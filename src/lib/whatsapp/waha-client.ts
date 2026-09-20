const WAHA_URL = process.env.WHATSAPP_API_URL || 'http://187.127.223.53:3000';
const WAHA_KEY = process.env.WHATSAPP_API_KEY || 'sfv_waha_master_key_2026';
const DEFAULT_SESSION = 'default';

function getHeaders() {
  return {
    'Content-Type': 'application/json',
    'X-Api-Key': WAHA_KEY,
  };
}

export function extractChatId(rawId: unknown): string {
  if (!rawId) return '';
  if (typeof rawId === 'string') return rawId;
  if (typeof rawId === 'object' && rawId !== null) {
    const obj = rawId as { _serialized?: string; user?: string; server?: string };
    return obj._serialized || (obj.user && obj.server ? `${obj.user}@${obj.server}` : '') || '';
  }
  return String(rawId);
}

export function formatChatId(phone: string): string {
  if (!phone) return '';
  if (typeof phone !== 'string') {
    return extractChatId(phone);
  }
  if (phone.includes('@')) {
    return phone;
  }
  let cleaned = phone.replace(/[\s\-\+\(\)]/g, '');
  if (cleaned.startsWith('0')) {
    cleaned = '60' + cleaned.slice(1);
  }
  return `${cleaned}@c.us`;
}

export interface WahaSessionInfo {
  name: string;
  status: 'WORKING' | 'SCAN_QR_CODE' | 'STARTING' | 'STOPPED' | 'FAILED' | 'UNKNOWN';
  me?: {
    id: string;
    pushName?: string;
  };
}

export interface WahaChatMessage {
  id: string;
  timestamp: number;
  from: string;
  fromMe: boolean;
  to?: string;
  body: string;
  hasMedia?: boolean;
  mediaUrl?: string;
  ack?: number; // 1: sent, 2: received, 3: read
}

export interface WahaChatSummary {
  id: string;
  name: string;
  phone: string;
  unreadCount: number;
  lastMessage?: {
    body: string;
    timestamp: number;
    fromMe: boolean;
  };
  isGroup?: boolean;
}

/**
 * Get current session status
 */
export async function getWahaStatus(): Promise<WahaSessionInfo> {
  try {
    const res = await fetch(`${WAHA_URL}/api/sessions/${DEFAULT_SESSION}`, {
      headers: getHeaders(),
      cache: 'no-store',
    });

    if (!res.ok) {
      if (res.status === 404) return { name: DEFAULT_SESSION, status: 'STOPPED' };
      return { name: DEFAULT_SESSION, status: 'UNKNOWN' };
    }

    const data = await res.json();
    return {
      name: data.name || DEFAULT_SESSION,
      status: data.status || 'UNKNOWN',
      me: data.me,
    };
  } catch {
    return { name: DEFAULT_SESSION, status: 'UNKNOWN' };
  }
}

/**
 * Start session
 */
export async function startWahaSession(): Promise<{ success: boolean; message?: string }> {
  try {
    const res = await fetch(`${WAHA_URL}/api/sessions/start`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ name: DEFAULT_SESSION }),
    });
    return { success: res.ok };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Gagal memulakan sesi WhatsApp';
    return { success: false, message };
  }
}

/**
 * Logout session
 */
export async function logoutWahaSession(): Promise<{ success: boolean }> {
  try {
    const res = await fetch(`${WAHA_URL}/api/sessions/logout`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ name: DEFAULT_SESSION }),
    });
    return { success: res.ok };
  } catch {
    return { success: false };
  }
}

/**
 * Restart session or recover stuck session
 */
export async function restartWahaSession(): Promise<{ success: boolean; message?: string }> {
  try {
    const res = await fetch(`${WAHA_URL}/api/sessions/${DEFAULT_SESSION}/restart`, {
      method: 'POST',
      headers: getHeaders(),
    });
    if (!res.ok) {
      // Fallback: Stop then start
      await fetch(`${WAHA_URL}/api/sessions/${DEFAULT_SESSION}/stop`, {
        method: 'POST',
        headers: getHeaders(),
      });
      await new Promise((r) => setTimeout(r, 1500));
      const startRes = await fetch(`${WAHA_URL}/api/sessions/start`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ name: DEFAULT_SESSION }),
      });
      return { success: startRes.ok };
    }
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Gagal memulakan semula sesi WhatsApp';
    return { success: false, message };
  }
}

/**
 * Get QR code data url
 */
export async function getWahaQrCode(): Promise<string | null> {
  try {
    const res = await fetch(`${WAHA_URL}/api/${DEFAULT_SESSION}/auth/qr?format=image`, {
      headers: getHeaders(),
      cache: 'no-store',
    });

    if (!res.ok) return null;

    const buffer = await res.arrayBuffer();
    const base64 = Buffer.from(buffer).toString('base64');
    return `data:image/png;base64,${base64}`;
  } catch {
    return null;
  }
}

/**
 * Fetch list of active chats for Omnichannel Inbox
 */
export async function getWahaChats(limit: number = 50): Promise<WahaChatSummary[]> {
  try {
    const res = await fetch(`${WAHA_URL}/api/${DEFAULT_SESSION}/chats?limit=${limit}`, {
      headers: getHeaders(),
      cache: 'no-store',
    });

    if (!res.ok) return [];

    const data = await res.json();
    if (!Array.isArray(data)) return [];

    const mapped: (WahaChatSummary | null)[] = data.map((c: Record<string, unknown>) => {
      const chatId = extractChatId(c.id);
      if (!chatId || chatId.includes('status@broadcast')) return null;

      const isGroup = !!c.isGroup || chatId.includes('@g.us');
      const phone = chatId.split('@')[0] || '';
      
      const lastMsgObj = c.lastMessage as Record<string, unknown> | undefined;
      const lastMsgData = lastMsgObj?._data as Record<string, unknown> | undefined;
      const lastMsgBody = (lastMsgData?.body as string) || (lastMsgObj?.body as string) || (lastMsgObj?.hasMedia ? '[Media / Gambar]' : '');
      const rawTime = (lastMsgObj?.timestamp as number) || (lastMsgData?.t as number) || (c.timestamp as number) || Date.now() / 1000;
      const lastMsgTime = rawTime > 10000000000 ? rawTime : rawTime * 1000;
      const lastMsgFromMe = !!(lastMsgObj?.fromMe || (lastMsgData?.id as Record<string, unknown>)?.fromMe);

      return {
        id: chatId,
        name: (c.name as string) || phone || 'Pelanggan WhatsApp',
        phone,
        unreadCount: Number(c.unreadCount) || 0,
        isGroup,
        lastMessage: lastMsgBody || rawTime
          ? {
              body: lastMsgBody,
              timestamp: lastMsgTime,
              fromMe: lastMsgFromMe,
            }
          : undefined,
      };
    });

    const validChats: WahaChatSummary[] = mapped.filter((item): item is WahaChatSummary => item !== null);
    return validChats.sort((a, b) => (b.lastMessage?.timestamp || 0) - (a.lastMessage?.timestamp || 0));
  } catch {
    return [];
  }
}

/**
 * Fetch message history for a specific conversation
 */
export async function getWahaMessages(chatId: string, limit: number = 50): Promise<WahaChatMessage[]> {
  try {
    const formattedId = formatChatId(chatId);
    const res = await fetch(`${WAHA_URL}/api/${DEFAULT_SESSION}/chats/${encodeURIComponent(formattedId)}/messages?limit=${limit}`, {
      headers: getHeaders(),
      cache: 'no-store',
    });

    if (!res.ok) return [];

    const data = await res.json();
    if (!Array.isArray(data)) return [];

    return data.map((m: Record<string, unknown>) => {
      const msgIdObj = m.id as { _serialized?: string; id?: string } | string;
      const msgId = typeof msgIdObj === 'object' && msgIdObj !== null ? (msgIdObj._serialized || msgIdObj.id) : msgIdObj;
      const msgData = m._data as Record<string, unknown> | undefined;
      const rawTime = (m.timestamp as number) || (msgData?.t as number) || Date.now() / 1000;
      const timestamp = rawTime > 10000000000 ? rawTime : rawTime * 1000;
      
      const from = extractChatId(m.from);
      const to = extractChatId(m.to);
      const fromMe = !!(m.fromMe || (msgData?.id as Record<string, unknown>)?.fromMe);
      const body = (m.body as string) || (msgData?.body as string) || (m.hasMedia ? '[Media / Gambar]' : '');
      const media = m.media as { url?: string } | undefined;

      return {
        id: (msgId as string) || String(Math.random()),
        timestamp,
        from: from || '',
        fromMe,
        to: to || '',
        body: body || '',
        hasMedia: !!m.hasMedia,
        mediaUrl: media?.url,
        ack: (m.ack as number) || (msgData?.ack as number),
      };
    });
  } catch {
    return [];
  }
}

/**
 * Send text message
 */
export async function sendWahaMessage(to: string, text: string): Promise<{ success: boolean; data?: unknown; error?: string }> {
  try {
    const chatId = formatChatId(to);
    const res = await fetch(`${WAHA_URL}/api/sendText`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        session: DEFAULT_SESSION,
        chatId,
        text,
      }),
    });

    if (!res.ok) {
      const errBody = await res.text();
      return { success: false, error: errBody || 'Ralat penghantaran WhatsApp' };
    }

    const data = await res.json();
    return { success: true, data };
  } catch (err: unknown) {
    const error = err instanceof Error ? err.message : 'Ralat sambungan ke engine WhatsApp VPS';
    return { success: false, error };
  }
}

/**
 * Send image
 */
export async function sendWahaImage(to: string, fileUrl: string, caption?: string): Promise<{ success: boolean; data?: unknown; error?: string }> {
  try {
    const chatId = formatChatId(to);
    const res = await fetch(`${WAHA_URL}/api/sendImage`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        session: DEFAULT_SESSION,
        chatId,
        file: { url: fileUrl },
        caption: caption || '',
      }),
    });

    if (!res.ok) {
      const errBody = await res.text();
      return { success: false, error: errBody || 'Ralat penghantaran gambar WhatsApp' };
    }

    const data = await res.json();
    return { success: true, data };
  } catch (err: unknown) {
    const error = err instanceof Error ? err.message : 'Ralat sambungan gambar WhatsApp';
    return { success: false, error };
  }
}

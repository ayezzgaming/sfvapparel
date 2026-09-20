const WAHA_URL = process.env.WHATSAPP_API_URL || 'http://187.127.223.53:3000';
const WAHA_KEY = process.env.WHATSAPP_API_KEY || 'sfv_waha_master_key_2026';
const DEFAULT_SESSION = 'default';

function getHeaders() {
  return {
    'Content-Type': 'application/json',
    'X-Api-Key': WAHA_KEY,
  };
}

export function formatChatId(phone: string): string {
  let cleaned = phone.replace(/[\s\-\+\(\)]/g, '');
  if (cleaned.startsWith('0')) {
    cleaned = '60' + cleaned.slice(1);
  }
  if (!cleaned.includes('@')) {
    cleaned = `${cleaned}@c.us`;
  }
  return cleaned;
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
export async function getWahaChats(limit: number = 30): Promise<WahaChatSummary[]> {
  try {
    const res = await fetch(`${WAHA_URL}/api/${DEFAULT_SESSION}/chats?limit=${limit}`, {
      headers: getHeaders(),
      cache: 'no-store',
    });

    if (!res.ok) return [];

    const data = await res.json();
    if (!Array.isArray(data)) return [];

    return data
      .filter((c) => !c.id?.includes('@g.us') && !c.id?.includes('status@broadcast')) // Filter out groups/status for clean 1-on-1 CRM
      .map((c) => {
        const phone = c.id ? c.id.split('@')[0] : '';
        return {
          id: c.id,
          name: c.name || phone || 'Pelanggan',
          phone,
          unreadCount: c.unreadCount || 0,
          isGroup: false,
          lastMessage: c.lastMessage
            ? {
                body: c.lastMessage.body || (c.lastMessage.hasMedia ? '[Media Gambar/Dokumen]' : ''),
                timestamp: c.lastMessage.timestamp ? c.lastMessage.timestamp * 1000 : Date.now(),
                fromMe: !!c.lastMessage.fromMe,
              }
            : undefined,
        };
      });
  } catch {
    return [];
  }
}

/**
 * Fetch message history for a specific conversation
 */
export async function getWahaMessages(chatId: string, limit: number = 40): Promise<WahaChatMessage[]> {
  try {
    const formattedId = formatChatId(chatId);
    const res = await fetch(`${WAHA_URL}/api/${DEFAULT_SESSION}/chats/${formattedId}/messages?limit=${limit}`, {
      headers: getHeaders(),
      cache: 'no-store',
    });

    if (!res.ok) return [];

    const data = await res.json();
    if (!Array.isArray(data)) return [];

    return data.map((m) => ({
      id: m.id || String(Math.random()),
      timestamp: m.timestamp ? m.timestamp * 1000 : Date.now(),
      from: m.from || '',
      fromMe: !!m.fromMe,
      to: m.to,
      body: m.body || '',
      hasMedia: !!m.hasMedia,
      mediaUrl: m.media?.url,
      ack: m.ack,
    }));
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

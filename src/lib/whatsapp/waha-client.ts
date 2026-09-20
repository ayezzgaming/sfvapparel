const WAHA_URL = process.env.WHATSAPP_API_URL || 'http://187.127.223.53:3000';
const WAHA_KEY = process.env.WHATSAPP_API_KEY || 'sfv_waha_master_key_2026';
const DEFAULT_SESSION = 'default';

function getHeaders() {
  return {
    'Content-Type': 'application/json',
    'X-Api-Key': WAHA_KEY,
  };
}

/**
 * Format any phone number into WAHA chatId (e.g. '60148599138@c.us')
 */
export function formatChatId(phone: string): string {
  let cleaned = phone.replace(/[\s\-\+\(\)]/g, '');
  if (cleaned.startsWith('0')) {
    // Convert Malaysian '0148599138' -> '60148599138'
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

/**
 * Get the current WhatsApp session status
 */
export async function getWahaStatus(): Promise<WahaSessionInfo> {
  try {
    const res = await fetch(`${WAHA_URL}/api/sessions/${DEFAULT_SESSION}`, {
      headers: getHeaders(),
      cache: 'no-store',
    });

    if (!res.ok) {
      if (res.status === 404) {
        return { name: DEFAULT_SESSION, status: 'STOPPED' };
      }
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
 * Start or resume the WhatsApp session
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
 * Stop WhatsApp session
 */
export async function stopWahaSession(): Promise<{ success: boolean }> {
  try {
    const res = await fetch(`${WAHA_URL}/api/sessions/stop`, {
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
 * Logout and clear WhatsApp device session (for linking a new number)
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
 * Fetch the live QR Code image as a base64 Data URL
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
 * Send an automated WhatsApp text message
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
 * Send an image with caption
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
        file: {
          url: fileUrl,
        },
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

import { getServiceSupabase } from '@/lib/supabase/serverClient';

export interface WhatsAppBotSettings {
  id: string;
  auto_reply_enabled: boolean;
  paused_reason?: string | null;
  updated_by?: string | null;
  updated_at: string;
}

// In-memory cache for fast access (avoids DB latency on high message throughput)
let cachedSettings: WhatsAppBotSettings = {
  id: 'default',
  auto_reply_enabled: true,
  paused_reason: null,
  updated_by: 'system',
  updated_at: new Date().toISOString(),
};
let lastFetchedTime = 0;
const CACHE_TTL_MS = 5000; // 5 seconds cache

/**
 * Fetch WhatsApp Bot Settings with DB fallback and memory caching
 */
export async function getWhatsAppBotSettings(forceRefresh = false): Promise<WhatsAppBotSettings> {
  const now = Date.now();
  if (!forceRefresh && now - lastFetchedTime < CACHE_TTL_MS) {
    return cachedSettings;
  }

  try {
    const supabase = getServiceSupabase();
    if (supabase) {
      const { data, error } = await supabase
        .from('whatsapp_bot_settings')
        .select('*')
        .eq('id', 'default')
        .maybeSingle();

      if (!error && data) {
        cachedSettings = {
          id: data.id || 'default',
          auto_reply_enabled: data.auto_reply_enabled ?? true,
          paused_reason: data.paused_reason || null,
          updated_by: data.updated_by || null,
          updated_at: data.updated_at || new Date().toISOString(),
        };
        lastFetchedTime = now;
        return cachedSettings;
      }
    }
  } catch (err) {
    console.warn('[getWhatsAppBotSettings] Error fetching from DB, falling back to cache:', err);
  }

  return cachedSettings;
}

/**
 * Update WhatsApp Bot Settings in DB and update in-memory cache
 */
export async function updateWhatsAppBotSettings(params: {
  auto_reply_enabled: boolean;
  paused_reason?: string | null;
  updated_by?: string | null;
}): Promise<WhatsAppBotSettings> {
  const now = new Date().toISOString();
  cachedSettings = {
    id: 'default',
    auto_reply_enabled: params.auto_reply_enabled,
    paused_reason: params.paused_reason ?? null,
    updated_by: params.updated_by ?? 'admin',
    updated_at: now,
  };
  lastFetchedTime = Date.now();

  try {
    const supabase = getServiceSupabase();
    if (supabase) {
      const { error } = await supabase.from('whatsapp_bot_settings').upsert({
        id: 'default',
        auto_reply_enabled: params.auto_reply_enabled,
        paused_reason: params.paused_reason ?? null,
        updated_by: params.updated_by ?? 'admin',
        updated_at: now,
      });
      if (error) {
        console.warn('[updateWhatsAppBotSettings] DB upsert note:', error.message);
      }
    }
  } catch (err) {
    console.warn('[updateWhatsAppBotSettings] Error updating DB:', err);
  }

  return cachedSettings;
}

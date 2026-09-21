import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { PaymentGatewayConfig } from '@/types/database';

const CONFIG_FILE_PATH = path.join(process.cwd(), 'src', 'lib', 'payment', '.chip-config.json');

// Default / Initial Config
const DEFAULT_CHIP_CONFIG: PaymentGatewayConfig = {
  id: 'chip-main-gateway',
  provider: 'chip',
  brand_id: process.env.CHIP_BRAND_ID || '',
  api_key: process.env.CHIP_API_KEY || '',
  public_key: process.env.CHIP_PUBLIC_KEY || '',
  is_active: process.env.CHIP_IS_ACTIVE === 'true',
  is_sandbox: process.env.CHIP_IS_SANDBOX !== 'false', // Default to sandbox for safety
  webhook_url: '/api/payment/chip/webhook',
  payment_methods: ['fpx', 'card', 'duitnow_qr', 'ewallet'],
  updated_at: new Date().toISOString(),
};

/**
 * In-memory and secure local persistence fallback
 */
let cachedConfig: PaymentGatewayConfig | null = null;

export function getChipBaseUrl(isSandbox: boolean): string {
  // CHIP Gateway Base API URL
  return isSandbox
    ? 'https://gate.staging.chip-in.asia/api/v1'
    : 'https://gate.chip-in.asia/api/v1';
}

/**
 * Server-only: Retrieve full Payment Gateway Configuration (with secret API key)
 */
export async function getFullChipConfig(): Promise<PaymentGatewayConfig> {
  if (cachedConfig) return cachedConfig;

  try {
    if (fs.existsSync(CONFIG_FILE_PATH)) {
      const fileData = fs.readFileSync(CONFIG_FILE_PATH, 'utf8');
      const parsed = JSON.parse(fileData);
      cachedConfig = {
        ...DEFAULT_CHIP_CONFIG,
        ...parsed,
        brand_id: parsed.brand_id || process.env.CHIP_BRAND_ID || '',
        api_key: parsed.api_key || process.env.CHIP_API_KEY || '',
        public_key: parsed.public_key || process.env.CHIP_PUBLIC_KEY || '',
      };
      return cachedConfig!;
    }
  } catch (err) {
    console.warn('[CHIP] Failed to read .chip-config.json file, using environment fallback:', err);
  }

  cachedConfig = { ...DEFAULT_CHIP_CONFIG };
  return cachedConfig;
}

/**
 * Client-safe: Retrieve sanitized Payment Gateway Configuration (Masked secret API key)
 */
export async function getSafeChipConfig(): Promise<PaymentGatewayConfig> {
  const full = await getFullChipConfig();
  return {
    ...full,
    api_key: maskSecretKey(full.api_key),
  };
}

/**
 * Mask secret key for secure UI presentation (e.g. "chip_live_••••••••••••8a9f")
 */
export function maskSecretKey(key?: string): string {
  if (!key || key.trim().length === 0) return '';
  const trimmed = key.trim();
  if (trimmed.length <= 8) return '••••••••';
  const prefix = trimmed.slice(0, 6);
  const suffix = trimmed.slice(-4);
  return `${prefix}••••••••••••${suffix}`;
}

/**
 * Server-only: Save Payment Gateway Configuration
 */
export async function saveChipConfig(
  newConfig: Partial<PaymentGatewayConfig>
): Promise<PaymentGatewayConfig> {
  const current = await getFullChipConfig();

  // If user didn't change the masked API key (contains bullet dots), keep current key
  let apiKeyToSave = newConfig.api_key?.trim() || current.api_key;
  if (apiKeyToSave.includes('••••')) {
    apiKeyToSave = current.api_key;
  }

  const updated: PaymentGatewayConfig = {
    ...current,
    brand_id: newConfig.brand_id !== undefined ? newConfig.brand_id.trim() : current.brand_id,
    api_key: apiKeyToSave,
    public_key: newConfig.public_key !== undefined ? newConfig.public_key.trim() : current.public_key,
    is_active: newConfig.is_active !== undefined ? Boolean(newConfig.is_active) : current.is_active,
    is_sandbox: newConfig.is_sandbox !== undefined ? Boolean(newConfig.is_sandbox) : current.is_sandbox,
    payment_methods: newConfig.payment_methods || current.payment_methods,
    updated_at: new Date().toISOString(),
  };

  try {
    const dir = path.dirname(CONFIG_FILE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(CONFIG_FILE_PATH, JSON.stringify(updated, null, 2), 'utf8');
  } catch (err) {
    console.error('[CHIP] Error writing config to disk:', err);
  }

  cachedConfig = updated;
  return updated;
}

/**
 * Test Connection & Credentials with CHIP API
 */
export async function testChipConnection(
  brandId: string,
  apiKey: string,
  isSandbox: boolean
): Promise<{ success: boolean; latencyMs: number; message: string; brandTitle?: string }> {
  const startTime = Date.now();

  if (!brandId?.trim() || !apiKey?.trim()) {
    return {
      success: false,
      latencyMs: 0,
      message: 'Sila masukkan Brand ID dan Secret API Key sebelum menguji sambungan.',
    };
  }

  // If apiKey is masked, fetch real key from config
  let realApiKey = apiKey.trim();
  if (realApiKey.includes('••••')) {
    const full = await getFullChipConfig();
    realApiKey = full.api_key;
  }

  const baseUrl = getChipBaseUrl(isSandbox);

  try {
    // CHIP API provides GET /api/v1/payment_methods/?brand_id=... or GET /api/v1/purchases/ to verify auth
    const url = `${baseUrl}/payment_methods/?brand_id=${encodeURIComponent(brandId.trim())}&currency=MYR`;
    
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${realApiKey.trim()}`,
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    const latencyMs = Date.now() - startTime;

    if (res.status === 200 || res.status === 204) {
      const data = await res.json().catch(() => ({}));
      return {
        success: true,
        latencyMs,
        message: `Sambungan ke CHIP Gateway (${isSandbox ? 'Sandbox' : 'Live'}) Berjaya! API Key & Brand ID disahkan sah.`,
        brandTitle: data?.available_payment_methods ? `Kaedah Tersedia: ${data.available_payment_methods.length}` : undefined,
      };
    }

    if (res.status === 401 || res.status === 403) {
      return {
        success: false,
        latencyMs,
        message: 'Pengesahan Gagal (401 Unauthorized): Secret API Key tidak sah atau tidak mempunyai kebenaran.',
      };
    }

    if (res.status === 404) {
      return {
        success: false,
        latencyMs,
        message: 'Brand ID tidak dijumpai di portal CHIP (404 Not Found). Sila semak Brand ID anda.',
      };
    }

    const errData = await res.json().catch(() => ({}));
    const errMsg = errData?.message || errData?.errors?.[0] || `Ralat HTTP ${res.status}`;
    return {
      success: false,
      latencyMs,
      message: `CHIP API Ralat (${res.status}): ${errMsg}`,
    };
  } catch (err: unknown) {
    const latencyMs = Date.now() - startTime;
    const msg = err instanceof Error ? err.message : 'Sambungan ke pelayan CHIP gagal.';
    return {
      success: false,
      latencyMs,
      message: `Gagal menyambung ke gateway CHIP: ${msg}`,
    };
  }
}

export interface CreateChipPurchaseParams {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  totalAmount: number; // in MYR (e.g. 150.00)
  itemsDescription: string;
  baseUrl: string;
}

export interface CreateChipPurchaseResult {
  success: boolean;
  checkoutUrl?: string;
  purchaseId?: string;
  message?: string;
}

/**
 * Server-only: Create a purchase session on CHIP Gateway
 */
export async function createChipPurchase(
  params: CreateChipPurchaseParams
): Promise<CreateChipPurchaseResult> {
  const config = await getFullChipConfig();

  if (!config.is_active) {
    return {
      success: false,
      message: 'Gerbang Pembayaran CHIP sedang dinyahaktifkan oleh pentadbir.',
    };
  }

  if (!config.brand_id || !config.api_key) {
    return {
      success: false,
      message: 'Kredensial CHIP Gateway (Brand ID / API Key) belum dikonfigurasikan.',
    };
  }

  const endpoint = `${getChipBaseUrl(config.is_sandbox)}/purchases/`;

  // CHIP expects amount in CENTS (e.g. RM 35.00 -> 3500 cents)
  const amountInCents = Math.round(params.totalAmount * 100);

  // Normalize phone for CHIP (e.g. +60123456789)
  let cleanPhone = params.customerPhone.replace(/[\s\-\+\(\)]/g, '');
  if (cleanPhone.startsWith('0')) cleanPhone = '60' + cleanPhone.slice(1);
  if (!cleanPhone.startsWith('6') && cleanPhone.length >= 9) cleanPhone = '60' + cleanPhone;
  const formattedPhone = `+${cleanPhone}`;

  const payload = {
    brand_id: config.brand_id.trim(),
    client: {
      email: params.customerEmail || 'customer@sfvapparel.my',
      phone: formattedPhone,
      full_name: params.customerName || 'Pelanggan SFV Apparel',
    },
    purchase: {
      currency: 'MYR',
      products: [
        {
          name: params.itemsDescription || `Pesanan ${params.orderNumber}`,
          price: amountInCents,
          quantity: 1,
        },
      ],
    },
    success_redirect: `${params.baseUrl}/history?payment=success&order_number=${encodeURIComponent(params.orderNumber)}`,
    failure_redirect: `${params.baseUrl}/history?payment=failed&order_number=${encodeURIComponent(params.orderNumber)}`,
    cancel_redirect: `${params.baseUrl}/history?payment=cancelled&order_number=${encodeURIComponent(params.orderNumber)}`,
    success_callback: `${params.baseUrl}/api/payment/chip/webhook`,
    reference: params.orderNumber,
  };

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.api_key.trim()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (!res.ok || !data.checkout_url) {
      console.error('[CHIP Create Purchase Error]:', res.status, data);
      const errMsg = data?.message || data?.errors?.[0] || 'Gagal menjana sesi pembayaran CHIP.';
      return {
        success: false,
        message: errMsg,
      };
    }

    return {
      success: true,
      checkoutUrl: data.checkout_url,
      purchaseId: data.id,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Ralat rangkaian semasa mencipta sesi CHIP.';
    console.error('[CHIP Purchase Network Error]:', err);
    return {
      success: false,
      message: msg,
    };
  }
}

/**
 * Verify incoming Webhook Signature from CHIP (RSA-SHA256)
 */
export function verifyChipSignature(
  rawBody: string,
  signatureHeader?: string | null,
  publicKeyPem?: string
): boolean {
  if (!signatureHeader || !publicKeyPem || publicKeyPem.trim().length === 0) {
    // If no public key configured, signature verification is skipped
    return true;
  }

  try {
    let formattedKey = publicKeyPem.trim();
    if (!formattedKey.includes('-----BEGIN PUBLIC KEY-----')) {
      formattedKey = `-----BEGIN PUBLIC KEY-----\n${formattedKey}\n-----END PUBLIC KEY-----`;
    }

    const verifier = crypto.createVerify('RSA-SHA256');
    verifier.update(rawBody);
    return verifier.verify(formattedKey, signatureHeader, 'base64');
  } catch (e) {
    console.error('[CHIP Signature Verification Error]:', e);
    return false;
  }
}

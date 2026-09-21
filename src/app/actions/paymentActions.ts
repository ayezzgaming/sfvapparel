'use server';

import { 
  getSafeChipConfig, 
  saveChipConfig, 
  testChipConnection,
  createChipPurchase,
  CreateChipPurchaseParams,
  CreateChipPurchaseResult 
} from '@/lib/payment/chip-client';
import { PaymentGatewayConfig, PaymentStatus } from '@/types/database';
import { getServiceSupabase } from '@/lib/supabase/serverClient';

/**
 * Server Action: Get client-safe Payment Gateway configuration
 */
export async function getPaymentConfigAction(): Promise<{
  success: boolean;
  config?: PaymentGatewayConfig;
  message?: string;
}> {
  try {
    const config = await getSafeChipConfig();
    return { success: true, config };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Gagal memuatkan konfigurasi gerbang pembayaran.';
    return { success: false, message: msg };
  }
}

/**
 * Server Action: Save Payment Gateway configuration
 */
export async function savePaymentConfigAction(
  formData: Partial<PaymentGatewayConfig>
): Promise<{
  success: boolean;
  config?: PaymentGatewayConfig;
  message?: string;
}> {
  try {
    const saved = await saveChipConfig(formData);
    const safeConfig = await getSafeChipConfig();
    return {
      success: true,
      config: safeConfig,
      message: 'Konfigurasi CHIP Payment Gateway berjaya disimpan.',
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Gagal menyimpan konfigurasi CHIP.';
    return { success: false, message: msg };
  }
}

/**
 * Server Action: Test live/sandbox API connection to CHIP portal
 */
export async function testChipConnectionAction(
  brandId: string,
  apiKey: string,
  isSandbox: boolean
): Promise<{
  success: boolean;
  latencyMs: number;
  message: string;
  brandTitle?: string;
}> {
  return await testChipConnection(brandId, apiKey, isSandbox);
}

/**
 * Server Action: Create CHIP Purchase and get checkout_url
 */
export async function createChipPurchaseAction(
  params: CreateChipPurchaseParams
): Promise<CreateChipPurchaseResult> {
  return await createChipPurchase(params);
}

/**
 * Server Action: Update Order Payment Status in Database
 */
export async function updateOrderPaymentStatusDb(
  orderNumber: string,
  paymentStatus: PaymentStatus,
  paymentId?: string,
  paymentMethod?: string
): Promise<{ success: boolean; message?: string }> {
  try {
    const supabase = getServiceSupabase();
    if (!supabase) return { success: false, message: 'Database connection failed' };

    const updatePayload: Record<string, unknown> = {
      payment_status: paymentStatus,
      updated_at: new Date().toISOString(),
    };

    if (paymentId) updatePayload.payment_id = paymentId;
    if (paymentMethod) updatePayload.payment_method = paymentMethod;
    if (paymentStatus === 'paid') {
      updatePayload.paid_at = new Date().toISOString();
      updatePayload.status = 'proof_approved'; // Auto-advance from pending_proof once paid
    }

    const { error } = await supabase
      .from('orders')
      .update(updatePayload)
      .eq('order_number', orderNumber);

    if (error) {
      console.warn('[updateOrderPaymentStatusDb] Supabase update warning:', error.message);
    }

    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Gagal mengemaskini status bayaran pesanan.';
    return { success: false, message: msg };
  }
}

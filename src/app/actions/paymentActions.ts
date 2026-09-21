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
 * Server Action: Update Order Payment Status in Database with Downpayment & Balance Support
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

    const baseOrderNumber = orderNumber.replace(/-(DP|BAL)$/i, '');
    const isBalancePayment = /-BAL$/i.test(orderNumber);
    const isDepositPayment = /-DP$/i.test(orderNumber);

    // Dapatkan data pesanan sedia ada
    const { data: currentOrder, error: fetchErr } = await supabase
      .from('orders')
      .select('id, total_amount, deposit_amount, balance_amount, paid_amount, payment_type_selected, status')
      .eq('order_number', baseOrderNumber)
      .single();

    if (fetchErr || !currentOrder) {
      console.warn('[updateOrderPaymentStatusDb] Pesanan tidak dijumpai:', baseOrderNumber);
    }

    const totalAmount = Number(currentOrder?.total_amount) || 0;
    const depositAmount = Number(currentOrder?.deposit_amount) || (Math.round(totalAmount * 0.5 * 100) / 100);

    const updatePayload: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (paymentStatus === 'paid') {
      if (isBalancePayment) {
        // Pelunasan baki 50%
        updatePayload.payment_status = 'paid';
        updatePayload.balance_paid_at = new Date().toISOString();
        updatePayload.balance_amount = 0;
        updatePayload.paid_amount = totalAmount;
        if (paymentId) updatePayload.balance_payment_id = paymentId;
        if (paymentMethod) updatePayload.balance_payment_method = paymentMethod;
      } else if (isDepositPayment || currentOrder?.payment_type_selected === 'deposit_50') {
        // Pembayaran deposit 50%
        updatePayload.payment_status = 'deposit_paid';
        updatePayload.deposit_paid_at = new Date().toISOString();
        updatePayload.deposit_amount = depositAmount;
        updatePayload.balance_amount = totalAmount - depositAmount;
        updatePayload.paid_amount = depositAmount;
        if (paymentId) updatePayload.deposit_payment_id = paymentId;
        if (paymentMethod) updatePayload.deposit_payment_method = paymentMethod;
        // Majukan status ke proof_approved secara automatik
        if (currentOrder?.status === 'pending_proof') {
          updatePayload.status = 'proof_approved';
        }
      } else {
        // Bayaran Penuh 100%
        updatePayload.payment_status = 'paid';
        updatePayload.paid_at = new Date().toISOString();
        updatePayload.paid_amount = totalAmount;
        updatePayload.balance_amount = 0;
        if (paymentId) updatePayload.payment_id = paymentId;
        if (paymentMethod) updatePayload.payment_method = paymentMethod;
        if (currentOrder?.status === 'pending_proof') {
          updatePayload.status = 'proof_approved';
        }
      }
    } else {
      updatePayload.payment_status = paymentStatus;
      if (paymentId) updatePayload.payment_id = paymentId;
      if (paymentMethod) updatePayload.payment_method = paymentMethod;
    }

    const { error } = await supabase
      .from('orders')
      .update(updatePayload)
      .eq('order_number', baseOrderNumber);

    if (error) {
      console.warn('[updateOrderPaymentStatusDb] Supabase update warning:', error.message);
      return { success: false, message: error.message };
    }

    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Gagal mengemaskini status bayaran pesanan.';
    return { success: false, message: msg };
  }
}

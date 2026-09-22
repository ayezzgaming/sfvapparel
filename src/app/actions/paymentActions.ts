'use server';

import { 
  getSafeChipConfig, 
  saveChipConfig, 
  testChipConnection,
  createChipPurchase,
  CreateChipPurchaseParams,
  CreateChipPurchaseResult 
} from '@/lib/payment/chip-client';
import { PaymentGatewayConfig, PaymentStatus, Order } from '@/types/database';
import { getServiceSupabase } from '@/lib/supabase/serverClient';
import { sendOrderInvoiceWhatsApp } from '@/lib/whatsapp/order-notifier';
import { triggerStaffProductionAlert } from '@/lib/n8n/n8n-client';

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
      .select('id, total_amount, deposit_amount, balance_amount, paid_amount, payment_type_selected, payment_status, deposit_paid_at, status')
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
        // If already paid 100%, do not regress to deposit_paid
        if (currentOrder?.payment_status === 'paid') {
          updatePayload.payment_status = 'paid';
        } else {
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
      // If a balance settlement session was failed/cancelled, do NOT wipe out existing deposit_paid status!
      if (isBalancePayment) {
        if (currentOrder?.payment_status === 'deposit_paid' || currentOrder?.deposit_paid_at) {
          updatePayload.payment_status = 'deposit_paid';
        } else {
          updatePayload.payment_status = paymentStatus;
        }
      } else {
        // Only update if not already paid
        if (currentOrder?.payment_status !== 'paid') {
          updatePayload.payment_status = paymentStatus;
        }
      }
      if (paymentId) updatePayload.payment_id = paymentId;
      if (paymentMethod) updatePayload.payment_method = paymentMethod;
    }

    const { data: updatedOrder, error } = await supabase
      .from('orders')
      .update(updatePayload)
      .eq('order_number', baseOrderNumber)
      .select()
      .maybeSingle();

    if (error) {
      console.warn('[updateOrderPaymentStatusDb] Supabase update warning:', error.message);
      return { success: false, message: error.message };
    }

    // Trigger WhatsApp Official Invoice & n8n Staff Production queue asynchronously
    if (updatedOrder && paymentStatus === 'paid') {
      const order = updatedOrder as Order;
      const notifType = isBalancePayment ? 'balance_paid' : 'deposit_confirmed';

      sendOrderInvoiceWhatsApp(order, notifType).catch((e) =>
        console.error('[updateOrderPaymentStatusDb] WA Invoice notification error:', e)
      );

      triggerStaffProductionAlert({
        orderNumber: order.order_number,
        customerName: order.customer_name,
        status: isBalancePayment ? 'LUNAS (100% Sedia Pos)' : 'DEPOSIT DITERIMA (Barisan Cetakan)',
        itemCount: order.total_quantity || 1,
        totalAmount: Number(order.total_amount) || 0,
      }).catch((e) =>
        console.error('[updateOrderPaymentStatusDb] n8n production trigger error:', e)
      );
    }

    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Gagal mengemaskini status bayaran pesanan.';
    return { success: false, message: msg };
  }
}


/**
 * Server Action: Authoritatively confirm payment on successful gateway return
 */
export async function confirmPaymentReturnAction(orderNumber: string): Promise<{ success: boolean; order?: any; message?: string }> {
  try {
    const supabase = getServiceSupabase();
    if (!supabase) return { success: false, message: 'Database connection failed' };

    const baseOrderNumber = orderNumber.replace(/-(DP|BAL)$/i, '');
    const isBalancePayment = /-BAL$/i.test(orderNumber);
    const isDepositPayment = /-DP$/i.test(orderNumber);

    const { data: currentOrder, error: fetchErr } = await supabase
      .from('orders')
      .select('*')
      .eq('order_number', baseOrderNumber)
      .single();

    if (fetchErr || !currentOrder) {
      return { success: false, message: 'Pesanan tidak dijumpai' };
    }

    const totalAmount = Number(currentOrder.total_amount) || 0;
    const depositAmount = Number(currentOrder.deposit_amount) || (Math.round(totalAmount * 0.5 * 100) / 100);

    const updatePayload: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (isBalancePayment) {
      updatePayload.payment_status = 'paid';
      updatePayload.balance_paid_at = new Date().toISOString();
      updatePayload.balance_amount = 0;
      updatePayload.paid_amount = totalAmount;
      updatePayload.balance_payment_method = 'CHIP Online Gateway';
    } else if (isDepositPayment || currentOrder.payment_type_selected === 'deposit_50') {
      if (currentOrder.payment_status !== 'paid') {
        updatePayload.payment_status = 'deposit_paid';
        updatePayload.deposit_paid_at = new Date().toISOString();
        updatePayload.deposit_amount = depositAmount;
        updatePayload.balance_amount = Math.max(0, totalAmount - depositAmount);
        updatePayload.paid_amount = depositAmount;
        updatePayload.payment_method = 'CHIP Online (Deposit 50%)';
        if (currentOrder.status === 'pending_proof') {
          updatePayload.status = 'proof_approved';
        }
      }
    } else {
      updatePayload.payment_status = 'paid';
      updatePayload.paid_at = new Date().toISOString();
      updatePayload.paid_amount = totalAmount;
      updatePayload.balance_amount = 0;
      updatePayload.payment_method = 'CHIP Online (100% Penuh)';
      if (currentOrder.status === 'pending_proof') {
        updatePayload.status = 'proof_approved';
      }
    }

    const { data: updatedOrder, error: updateErr } = await supabase
      .from('orders')
      .update(updatePayload)
      .eq('order_number', baseOrderNumber)
      .select()
      .single();

    if (updateErr) {
      return { success: false, message: updateErr.message };
    }

    // Trigger WhatsApp Official Invoice asynchronously
    if (updatedOrder) {
      sendOrderInvoiceWhatsApp(
        updatedOrder as Order,
        isBalancePayment ? 'balance_paid' : 'deposit_confirmed'
      ).catch((e) => console.error('[confirmPaymentReturnAction] WA Invoice notification error:', e));
    }

    return { success: true, order: updatedOrder };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Gagal mengesahkan pembayaran';
    return { success: false, message: msg };
  }
}

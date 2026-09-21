'use server';

import { getServiceSupabase } from '@/lib/supabase/serverClient';
import { Order, OrderStatus } from '@/types/database';
import { sendOrderInvoiceWhatsApp } from '@/lib/whatsapp/order-notifier';

export async function getOrdersDb(): Promise<{ success: boolean; orders?: Order[]; message?: string }> {
  try {
    const supabase = getServiceSupabase();
    if (!supabase) return { success: false, message: 'Database connection failed.' };

    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[orderActions] getOrdersDb error:', error.message);
      return { success: false, message: error.message };
    }

    return { success: true, orders: (data as Order[]) || [] };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to fetch orders';
    return { success: false, message };
  }
}

export async function getCustomerOrdersDb(identifier: string): Promise<{ success: boolean; orders?: Order[]; message?: string }> {
  try {
    const supabase = getServiceSupabase();
    if (!supabase) return { success: false, message: 'Database connection failed.' };

    if (!identifier || !identifier.trim()) return { success: true, orders: [] };

    const trimmed = identifier.trim();
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(trimmed);

    let query = supabase.from('orders').select('*');

    if (isUuid) {
      query = query.or(`customer_id.eq.${trimmed},id.eq.${trimmed}`);
    } else {
      const cleanDigits = trimmed.replace(/[\s\-\+\(\)]/g, '');
      const shortDigits = cleanDigits.replace(/^60|^0/, '');
      let normalized60 = cleanDigits;
      if (normalized60.startsWith('0')) normalized60 = '60' + normalized60.slice(1);
      if (!normalized60.startsWith('6') && normalized60.length >= 9) normalized60 = '60' + normalized60;

      const orConditions = [
        shortDigits.length >= 6 ? `customer_phone.ilike.%${shortDigits}%` : '',
        `customer_phone.eq.${trimmed}`,
        `customer_phone.eq.${normalized60}`,
        `customer_phone.eq.+${normalized60}`,
        `order_number.ilike.%${trimmed}%`,
        trimmed.includes('@') ? `customer_email.ilike.%${trimmed}%` : '',
      ].filter(Boolean).join(',');

      query = query.or(orConditions);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('[orderActions] getCustomerOrdersDb error:', error.message);
      return { success: false, message: error.message };
    }

    return { success: true, orders: (data as Order[]) || [] };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to fetch customer orders';
    return { success: false, message };
  }
}

function toValidUuidOrNull(val?: string | null): string | null {
  if (!val) return null;
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val.trim());
  return isUuid ? val.trim() : null;
}

export async function saveOrderDb(orderData: Partial<Order>): Promise<{ success: boolean; order?: Order; message?: string }> {
  try {
    const supabase = getServiceSupabase();
    if (!supabase) return { success: false, message: 'Database connection failed.' };

    const now = new Date();
    const yy = String(now.getFullYear()).slice(-2);
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const orderNumber = orderData.order_number || `SFV-${yy}${mm}-${randomSuffix}`;

    const recordToInsert: Record<string, unknown> = {
      order_number: orderNumber,
      customer_id: toValidUuidOrNull(orderData.customer_id),
      customer_name: orderData.customer_name || 'Pelanggan',
      customer_email: orderData.customer_email || 'pelanggan@sfv.my',
      customer_phone: orderData.customer_phone || '',
      print_type: orderData.print_type || 'sublimation',
      design_id: toValidUuidOrNull(orderData.design_id),
      design_title: orderData.design_title || 'Custom Order',
      mockup_url: orderData.mockup_url || null,
      custom_artwork_url: orderData.custom_artwork_url || null,
      fabric_material_id: toValidUuidOrNull(orderData.fabric_material_id),
      fabric_name: orderData.fabric_name || null,
      apparel_cut_id: toValidUuidOrNull(orderData.apparel_cut_id),
      cut_name: orderData.cut_name || null,
      dtf_dimension_id: toValidUuidOrNull(orderData.dtf_dimension_id),
      dtf_dimension_name: orderData.dtf_dimension_name || null,
      dtf_option_type: orderData.dtf_option_type || null,
      garment_blank_color: orderData.garment_blank_color || null,
      sizing_breakdown: orderData.sizing_breakdown || {},
      total_quantity: orderData.total_quantity || 1,
      raw_unit_price: orderData.raw_unit_price || 0,
      discount_percentage: orderData.discount_percentage || 0,
      final_unit_price: orderData.final_unit_price || 0,
      total_amount: orderData.total_amount || 0,
      deposit_amount: orderData.deposit_amount !== undefined ? orderData.deposit_amount : Math.round((orderData.total_amount || 0) * 0.5 * 100) / 100,
      balance_amount: orderData.balance_amount !== undefined ? orderData.balance_amount : ((orderData.total_amount || 0) - (orderData.deposit_amount !== undefined ? orderData.deposit_amount : Math.round((orderData.total_amount || 0) * 0.5 * 100) / 100)),
      paid_amount: orderData.paid_amount || 0,
      payment_type_selected: orderData.payment_type_selected || 'deposit_50',
      payment_status: orderData.payment_status || 'unpaid',
      payment_method: orderData.payment_method || null,
      payment_id: orderData.payment_id || null,
      status: orderData.status || 'pending_proof',
      production_notes: orderData.production_notes || null,
      shipping_address: orderData.shipping_address || null,
      shipping_courier: orderData.shipping_courier || null,
      tracking_number: orderData.tracking_number || null,
    };

    let { data, error } = await supabase
      .from('orders')
      .insert(recordToInsert)
      .select()
      .single();

    // Fallback: If custom deposit columns don't exist in Supabase yet, retry with base columns
    if (error && error.message && error.message.includes('column')) {
      console.warn('[orderActions] Retrying insert with standard columns:', error.message);
      const baseRecord = {
        order_number: orderNumber,
        customer_id: toValidUuidOrNull(orderData.customer_id),
        customer_name: orderData.customer_name || 'Pelanggan',
        customer_email: orderData.customer_email || 'pelanggan@sfv.my',
        customer_phone: orderData.customer_phone || '',
        print_type: orderData.print_type || 'sublimation',
        design_id: toValidUuidOrNull(orderData.design_id),
        design_title: orderData.design_title || 'Custom Order',
        mockup_url: orderData.mockup_url || null,
        custom_artwork_url: orderData.custom_artwork_url || null,
        fabric_material_id: toValidUuidOrNull(orderData.fabric_material_id),
        fabric_name: orderData.fabric_name || null,
        apparel_cut_id: toValidUuidOrNull(orderData.apparel_cut_id),
        cut_name: orderData.cut_name || null,
        dtf_dimension_id: toValidUuidOrNull(orderData.dtf_dimension_id),
        dtf_dimension_name: orderData.dtf_dimension_name || null,
        dtf_option_type: orderData.dtf_option_type || null,
        garment_blank_color: orderData.garment_blank_color || null,
        sizing_breakdown: orderData.sizing_breakdown || {},
        total_quantity: orderData.total_quantity || 1,
        raw_unit_price: orderData.raw_unit_price || 0,
        discount_percentage: orderData.discount_percentage || 0,
        final_unit_price: orderData.final_unit_price || 0,
        total_amount: orderData.total_amount || 0,
        status: orderData.status || 'pending_proof',
        production_notes: orderData.production_notes || null,
        shipping_address: orderData.shipping_address || null,
        shipping_courier: orderData.shipping_courier || null,
        tracking_number: orderData.tracking_number || null,
      };

      const retry = await supabase.from('orders').insert(baseRecord).select().single();
      data = retry.data;
      error = retry.error;
    }

    if (error) {
      console.error('[orderActions] saveOrderDb error:', error.message);
      return { success: false, message: error.message };
    }

    const savedOrder = data as Order;

    // Trigger WhatsApp Official Invoice asynchronously
    if (savedOrder && savedOrder.customer_phone) {
      sendOrderInvoiceWhatsApp(savedOrder, 'order_created').catch((e) =>
        console.error('[saveOrderDb] WA Invoice notification error:', e)
      );
    }

    return { success: true, order: savedOrder };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to save order';
    return { success: false, message };
  }
}

export async function markOrderBalancePaidAction(
  orderId: string,
  paymentMethod: string = 'Manual Transfer / Cash',
  paymentId?: string
): Promise<{ success: boolean; message?: string }> {
  try {
    const supabase = getServiceSupabase();
    if (!supabase) return { success: false, message: 'Database connection failed.' };

    const { data: currentOrder, error: fetchErr } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (fetchErr || !currentOrder) {
      return { success: false, message: 'Pesanan tidak dijumpai.' };
    }

    const totalAmount = Number(currentOrder.total_amount) || 0;

    const updates: Record<string, unknown> = {
      payment_status: 'paid',
      balance_amount: 0,
      paid_amount: totalAmount,
      balance_paid_at: new Date().toISOString(),
      balance_payment_method: paymentMethod,
      updated_at: new Date().toISOString(),
    };

    if (paymentId) updates.balance_payment_id = paymentId;

    const { data: updatedOrder, error } = await supabase
      .from('orders')
      .update(updates)
      .eq('id', orderId)
      .select()
      .single();

    if (error) {
      return { success: false, message: error.message };
    }

    // Trigger WhatsApp notification for full balance payment
    if (updatedOrder) {
      sendOrderInvoiceWhatsApp(updatedOrder as Order, 'balance_paid').catch((e) =>
        console.error('[markOrderBalancePaidAction] WA notification error:', e)
      );
    }

    return { success: true, message: 'Baki pesanan berjaya dilunaskan.' };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Ralat melunaskan baki pesanan';
    return { success: false, message };
  }
}

export async function updateOrderStatusDb(
  orderId: string,
  status: OrderStatus,
  trackingNumber?: string,
  notes?: string
): Promise<{ success: boolean; message?: string }> {
  try {
    const supabase = getServiceSupabase();
    if (!supabase) return { success: false, message: 'Database connection failed.' };

    const updates: Record<string, unknown> = {
      status,
      updated_at: new Date().toISOString(),
    };

    if (trackingNumber !== undefined) updates.tracking_number = trackingNumber;
    if (notes !== undefined) updates.production_notes = notes;

    const { error } = await supabase
      .from('orders')
      .update(updates)
      .eq('id', orderId);

    if (error) {
      console.error('[orderActions] updateOrderStatusDb error:', error.message);
      return { success: false, message: error.message };
    }

    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to update order status';
    return { success: false, message };
  }
}

export async function deleteOrderDb(orderIdOrNumber: string): Promise<{ success: boolean; message?: string }> {
  try {
    const supabase = getServiceSupabase();
    if (!supabase) return { success: false, message: 'Database connection failed.' };

    const cleanId = orderIdOrNumber.trim();
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cleanId);

    let query = supabase.from('orders').delete();
    if (isUuid) {
      query = query.or(`id.eq.${cleanId},order_number.eq.${cleanId}`);
    } else {
      query = query.eq('order_number', cleanId);
    }

    const { error } = await query;

    if (error) {
      console.error('[orderActions] deleteOrderDb error:', error.message);
      return { success: false, message: error.message };
    }

    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to delete order';
    return { success: false, message };
  }
}

/**
 * Server Action: Retrieve full order by order number or ID
 */
export async function getOrderByNumberOrIdDb(identifier: string): Promise<{ success: boolean; order?: Order; message?: string }> {
  try {
    const supabase = getServiceSupabase();
    if (!supabase) return { success: false, message: 'Database connection failed.' };

    const cleanIdentifier = identifier.trim().replace(/-(DP|BAL)$/i, '');
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cleanIdentifier);

    let query = supabase.from('orders').select('*');

    if (isUuid) {
      query = query.or(`id.eq.${cleanIdentifier},order_number.eq.${cleanIdentifier}`);
    } else {
      query = query.eq('order_number', cleanIdentifier);
    }

    const { data, error } = await query.single();

    if (error || !data) {
      return { success: false, message: 'Pesanan tidak dijumpai.' };
    }

    return { success: true, order: data as Order };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Ralat memuatkan data pesanan';
    return { success: false, message };
  }
}

/**
 * Server Action: Client approves production mockup proof
 */
export async function clientApproveProofAction(orderNumber: string): Promise<{ success: boolean; message?: string }> {
  try {
    const supabase = getServiceSupabase();
    if (!supabase) return { success: false, message: 'Database connection failed.' };

    const cleanOrderNumber = orderNumber.trim().replace(/-(DP|BAL)$/i, '');

    const { error } = await supabase
      .from('orders')
      .update({
        status: 'proof_approved',
        updated_at: new Date().toISOString(),
      })
      .eq('order_number', cleanOrderNumber);

    if (error) {
      return { success: false, message: error.message };
    }

    return { success: true, message: 'Mockup reka bentuk berjaya disahkan dan diluluskan!' };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Ralat meluluskan mockup';
    return { success: false, message };
  }
}

/**
 * Server Action: Send or Resend WhatsApp Invoice Directly to Customer
 */
export async function sendOrderInvoiceWhatsAppAction(
  identifier: string
): Promise<{ success: boolean; message: string }> {
  try {
    const res = await getOrderByNumberOrIdDb(identifier);
    if (!res.success || !res.order) {
      return { success: false, message: 'Pesanan tidak dijumpai.' };
    }

    const order = res.order;
    if (!order.customer_phone) {
      return { success: false, message: 'Nombor WhatsApp pelanggan tidak ditemui pada pesanan ini.' };
    }

    const waRes = await sendOrderInvoiceWhatsApp(order, 'manual_invoice');
    if (!waRes.success) {
      return { success: false, message: waRes.error || 'Gagal menghantar invois melalui WhatsApp.' };
    }

    return { success: true, message: `Invois rasmi berjaya dihantar ke WhatsApp ${order.customer_phone}!` };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Ralat semasa menghantar WhatsApp';
    return { success: false, message: msg };
  }
}

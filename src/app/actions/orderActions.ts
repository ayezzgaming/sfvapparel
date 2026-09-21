'use server';

import { getServiceSupabase } from '@/lib/supabase/serverClient';
import { Order, OrderStatus } from '@/types/database';

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

    if (!identifier) return { success: true, orders: [] };

    let cleanedPhone = identifier.replace(/[\s\-\+\(\)]/g, '');
    if (cleanedPhone.startsWith('0')) cleanedPhone = '60' + cleanedPhone.slice(1);
    if (!cleanedPhone.startsWith('6') && cleanedPhone.length >= 9) cleanedPhone = '60' + cleanedPhone;

    // Fetch orders matching customer_id, customer_phone, or normalized phone
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .or(`customer_id.eq.${identifier},customer_phone.eq.${identifier},customer_phone.eq.${cleanedPhone},customer_phone.eq.+${cleanedPhone}`)
      .order('created_at', { ascending: false });

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

export async function saveOrderDb(orderData: Partial<Order>): Promise<{ success: boolean; order?: Order; message?: string }> {
  try {
    const supabase = getServiceSupabase();
    if (!supabase) return { success: false, message: 'Database connection failed.' };

    const now = new Date();
    const yy = String(now.getFullYear()).slice(-2);
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const orderNumber = orderData.order_number || `SFV-${yy}${mm}-${randomSuffix}`;

    const recordToInsert = {
      order_number: orderNumber,
      customer_id: orderData.customer_id || null,
      customer_name: orderData.customer_name || 'Pelanggan',
      customer_email: orderData.customer_email || 'pelanggan@sfv.my',
      customer_phone: orderData.customer_phone || '',
      print_type: orderData.print_type || 'sublimation',
      design_id: orderData.design_id || null,
      design_title: orderData.design_title || 'Custom Order',
      mockup_url: orderData.mockup_url || null,
      custom_artwork_url: orderData.custom_artwork_url || null,
      fabric_material_id: orderData.fabric_material_id || null,
      fabric_name: orderData.fabric_name || null,
      apparel_cut_id: orderData.apparel_cut_id || null,
      cut_name: orderData.cut_name || null,
      dtf_dimension_id: orderData.dtf_dimension_id || null,
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

    const { data, error } = await supabase
      .from('orders')
      .insert(recordToInsert)
      .select()
      .single();

    if (error) {
      console.error('[orderActions] saveOrderDb error:', error.message);
      return { success: false, message: error.message };
    }

    return { success: true, order: data as Order };
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
      .select('total_amount, paid_amount')
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

    const { error } = await supabase
      .from('orders')
      .update(updates)
      .eq('id', orderId);

    if (error) {
      return { success: false, message: error.message };
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

export async function deleteOrderDb(orderId: string): Promise<{ success: boolean; message?: string }> {
  try {
    const supabase = getServiceSupabase();
    if (!supabase) return { success: false, message: 'Database connection failed.' };

    const { error } = await supabase
      .from('orders')
      .delete()
      .eq('id', orderId);

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

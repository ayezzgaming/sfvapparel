import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase/serverClient';
import { sendOrderStatusMilestoneWhatsApp } from '@/lib/whatsapp/order-notifier';
import { triggerStaffProductionAlert } from '@/lib/n8n/n8n-client';
import { Order, OrderStatus } from '@/types/database';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      orderId,
      orderNumber,
      customerName,
      customerPhone,
      status,
      trackingNumber,
      productionNotes,
      shippingCourier,
    } = body as {
      orderId?: string;
      orderNumber?: string;
      customerName?: string;
      customerPhone?: string;
      status?: OrderStatus;
      trackingNumber?: string;
      productionNotes?: string;
      shippingCourier?: string;
    };

    if (!orderId && !orderNumber) {
      return NextResponse.json(
        { success: false, message: 'ID atau Nombor Pesanan diperlukan.' },
        { status: 400 }
      );
    }

    const supabase = getServiceSupabase();
    if (!supabase) {
      return NextResponse.json(
        { success: false, message: 'Sambungan pangkalan data gagal.' },
        { status: 500 }
      );
    }

    // Fetch existing order record
    let query = supabase.from('orders').select('*');
    if (orderId) {
      query = query.eq('id', orderId);
    } else if (orderNumber) {
      query = query.eq('order_number', orderNumber);
    }

    const { data: currentOrder, error: fetchErr } = await query.single();
    if (fetchErr || !currentOrder) {
      return NextResponse.json(
        { success: false, message: 'Pesanan tidak dijumpai dalam pangkalan data.' },
        { status: 404 }
      );
    }

    const order = currentOrder as Order;
    const targetStatus = status || order.status;
    const targetTracking = trackingNumber !== undefined ? trackingNumber : order.tracking_number;
    const targetNotes = productionNotes !== undefined ? productionNotes : order.production_notes;

    // 1. Update Database Record
    const updates: Record<string, unknown> = {
      status: targetStatus,
      tracking_number: targetTracking,
      production_notes: targetNotes,
      updated_at: new Date().toISOString(),
    };

    const { data: updatedOrder, error: updateErr } = await supabase
      .from('orders')
      .update(updates)
      .eq('id', order.id)
      .select()
      .single();

    if (updateErr) {
      return NextResponse.json(
        { success: false, message: `Gagal mengemaskini status: ${updateErr.message}` },
        { status: 500 }
      );
    }

    const finalOrder = (updatedOrder as Order) || order;

    // 2. Trigger WhatsApp Milestone Notification to Customer
    const phone = customerPhone || finalOrder.customer_phone;
    let waResult: { success: boolean; error?: string } = { success: false, error: 'Tiada nombor telefon' };

    if (phone) {
      waResult = await sendOrderStatusMilestoneWhatsApp(
        finalOrder,
        targetStatus,
        targetTracking || undefined,
        shippingCourier || finalOrder.shipping_courier || undefined
      );
    }

    // 3. Trigger N8N Staff Production Alert
    triggerStaffProductionAlert({
      orderNumber: finalOrder.order_number,
      customerName: finalOrder.customer_name,
      status: targetStatus,
      itemCount: finalOrder.total_quantity || 1,
      totalAmount: Number(finalOrder.total_amount) || 0,
    }).catch((err) => console.warn('[send-status-update] N8N Alert error:', err));

    return NextResponse.json({
      success: true,
      message: waResult.success
        ? `Status ${targetStatus} berjaya dikemaskini & dihantar ke WhatsApp pelanggan!`
        : `Status dikemaskini dalam pangkalan data. (WhatsApp: ${waResult.error || 'Dihantar'})`,
      order: finalOrder,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Ralat semasa memproses kemas kini status';
    console.error('[send-status-update API] Error:', err);
    return NextResponse.json(
      { success: false, message: msg },
      { status: 500 }
    );
  }
}

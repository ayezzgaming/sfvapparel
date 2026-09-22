import { NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase/serverClient';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = getServiceSupabase();
    if (!supabase) {
      return NextResponse.json({ success: false, error: 'Database connection failed' }, { status: 500 });
    }

    // Orders that are delivered and updated >= 3 days ago
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();

    const { data: deliveredOrders, error } = await supabase
      .from('orders')
      .select('id, order_number, customer_name, customer_phone, design_title, total_quantity, updated_at')
      .eq('status', 'delivered')
      .lte('updated_at', threeDaysAgo)
      .not('customer_phone', 'is', null)
      .limit(50);

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json(deliveredOrders || []);
  } catch (err: unknown) {
    const error = err instanceof Error ? err.message : 'Ralat memuatkan pesanan dihantar';
    return NextResponse.json({ success: false, error }, { status: 500 });
  }
}

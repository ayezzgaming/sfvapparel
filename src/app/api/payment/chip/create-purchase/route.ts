import { NextRequest, NextResponse } from 'next/server';
import { createChipPurchase } from '@/lib/payment/chip-client';
import { getServiceSupabase } from '@/lib/supabase/serverClient';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      orderNumber,
      customerName,
      customerEmail,
      customerPhone,
      itemsDescription,
    } = body;

    if (!orderNumber) {
      return NextResponse.json(
        { success: false, message: 'Nombor pesanan diperlukan.' },
        { status: 400 }
      );
    }

    const baseOrderNumber = String(orderNumber).replace(/-(DP|BAL)$/i, '');
    const isDepositPayment = /-DP$/i.test(String(orderNumber));
    const isBalancePayment = /-BAL$/i.test(String(orderNumber));

    // Security check: Fetch authoritative order from Supabase to prevent client-side price tampering
    const supabase = getServiceSupabase();
    let validatedAmount = Number(body.totalAmount) || 0;
    let validatedCustomerName = customerName || 'Pelanggan SFV Apparel';
    let validatedCustomerEmail = customerEmail || '';
    let validatedCustomerPhone = customerPhone || '';

    if (supabase) {
      let { data: dbOrder, error: dbErr } = await supabase
        .from('orders')
        .select('*')
        .eq('order_number', baseOrderNumber)
        .single();

      // Retry once after 350ms if order was just created by client
      if ((dbErr || !dbOrder) && baseOrderNumber) {
        await new Promise((r) => setTimeout(r, 350));
        const retryResult = await supabase
          .from('orders')
          .select('*')
          .eq('order_number', baseOrderNumber)
          .single();
        dbOrder = retryResult.data;
        dbErr = retryResult.error;
      }

      if (dbErr || !dbOrder) {
        return NextResponse.json(
          { success: false, message: `Pesanan ${baseOrderNumber} tidak ditemui dalam sistem.` },
          { status: 404 }
        );
      }

      // Check if already paid
      if (dbOrder.payment_status === 'paid') {
        return NextResponse.json(
          { success: false, message: 'Pesanan ini telah dilunaskan sepenuhnya.' },
          { status: 400 }
        );
      }

      const totalOrderAmount = Number(dbOrder.total_amount) || 0;
      const depositOrderAmount = Number(dbOrder.deposit_amount) || Math.round(totalOrderAmount * 0.5 * 100) / 100;
      const balanceOrderAmount = Number(dbOrder.balance_amount) || Math.round((totalOrderAmount - depositOrderAmount) * 100) / 100;

      if (isBalancePayment) {
        if (balanceOrderAmount <= 0) {
          return NextResponse.json(
            { success: false, message: 'Tiada baki bayaran yang perlu dijelaskan untuk pesanan ini.' },
            { status: 400 }
          );
        }
        validatedAmount = balanceOrderAmount;
      } else if (isDepositPayment || dbOrder.payment_type_selected === 'deposit_50') {
        validatedAmount = depositOrderAmount;
      } else {
        validatedAmount = totalOrderAmount;
      }

      if (dbOrder.customer_name) validatedCustomerName = dbOrder.customer_name;
      if (dbOrder.customer_email) validatedCustomerEmail = dbOrder.customer_email;
      if (dbOrder.customer_phone) validatedCustomerPhone = dbOrder.customer_phone;

      // Update pending status in database
      const pendingStatus = isBalancePayment ? 'balance_pending' : 'deposit_pending';
      await supabase
        .from('orders')
        .update({
          payment_status: pendingStatus,
          updated_at: new Date().toISOString(),
        })
        .eq('order_number', baseOrderNumber);
    }

    if (validatedAmount <= 0) {
      return NextResponse.json(
        { success: false, message: 'Jumlah bayaran tidak sah (RM 0.00).' },
        { status: 400 }
      );
    }

    const host = req.headers.get('host') || 'localhost:3000';
    const protocol = host.includes('localhost') ? 'http' : 'https';
    const baseUrl = `${protocol}://${host}`;

    const result = await createChipPurchase({
      orderNumber: String(orderNumber),
      customerName: validatedCustomerName,
      customerEmail: validatedCustomerEmail,
      customerPhone: validatedCustomerPhone,
      totalAmount: validatedAmount,
      itemsDescription: itemsDescription || `Tempahan Kustom ${orderNumber}`,
      baseUrl,
    });

    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Ralat memproses sesi pembayaran CHIP.';
    console.error('[API create-purchase error]:', err);
    return NextResponse.json(
      { success: false, message: msg },
      { status: 500 }
    );
  }
}

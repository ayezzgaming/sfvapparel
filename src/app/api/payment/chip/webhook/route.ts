import { NextRequest, NextResponse } from 'next/server';
import { getFullChipConfig, verifyChipSignature } from '@/lib/payment/chip-client';
import { updateOrderPaymentStatusDb } from '@/app/actions/paymentActions';

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get('x-signature') || req.headers.get('X-Signature');

    const config = await getFullChipConfig();

    // Verify RSA Signature if Public Key is configured
    if (config.public_key && config.public_key.trim().length > 0) {
      const isValid = verifyChipSignature(rawBody, signature, config.public_key);
      if (!isValid) {
        console.warn('[CHIP Webhook] Invalid X-Signature signature header received');
        return NextResponse.json(
          { success: false, message: 'Invalid signature verification' },
          { status: 401 }
        );
      }
    }

    let payload: Record<string, unknown>;
    try {
      payload = JSON.parse(rawBody);
    } catch {
      return NextResponse.json(
        { success: false, message: 'Invalid JSON payload' },
        { status: 400 }
      );
    }

    console.log('[CHIP Webhook Received]:', JSON.stringify(payload, null, 2));

    const eventType = (payload.event_type as string) || (payload.event as string) || '';
    const status = (payload.status as string) || '';
    const reference = (payload.reference as string) || '';
    const purchaseId = (payload.id as string) || (payload.purchase_id as string) || '';
    const paymentMethod = (payload.payment_method as string) || (payload.payment_type as string) || 'CHIP Gateway';

    if (!reference) {
      console.log('[CHIP Webhook] No reference order number found in webhook payload');
      return NextResponse.json({ success: true, message: 'Received but no reference' });
    }

    // Determine payment outcome
    const isPaid = status === 'paid' || status === 'cleared' || eventType === 'purchase.paid';
    const isFailed = status === 'failed' || eventType === 'purchase.payment_failed';
    const isCancelled = status === 'cancelled' || eventType === 'purchase.cancelled';

    if (isPaid) {
      console.log(`[CHIP Webhook] Order ${reference} marked as PAID via ${paymentMethod} (Purchase ID: ${purchaseId})`);
      await updateOrderPaymentStatusDb(reference, 'paid', purchaseId, paymentMethod);
    } else if (isFailed) {
      console.log(`[CHIP Webhook] Order ${reference} payment FAILED`);
      await updateOrderPaymentStatusDb(reference, 'failed', purchaseId, paymentMethod);
    } else if (isCancelled) {
      console.log(`[CHIP Webhook] Order ${reference} payment CANCELLED`);
      await updateOrderPaymentStatusDb(reference, 'unpaid', purchaseId, paymentMethod);
    }

    // CHIP expects a 200 OK response with JSON acknowledgment
    return NextResponse.json({
      success: true,
      received: true,
      reference,
      status: isPaid ? 'paid' : status,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Internal webhook processing error';
    console.error('[CHIP Webhook Error]:', err);
    return NextResponse.json(
      { success: false, message: msg },
      { status: 500 }
    );
  }
}

import { Order } from '@/types/database';
import { formatCurrency } from '@/lib/pricing-calculator';
import { generateOrderInvoicePdf } from '@/lib/invoice/pdf-invoice-generator';

export type EmailInvoiceType =
  | 'order_created'
  | 'deposit_confirmed'
  | 'balance_paid'
  | 'balance_reminder'
  | 'manual_invoice';

/**
 * Generates an elegant, notification email with PDF download button and order summary
 */
export function generateInvoiceEmailHtml(
  order: Order,
  type: EmailInvoiceType = 'deposit_confirmed',
  baseUrl?: string
): string {
  const host = baseUrl || process.env.NEXT_PUBLIC_APP_URL || 'https://sfvapparel.my';
  const trackingLink = `${host}/history/${order.order_number}`;
  const pdfDownloadLink = `${host}/api/invoice/${encodeURIComponent(order.order_number)}/pdf`;

  const totalAmount = Number(order.total_amount) || 0;
  const depositAmount = Number(order.deposit_amount) || Math.round(totalAmount * 0.5 * 100) / 100;
  const balanceAmount =
    order.balance_amount !== undefined && order.balance_amount !== null && order.balance_amount > 0
      ? Number(order.balance_amount)
      : Math.max(0, Math.round((totalAmount - depositAmount) * 100) / 100);

  const isDepositPaid =
    order.payment_status === 'deposit_paid' ||
    order.payment_status === 'paid' ||
    Boolean(order.deposit_paid_at);

  const isPaidInFull = order.payment_status === 'paid' || Boolean(order.balance_paid_at);

  const invoiceNumber = `INV-${order.order_number.replace(/^SFV-?/i, '')}`;
  const orderDate = new Date(order.created_at || Date.now()).toLocaleDateString('ms-MY', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  let statusTitle = 'Pengesahan Bayaran Deposit 50%';
  let statusBadge = 'DEPOSIT 50% DISAHKAN';
  let badgeColor = '#059669'; // Emerald
  let leadText = 'Bayaran deposit 50% untuk pesanan anda telah berjaya diterima dan disahkan. Barisan pengeluaran kilang SFV Apparel telah dimulakan.';

  if (type === 'balance_paid' || isPaidInFull) {
    statusTitle = 'Resit Bayaran Penuh 100% (Lunas)';
    statusBadge = 'LUNAS SEPENUHNYA';
    badgeColor = '#059669';
    leadText = 'Bayaran penuh bagi pesanan anda telah disahkan lunas sepenuhnya. Tempahan anda sedia untuk dihantar / diambil.';
  } else if (type === 'balance_reminder') {
    statusTitle = 'Peringatan Pelunasan Baki 50%';
    statusBadge = 'SEDIA DILUNASKAN';
    badgeColor = '#d97706';
    leadText = 'Pesanan jersi anda kini telah siap dicetak dan sedia untuk dihantar. Sila jelaskan baki 50% untuk pelepasan kurier.';
  } else if (type === 'order_created') {
    statusTitle = 'Pengesahan Tempahan Rasmi';
    statusBadge = 'PESANAN DITERIMA';
    badgeColor = '#0284c7';
    leadText = 'Tempahan jersi anda telah direkodkan dalam sistem pengeluaran SFV Apparel.';
  }

  return `
<!DOCTYPE html>
<html lang="ms">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invois Rasmi PDF - ${order.order_number}</title>
</head>
<body style="margin:0;padding:0;background-color:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1e293b;-webkit-font-smoothing:antialiased;">
  <div style="max-width:580px;margin:30px auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.06);border:1px solid #e2e8f0;">
    
    <!-- Top Brand Header -->
    <div style="background:#0f172a;padding:28px 24px;text-align:center;">
      <h1 style="color:#ffffff;font-size:22px;margin:0;font-weight:800;letter-spacing:1.5px;">SFV APPAREL</h1>
      <p style="color:#94a3b8;font-size:12px;margin:4px 0 0 0;letter-spacing:0.5px;text-transform:uppercase;">Pakar Pembuatan Jersi & Pakaian Kustom Malaysia</p>
    </div>

    <!-- Notification Header -->
    <div style="padding:24px 24px 16px 24px;border-bottom:1px solid #f1f5f9;">
      <div style="display:inline-block;background:${badgeColor};color:#ffffff;font-size:10.5px;font-weight:700;padding:4px 10px;border-radius:20px;text-transform:uppercase;margin-bottom:10px;">
        ${statusBadge}
      </div>
      <h2 style="margin:0 0 8px 0;font-size:18px;color:#0f172a;font-weight:700;">${statusTitle}</h2>
      <p style="margin:0;font-size:13.5px;color:#475569;line-height:1.5;">${leadText}</p>
    </div>

    <!-- PDF Attachment Notice Card -->
    <div style="margin:16px 24px;background:#f8fafc;border:1.5px dashed #cbd5e1;border-radius:12px;padding:16px;text-align:center;">
      <div style="font-size:28px;margin-bottom:6px;">📄</div>
      <strong style="display:block;font-size:14px;color:#0f172a;margin-bottom:4px;">Fail Invois Rasmi PDF Dilampirkan</strong>
      <p style="margin:0 0 12px 0;font-size:12px;color:#64748b;">
        Dokumen rasmi <strong>Invois_SFV_${order.order_number}.pdf</strong> telah disertakan sebagai lampiran pada email ini.
      </p>
      <a href="${pdfDownloadLink}" style="display:inline-block;background:#0284c7;color:#ffffff;text-decoration:none;font-size:12.5px;font-weight:700;padding:8px 18px;border-radius:8px;">
        Muat Turun Invois PDF Langsung ↓
      </a>
    </div>

    <!-- Brief Order Details -->
    <div style="padding:0 24px 20px 24px;">
      <table style="width:100%;border-collapse:collapse;font-size:13px;margin-bottom:16px;">
        <tr>
          <td style="padding:6px 0;color:#64748b;">No. Invois:</td>
          <td style="padding:6px 0;text-align:right;font-weight:700;color:#0f172a;font-family:monospace;">${invoiceNumber}</td>
        </tr>
        <tr>
          <td style="padding:6px 0;color:#64748b;">No. Pesanan:</td>
          <td style="padding:6px 0;text-align:right;font-weight:700;color:#0f172a;font-family:monospace;">${order.order_number}</td>
        </tr>
        <tr>
          <td style="padding:6px 0;color:#64748b;">Pelanggan:</td>
          <td style="padding:6px 0;text-align:right;font-weight:600;color:#0f172a;">${order.customer_name} (${order.customer_phone})</td>
        </tr>
        <tr>
          <td style="padding:6px 0;color:#64748b;">Tarikh:</td>
          <td style="padding:6px 0;text-align:right;font-weight:600;color:#334155;">${orderDate}</td>
        </tr>
        <tr>
          <td style="padding:6px 0;color:#64748b;">Item Tempahan:</td>
          <td style="padding:6px 0;text-align:right;font-weight:600;color:#0f172a;">${order.design_title} (${order.total_quantity} helai)</td>
        </tr>
      </table>

      <!-- Financial Snapshot -->
      <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:14px;margin-bottom:20px;">
        <div style="display:flex;justify-content:space-between;margin-bottom:6px;font-size:13px;">
          <span style="color:#64748b;">Jumlah Nilai Tempahan:</span>
          <strong style="color:#0f172a;">${formatCurrency(totalAmount)}</strong>
        </div>
        <div style="display:flex;justify-content:space-between;margin-bottom:6px;font-size:13px;">
          <span style="color:#64748b;">1. Deposit 50%:</span>
          <strong style="color:${isDepositPaid ? '#059669' : '#d97706'};">
            ${formatCurrency(depositAmount)} ${isDepositPaid ? '✓ (Disahkan)' : '(Menunggu)'}
          </strong>
        </div>
        <div style="display:flex;justify-content:space-between;font-size:13px;">
          <span style="color:#64748b;">2. Baki 50%:</span>
          <strong style="color:${isPaidInFull ? '#059669' : '#0f172a'};">
            ${formatCurrency(balanceAmount)} ${isPaidInFull ? '✓ (Lunas)' : '(Semasa Siap)'}
          </strong>
        </div>
      </div>

      <!-- Action Tracking Button -->
      <div style="text-align:center;margin-top:20px;">
        <a href="${trackingLink}" style="display:inline-block;background:#0f172a;color:#ffffff;text-decoration:none;font-size:13.5px;font-weight:700;padding:12px 24px;border-radius:10px;">
          Jejak Pengeluaran & Status Pesanan →
        </a>
      </div>
    </div>

    <!-- Footer -->
    <div style="background:#f8fafc;padding:18px 24px;text-align:center;border-top:1px solid #e2e8f0;font-size:11.5px;color:#94a3b8;">
      <p style="margin:0 0 3px 0;font-weight:600;color:#64748b;">SFV APPAREL SDN BHD</p>
      <p style="margin:0;">Sebarang pertanyaan, hubungi Khidmat Pelanggan kami melalui WhatsApp rasmi.</p>
    </div>

  </div>
</body>
</html>
  `.trim();
}

/**
 * Sends official order invoice email with attached high-quality PDF to customer
 */
export async function sendOrderInvoiceEmail(
  order: Order,
  type: EmailInvoiceType = 'deposit_confirmed',
  baseUrl?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const customerEmail = order.customer_email?.trim();
    if (!customerEmail || !customerEmail.includes('@') || customerEmail.endsWith('@example.com')) {
      return { success: false, error: 'Tiada alamat email pelanggan yang sah.' };
    }

    // 1. Generate crisp, professional Vector PDF Invoice
    const pdfBytes = await generateOrderInvoicePdf(order, { baseUrl });
    const pdfBase64 = Buffer.from(pdfBytes).toString('base64');
    const pdfFilename = `Invois_SFV_${order.order_number.replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf`;

    const htmlContent = generateInvoiceEmailHtml(order, type, baseUrl);
    const invoiceNumber = `INV-${order.order_number.replace(/^SFV-?/i, '')}`;

    let subject = `[Invois SFV Apparel] Pengesahan Bayaran Deposit - ${invoiceNumber}`;
    if (type === 'balance_paid') {
      subject = `[Resit SFV Apparel] Bayaran Penuh Disahkan (Lunas) - ${invoiceNumber}`;
    } else if (type === 'balance_reminder') {
      subject = `[Peringatan SFV Apparel] Tempahan Siap & Pelunasan Baki - ${invoiceNumber}`;
    } else if (type === 'order_created') {
      subject = `[Pengesahan Pesanan] Tempahan Diterima - ${invoiceNumber}`;
    }

    const resendApiKey = process.env.RESEND_API_KEY;

    if (!resendApiKey) {
      console.log(`[sendOrderInvoiceEmail] [DRY RUN / No RESEND_API_KEY] Email with attached PDF (${pdfFilename}, ${pdfBytes.length} bytes) would be sent to: ${customerEmail} with subject: "${subject}"`);
      return { success: true };
    }

    // 2. Dispatch email via Resend API with PDF attachment
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM || 'SFV Apparel <orders@sfvapparel.my>',
        to: [customerEmail],
        subject: subject,
        html: htmlContent,
        attachments: [
          {
            filename: pdfFilename,
            content: pdfBase64,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errBody = await response.text();
      console.error('[sendOrderInvoiceEmail] Resend API error:', errBody);
      return { success: false, error: errBody };
    }

    const data = await response.json();
    console.log('[sendOrderInvoiceEmail] Email with PDF invoice attached successfully sent:', data);
    return { success: true };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Ralat menjana & menghantar PDF email invois';
    console.error('[sendOrderInvoiceEmail] Exception:', errorMsg);
    return { success: false, error: errorMsg };
  }
}

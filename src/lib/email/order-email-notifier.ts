import { Order } from '@/types/database';
import { formatCurrency } from '@/lib/pricing-calculator';

export type EmailInvoiceType =
  | 'order_created'
  | 'deposit_confirmed'
  | 'balance_paid'
  | 'balance_reminder'
  | 'manual_invoice';

/**
 * Generates high-converting, professional HTML invoice email template
 */
export function generateInvoiceHtml(order: Order, type: EmailInvoiceType = 'deposit_confirmed', baseUrl?: string): string {
  const host = baseUrl || process.env.NEXT_PUBLIC_APP_URL || 'https://sfvapparel.my';
  const trackingLink = `${host}/history/${order.order_number}`;

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

  let statusTitle = 'PENGESAHAN BAYARAN DEPOSIT 50%';
  let statusBadge = 'DEPOSIT DISAHKAN DITERIMA';
  let badgeColor = '#10b981'; // Emerald

  if (type === 'balance_paid' || isPaidInFull) {
    statusTitle = 'RESIT RASMI BAYARAN PENUH 100%';
    statusBadge = 'LUNAS SEPENUHNYA';
    badgeColor = '#059669';
  } else if (type === 'balance_reminder') {
    statusTitle = 'PERINGATAN PELUNASAN BAKI 50%';
    statusBadge = 'MENUNGGU PELUNASAN BAKI';
    badgeColor = '#f59e0b';
  } else if (type === 'order_created') {
    statusTitle = 'PENGESAHAN TEMPAHAN RASMI';
    statusBadge = 'PESANAN DITERIMA';
    badgeColor = '#3b82f6';
  }

  // Sizing breakdown list
  let sizeRows = '';
  if (order.sizing_breakdown && Object.keys(order.sizing_breakdown).length > 0) {
    sizeRows = Object.entries(order.sizing_breakdown)
      .map(([s, q]) => `<span style="display:inline-block;background:#f1f5f9;color:#334155;padding:3px 8px;border-radius:6px;margin:2px 4px 2px 0;font-size:12px;font-weight:600;">${s}: ${q} helai</span>`)
      .join(' ');
  }

  return `
<!DOCTYPE html>
<html lang="ms">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invois Rasmi SFV Apparel - ${order.order_number}</title>
</head>
<body style="margin:0;padding:0;background-color:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1e293b;-webkit-font-smoothing:antialiased;">
  <div style="max-width:600px;margin:30px auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.05);border:1px solid #e2e8f0;">
    
    <!-- Header -->
    <div style="background:#09090b;padding:28px 24px;text-align:center;">
      <h1 style="color:#ffffff;font-size:22px;margin:0;font-weight:800;letter-spacing:1px;">SFV APPAREL</h1>
      <p style="color:#94a3b8;font-size:12px;margin:4px 0 0 0;letter-spacing:0.5px;text-transform:uppercase;">Pakar Pembuatan Jersi & Pakaian Kustom Malaysia</p>
    </div>

    <!-- Status Banner -->
    <div style="background:#f1f5f9;padding:16px 24px;border-bottom:1px solid #e2e8f0;display:flex;justify-content:space-between;align-items:center;">
      <div>
        <span style="font-size:11px;text-transform:uppercase;color:#64748b;font-weight:700;display:block;">Jenis Notifikasi</span>
        <strong style="font-size:14px;color:#0f172a;">${statusTitle}</strong>
      </div>
      <div style="text-align:right;">
        <span style="display:inline-block;background:${badgeColor};color:#ffffff;font-size:11px;font-weight:700;padding:4px 10px;border-radius:20px;">${statusBadge}</span>
      </div>
    </div>

    <!-- Invoice Details -->
    <div style="padding:24px;">
      <table style="width:100%;border-collapse:collapse;margin-bottom:20px;font-size:13px;">
        <tr>
          <td style="padding:6px 0;color:#64748b;">No. Invois:</td>
          <td style="padding:6px 0;text-align:right;font-weight:700;color:#0f172a;font-family:monospace;">${invoiceNumber}</td>
        </tr>
        <tr>
          <td style="padding:6px 0;color:#64748b;">No. Pesanan:</td>
          <td style="padding:6px 0;text-align:right;font-weight:700;color:#0f172a;font-family:monospace;">${order.order_number}</td>
        </tr>
        <tr>
          <td style="padding:6px 0;color:#64748b;">Tarikh:</td>
          <td style="padding:6px 0;text-align:right;font-weight:600;color:#334155;">${orderDate}</td>
        </tr>
        <tr>
          <td style="padding:6px 0;color:#64748b;">Nama Pelanggan:</td>
          <td style="padding:6px 0;text-align:right;font-weight:600;color:#0f172a;">${order.customer_name}</td>
        </tr>
        <tr>
          <td style="padding:6px 0;color:#64748b;">Telefon / WA:</td>
          <td style="padding:6px 0;text-align:right;font-weight:600;color:#334155;">${order.customer_phone}</td>
        </tr>
        ${order.customer_email ? `
        <tr>
          <td style="padding:6px 0;color:#64748b;">Email:</td>
          <td style="padding:6px 0;text-align:right;font-weight:600;color:#334155;">${order.customer_email}</td>
        </tr>` : ''}
      </table>

      <!-- Order Summary Card -->
      <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:16px;margin-bottom:24px;">
        <h3 style="margin:0 0 10px 0;font-size:14px;font-weight:700;color:#0f172a;">Perincian Tempahan:</h3>
        <p style="margin:0 0 6px 0;font-size:13px;color:#334155;"><strong>Item:</strong> ${order.design_title}</p>
        <p style="margin:0 0 6px 0;font-size:13px;color:#334155;"><strong>Teknik:</strong> ${order.print_type === 'sublimation' ? 'Sublimasi Penuh (Full Sublimation)' : 'DTF Premium Heatpress'}</p>
        <p style="margin:0 0 10px 0;font-size:13px;color:#334155;"><strong>Jumlah Kuantiti:</strong> ${order.total_quantity} helai</p>
        ${sizeRows ? `<div style="margin-top:8px;">${sizeRows}</div>` : ''}
        ${order.shipping_address ? `<p style="margin:12px 0 0 0;font-size:12px;color:#64748b;border-top:1px dashed #cbd5e1;padding-top:8px;"><strong>Alamat / Kaedah Penghantaran:</strong><br>${order.shipping_address}</p>` : ''}
      </div>

      <!-- Payment Breakdown Table -->
      <table style="width:100%;border-collapse:collapse;margin-bottom:24px;font-size:13px;">
        <tr style="border-bottom:1px solid #e2e8f0;">
          <td style="padding:10px 0;color:#475569;">Jumlah Nilai Tempahan:</td>
          <td style="padding:10px 0;text-align:right;font-weight:700;color:#0f172a;font-size:15px;">${formatCurrency(totalAmount)}</td>
        </tr>
        <tr style="border-bottom:1px solid #e2e8f0;">
          <td style="padding:10px 0;color:#475569;">1. Bayaran Deposit 50%:</td>
          <td style="padding:10px 0;text-align:right;font-weight:700;color:${isDepositPaid ? '#059669' : '#d97706'};">
            ${formatCurrency(depositAmount)} ${isDepositPaid ? '✓ (Telah Dibayar)' : '(Belum Dibayar)'}
          </td>
        </tr>
        <tr style="border-bottom:2px solid #0f172a;">
          <td style="padding:10px 0;color:#475569;">2. Baki Pelunasan 50%:</td>
          <td style="padding:10px 0;text-align:right;font-weight:700;color:${isPaidInFull ? '#059669' : '#0f172a'};">
            ${formatCurrency(balanceAmount)} ${isPaidInFull ? '✓ (Lunas)' : '(Sedia Dibayar Bila Pos)'}
          </td>
        </tr>
      </table>

      <!-- Tracking & Portal Button -->
      <div style="text-align:center;margin:30px 0 10px 0;">
        <a href="${trackingLink}" style="display:inline-block;background:#09090b;color:#ffffff;text-decoration:none;font-size:14px;font-weight:700;padding:14px 28px;border-radius:10px;box-shadow:0 4px 12px rgba(0,0,0,0.15);">
          Semak Status & Invois Langsung →
        </a>
      </div>
      <p style="text-align:center;font-size:11px;color:#94a3b8;margin:10px 0 0 0;">
        Pautan: <a href="${trackingLink}" style="color:#64748b;">${trackingLink}</a>
      </p>

    </div>

    <!-- Footer -->
    <div style="background:#f8fafc;padding:20px;text-align:center;border-top:1px solid #e2e8f0;font-size:12px;color:#94a3b8;">
      <p style="margin:0 0 4px 0;font-weight:600;color:#64748b;">SFV APPAREL SDN BHD</p>
      <p style="margin:0;">Sebarang pertanyaan, hubungi WhatsApp Khidmat Pelanggan kami.</p>
    </div>

  </div>
</body>
</html>
  `.trim();
}

/**
 * Sends order invoice email to customer via Resend API or SMTP
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

    const resendApiKey = process.env.RESEND_API_KEY;
    const htmlContent = generateInvoiceHtml(order, type, baseUrl);
    const invoiceNumber = `INV-${order.order_number.replace(/^SFV-?/i, '')}`;

    let subject = `[Invois SFV Apparel] Pengesahan Bayaran Deposit - ${invoiceNumber}`;
    if (type === 'balance_paid') {
      subject = `[Resit SFV Apparel] Bayaran Penuh Disahkan (Lunas) - ${invoiceNumber}`;
    } else if (type === 'balance_reminder') {
      subject = `[Peringatan SFV Apparel] Tempahan Siap & Pelunasan Baki - ${invoiceNumber}`;
    } else if (type === 'order_created') {
      subject = `[Pengesahan Pesanan] Tempahan Diterima - ${invoiceNumber}`;
    }

    if (!resendApiKey) {
      console.log(`[sendOrderInvoiceEmail] [DRY RUN / No RESEND_API_KEY] Email would be sent to: ${customerEmail} with subject: "${subject}"`);
      return { success: true };
    }

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
      }),
    });

    if (!response.ok) {
      const errBody = await response.text();
      console.error('[sendOrderInvoiceEmail] Resend API error:', errBody);
      return { success: false, error: errBody };
    }

    const data = await response.json();
    console.log('[sendOrderInvoiceEmail] Email successfully sent:', data);
    return { success: true };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Ralat menghantar email invois';
    console.error('[sendOrderInvoiceEmail] Exception:', errorMsg);
    return { success: false, error: errorMsg };
  }
}

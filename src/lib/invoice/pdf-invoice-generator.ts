import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { PDFDocument, rgb, StandardFonts, PDFImage } from 'pdf-lib';
import { Order } from '@/types/database';
import { formatCurrency } from '@/lib/pricing-calculator';

export interface GeneratePdfOptions {
  baseUrl?: string;
  isBalancePaid?: boolean;
}

// In-memory cache for the rasterized logo PNG buffer to maximize PDF generation speed
let cachedLogoPngBuffer: Buffer | null = null;

async function getOfficialLogoPng(): Promise<Buffer | null> {
  if (cachedLogoPngBuffer) return cachedLogoPngBuffer;
  try {
    const logoSvgPath = path.join(process.cwd(), 'public', 'logo.svg');
    if (fs.existsSync(logoSvgPath)) {
      const svgBuffer = fs.readFileSync(logoSvgPath);
      const pngBuffer = await sharp(svgBuffer).resize(512, 512).png().toBuffer();
      cachedLogoPngBuffer = pngBuffer;
      return pngBuffer;
    }
  } catch (err) {
    console.warn('[pdf-invoice-generator] Could not convert public/logo.svg:', err);
  }
  return null;
}

/**
 * Generates an official, neat, ultra-crisp Vector PDF Invoice buffer for SFV Apparel
 */
export async function generateOrderInvoicePdf(
  order: Order,
  options?: GeneratePdfOptions
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  
  // Set PDF Metadata
  pdfDoc.setTitle(`Invois SFV Apparel - ${order.order_number}`);
  pdfDoc.setAuthor('SFV Apparel Sdn Bhd');
  pdfDoc.setSubject(`Invois Rasmi Pesanan ${order.order_number}`);
  pdfDoc.setCreator('SFV Apparel ERP System');

  // A4 Size: 595.28 x 841.89 points
  const page = pdfDoc.addPage([595.28, 841.89]);
  const { width, height } = page.getSize();

  // Load standard Helvetica fonts
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontOblique = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);

  // Load official logo
  let embeddedLogo: PDFImage | null = null;
  try {
    const logoPng = await getOfficialLogoPng();
    if (logoPng) {
      embeddedLogo = await pdfDoc.embedPng(logoPng);
    }
  } catch (e) {
    console.warn('[pdf-invoice-generator] Logo embed warning:', e);
  }

  // Palette definition
  const primaryDark = rgb(0.06, 0.09, 0.16); // #0F172A
  const textDark = rgb(0.12, 0.16, 0.23); // #1E293B
  const textMuted = rgb(0.39, 0.45, 0.55); // #64748B
  const textLight = rgb(0.58, 0.64, 0.72); // #94A3B8
  const bgLight = rgb(0.97, 0.98, 0.99); // #F8FAFC
  const borderGray = rgb(0.88, 0.91, 0.94); // #E2E8F0
  const emeraldGreen = rgb(0.02, 0.59, 0.41); // #059669
  const amberOrange = rgb(0.85, 0.47, 0.02); // #D97706
  const brandBlue = rgb(0.0, 0.74, 1.0); // #00BDFF (Official SFV Brand Blue)

  // Subtle Watermark in background if logo available
  if (embeddedLogo) {
    page.drawImage(embeddedLogo, {
      x: width / 2 - 120,
      y: height / 2 - 120,
      width: 240,
      height: 240,
      opacity: 0.04,
    });
  }

  // Financial calculations
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

  const isPaidInFull = order.payment_status === 'paid' || Boolean(order.balance_paid_at) || options?.isBalancePaid;

  const invoiceNumber = `INV-${order.order_number.replace(/^SFV-?/i, '')}`;
  const orderDate = new Date(order.created_at || Date.now()).toLocaleDateString('ms-MY', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const host = options?.baseUrl || process.env.NEXT_PUBLIC_APP_URL || 'https://sfvapparel.my';
  const trackingLink = `${host}/history/${order.order_number}`;

  // -------------------------------------------------------------
  // 1. TOP HEADER BRAND BAR WITH OFFICIAL LOGO
  // -------------------------------------------------------------
  // Header background rectangle
  page.drawRectangle({
    x: 0,
    y: height - 100,
    width: width,
    height: 100,
    color: primaryDark,
  });

  // Top accent stripe (Brand Blue)
  page.drawRectangle({
    x: 0,
    y: height - 4,
    width: width,
    height: 4,
    color: brandBlue,
  });

  // Draw Official Emblem / Logo Image
  const brandTextStartX = embeddedLogo ? 96 : 40;
  if (embeddedLogo) {
    page.drawImage(embeddedLogo, {
      x: 38,
      y: height - 84,
      width: 48,
      height: 48,
    });
  }

  // Brand Name
  page.drawText('SFV APPAREL', {
    x: brandTextStartX,
    y: height - 46,
    size: 21,
    font: fontBold,
    color: rgb(1, 1, 1),
  });

  page.drawText('Pakar Pembuatan Pakaian & Jersi Kustom Malaysia', {
    x: brandTextStartX,
    y: height - 60,
    size: 9,
    font: fontRegular,
    color: rgb(0.75, 0.82, 0.9),
  });

  page.drawText('No. Pendaftaran: 202601001234 (1598721-M)  |  Web: sfvapparel.my', {
    x: brandTextStartX,
    y: height - 73,
    size: 7.5,
    font: fontRegular,
    color: rgb(0.6, 0.68, 0.78),
  });

  // Invoice Title Right
  const docTitle = isPaidInFull ? 'RESIT RASMI (LUNAS)' : 'INVOIS RASMI';
  const docTitleWidth = fontBold.widthOfTextAtSize(docTitle, 15);
  page.drawText(docTitle, {
    x: width - 40 - docTitleWidth,
    y: height - 45,
    size: 15,
    font: fontBold,
    color: rgb(1, 1, 1),
  });

  const invNumText = `NO: ${invoiceNumber}`;
  const invNumWidth = fontBold.widthOfTextAtSize(invNumText, 10.5);
  page.drawText(invNumText, {
    x: width - 40 - invNumWidth,
    y: height - 61,
    size: 10.5,
    font: fontBold,
    color: brandBlue,
  });

  const dateText = `Tarikh: ${orderDate}`;
  const dateWidth = fontRegular.widthOfTextAtSize(dateText, 8);
  page.drawText(dateText, {
    x: width - 40 - dateWidth,
    y: height - 74,
    size: 8,
    font: fontRegular,
    color: rgb(0.8, 0.85, 0.9),
  });

  // -------------------------------------------------------------
  // 2. STATUS & RECIPIENT INFORMATION (2-COLUMN CARDS)
  // -------------------------------------------------------------
  const cardY = height - 195;
  const cardHeight = 82;
  const colWidth = 245;

  // Left Card: Dikeluarkan Kepada (Bill To)
  page.drawRectangle({
    x: 40,
    y: cardY,
    width: colWidth,
    height: cardHeight,
    color: bgLight,
    borderColor: borderGray,
    borderWidth: 1,
  });

  page.drawText('DIKELUARKAN KEPADA:', {
    x: 50,
    y: cardY + cardHeight - 16,
    size: 8,
    font: fontBold,
    color: textMuted,
  });

  page.drawText(order.customer_name || 'Pelanggan SFV Apparel', {
    x: 50,
    y: cardY + cardHeight - 30,
    size: 10,
    font: fontBold,
    color: textDark,
  });

  page.drawText(`Tel / WA: ${order.customer_phone || '-'}`, {
    x: 50,
    y: cardY + cardHeight - 44,
    size: 8.5,
    font: fontRegular,
    color: textDark,
  });

  if (order.customer_email) {
    page.drawText(`Email: ${order.customer_email}`, {
      x: 50,
      y: cardY + cardHeight - 56,
      size: 8.5,
      font: fontRegular,
      color: textDark,
    });
  }

  // Right Card: Maklumat Penghantaran & Status
  page.drawRectangle({
    x: width - 40 - colWidth,
    y: cardY,
    width: colWidth,
    height: cardHeight,
    color: bgLight,
    borderColor: borderGray,
    borderWidth: 1,
  });

  page.drawText('MAKLUMAT PENGHANTARAN & STATUS:', {
    x: width - 40 - colWidth + 10,
    y: cardY + cardHeight - 16,
    size: 8,
    font: fontBold,
    color: textMuted,
  });

  const isPickup = !order.shipping_address || order.shipping_address.toLowerCase().includes('ambil');
  page.drawText(`Kaedah: ${isPickup ? 'Ambil Sendiri di Kilang' : 'Penghantaran Kurier'}`, {
    x: width - 40 - colWidth + 10,
    y: cardY + cardHeight - 30,
    size: 9,
    font: fontBold,
    color: textDark,
  });

  const addressShort = (order.shipping_address || 'Ambil di Kilang SFV Apparel').slice(0, 42);
  page.drawText(`Alamat: ${addressShort}`, {
    x: width - 40 - colWidth + 10,
    y: cardY + cardHeight - 44,
    size: 8,
    font: fontRegular,
    color: textDark,
  });

  // Status Badge in right card
  const badgeText = isPaidInFull ? 'STATUS: LUNAS SEPENUHNYA (100%)' : isDepositPaid ? 'STATUS: DEPOSIT 50% DISAHKAN' : 'STATUS: MENUNGGU BAYARAN DEPOSIT';
  const badgeColor = isPaidInFull ? emeraldGreen : isDepositPaid ? emeraldGreen : amberOrange;
  page.drawText(badgeText, {
    x: width - 40 - colWidth + 10,
    y: cardY + cardHeight - 64,
    size: 8.5,
    font: fontBold,
    color: badgeColor,
  });

  // -------------------------------------------------------------
  // 3. ITEMS & SPECIFICATIONS TABLE
  // -------------------------------------------------------------
  const tableY = cardY - 25;
  const tableHeaderHeight = 22;

  // Table Header Background
  page.drawRectangle({
    x: 40,
    y: tableY - tableHeaderHeight,
    width: width - 80,
    height: tableHeaderHeight,
    color: primaryDark,
  });

  // Table Header Labels
  page.drawText('DESKRIPSI ITEM & SPESIFIKASI', {
    x: 50,
    y: tableY - 15,
    size: 8.5,
    font: fontBold,
    color: rgb(1, 1, 1),
  });

  page.drawText('KUANTITI', {
    x: 340,
    y: tableY - 15,
    size: 8.5,
    font: fontBold,
    color: rgb(1, 1, 1),
  });

  page.drawText('HARGA UNIT', {
    x: 420,
    y: tableY - 15,
    size: 8.5,
    font: fontBold,
    color: rgb(1, 1, 1),
  });

  page.drawText('JUMLAH (RM)', {
    x: 505,
    y: tableY - 15,
    size: 8.5,
    font: fontBold,
    color: rgb(1, 1, 1),
  });

  // Row 1: Main Custom Apparel Item
  const row1Y = tableY - tableHeaderHeight - 85;
  page.drawRectangle({
    x: 40,
    y: row1Y,
    width: width - 80,
    height: 85,
    color: rgb(1, 1, 1),
    borderColor: borderGray,
    borderWidth: 1,
  });

  // Item Title
  page.drawText(order.design_title || 'Jersi Kustom SFV', {
    x: 50,
    y: row1Y + 68,
    size: 10.5,
    font: fontBold,
    color: textDark,
  });

  // Technique / Material Details
  const printTechLabel = order.print_type === 'sublimation' ? 'Cetakan Sublimasi Penuh (Full Sublimation)' : 'Cetakan DTF Premium Heatpress';
  page.drawText(`• Teknik: ${printTechLabel}`, {
    x: 50,
    y: row1Y + 54,
    size: 8,
    font: fontRegular,
    color: textMuted,
  });

  const fabricCutText = [
    order.fabric_name ? `Kain: ${order.fabric_name}` : '',
    order.cut_name ? `Potongan: ${order.cut_name}` : '',
  ].filter(Boolean).join(' | ');

  if (fabricCutText) {
    page.drawText(`• Spesifikasi: ${fabricCutText}`, {
      x: 50,
      y: row1Y + 42,
      size: 8,
      font: fontRegular,
      color: textMuted,
    });
  }

  // Sizing Breakdown Text
  let sizingSummary = '';
  if (order.sizing_breakdown && Object.keys(order.sizing_breakdown).length > 0) {
    sizingSummary = Object.entries(order.sizing_breakdown)
      .map(([s, q]) => `${s}: ${q}`)
      .join(', ');
  }
  if (sizingSummary) {
    const truncatedSizing = sizingSummary.length > 55 ? sizingSummary.slice(0, 52) + '...' : sizingSummary;
    page.drawText(`• Pecahan Saiz: ${truncatedSizing}`, {
      x: 50,
      y: row1Y + 30,
      size: 8,
      font: fontRegular,
      color: textMuted,
    });
  }

  // Row 1 Column Values
  const qtyText = `${order.total_quantity || 1} helai`;
  page.drawText(qtyText, {
    x: 340,
    y: row1Y + 68,
    size: 9.5,
    font: fontBold,
    color: textDark,
  });

  const unitPriceVal = Number(order.final_unit_price || order.raw_unit_price) || (totalAmount / (order.total_quantity || 1));
  page.drawText(formatCurrency(unitPriceVal), {
    x: 420,
    y: row1Y + 68,
    size: 9.5,
    font: fontRegular,
    color: textDark,
  });

  const itemSubtotal = (order.total_quantity || 1) * unitPriceVal;
  const itemSubtotalStr = formatCurrency(itemSubtotal > 0 ? itemSubtotal : totalAmount);
  page.drawText(itemSubtotalStr, {
    x: 505,
    y: row1Y + 68,
    size: 9.5,
    font: fontBold,
    color: textDark,
  });

  // -------------------------------------------------------------
  // 4. FINANCIAL SUMMARY BREAKDOWN
  // -------------------------------------------------------------
  const summaryBoxY = row1Y - 145;
  const summaryBoxWidth = 240;
  const summaryBoxX = width - 40 - summaryBoxWidth;

  page.drawRectangle({
    x: summaryBoxX,
    y: summaryBoxY,
    width: summaryBoxWidth,
    height: 135,
    color: bgLight,
    borderColor: borderGray,
    borderWidth: 1,
  });

  // Subtotal
  page.drawText('Jumlah Kasar Produk:', {
    x: summaryBoxX + 12,
    y: summaryBoxY + 115,
    size: 8.5,
    font: fontRegular,
    color: textMuted,
  });
  page.drawText(formatCurrency(totalAmount), {
    x: summaryBoxX + summaryBoxWidth - 75,
    y: summaryBoxY + 115,
    size: 8.5,
    font: fontBold,
    color: textDark,
  });

  // Grand Total Line
  page.drawLine({
    start: { x: summaryBoxX + 12, y: summaryBoxY + 98 },
    end: { x: summaryBoxX + summaryBoxWidth - 12, y: summaryBoxY + 98 },
    thickness: 1,
    color: borderGray,
  });

  page.drawText('JUMLAH KESELURUHAN:', {
    x: summaryBoxX + 12,
    y: summaryBoxY + 84,
    size: 9.5,
    font: fontBold,
    color: primaryDark,
  });
  page.drawText(formatCurrency(totalAmount), {
    x: summaryBoxX + summaryBoxWidth - 85,
    y: summaryBoxY + 84,
    size: 11,
    font: fontBold,
    color: brandBlue,
  });

  // Deposit 50%
  page.drawText('1. Bayaran Deposit 50%:', {
    x: summaryBoxX + 12,
    y: summaryBoxY + 56,
    size: 8,
    font: fontRegular,
    color: textMuted,
  });
  const depStatusText = isDepositPaid ? `${formatCurrency(depositAmount)} [DITERIMA]` : `${formatCurrency(depositAmount)} [BELUM DIBAYAR]`;
  page.drawText(depStatusText, {
    x: summaryBoxX + summaryBoxWidth - 120,
    y: summaryBoxY + 56,
    size: 8,
    font: fontBold,
    color: isDepositPaid ? emeraldGreen : amberOrange,
  });

  // Balance 50%
  page.drawText('2. Baki Pelunasan 50%:', {
    x: summaryBoxX + 12,
    y: summaryBoxY + 38,
    size: 8,
    font: fontRegular,
    color: textMuted,
  });
  const balStatusText = isPaidInFull ? `${formatCurrency(balanceAmount)} [LUNAS]` : `${formatCurrency(balanceAmount)} [BAYAR BILA SIAP]`;
  page.drawText(balStatusText, {
    x: summaryBoxX + summaryBoxWidth - 120,
    y: summaryBoxY + 38,
    size: 8,
    font: fontBold,
    color: isPaidInFull ? emeraldGreen : primaryDark,
  });

  // Left Bank & Payment Info Box
  const bankBoxWidth = 250;
  page.drawRectangle({
    x: 40,
    y: summaryBoxY,
    width: bankBoxWidth,
    height: 135,
    color: bgLight,
    borderColor: borderGray,
    borderWidth: 1,
  });

  page.drawText('MAKLUMAT PEMBAYARAN & BANK:', {
    x: 52,
    y: summaryBoxY + 115,
    size: 8,
    font: fontBold,
    color: textMuted,
  });

  page.drawText('Nama Bank: Maybank Berhad', {
    x: 52,
    y: summaryBoxY + 98,
    size: 8.5,
    font: fontRegular,
    color: textDark,
  });

  page.drawText('Nama Akaun: SFV APPAREL SDN BHD', {
    x: 52,
    y: summaryBoxY + 84,
    size: 8.5,
    font: fontBold,
    color: textDark,
  });

  page.drawText('No. Akaun: 5621 8832 9901', {
    x: 52,
    y: summaryBoxY + 70,
    size: 9,
    font: fontBold,
    color: brandBlue,
  });

  page.drawText('Rujukan Bayaran: Masukkan No. Pesanan anda.', {
    x: 52,
    y: summaryBoxY + 54,
    size: 7.5,
    font: fontOblique,
    color: textMuted,
  });

  // -------------------------------------------------------------
  // 5. OFFICIAL FOOTER & TRACKING NOTICE
  // -------------------------------------------------------------
  const footerY = 50;

  page.drawLine({
    start: { x: 40, y: footerY + 50 },
    end: { x: width - 40, y: footerY + 50 },
    thickness: 1,
    color: borderGray,
  });

  page.drawText('Nota Terma & Jaminan Kualiti:', {
    x: 40,
    y: footerY + 38,
    size: 8,
    font: fontBold,
    color: textDark,
  });

  page.drawText('1. Pengeluaran dan barisan cetakan dimulakan sebaik sahaja deposit 50% disahkan.', {
    x: 40,
    y: footerY + 26,
    size: 7.5,
    font: fontRegular,
    color: textMuted,
  });

  page.drawText(`2. Jejak status pesanan & kemas kini kilang bila-bila masa di: ${trackingLink}`, {
    x: 40,
    y: footerY + 14,
    size: 7.5,
    font: fontRegular,
    color: textMuted,
  });

  page.drawText('Invois dijana secara digital oleh Sistem SFV Apparel — Sah tanpa tandatangan fizikal.', {
    x: 40,
    y: footerY,
    size: 7,
    font: fontOblique,
    color: textLight,
  });

  // Compile and return PDF binary bytes
  const pdfBytes = await pdfDoc.save();
  return pdfBytes;
}

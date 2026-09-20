import { NextResponse } from 'next/server';

export interface SupportTicket {
  id: string;
  ticketNumber: string;
  customerPhone: string;
  customerName?: string;
  category: 'custom_order' | 'complaint' | 'quotation_help' | 'design_assist' | 'general';
  summary: string;
  status: 'open' | 'in_progress' | 'resolved';
  createdAt: string;
}

// In-memory / persistent mock store for support tickets
let GLOBAL_TICKETS: SupportTicket[] = [
  {
    id: 't-1',
    ticketNumber: 'TIKET-2026-1042',
    customerPhone: '60148599138',
    customerName: 'Ahmad Khairi',
    category: 'custom_order',
    summary: 'Ingin rundingan tempahan jersi korporat 250 helai berserta kolar mandarin & poket.',
    status: 'open',
    createdAt: new Date().toISOString(),
  },
];

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({ tickets: GLOBAL_TICKETS });
}

export async function POST(req: Request) {
  try {
    const { phone, name, category = 'general', summary } = await req.json();

    if (!phone || !summary) {
      return NextResponse.json({ success: false, error: 'Nombor telefon dan ringkasan isu diperlukan' }, { status: 400 });
    }

    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const ticketNumber = `TIKET-2026-${randomNum}`;

    const newTicket: SupportTicket = {
      id: `t-${Date.now()}`,
      ticketNumber,
      customerPhone: phone.replace(/[\s\-\+\(\)]/g, ''),
      customerName: name || 'Pelanggan WhatsApp',
      category,
      summary,
      status: 'open',
      createdAt: new Date().toISOString(),
    };

    GLOBAL_TICKETS.unshift(newTicket);

    return NextResponse.json({
      success: true,
      ticket: newTicket,
      message: `Tiket sokongan ${ticketNumber} telah didaftarkan. Staf kilang kami akan menghubungi anda sebentar lagi.`,
    });
  } catch (err: unknown) {
    const error = err instanceof Error ? err.message : 'Ralat penjanaan tiket sokongan';
    return NextResponse.json({ success: false, error }, { status: 500 });
  }
}

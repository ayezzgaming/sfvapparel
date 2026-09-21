'use client';

import React, { useRef } from 'react';
import { Order } from '@/types/database';
import { formatCurrency } from '@/lib/pricing-calculator';
import { Printer, Download, X, CheckCircle2, ShieldCheck, QrCode } from 'lucide-react';

interface OrderInvoiceModalProps {
  order: Order;
  isOpen: boolean;
  onClose: () => void;
}

export default function OrderInvoiceModal({ order, isOpen, onClose }: OrderInvoiceModalProps) {
  const invoiceRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

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
  const orderDate = new Date(order.created_at).toLocaleDateString('ms-MY', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto print:p-0 print:bg-white print:static">
      {/* Container Dialog */}
      <div className="bg-white rounded-3xl w-full max-w-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] print:max-h-none print:shadow-none print:border-none print:w-full print:rounded-none">
        
        {/* Top Action Bar (Hidden in Print) */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between print:hidden">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-mono font-bold bg-white/10 px-3 py-1 rounded-full text-sky-400">
              {invoiceNumber}
            </span>
            <span className="text-xs text-slate-300 font-medium">Invois Rasmi SFV Apparel</span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-2 bg-[#007AFF] hover:bg-sky-500 active:scale-95 text-white font-bold text-xs rounded-full shadow-md shadow-blue-500/30 flex items-center space-x-1.5 transition-all cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak / Simpan PDF</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
              title="Tutup"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Printable Sheet Area */}
        <div className="overflow-y-auto p-6 sm:p-10 text-slate-800 space-y-8 bg-white print:overflow-visible print:p-8" ref={invoiceRef}>
          
          {/* 1. INVOICE HEADER (Company & Document Info) */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-6 border-b border-slate-200 pb-6">
            <div className="space-y-1.5">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-sm tracking-wider shadow-xs">
                  SFV
                </div>
                <div>
                  <h1 className="text-base font-extrabold tracking-tight text-slate-900 leading-none">
                    SFV APPAREL EMPIRE
                  </h1>
                  <span className="text-[10px] text-slate-400 font-mono">No. Pendaftaran: SA0549211-M</span>
                </div>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed max-w-xs pt-1">
                Pusat Pengeluaran & Cetakan Jersi Sublimasi Kustom Pukal Kilang<br />
                Kawasan Perindustrian Shah Alam, Selangor, Malaysia.<br />
                Emel: <span className="font-mono">billing@sfvapparel.com</span>
              </p>
            </div>

            <div className="text-left sm:text-right space-y-1 min-w-[200px]">
              <span className="text-[11px] font-bold text-sky-600 uppercase tracking-widest block">
                INVOIS RASMI KILANG
              </span>
              <h2 className="text-xl font-mono font-extrabold text-slate-900 tracking-tight">
                {invoiceNumber}
              </h2>
              <div className="text-xs text-slate-500 space-y-0.5 pt-1">
                <p>No. Pesanan: <span className="font-mono font-semibold text-slate-800">{order.order_number}</span></p>
                <p>Tarikh: <span className="font-medium text-slate-800">{orderDate}</span></p>
                <p>Status: <span className={`font-bold ${isPaidInFull ? 'text-emerald-700' : isDepositPaid ? 'text-sky-700' : 'text-amber-700'}`}>{isPaidInFull ? 'LUNAS SEPENUHNYA' : isDepositPaid ? 'DEPOSIT 50% DISAHKAN' : 'MENUNGGU BAYARAN'}</span></p>
              </div>
            </div>
          </div>

          {/* 2. BILLED TO & SHIPPING DETAILS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-slate-50/80 p-4 sm:p-5 rounded-2xl border border-slate-200/80 text-xs">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Ditujukan Kepada (Pelanggan)
              </span>
              <h3 className="text-sm font-bold text-slate-900">{order.customer_name}</h3>
              <p className="text-slate-600 font-mono">{order.customer_phone || '-'}</p>
              {order.customer_email && <p className="text-slate-500">{order.customer_email}</p>}
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Maklumat Penghantaran Kurier
              </span>
              <p className="text-slate-800 font-medium leading-relaxed">
                {order.shipping_address || 'Ambil sendiri di kilang / Tiada alamat pos'}
              </p>
              <p className="text-slate-500">
                Kurier: <span className="font-semibold text-slate-700">{order.shipping_courier || 'Kurier Standard (J&T / PosLaju)'}</span>
                {order.tracking_number && (
                  <span className="block font-mono text-sky-700 font-bold mt-0.5">
                    Resi: {order.tracking_number}
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* 3. ITEMIZED TABLE */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-slate-900 uppercase tracking-wider block">
              Perincian Pesanan & Spesifikasi Kilang
            </span>

            <div className="border border-slate-200 rounded-2xl overflow-hidden">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-100 text-slate-600 font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4 w-12 text-center">No</th>
                    <th className="py-3 px-4">Deskripsi Item & Spesifikasi</th>
                    <th className="py-3 px-4 text-center">Pecahan Saiz</th>
                    <th className="py-3 px-4 text-center">Kuantiti</th>
                    <th className="py-3 px-4 text-right">Harga Seunit</th>
                    <th className="py-3 px-4 text-right">Jumlah</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr>
                    <td className="py-4 px-4 text-center font-mono font-medium text-slate-400">01</td>
                    <td className="py-4 px-4 space-y-1">
                      <p className="font-bold text-slate-900 text-sm">{order.design_title}</p>
                      <p className="text-[11px] text-slate-500">
                        {order.print_type === 'sublimation'
                          ? `Cetakan Sublimasi Penuh • Fabrik: ${order.fabric_name || 'Microfiber'} • Potongan: ${order.cut_name || 'Standard'}`
                          : `Cetakan DTF Premium • ${order.dtf_dimension_name || 'Standard'} • ${
                              order.dtf_option_type === 'with_garment' ? 'Baju Siap' : 'Filem DTF'
                            }`}
                      </p>
                    </td>
                    <td className="py-4 px-4 text-center">
                      {order.sizing_breakdown && Object.keys(order.sizing_breakdown).length > 0 ? (
                        <div className="flex flex-wrap gap-1 justify-center max-w-[150px] mx-auto">
                          {Object.entries(order.sizing_breakdown).map(([sz, qty]) => (
                            <span key={sz} className="inline-block bg-slate-100 px-1.5 py-0.5 rounded font-mono text-[10px] text-slate-700">
                              {sz}:{qty}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-slate-400 font-mono">-</span>
                      )}
                    </td>
                    <td className="py-4 px-4 text-center font-bold text-slate-900">
                      {order.total_quantity} helai
                    </td>
                    <td className="py-4 px-4 text-right font-mono text-slate-700">
                      {formatCurrency(order.final_unit_price || order.raw_unit_price)}
                    </td>
                    <td className="py-4 px-4 text-right font-mono font-bold text-slate-900">
                      {formatCurrency((order.final_unit_price || order.raw_unit_price) * order.total_quantity)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* 4. FINANCIAL SUMMARY BREAKDOWN */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-6 pt-2">
            {/* Payment Verification Stamp */}
            <div className="w-full sm:w-1/2 p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
              <div className="flex items-center space-x-2 text-slate-900">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span className="text-xs font-bold uppercase tracking-wider">Pengesahan Bayaran Rasmi</span>
              </div>

              {isPaidInFull ? (
                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-900 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-xs">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>STATUS: LUNAS SEPENUHNYA (PAID IN FULL)</span>
                  </div>
                  <p className="text-[10px] text-emerald-700">
                    Semua baki pembayaran telah disahkan diterima. Pesanan sedia untuk pelepasan kurier/serahan.
                  </p>
                </div>
              ) : isDepositPaid ? (
                <div className="p-3 bg-sky-50 rounded-xl border border-sky-200 text-sky-900 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-xs">
                    <CheckCircle2 className="w-4 h-4 text-sky-600 shrink-0" />
                    <span>STATUS: DEPOSIT 50% DITERIMA & DISAHKAN</span>
                  </div>
                  <p className="text-[10px] text-sky-700">
                    Proses pengeluaran kilang telah diaktifkan. Baki 50% perlu dijelaskan apabila status bertukar ke Sedia Dipos.
                  </p>
                </div>
              ) : (
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-xs">
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                    <span>STATUS: MENUNGGU PENGESAHAN BAYARAN</span>
                  </div>
                  <p className="text-[10px] text-amber-700">
                    Sila selesaikan bayaran deposit 50% bagi memulakan giliran mesin cetak dan jahitan.
                  </p>
                </div>
              )}

              <p className="text-[10px] text-slate-400 leading-relaxed font-mono">
                Transaksi ini disahkan secara digital oleh Gerbang Pembayaran CHIP / SFV Automated Gateway.
              </p>
            </div>

            {/* Calculations Box */}
            <div className="w-full sm:w-1/2 space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Jumlah Harga Produk</span>
                <span className="font-mono">{formatCurrency((order.final_unit_price || order.raw_unit_price) * order.total_quantity)}</span>
              </div>

              {order.discount_percentage > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>Diskaun Pukal ({order.discount_percentage}%)</span>
                  <span className="font-mono">Termasuk dalam harga</span>
                </div>
              )}

              <div className="flex justify-between text-slate-600">
                <span>Caj Penghantaran Kurier</span>
                <span className="font-mono">
                  {formatCurrency(Math.max(0, totalAmount - (order.final_unit_price || order.raw_unit_price) * order.total_quantity))}
                </span>
              </div>

              <div className="flex justify-between text-base font-extrabold text-slate-900 pt-3 border-t-2 border-slate-900">
                <span>JUMLAH KESELURUHAN</span>
                <span className="font-mono">{formatCurrency(totalAmount)}</span>
              </div>

              {/* Deposit vs Balance Breakdown */}
              <div className="pt-2 space-y-1.5 border-t border-slate-200">
                <div className="flex justify-between items-center text-slate-700 font-medium">
                  <span className="flex items-center gap-1">
                    <span>1. Deposit 50% Dibayar</span>
                    {isDepositPaid && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                  </span>
                  <span className="font-mono font-bold text-slate-900">{formatCurrency(depositAmount)}</span>
                </div>

                <div className="flex justify-between items-center text-slate-700 font-medium">
                  <span className="flex items-center gap-1">
                    <span>2. Baki Pelunasan 50%</span>
                    {isPaidInFull && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                  </span>
                  <span className={`font-mono font-bold ${isPaidInFull ? 'text-slate-400 line-through' : 'text-slate-900'}`}>
                    {formatCurrency(balanceAmount)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 5. FOOTER & AUTHORIZED SIGNATURE (Clean Corporate) */}
          <div className="border-t border-slate-200 pt-6 flex flex-col sm:flex-row justify-between items-end gap-6 text-[11px] text-slate-500">
            <div className="space-y-1 max-w-sm">
              <p className="font-bold text-slate-700 uppercase tracking-wide">Syarat & Jaminan Kilang:</p>
              <ul className="list-disc list-inside space-y-0.5 text-[10px] leading-relaxed text-slate-500">
                <li>Jaminan kualiti warna cetakan sublimasi kekal terang dan tidak luntur.</li>
                <li>Sebarang ralat saiz/cetakan dari pihak kilang akan diganti secara percuma.</li>
                <li>Invois ini dijana secara berkomputer dan sah tanpa tandatangan fizikal.</li>
              </ul>
            </div>

            <div className="text-right space-y-2 shrink-0">
              <div className="font-mono text-[9px] text-slate-400 uppercase tracking-wider">
                Pengesahan Digital SFV Apparel
              </div>
              <div className="h-10 flex items-center justify-end">
                <span className="px-3 py-1 bg-slate-100 rounded border border-slate-200 font-mono text-[10px] font-bold text-slate-700">
                  SFV-VERIFIED-{order.order_number}
                </span>
              </div>
              <p className="text-[10px] font-bold text-slate-800">PENGURUS OPERASI PENGELUARAN</p>
            </div>
          </div>

        </div>

      </div>

      {/* Global Print Style Injection */}
      <style jsx global>{`
        @media print {
          body {
            background-color: white !important;
            color: black !important;
          }
          header, nav, footer, button, .print\\:hidden {
            display: none !important;
          }
          @page {
            margin: 12mm;
            size: A4 portrait;
          }
        }
      `}</style>
    </div>
  );
}

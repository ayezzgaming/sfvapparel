'use client';

import React, { useRef, useState } from 'react';
import { Order } from '@/types/database';
import { useAppStore } from '@/lib/store/app-store';
import { formatCurrency } from '@/lib/pricing-calculator';
import { sendOrderInvoiceWhatsAppAction } from '@/app/actions/orderActions';
import { Printer, X, Check, ShieldCheck, Send } from 'lucide-react';
import { FaWhatsapp } from 'react-icons/fa6';

interface OrderInvoiceModalProps {
  order: Order;
  isOpen: boolean;
  onClose: () => void;
}

export default function OrderInvoiceModal({ order, isOpen, onClose }: OrderInvoiceModalProps) {
  const invoiceRef = useRef<HTMLDivElement>(null);
  const { companySettings } = useAppStore();
  const [isSendingWa, setIsSendingWa] = useState(false);
  const [waToast, setWaToast] = useState<{ success: boolean; message: string } | null>(null);

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
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  const companyName = companySettings?.company_name || 'SFV APPAREL';
  const brandName = companySettings?.brand_name || 'SFV APPAREL';
  const regNumber = companySettings?.registration_number || '';
  const companyAddress = companySettings?.address || '';
  const companyEmail = companySettings?.email || 'sales@sfvapparel.my';
  const companyPhone = companySettings?.phone || companySettings?.whatsapp_number || '';

  const handlePrint = () => {
    window.print();
  };

  const handleSendWhatsApp = async () => {
    if (!order.customer_phone) {
      setWaToast({ success: false, message: 'Nombor telefon pelanggan tidak ditemui.' });
      setTimeout(() => setWaToast(null), 3000);
      return;
    }
    setIsSendingWa(true);
    setWaToast(null);
    try {
      const res = await sendOrderInvoiceWhatsAppAction(order.order_number);
      setWaToast({ success: res.success, message: res.message });
    } catch {
      setWaToast({ success: false, message: 'Ralat sambungan penghantaran WhatsApp.' });
    } finally {
      setIsSendingWa(false);
      setTimeout(() => setWaToast(null), 4000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-0 sm:p-4 overflow-y-auto print:p-0 print:bg-white print:static select-none font-ios">
      {/* Mobile-First Modal Container (Clean iOS Card / Full-screen on mobile) */}
      <div className="bg-white w-full h-full sm:h-auto sm:max-h-[90vh] sm:max-w-md sm:rounded-3xl shadow-xl border border-slate-200/80 flex flex-col overflow-hidden print:max-h-none print:shadow-none print:border-none print:w-full print:rounded-none">
        
        {/* Clean iOS Top Navigation (Hidden in Print) */}
        <header className="px-4 py-3 bg-white border-b border-slate-100 flex items-center justify-between shrink-0 print:hidden">
          <div className="flex items-center space-x-2">
            <span className="font-mono text-xs font-semibold text-slate-800 bg-slate-100 px-2.5 py-0.5 rounded-full">
              {invoiceNumber}
            </span>
            <span className="text-xs text-slate-500 font-normal">Invois Rasmi</span>
          </div>

          <div className="flex items-center space-x-1.5">
            {/* 1-Tap Send to Customer WhatsApp */}
            <button
              type="button"
              onClick={handleSendWhatsApp}
              disabled={isSendingWa || !order.customer_phone}
              className="p-2 rounded-full hover:bg-emerald-50 text-emerald-600 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
              title="Hantar Invois ke WhatsApp Pelanggan"
            >
              <FaWhatsapp className={`w-4 h-4 ${isSendingWa ? 'animate-spin' : ''}`} />
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 active:scale-95 text-white font-medium text-xs rounded-full flex items-center space-x-1 transition-all cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak / PDF</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </header>

        {waToast && (
          <div className={`px-4 py-2 text-xs font-medium border-b flex items-center gap-1.5 print:hidden ${
            waToast.success ? 'bg-emerald-50 text-emerald-800 border-emerald-100' : 'bg-rose-50 text-rose-800 border-rose-100'
          }`}>
            <FaWhatsapp className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>{waToast.message}</span>
          </div>
        )}

        {/* Scrollable Clean Invoice Body */}
        <div className="overflow-y-auto p-5 sm:p-6 text-slate-800 space-y-5 bg-white print:overflow-visible print:p-8" ref={invoiceRef}>
          
          {/* 1. HEADER (Dynamic Database Company Settings) */}
          <div className="border-b border-slate-100 pb-4 space-y-3">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-sm font-bold text-slate-900 tracking-tight">
                  {companyName}
                </h1>
                {brandName && brandName !== companyName && (
                  <span className="text-[11px] text-slate-500 block font-medium">
                    Jenama: {brandName}
                  </span>
                )}
                {regNumber && (
                  <span className="text-[10px] text-slate-400 font-mono block">
                    No. Daftar: {regNumber}
                  </span>
                )}
              </div>

              <div className="text-right">
                <span className="text-[10px] font-mono font-semibold text-slate-400 uppercase block">
                  INVOIS RASMI
                </span>
                <span className="font-mono text-xs font-bold text-slate-900 block">
                  {invoiceNumber}
                </span>
                <span className="text-[10px] text-slate-400 font-mono block">
                  {orderDate}
                </span>
              </div>
            </div>

            {companyAddress && (
              <p className="text-[10px] text-slate-500 leading-relaxed max-w-xs">
                {companyAddress}
              </p>
            )}

            <div className="text-[10px] text-slate-400 flex flex-wrap gap-x-3 font-mono">
              {companyEmail && <span>Emel: {companyEmail}</span>}
              {companyPhone && <span>Tel: {companyPhone}</span>}
            </div>
          </div>

          {/* 2. BILLED TO & SHIPPING */}
          <div className="p-3.5 rounded-2xl bg-slate-50/80 border border-slate-200/60 space-y-2 text-xs">
            <div className="flex justify-between items-start gap-2">
              <div className="min-w-0 flex-1">
                <span className="text-[10px] text-slate-400 uppercase font-medium block">
                  Pelanggan
                </span>
                <p className="font-semibold text-slate-800 text-xs truncate">{order.customer_name}</p>
                <p className="text-slate-500 font-mono text-[11px]">{order.customer_phone || '-'}</p>
                {order.customer_email && (
                  <p className="text-slate-400 text-[10px] truncate">{order.customer_email}</p>
                )}
              </div>

              <div className="text-right shrink-0">
                <span className="text-[10px] text-slate-400 uppercase font-medium block">
                  Status Bayaran
                </span>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full inline-block mt-0.5 border ${
                  isPaidInFull 
                    ? 'bg-slate-100 text-slate-800 border-slate-300' 
                    : isDepositPaid 
                    ? 'bg-slate-100 text-slate-800 border-slate-300' 
                    : 'bg-slate-100 text-slate-600 border-slate-200'
                }`}>
                  {isPaidInFull ? 'Lunas 100%' : isDepositPaid ? 'Deposit 50% Sah' : 'Menunggu Bayaran'}
                </span>
              </div>
            </div>

            {order.shipping_address && (
              <div className="pt-2 border-t border-slate-200/60 text-[11px]">
                <span className="text-[10px] text-slate-400 uppercase font-medium block">
                  Alamat Penghantaran
                </span>
                <p className="text-slate-600 leading-snug">{order.shipping_address}</p>
                <p className="text-slate-400 text-[10px] mt-0.5">
                  Kurier: <span className="text-slate-600">{order.shipping_courier || 'Kurier Standard'}</span>
                  {order.tracking_number && (
                    <span className="font-mono text-slate-700 ml-1 font-semibold">({order.tracking_number})</span>
                  )}
                </p>
              </div>
            )}
          </div>

          {/* 3. ITEM SUMMARY */}
          <div className="space-y-2">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Perincian Pesanan
            </span>

            <div className="rounded-2xl border border-slate-200/80 p-3.5 bg-white space-y-2.5">
              <div className="flex justify-between items-start gap-2">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-xs text-slate-900">{order.design_title}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    {order.print_type === 'sublimation'
                      ? `Sublimasi • ${order.fabric_name || 'Standard'} • ${order.cut_name || 'Standard'}`
                      : `DTF • ${order.dtf_dimension_name || 'Standard'}`}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <span className="font-mono text-xs font-semibold text-slate-900 block">
                    {formatCurrency((order.final_unit_price || order.raw_unit_price) * order.total_quantity)}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono block">
                    {order.total_quantity} helai @ {formatCurrency(order.final_unit_price || order.raw_unit_price)}
                  </span>
                </div>
              </div>

              {/* Sizing Matrix */}
              {order.sizing_breakdown && Object.keys(order.sizing_breakdown).length > 0 && (
                <div className="pt-2 border-t border-slate-100 flex flex-wrap gap-1.5 items-center">
                  <span className="text-[10px] text-slate-400 uppercase font-mono">Saiz:</span>
                  {Object.entries(order.sizing_breakdown).map(([sz, qty]) => (
                    <span key={sz} className="px-2 py-0.5 rounded-md bg-slate-100 font-mono text-[10px] text-slate-700">
                      {sz}: {qty}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 4. FINANCIAL SUMMARY */}
          <div className="space-y-1.5 pt-1 text-xs">
            <div className="flex justify-between text-slate-500">
              <span>Jumlah Item ({order.total_quantity} helai)</span>
              <span className="font-mono">{formatCurrency((order.final_unit_price || order.raw_unit_price) * order.total_quantity)}</span>
            </div>

            <div className="flex justify-between text-slate-500">
              <span>Caj Pos / Penghantaran</span>
              <span className="font-mono">
                {formatCurrency(Math.max(0, totalAmount - (order.final_unit_price || order.raw_unit_price) * order.total_quantity))}
              </span>
            </div>

            <div className="flex justify-between text-sm font-bold text-slate-900 pt-2 border-t border-slate-200">
              <span>Jumlah Keseluruhan</span>
              <span className="font-mono">{formatCurrency(totalAmount)}</span>
            </div>

            {/* Downpayment & Balance Rows */}
            <div className="pt-2 space-y-1 border-t border-slate-100 text-xs">
              <div className="flex justify-between items-center text-slate-700">
                <span className="flex items-center gap-1">
                  <span>1. Deposit 50%</span>
                  {isDepositPaid && <Check className="w-3 h-3 text-slate-900" />}
                </span>
                <span className="font-mono font-medium">{formatCurrency(depositAmount)}</span>
              </div>

              <div className="flex justify-between items-center text-slate-700">
                <span className="flex items-center gap-1">
                  <span>2. Baki Pelunasan 50%</span>
                  {isPaidInFull && <Check className="w-3 h-3 text-slate-900" />}
                </span>
                <span className={`font-mono font-medium ${isPaidInFull ? 'text-slate-400 line-through' : 'text-slate-900'}`}>
                  {formatCurrency(balanceAmount)}
                </span>
              </div>
            </div>
          </div>

          {/* 5. FOOTER DISCLAIMER */}
          <div className="pt-3 border-t border-slate-100 text-center space-y-1">
            <p className="text-[10px] text-slate-400 leading-relaxed font-mono">
              Invois berkomputer sah tanpa tandatangan fizikal. Terima kasih atas tempahan anda.
            </p>
          </div>

        </div>

      </div>

      {/* Global Print Style */}
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
            margin: 10mm;
            size: A4 portrait;
          }
        }
      `}</style>
    </div>
  );
}

'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  X, 
  ChevronRight, 
  ShoppingBag,
  CheckCircle2,
  Clock,
  Package,
  Truck,
  Copy,
  Check,
  ArrowRight
} from 'lucide-react';
import { FaWhatsapp } from 'react-icons/fa6';
import { useAppStore } from '@/lib/store/app-store';
import { useUI } from '@/lib/store/ui-context';
import { Order, OrderStatus } from '@/types/database';

const STATUS_CONFIG: Record<OrderStatus, { label: string; stepIndex: number; color: string; bg: string; dot: string }> = {
  pending_proof: { label: 'Semakan Reka Bentuk', stepIndex: 1, color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200/60', dot: 'bg-amber-500' },
  proof_approved: { label: 'Mockup Diluluskan', stepIndex: 1, color: 'text-purple-700', bg: 'bg-purple-50 border-purple-200/60', dot: 'bg-purple-500' },
  in_printing: { label: 'Dalam Cetakan', stepIndex: 2, color: 'text-[#0052FF]', bg: 'bg-blue-50 border-blue-200/60', dot: 'bg-[#0052FF]' },
  heat_press: { label: 'Proses Haba', stepIndex: 2, color: 'text-indigo-700', bg: 'bg-indigo-50 border-indigo-200/60', dot: 'bg-indigo-500' },
  sewing: { label: 'Proses Jahitan', stepIndex: 3, color: 'text-sky-700', bg: 'bg-sky-50 border-sky-200/60', dot: 'bg-sky-500' },
  qc_check: { label: 'Kawalan Kualiti (QC)', stepIndex: 3, color: 'text-teal-700', bg: 'bg-teal-50 border-teal-200/60', dot: 'bg-teal-500' },
  ready_to_ship: { label: 'Sedia Dipos', stepIndex: 4, color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200/60', dot: 'bg-emerald-500' },
  delivered: { label: 'Selesai Diterima', stepIndex: 4, color: 'text-slate-700', bg: 'bg-slate-100 border-slate-200/60', dot: 'bg-slate-500' },
  cancelled: { label: 'Dibatalkan', stepIndex: 0, color: 'text-rose-700', bg: 'bg-rose-50 border-rose-200/60', dot: 'bg-rose-500' },
};

const TIMELINE_STEPS = [
  { step: 1, title: 'Reka Bentuk & Mockup', desc: 'Pengesahan artwork rekaan kilang' },
  { step: 2, title: 'Cetakan & Pemindahan Haba', desc: 'Proses sublimasi / DTF berkualiti tinggi' },
  { step: 3, title: 'Jahitan & Kawalan Kualiti (QC)', desc: 'Jahitan kemas dan pemeriksaan akhir' },
  { step: 4, title: 'Penghantaran Kurier', desc: 'Bungkusan sedia dipos atau dihantar' },
];

export default function HistoryPage() {
  const { orders } = useAppStore();
  const { setBottomSheetOpen } = useUI();
  const [selectedOrder, setSelectedOrder] = useState<Order>(orders[0] || {
    id: 'ord-fallback',
    order_number: 'SFV-2026-001',
    customer_name: 'Pelanggan',
    customer_email: 'customer@sfv.my',
    customer_phone: '+60 12-345 6789',
    print_type: 'sublimation',
    design_title: 'Valkyrie Cyber Esports Jersey',
    fabric_name: 'Drifit Milano (Premium)',
    cut_name: 'Raglan Sleeve Mobility Cut',
    sizing_breakdown: { S: 5, M: 10, L: 8, XL: 2 },
    total_quantity: 25,
    raw_unit_price: 3500,
    discount_percentage: 10,
    final_unit_price: 3150,
    total_amount: 78750,
    status: 'in_printing',
    shipping_address: 'No 15, Jalan Ampang, 50450 Kuala Lumpur',
    shipping_courier: 'J&T Express MY',
    tracking_number: 'JNTMY8839201948',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  const [isOrderSheetOpen, setIsOrderSheetOpen] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  // Sync with global UIContext so Bottom Nav & WhatsApp FAB automatically hide when sheet is open
  React.useEffect(() => {
    setBottomSheetOpen(isOrderSheetOpen);
    return () => setBottomSheetOpen(false);
  }, [isOrderSheetOpen, setBottomSheetOpen]);

  const handleOpenOrder = (order: Order) => {
    setSelectedOrder(order);
    setIsOrderSheetOpen(true);
    setIsCopied(false);
  };

  const handleCopyTracking = (tracking: string) => {
    navigator.clipboard.writeText(tracking);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="w-full min-h-full pt-4 pb-12 space-y-4.5 select-none font-ios bg-[#F2F2F7]">
      {/* Header */}
      <div className="px-5">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 text-[#0052FF] text-[10.5px] font-bold uppercase tracking-wider mb-1.5">
          <span>Pengurusan Pesanan</span>
        </div>
        <h1 className="text-xl sm:text-[22px] font-bold text-slate-900 tracking-tight">
          Senarai Pesanan
        </h1>
        <p className="text-xs text-slate-500 font-normal tracking-wide mt-0.5">
          Jejak status pembuatan dan penghantaran pakaian anda secara masa nyata
        </p>
      </div>

      {/* Orders List */}
      <div className="px-5 space-y-3">
        {orders.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center shadow-sm space-y-3 border border-slate-200/70">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <ShoppingBag className="w-6 h-6 stroke-[1.5]" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-800">Belum ada pesanan aktif</p>
              <p className="text-xs text-slate-500 mt-0.5">Pilih templat dari katalog untuk memulakan tempahan.</p>
            </div>
            <Link
              href="/catalog"
              className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-[#0052FF] text-white text-xs font-semibold shadow-md shadow-blue-500/20 active:bg-blue-700 transition-colors"
            >
              <span>Lihat Katalog</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        ) : (
          orders.map((order) => {
            const config = STATUS_CONFIG[order.status] || {
              label: order.status,
              stepIndex: 2,
              color: 'text-[#0052FF]',
              bg: 'bg-blue-50 border-blue-200/60',
              dot: 'bg-[#0052FF]',
            };

            const mockupImg = order.mockup_url || 
              (order.print_type === 'sublimation' ? '/images/prod_sportswear.jpg' : '/images/prod_tshirt.jpg');

            const formattedPrice = (order.total_amount / 100).toFixed(2);

            return (
              <div
                key={order.id}
                onClick={() => handleOpenOrder(order)}
                className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200/70 hover:border-blue-200 hover:shadow-md transition-all cursor-pointer active:scale-[0.99] space-y-3"
              >
                {/* Header Row: Order Number + Status Badge */}
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-slate-900 tracking-tight">
                    {order.order_number}
                  </span>
                  
                  <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${config.bg} ${config.color} uppercase tracking-wider`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
                    {config.label}
                  </span>
                </div>

                {/* Product Detail Row */}
                <div className="flex items-center space-x-3.5 pt-0.5">
                  {/* Mockup Thumbnail */}
                  <div className="w-14 h-14 rounded-xl overflow-hidden bg-slate-100 shrink-0 border border-slate-100">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={mockupImg}
                      alt={order.design_title}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Title & Quantity Meta */}
                  <div className="min-w-0 flex-1 space-y-0.5">
                    <h3 className="text-[13.5px] font-bold text-slate-900 tracking-tight truncate leading-snug">
                      {order.design_title}
                    </h3>
                    <p className="text-[11.5px] text-slate-500 truncate">
                      {order.total_quantity} helai • {order.print_type === 'sublimation' ? 'Sublimasi Penuh' : 'Cetakan DTF'}
                    </p>
                    <p className="text-xs font-black text-[#0052FF]">
                      RM{formattedPrice}
                    </p>
                  </div>
                </div>

                {/* Footer Row: Date & Action Link */}
                <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-medium text-[11px]">
                    {order.created_at ? new Date(order.created_at).toLocaleDateString('ms-MY', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Hari Ini'}
                  </span>
                  
                  <div className="flex items-center space-x-1 text-[#0052FF] font-semibold text-[11.5px]">
                    <span>Jejak Pesanan</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* =========================================================================
          NATIVE iOS BOTTOM SHEET FOR ORDER TRACKING DETAIL
         ========================================================================= */}
      {/* 1. BACKDROP */}
      <div 
        className={`fixed inset-0 bg-black/50 z-40 transition-opacity duration-300 ${
          isOrderSheetOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setIsOrderSheetOpen(false)}
      />

      {/* 2. SHEET CONTAINER */}
      <div 
        className={`fixed inset-x-0 bottom-0 z-50 w-full max-w-md mx-auto bg-white rounded-t-[32px] rounded-b-none mb-0 shadow-2xl transform transition-transform duration-300 ease-out flex flex-col max-h-[88vh] ${
          isOrderSheetOpen ? 'translate-y-0 pointer-events-auto' : 'translate-y-full pointer-events-none'
        }`}
      >
        {/* iOS Drag Handle & Sticky Header */}
        <div className="pt-3 pb-2.5 px-6 shrink-0 border-b border-black/[0.04]">
          <div className="flex justify-center pb-2.5">
            <div className="w-12 h-1.5 bg-gray-300 rounded-full" />
          </div>
          <div className="flex items-center justify-between pb-1">
            <div>
              <span className="font-mono text-sm font-bold text-slate-900 tracking-tight">
                {selectedOrder.order_number}
              </span>
              <p className="text-[11px] text-gray-500 font-normal mt-0.5">
                Tarikh Tempahan: {selectedOrder.created_at ? new Date(selectedOrder.created_at).toLocaleDateString('ms-MY', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsOrderSheetOpen(false)}
              aria-label="Tutup"
              className="bg-gray-100 p-2 rounded-full text-gray-500 hover:bg-gray-200 active:scale-95 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="px-6 py-4 overflow-y-auto sparkle-scroll space-y-4 flex-1">
          {/* Status Current Banner */}
          <div className="bg-slate-50 rounded-2xl p-4 space-y-2 border border-slate-200/60">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800">Status Semasa</span>
              <span className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-3 py-1 rounded-full border ${STATUS_CONFIG[selectedOrder.status]?.bg || 'bg-blue-50 border-blue-200/60'} ${STATUS_CONFIG[selectedOrder.status]?.color || 'text-[#0052FF]'}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${STATUS_CONFIG[selectedOrder.status]?.dot || 'bg-[#0052FF]'}`} />
                {STATUS_CONFIG[selectedOrder.status]?.label || selectedOrder.status}
              </span>
            </div>

            {selectedOrder.tracking_number && (
              <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-xs">
                <span className="text-slate-500 font-medium">
                  {selectedOrder.shipping_courier || 'Kurier'}:
                </span>
                <button
                  type="button"
                  onClick={() => handleCopyTracking(selectedOrder.tracking_number || '')}
                  className="flex items-center gap-1.5 font-mono font-bold text-[#0052FF] bg-white px-2.5 py-1 rounded-lg border border-blue-100 shadow-2xs active:scale-95 transition-transform"
                >
                  <span>{selectedOrder.tracking_number}</span>
                  {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            )}
          </div>

          {/* Stepper Timeline */}
          <div className="space-y-2.5">
            <span className="text-xs font-bold text-slate-900">Perjalanan Tempahan Kilang</span>
            <div className="bg-white rounded-2xl p-4 border border-slate-200/70 space-y-4">
              {TIMELINE_STEPS.map((step, idx) => {
                const currentStep = STATUS_CONFIG[selectedOrder.status]?.stepIndex || 2;
                const isFinished = currentStep > step.step;
                const isCurrent = currentStep === step.step;

                return (
                  <div key={step.step} className="flex items-start gap-3 relative">
                    {/* Left Line */}
                    {idx < TIMELINE_STEPS.length - 1 && (
                      <div className={`absolute left-3.5 top-7 bottom-0 w-0.5 -mb-4 ${isFinished ? 'bg-[#0052FF]' : 'bg-slate-100'}`} />
                    )}

                    {/* Step Icon */}
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 z-10 ${
                      isFinished
                        ? 'bg-[#0052FF] text-white'
                        : isCurrent
                        ? 'bg-blue-100 text-[#0052FF] ring-4 ring-blue-50'
                        : 'bg-slate-100 text-slate-400'
                    }`}>
                      {isFinished ? (
                        <CheckCircle2 className="w-4 h-4" />
                      ) : isCurrent ? (
                        <Clock className="w-3.5 h-3.5 animate-pulse" />
                      ) : (
                        <span className="text-[11px] font-bold">{step.step}</span>
                      )}
                    </div>

                    {/* Step Text */}
                    <div className="min-w-0 flex-1 pt-0.5">
                      <p className={`text-[12.5px] font-bold leading-tight ${isCurrent ? 'text-[#0052FF]' : isFinished ? 'text-slate-900' : 'text-slate-400'}`}>
                        {step.title}
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {step.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Order Garment Specs */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-slate-900">Perincian Pakaian</span>
            <div className="bg-slate-50 rounded-2xl p-4 space-y-2.5 border border-slate-200/60">
              <h4 className="text-[13.5px] font-bold text-slate-900">{selectedOrder.design_title}</h4>
              
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-white p-2.5 rounded-xl border border-slate-200/50">
                  <span className="text-[10.5px] text-slate-500 block font-medium">Kaedah Cetak</span>
                  <span className="font-semibold text-slate-900">
                    {selectedOrder.print_type === 'sublimation' ? 'Sublimasi Penuh' : 'Cetakan DTF'}
                  </span>
                </div>

                <div className="bg-white p-2.5 rounded-xl border border-slate-200/50">
                  <span className="text-[10.5px] text-slate-500 block font-medium">Jumlah Kuantiti</span>
                  <span className="font-bold text-[#0052FF]">
                    {selectedOrder.total_quantity} helai
                  </span>
                </div>
              </div>

              {selectedOrder.fabric_name && (
                <p className="text-xs text-slate-600 pt-1">
                  Fabrik: <span className="font-semibold text-slate-900">{selectedOrder.fabric_name}</span>
                  {selectedOrder.cut_name ? ` • Potongan: ${selectedOrder.cut_name}` : ''}
                </p>
              )}

              {/* Sizing Breakdown */}
              {selectedOrder.sizing_breakdown && Object.keys(selectedOrder.sizing_breakdown).length > 0 && (
                <div className="pt-2 border-t border-slate-200/60">
                  <p className="text-[11px] text-slate-500 font-medium mb-1.5">Pecahan Saiz:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {Object.entries(selectedOrder.sizing_breakdown).map(([sz, qty]) => (
                      <div key={sz} className="bg-white px-2.5 py-1 rounded-lg text-xs font-mono font-semibold text-slate-800 border border-slate-200/50">
                        {sz}: <span className="text-[#0052FF] font-bold">{qty}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Shipping Address */}
          <div className="bg-slate-50 rounded-2xl p-4 space-y-1 border border-slate-200/60">
            <span className="text-xs font-bold text-slate-900">Alamat Penghantaran</span>
            <p className="text-xs text-slate-600 leading-relaxed">
              {selectedOrder.shipping_address || 'No 15, Jalan Ampang, 50450 Kuala Lumpur'}
            </p>
          </div>
        </div>

        {/* Sticky Bottom Action Dock: Direct WhatsApp Status Check */}
        <div className="p-4 px-6 bg-white/95 backdrop-blur-md border-t border-slate-100 shrink-0">
          <a
            href={`https://wa.me/60148599138?text=Hai%20SFV%20Apparel,%20saya%20ingin%20semak%20status%20pesanan%20*${selectedOrder.order_number}*%20(${encodeURIComponent(selectedOrder.design_title)})`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full bg-[#25D366] hover:bg-[#20bd5a] text-white font-semibold py-3.5 rounded-xl text-center active:bg-emerald-700 transition-colors flex items-center justify-center space-x-2 shadow-md shadow-emerald-500/25 text-xs"
          >
            <FaWhatsapp className="w-4.5 h-4.5" />
            <span>Tanya Status Pesanan di WhatsApp →</span>
          </a>
        </div>
      </div>
    </div>
  );
}

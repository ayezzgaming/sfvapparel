'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  ChevronRight, 
  ShoppingBag,
  CheckCircle2,
  Clock,
  Copy,
  Check,
  Trash2
} from 'lucide-react';
import { FaWhatsapp } from 'react-icons/fa6';
import { useAppStore } from '@/lib/store/app-store';
import { formatCurrency } from '@/lib/pricing-calculator';
import SwipeableBottomSheet from '@/components/ui/SwipeableBottomSheet';
import { Order, OrderStatus } from '@/types/database';

const STATUS_CONFIG: Record<OrderStatus, { label: string; stepIndex: number; color: string; bg: string; dot: string }> = {
  pending_proof: { label: 'Semakan Mockup', stepIndex: 1, color: 'text-amber-700', bg: 'bg-amber-50', dot: 'bg-amber-500' },
  proof_approved: { label: 'Diluluskan', stepIndex: 1, color: 'text-purple-700', bg: 'bg-purple-50', dot: 'bg-purple-500' },
  in_printing: { label: 'Dalam Cetakan', stepIndex: 2, color: 'text-[#0052FF]', bg: 'bg-blue-50', dot: 'bg-[#0052FF]' },
  heat_press: { label: 'Proses Haba', stepIndex: 2, color: 'text-indigo-700', bg: 'bg-indigo-50', dot: 'bg-indigo-500' },
  sewing: { label: 'Jahitan', stepIndex: 3, color: 'text-sky-700', bg: 'bg-sky-50', dot: 'bg-sky-500' },
  qc_check: { label: 'Kawalan Kualiti', stepIndex: 3, color: 'text-teal-700', bg: 'bg-teal-50', dot: 'bg-teal-500' },
  ready_to_ship: { label: 'Sedia Dipos', stepIndex: 4, color: 'text-emerald-700', bg: 'bg-emerald-50', dot: 'bg-emerald-500' },
  delivered: { label: 'Selesai', stepIndex: 4, color: 'text-slate-700', bg: 'bg-slate-100', dot: 'bg-slate-500' },
  cancelled: { label: 'Dibatalkan', stepIndex: 0, color: 'text-rose-700', bg: 'bg-rose-50', dot: 'bg-rose-500' },
};

const TIMELINE_STEPS = [
  { step: 1, title: 'Reka Bentuk & Mockup', desc: 'Pengesahan artwork & susun atur' },
  { step: 2, title: 'Cetakan & Pemindahan Haba', desc: 'Proses sublimasi / cetakan DTF' },
  { step: 3, title: 'Jahitan & Pemeriksaan QC', desc: 'Jahitan kemas dan kawalan kualiti' },
  { step: 4, title: 'Penghantaran Kurier', desc: 'Bungkusan sedia dihantar kepada anda' },
];

export default function HistoryPage() {
  const { orders, deleteOrder } = useAppStore();
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

  const handleDeleteOrder = (orderId: string, orderNumber: string) => {
    if (confirm(`Adakah anda pasti mahu memadam pesanan ${orderNumber}?`)) {
      deleteOrder(orderId);
      setIsOrderSheetOpen(false);
    }
  };

  return (
    <div className="w-full min-h-full pt-3 pb-16 space-y-4 select-none font-ios bg-[#F2F2F7]">
      {/* 1. Orders List (Decluttered Cards with Clean Spacing) */}
      <div className="px-5 space-y-3.5 pt-1">
        {orders.length === 0 ? (
          <div className="bg-white rounded-3xl p-10 text-center shadow-xs space-y-3 border border-slate-200/60 my-4">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <ShoppingBag className="w-6 h-6 stroke-[1.5]" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-800">Tiada pesanan aktif</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Pilih templat dari katalog untuk mula menempah.</p>
            </div>
            <Link
              href="/catalog"
              className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-[#0052FF] text-white text-xs font-semibold shadow-sm active:bg-blue-700 transition-colors"
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
              bg: 'bg-blue-50',
              dot: 'bg-[#0052FF]',
            };

            const mockupImg = order.mockup_url || 
              (order.print_type === 'sublimation' ? '/images/prod_sportswear.jpg' : '/images/prod_tshirt.jpg');

            return (
              <div
                key={order.id}
                onClick={() => handleOpenOrder(order)}
                className="bg-white rounded-2xl p-4 shadow-xs border border-slate-200/60 hover:border-blue-200 transition-all cursor-pointer active:scale-[0.98] space-y-3"
              >
                {/* Header Row: Order Number + Minimal Pill Status + Quick Delete */}
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-slate-800 tracking-tight">
                    {order.order_number}
                  </span>
                  
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full ${config.bg} ${config.color}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
                      {config.label}
                    </span>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteOrder(order.id, order.order_number);
                      }}
                      title="Padam pesanan"
                      className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 active:scale-90 transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Product Detail Row */}
                <div className="flex items-center space-x-3.5">
                  <div className="w-14 h-14 rounded-xl overflow-hidden bg-slate-100 shrink-0 border border-slate-100">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={mockupImg}
                      alt={order.design_title}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <h3 className="text-xs font-bold text-slate-900 truncate">
                      {order.design_title}
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-0.5 truncate">
                      {order.total_quantity} helai • {order.print_type === 'sublimation' ? 'Sublimasi' : 'DTF'}
                    </p>
                    <p className="text-xs font-bold text-[#0052FF] mt-1">
                      {formatCurrency(order.total_amount)}
                    </p>
                  </div>
                </div>

                {/* Footer Row: Clean Date & Subdued Chevron */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">
                    {order.created_at ? new Date(order.created_at).toLocaleDateString('ms-MY', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Hari Ini'}
                  </span>
                  
                  <div className="flex items-center space-x-1 text-slate-500 font-medium">
                    <span>Perincian & Jejak</span>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* =========================================================================
          SWIPEABLE iOS BOTTOM SHEET FOR ORDER TRACKING DETAIL
         ========================================================================= */}
      <SwipeableBottomSheet
        isOpen={isOrderSheetOpen}
        onClose={() => setIsOrderSheetOpen(false)}
        maxHeight="max-h-[84dvh]"
        title={
          <div>
            <span className="font-mono text-sm font-bold text-slate-900 tracking-tight">
              {selectedOrder.order_number}
            </span>
            <p className="text-[11px] text-slate-400 font-normal mt-0.5">
              Tarikh: {selectedOrder.created_at ? new Date(selectedOrder.created_at).toLocaleDateString('ms-MY', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}
            </p>
          </div>
        }
        footer={
          <div className="space-y-2 w-full">
            <a
              href={`https://wa.me/60148599138?text=Hai%20SFV%20Apparel,%20saya%20ingin%20semak%20status%20pesanan%20*${selectedOrder.order_number}*%20(${encodeURIComponent(selectedOrder.design_title)})`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full bg-[#25D366] hover:bg-[#20bd5a] text-white font-semibold py-3.5 rounded-xl text-center active:bg-emerald-700 transition-colors flex items-center justify-center space-x-2 shadow-md shadow-emerald-500/20 text-xs"
            >
              <FaWhatsapp className="w-4 h-4" />
              <span>Tanya Status di WhatsApp</span>
            </a>

            <button
              type="button"
              onClick={() => handleDeleteOrder(selectedOrder.id, selectedOrder.order_number)}
              className="w-full bg-rose-50 text-rose-600 hover:bg-rose-100 font-semibold py-2.5 rounded-xl text-center active:scale-[0.99] transition-all flex items-center justify-center space-x-1.5 text-xs"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Padam Pesanan Ini</span>
            </button>
          </div>
        }
      >
        {/* Status Current Banner */}
        <div className="bg-slate-50 rounded-2xl p-3.5 space-y-2 border border-slate-200/50">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800">Status Terkini</span>
            <span className={`inline-flex items-center gap-1.5 text-[10.5px] font-bold px-2.5 py-1 rounded-full ${STATUS_CONFIG[selectedOrder.status]?.bg || 'bg-blue-50'} ${STATUS_CONFIG[selectedOrder.status]?.color || 'text-[#0052FF]'}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${STATUS_CONFIG[selectedOrder.status]?.dot || 'bg-[#0052FF]'}`} />
              {STATUS_CONFIG[selectedOrder.status]?.label || selectedOrder.status}
            </span>
          </div>

          {selectedOrder.tracking_number && (
            <div className="pt-2 border-t border-slate-200/50 flex items-center justify-between text-xs">
              <span className="text-slate-500 text-[11px]">
                {selectedOrder.shipping_courier || 'Kurier'}:
              </span>
              <button
                type="button"
                onClick={() => handleCopyTracking(selectedOrder.tracking_number || '')}
                className="flex items-center gap-1.5 font-mono font-bold text-xs text-[#0052FF] bg-white px-2.5 py-1 rounded-lg border border-slate-200/60 shadow-2xs active:scale-95 transition-transform"
              >
                <span>{selectedOrder.tracking_number}</span>
                {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          )}
        </div>

        {/* Stepper Timeline */}
        <div className="space-y-2">
          <span className="text-xs font-bold text-slate-900">Kemajuan Kilang</span>
          <div className="bg-white rounded-2xl p-4 border border-slate-200/60 space-y-3.5">
            {TIMELINE_STEPS.map((step, idx) => {
              const currentStep = STATUS_CONFIG[selectedOrder.status]?.stepIndex || 2;
              const isFinished = currentStep > step.step;
              const isCurrent = currentStep === step.step;

              return (
                <div key={step.step} className="flex items-start gap-3 relative">
                  {/* Left Connecting Line */}
                  {idx < TIMELINE_STEPS.length - 1 && (
                    <div className={`absolute left-3 top-6 bottom-0 w-0.5 -mb-3.5 ${isFinished ? 'bg-[#0052FF]' : 'bg-slate-100'}`} />
                  )}

                  {/* Step Icon */}
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 z-10 text-[10px] font-bold ${
                    isFinished
                      ? 'bg-[#0052FF] text-white'
                      : isCurrent
                      ? 'bg-blue-100 text-[#0052FF] ring-2 ring-blue-50'
                      : 'bg-slate-100 text-slate-400'
                  }`}>
                    {isFinished ? (
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    ) : isCurrent ? (
                      <Clock className="w-3 h-3 animate-pulse" />
                    ) : (
                      step.step
                    )}
                  </div>

                  {/* Step Content */}
                  <div className="min-w-0 flex-1 pt-0.5">
                    <p className={`text-xs font-bold ${isCurrent ? 'text-[#0052FF]' : isFinished ? 'text-slate-900' : 'text-slate-400'}`}>
                      {step.title}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
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
          <div className="bg-slate-50 rounded-2xl p-3.5 space-y-2 border border-slate-200/50 text-xs">
            <h4 className="text-xs font-bold text-slate-900">{selectedOrder.design_title}</h4>
            
            <div className="flex justify-between items-center text-[11px] text-slate-500 pt-1">
              <span>Jenis Cetakan:</span>
              <span className="font-semibold text-slate-800">
                {selectedOrder.print_type === 'sublimation' ? 'Sublimasi Penuh' : 'Cetakan DTF'}
              </span>
            </div>

            <div className="flex justify-between items-center text-[11px] text-slate-500">
              <span>Jumlah Tempahan:</span>
              <span className="font-bold text-[#0052FF]">
                {selectedOrder.total_quantity} helai
              </span>
            </div>

            <div className="flex justify-between items-center text-[11px] text-slate-500">
              <span>Jumlah Harga:</span>
              <span className="font-bold text-slate-900">
                {formatCurrency(selectedOrder.total_amount)}
              </span>
            </div>

            {selectedOrder.fabric_name && (
              <div className="flex justify-between items-center text-[11px] text-slate-500">
                <span>Fabrik / Potongan:</span>
                <span className="font-semibold text-slate-800">
                  {selectedOrder.fabric_name}
                </span>
              </div>
            )}

            {/* Sizing Breakdown */}
            {selectedOrder.sizing_breakdown && Object.keys(selectedOrder.sizing_breakdown).length > 0 && (
              <div className="pt-2 border-t border-slate-200/50">
                <p className="text-[10.5px] text-slate-400 mb-1">Pecahan Saiz:</p>
                <div className="flex flex-wrap gap-1.5">
                  {Object.entries(selectedOrder.sizing_breakdown).map(([sz, qty]) => (
                    <div key={sz} className="bg-white px-2 py-0.5 rounded-md text-[11px] font-mono font-semibold text-slate-700 border border-slate-200/40">
                      {sz}: <span className="text-[#0052FF] font-bold">{qty}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Shipping Address */}
        <div className="bg-slate-50 rounded-2xl p-3.5 space-y-1 border border-slate-200/50 text-xs">
          <span className="text-xs font-bold text-slate-900">Alamat Penghantaran</span>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            {selectedOrder.shipping_address || 'No 15, Jalan Ampang, 50450 Kuala Lumpur'}
          </p>
        </div>
      </SwipeableBottomSheet>
    </div>
  );
}

'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  ChevronRight, 
  ShoppingBag,
  CheckCircle2,
  Clock,
  Copy,
  Check,
  Trash2,
  LogIn,
  Package,
  Truck
} from 'lucide-react';
import { FaWhatsapp } from 'react-icons/fa6';
import { useAppStore } from '@/lib/store/app-store';
import { useAuth } from '@/hooks/useAuth';
import { formatCurrency } from '@/lib/pricing-calculator';
import { buildWhatsAppInquiryUrl } from '@/lib/whatsapp/dynamic-link';
import SwipeableBottomSheet from '@/components/ui/SwipeableBottomSheet';
import { Order, OrderStatus } from '@/types/database';

const STATUS_CONFIG: Record<OrderStatus, { label: string; stepIndex: number; color: string; bg: string; dot: string }> = {
  pending_proof: { label: 'Semakan Mockup', stepIndex: 1, color: 'text-amber-800', bg: 'bg-amber-50', dot: 'bg-amber-500' },
  proof_approved: { label: 'Diluluskan', stepIndex: 1, color: 'text-purple-800', bg: 'bg-purple-50', dot: 'bg-purple-500' },
  in_printing: { label: 'Dalam Cetakan', stepIndex: 2, color: 'text-blue-800', bg: 'bg-blue-50', dot: 'bg-blue-500' },
  heat_press: { label: 'Proses Haba', stepIndex: 2, color: 'text-indigo-800', bg: 'bg-indigo-50', dot: 'bg-indigo-500' },
  sewing: { label: 'Jahitan', stepIndex: 3, color: 'text-sky-800', bg: 'bg-sky-50', dot: 'bg-sky-500' },
  qc_check: { label: 'Kawalan Kualiti', stepIndex: 3, color: 'text-teal-800', bg: 'bg-teal-50', dot: 'bg-teal-500' },
  ready_to_ship: { label: 'Sedia Dipos', stepIndex: 4, color: 'text-emerald-800', bg: 'bg-emerald-50', dot: 'bg-emerald-500' },
  delivered: { label: 'Selesai', stepIndex: 4, color: 'text-slate-700', bg: 'bg-slate-100', dot: 'bg-slate-500' },
  cancelled: { label: 'Dibatalkan', stepIndex: 0, color: 'text-rose-800', bg: 'bg-rose-50', dot: 'bg-rose-500' },
};

const TIMELINE_STEPS = [
  { step: 1, title: 'Reka Bentuk & Mockup', desc: 'Pengesahan artwork & susun atur' },
  { step: 2, title: 'Cetakan & Pemindahan Haba', desc: 'Proses sublimasi / cetakan DTF' },
  { step: 3, title: 'Jahitan & Pemeriksaan QC', desc: 'Jahitan kemas dan kawalan kualiti' },
  { step: 4, title: 'Penghantaran Kurier', desc: 'Bungkusan sedia dihantar kepada anda' },
];

export default function HistoryPage() {
  const { orders, deleteOrder, companySettings } = useAppStore();
  const { isAuthenticated, customer, isLoading } = useAuth();

  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isOrderSheetOpen, setIsOrderSheetOpen] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  // Filter orders by authenticated customer from Database
  const customerOrders = useMemo(() => {
    if (!isAuthenticated || !customer) return [];
    const phone = customer.whatsapp || '';
    const cleanPhone = phone.replace(/[\s\-\+\(\)]/g, '');

    return orders.filter((o) => {
      if (o.customer_id && customer.id && o.customer_id === customer.id) return true;
      if (o.customer_phone && cleanPhone) {
        const orderPhoneClean = o.customer_phone.replace(/[\s\-\+\(\)]/g, '');
        if (orderPhoneClean.includes(cleanPhone.slice(-8)) || cleanPhone.includes(orderPhoneClean.slice(-8))) return true;
      }
      if (customer.email && o.customer_email && o.customer_email.toLowerCase() === customer.email.toLowerCase()) return true;
      return false;
    });
  }, [orders, isAuthenticated, customer]);

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
      <div className="px-5 space-y-3.5 pt-1">
        
        {/* State 1: Guest / Not Logged In */}
        {!isAuthenticated ? (
          <div className="bg-white rounded-3xl p-8 text-center shadow-xs space-y-3 border border-slate-200/60 my-4">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <ShoppingBag className="w-6 h-6 stroke-[1.5]" />
            </div>
            <div className="space-y-1 max-w-xs mx-auto">
              <h3 className="text-sm font-semibold text-slate-900">Log Masuk Diperlukan</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Sila log masuk dengan nombor WhatsApp untuk melihat sejarah dan status penjejakan pesanan anda.
              </p>
            </div>
            <div className="pt-2">
              <Link
                href="/auth/login?redirect=/history"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-slate-900 text-white text-xs font-medium shadow-xs active:scale-95 transition-all"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Log Masuk / Daftar</span>
              </Link>
            </div>
          </div>
        ) : customerOrders.length === 0 ? (
          /* State 2: Logged in but No Orders */
          <div className="bg-white rounded-3xl p-10 text-center shadow-xs space-y-3 border border-slate-200/60 my-4">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <ShoppingBag className="w-6 h-6 stroke-[1.5]" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-800">Tiada Pesanan Rekod</p>
              <p className="text-xs text-slate-400 mt-0.5">Anda belum mempunyai rekod tempahan di kilang.</p>
            </div>
            <div className="pt-2">
              <Link
                href="/catalog"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-medium active:bg-slate-800 transition-colors"
              >
                <span>Lihat Katalog</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        ) : (
          /* State 3: List Real Customer Orders from Database */
          customerOrders.map((order) => {
            const config = STATUS_CONFIG[order.status] || {
              label: order.status,
              stepIndex: 2,
              color: 'text-slate-800',
              bg: 'bg-slate-100',
              dot: 'bg-slate-500',
            };

            const mockupImg = order.mockup_url || 
              (order.print_type === 'sublimation' ? '/images/prod_sportswear.webp' : '/images/prod_tshirt.webp');

            return (
              <div
                key={order.id}
                onClick={() => handleOpenOrder(order)}
                className="p-4 rounded-2xl bg-white border border-slate-200/70 shadow-xs hover:border-slate-300 active:scale-[0.99] transition-all cursor-pointer space-y-3"
              >
                {/* Header: Order Number & Status */}
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-xs font-semibold text-slate-900">
                      {order.order_number}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {new Date(order.created_at).toLocaleDateString('ms-MY', { day: 'numeric', month: 'short' })}
                    </span>
                  </div>

                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-[10px] font-medium ${config.bg} ${config.color}`}>
                    <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${config.dot}`} />
                    {config.label}
                  </span>
                </div>

                {/* Item Details */}
                <div className="flex space-x-3 items-center">
                  <div className="w-14 h-14 rounded-xl overflow-hidden bg-slate-100 shrink-0 border border-slate-200/60 relative">
                    <Image
                      src={mockupImg}
                      alt={order.design_title}
                      fill
                      className="object-cover"
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="text-xs font-semibold text-slate-800 truncate">
                      {order.design_title}
                    </h3>
                    <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                      {order.print_type === 'sublimation'
                        ? `${order.fabric_name || 'Sublimasi'} • ${order.cut_name || 'Standard'}`
                        : `${order.dtf_dimension_name || 'DTF'} • ${order.dtf_option_type === 'with_garment' ? 'Dengan Baju' : 'Cetakan Filem Sahaja'}`}
                    </p>
                    <p className="text-[11px] font-medium text-slate-400 mt-0.5">
                      Kuantiti: {order.total_quantity} helai
                    </p>
                  </div>
                </div>

                {/* Footer: Amount & Action Link */}
                <div className="pt-2 border-t border-slate-100 flex justify-between items-center text-xs">
                  <div>
                    <span className="text-[11px] text-slate-400">Jumlah: </span>
                    <span className="font-semibold text-slate-900">
                      {formatCurrency(order.total_amount)}
                    </span>
                  </div>

                  <div className="flex items-center text-slate-500 font-medium text-[11px] gap-0.5 group">
                    <span>Perincian</span>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* =========================================================================
          ORDER DETAIL MODAL (SWIPEABLE iOS BOTTOM SHEET)
         ========================================================================= */}
      {selectedOrder && (
        <SwipeableBottomSheet
          isOpen={isOrderSheetOpen}
          onClose={() => setIsOrderSheetOpen(false)}
          maxHeight="max-h-[90vh]"
          title={
            <div className="flex items-center space-x-2">
              <span className="font-mono text-xs font-semibold text-slate-900">
                {selectedOrder.order_number}
              </span>
              <span className={`px-2 py-0.5 rounded-md text-[10px] font-medium ${
                STATUS_CONFIG[selectedOrder.status]?.bg || 'bg-slate-100'
              } ${
                STATUS_CONFIG[selectedOrder.status]?.color || 'text-slate-800'
              }`}>
                {STATUS_CONFIG[selectedOrder.status]?.label || selectedOrder.status}
              </span>
            </div>
          }
          footer={
            <div className="space-y-2 w-full">
              <a
                href={buildWhatsAppInquiryUrl({
                  phone: companySettings?.whatsapp_number,
                  type: 'order',
                  orderNumber: selectedOrder.order_number,
                })}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full bg-[#25D366] text-white font-medium py-3 rounded-xl text-center active:bg-emerald-600 transition-colors flex items-center justify-center space-x-2 shadow-xs text-xs"
              >
                <FaWhatsapp className="w-4 h-4" />
                <span>Semak Kemaskini dengan Kilang (WhatsApp)</span>
              </a>

              <button
                type="button"
                onClick={() => handleDeleteOrder(selectedOrder.id, selectedOrder.order_number)}
                className="w-full py-2.5 text-center text-xs font-medium text-slate-400 hover:text-rose-600 transition-colors"
              >
                Padam Rekod Ini
              </button>
            </div>
          }
        >
          <div className="space-y-4 pt-1 text-xs">
            
            {/* Tracking Banner if Available */}
            {selectedOrder.tracking_number && (
              <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 flex items-center justify-between">
                <div className="flex items-center space-x-2.5 min-w-0">
                  <Truck className="w-4 h-4 text-emerald-700 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[10px] text-emerald-600 font-medium">
                      {selectedOrder.shipping_courier || 'Kurier Malaysia'}
                    </p>
                    <p className="font-mono text-xs font-bold text-emerald-950 truncate">
                      {selectedOrder.tracking_number}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleCopyTracking(selectedOrder.tracking_number || '')}
                  className="px-2.5 py-1 rounded-lg bg-white border border-emerald-200 text-[10px] font-medium text-emerald-800 flex items-center gap-1 active:scale-95 shadow-2xs"
                >
                  {isCopied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                  <span>{isCopied ? 'Disalin' : 'Salin'}</span>
                </button>
              </div>
            )}

            {/* Production Timeline */}
            <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-200/60 space-y-3">
              <h4 className="text-[11px] font-semibold text-slate-900 uppercase tracking-wider">
                Status Aliran Pengeluaran
              </h4>

              <div className="space-y-3 relative pl-4 border-l-2 border-slate-200 ml-1">
                {TIMELINE_STEPS.map((step) => {
                  const currentStepIdx = STATUS_CONFIG[selectedOrder.status]?.stepIndex || 1;
                  const isPassed = step.step <= currentStepIdx;
                  const isCurrent = step.step === currentStepIdx;

                  return (
                    <div key={step.step} className="relative">
                      <div className={`absolute -left-[21px] top-0.5 w-3 h-3 rounded-full border-2 border-white ${
                        isCurrent ? 'bg-blue-600 ring-2 ring-blue-100' : isPassed ? 'bg-emerald-500' : 'bg-slate-300'
                      }`} />
                      <p className={`text-xs font-medium ${isCurrent ? 'text-blue-950 font-semibold' : isPassed ? 'text-slate-800' : 'text-slate-400'}`}>
                        {step.title}
                      </p>
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        {step.desc}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Sizing Breakdown Table */}
            {selectedOrder.sizing_breakdown && Object.keys(selectedOrder.sizing_breakdown).length > 0 && (
              <div className="p-3.5 rounded-2xl bg-white border border-slate-200/70 space-y-2">
                <h4 className="text-[11px] font-semibold text-slate-900 uppercase tracking-wider">
                  Pecahan Saiz ({selectedOrder.total_quantity} helai)
                </h4>
                <div className="flex flex-wrap gap-2 pt-1">
                  {Object.entries(selectedOrder.sizing_breakdown).map(([size, qty]) => (
                    <div key={size} className="px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200/60 font-mono text-xs flex items-center gap-1.5">
                      <span className="font-bold text-slate-800">{size}:</span>
                      <span className="text-slate-600">{qty} helai</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Financial Summary */}
            <div className="p-3.5 rounded-2xl bg-white border border-slate-200/70 space-y-1.5">
              <div className="flex justify-between text-slate-500">
                <span>Harga Seunit Asal</span>
                <span className="font-mono">{formatCurrency(selectedOrder.raw_unit_price)}</span>
              </div>
              {selectedOrder.discount_percentage > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>Diskaun Pukal ({selectedOrder.discount_percentage}%)</span>
                  <span className="font-mono">-{formatCurrency(selectedOrder.raw_unit_price - selectedOrder.final_unit_price)} / helai</span>
                </div>
              )}
              <div className="flex justify-between text-slate-500">
                <span>Harga Seunit Akhir</span>
                <span className="font-mono">{formatCurrency(selectedOrder.final_unit_price)}</span>
              </div>
              <div className="flex justify-between font-semibold text-slate-900 pt-1.5 border-t border-slate-100 text-sm">
                <span>Jumlah Keseluruhan</span>
                <span className="font-mono">{formatCurrency(selectedOrder.total_amount)}</span>
              </div>
            </div>

            {/* Shipping Address */}
            {selectedOrder.shipping_address && (
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/60 space-y-1 text-xs">
                <span className="font-semibold text-slate-900 block">Alamat Penghantaran</span>
                <p className="text-slate-600">{selectedOrder.shipping_address}</p>
              </div>
            )}

          </div>
        </SwipeableBottomSheet>
      )}

    </div>
  );
}

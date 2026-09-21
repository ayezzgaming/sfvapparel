'use client';

import React, { useState, useMemo, useEffect, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
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
  Truck,
  CreditCard,
  AlertCircle
} from 'lucide-react';
import { FaWhatsapp } from 'react-icons/fa6';
import { useAppStore } from '@/lib/store/app-store';
import { useAuth } from '@/hooks/useAuth';
import { formatCurrency } from '@/lib/pricing-calculator';
import { buildWhatsAppInquiryUrl } from '@/lib/whatsapp/dynamic-link';
import SwipeableBottomSheet from '@/components/ui/SwipeableBottomSheet';
import { confirmPaymentReturnAction } from '@/app/actions/paymentActions';
import { getCustomerOrdersDb } from '@/app/actions/orderActions';
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

function HistoryContent() {
  const { orders, deleteOrder, companySettings, refreshAllDb } = useAppStore();
  const { isAuthenticated, customer, isLoading } = useAuth();
  const searchParams = useSearchParams();

  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isOrderSheetOpen, setIsOrderSheetOpen] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [isPayingBalance, setIsPayingBalance] = useState(false);
  const [balanceError, setBalanceError] = useState<string | null>(null);
  const [liveOrders, setLiveOrders] = useState<Order[]>([]);
  const [isFetchingLive, setIsFetchingLive] = useState(false);

  const paymentQuery = searchParams.get('payment');
  const orderNumberQuery = searchParams.get('order_number');

  // Auto confirm payment return from gateway & sync database
  useEffect(() => {
    let isMounted = true;
    if (paymentQuery === 'success' && orderNumberQuery) {
      confirmPaymentReturnAction(orderNumberQuery)
        .then((res) => {
          if (isMounted) {
            refreshAllDb?.();
            if (res.success && res.order) {
              setSelectedOrder(res.order);
              setIsOrderSheetOpen(true);
            }
          }
        })
        .catch((e) => {
          console.error('[history] Error confirming payment return:', e);
          refreshAllDb?.();
        });
    } else {
      refreshAllDb?.();
    }
    return () => {
      isMounted = false;
    };
  }, [paymentQuery, orderNumberQuery, refreshAllDb]);

  // Fetch live orders directly from Supabase by Customer Phone or Order Number
  useEffect(() => {
    let isMounted = true;
    const identifier = customer?.phone || customer?.whatsapp || customer?.id || orderNumberQuery;
    if (identifier) {
      setIsFetchingLive(true);
      getCustomerOrdersDb(identifier)
        .then((res) => {
          if (isMounted && res.success && Array.isArray(res.orders)) {
            setLiveOrders(res.orders);
          }
        })
        .catch(console.error)
        .finally(() => {
          if (isMounted) setIsFetchingLive(false);
        });
    }
    return () => {
      isMounted = false;
    };
  }, [customer, orderNumberQuery]);

  // Combined & deduplicated customer orders list
  const customerOrders = useMemo(() => {
    const combined: Order[] = [...liveOrders];
    const existingIds = new Set(combined.map((o) => o.id || o.order_number));

    const phone = String(customer?.phone || customer?.whatsapp || '');
    const cleanPhone = phone.replace(/[\s\-\+\(\)]/g, '');
    const shortPhone = cleanPhone.replace(/^60|^0/, '');

    if (Array.isArray(orders)) {
      for (const o of orders) {
        if (!o || existingIds.has(o.id) || existingIds.has(o.order_number)) continue;

        let isMatch = false;
        if (orderNumberQuery) {
          const baseQuery = orderNumberQuery.replace(/-(DP|BAL)$/i, '');
          if (o.order_number === baseQuery) isMatch = true;
        }
        if (customer?.id && o.customer_id === customer.id) isMatch = true;
        if (shortPhone && shortPhone.length >= 6 && o.customer_phone) {
          const oPhone = String(o.customer_phone).replace(/[\s\-\+\(\)]/g, '');
          if (oPhone.includes(shortPhone) || shortPhone.includes(oPhone)) isMatch = true;
        }
        if (customer?.email && o.customer_email && String(o.customer_email).toLowerCase() === String(customer.email).toLowerCase()) isMatch = true;

        if (isMatch) {
          combined.push(o);
          existingIds.add(o.id || o.order_number);
        }
      }
    }

    return combined;
  }, [liveOrders, orders, customer, orderNumberQuery]);

  const handleOpenOrder = (order: Order) => {
    setSelectedOrder(order);
    setIsOrderSheetOpen(true);
    setIsCopied(false);
    setBalanceError(null);
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

  const handlePayBalance = async (order: Order) => {
    setIsPayingBalance(true);
    setBalanceError(null);
    try {
      const balanceAmt = order.balance_amount !== undefined 
        ? order.balance_amount 
        : ((Number(order.total_amount) || 0) - (Number(order.deposit_amount) || Math.round((Number(order.total_amount) || 0) * 0.5 * 100) / 100));

      if (balanceAmt <= 0) {
        setBalanceError('Pesanan ini telah dilunaskan sepenuhnya.');
        setIsPayingBalance(false);
        return;
      }

      const res = await fetch('/api/payment/chip/create-purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderNumber: `${order.order_number}-BAL`,
          customerName: order.customer_name,
          customerEmail: order.customer_email || `${order.customer_name.toLowerCase().replace(/\s+/g, '')}@gmail.com`,
          customerPhone: order.customer_phone,
          totalAmount: balanceAmt,
          itemsDescription: `Pelunasan Baki 50% Pesanan ${order.order_number} (${order.design_title})`,
        }),
      });

      const data = await res.json();
      if (data.success && data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        setBalanceError(data.message || 'Gagal memulakan sesi pembayaran baki CHIP.');
        setIsPayingBalance(false);
      }
    } catch (err: unknown) {
      console.error('Balance checkout error:', err);
      setBalanceError('Ralat sambungan gerbang pembayaran. Sila gunakan pilihan WhatsApp.');
      setIsPayingBalance(false);
    }
  };

  return (
    <div className="w-full min-h-full pt-3 pb-16 space-y-4 select-none font-ios bg-[#F2F2F7]">
      <div className="px-5 space-y-3.5 pt-1">
        
        {/* Payment Gateway Callback Status Notification */}
        {paymentQuery === 'success' && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-start gap-3 shadow-xs">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div className="text-xs space-y-0.5">
              <p className="font-bold">Pembayaran Berjaya Diterima!</p>
              <p className="text-emerald-700 leading-relaxed">
                {orderNumberQuery ? `Transaksi untuk pesanan ${orderNumberQuery} telah disahkan.` : 'Transaksi anda telah disahkan.'} Pihak kilang sedang menyemak mockup dan memulakan jadual pengeluaran.
              </p>
            </div>
          </div>
        )}

        {(paymentQuery === 'failed' || paymentQuery === 'cancelled') && (
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 flex items-start gap-3 shadow-xs">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-xs space-y-0.5">
              <p className="font-bold">Pembayaran Tidak Selesai</p>
              <p className="text-amber-700 leading-relaxed">
                Sesi pembayaran dalam talian telah dibatalkan atau tidak berjaya. Anda boleh mencuba semula melalui butang perincian pesanan di bawah atau hubungi kami melalui WhatsApp.
              </p>
            </div>
          </div>
        )}

        {/* Loading State */}
        {(isLoading || isFetchingLive) && customerOrders.length === 0 ? (
          <div className="bg-white rounded-3xl p-10 text-center shadow-xs space-y-3 border border-slate-200/60 my-4">
            <div className="w-8 h-8 rounded-full border-2 border-sky-500 border-t-transparent animate-spin mx-auto" />
            <p className="text-xs text-slate-500">Memuatkan rekod pesanan dari pangkalan data...</p>
          </div>
        ) : !isAuthenticated && customerOrders.length === 0 ? (
          /* State 1: Guest / Not Logged In & No Direct Query */
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
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-gradient-to-r from-[#0052FF] to-[#00BDFF] text-white text-xs font-bold shadow-md shadow-blue-500/20 active:scale-95 transition-all"
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
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-slate-900">Tiada Pesanan Rekod</h3>
              <p className="text-xs text-slate-500">Anda belum mempunyai rekod tempahan di kilang.</p>
            </div>
            <div className="pt-2">
              <Link
                href="/catalog"
                className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-full bg-[#007AFF] text-white text-xs font-bold shadow-md shadow-blue-500/20 active:scale-95 transition-all"
              >
                <span>Lihat Katalog</span>
                <ChevronRight className="w-4 h-4" />
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

                  <div className="flex items-center gap-1.5">
                    {order.payment_status === 'paid' ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[9px] font-bold bg-emerald-100 text-emerald-800">
                        Lunas 100%
                      </span>
                    ) : order.payment_status === 'deposit_paid' ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[9px] font-bold bg-sky-100 text-sky-800">
                        DP 50% Dibayar
                      </span>
                    ) : order.payment_status === 'deposit_pending' || order.payment_status === 'balance_pending' ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[9px] font-bold bg-amber-100 text-amber-800">
                        Menunggu Bayaran
                      </span>
                    ) : null}

                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-[10px] font-medium ${config.bg} ${config.color}`}>
                      <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${config.dot}`} />
                      {config.label}
                    </span>
                  </div>
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
                    {order.payment_status === 'deposit_paid' && order.balance_amount && order.balance_amount > 0 ? (
                      <span className="text-[10px] text-amber-600 font-medium ml-1.5">
                        (Baki: {formatCurrency(order.balance_amount)})
                      </span>
                    ) : null}
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
                className="w-full bg-[#25D366] hover:bg-emerald-600 text-white font-bold py-3.5 px-6 rounded-full text-center active:scale-[0.98] transition-all flex items-center justify-center space-x-2 shadow-md shadow-emerald-500/20 text-xs"
              >
                <FaWhatsapp className="w-4 h-4" />
                <span>Semak Kemaskini dengan Kilang (WhatsApp)</span>
              </a>

              <button
                type="button"
                onClick={() => handleDeleteOrder(selectedOrder.id, selectedOrder.order_number)}
                className="w-full py-2.5 text-center text-xs font-semibold text-slate-400 hover:text-rose-600 transition-colors"
              >
                Padam Rekod Ini
              </button>
            </div>
          }
        >
          <div className="space-y-4 pt-1 text-xs">

            {/* Settlement Action Banner for 50% Deposit Orders */}
            {selectedOrder.payment_status === 'deposit_paid' && (selectedOrder.balance_amount || 0) > 0 && (
              <div className={`p-4 rounded-2xl border space-y-3 ${
                selectedOrder.status === 'ready_to_ship'
                  ? 'bg-amber-500/10 border-amber-300 ring-1 ring-amber-400/30'
                  : 'bg-blue-50/80 border-blue-200'
              }`}>
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-xl shrink-0 ${
                    selectedOrder.status === 'ready_to_ship' ? 'bg-amber-500 text-white' : 'bg-blue-600 text-white'
                  }`}>
                    <CreditCard className="w-4 h-4" />
                  </div>
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-slate-900 text-xs">
                        {selectedOrder.status === 'ready_to_ship'
                          ? 'Pesanan Siap - Sila Jelaskan Baki'
                          : 'Baki Pelunasan 50%'}
                      </h4>
                      <span className="font-mono font-bold text-sm text-slate-900">
                        {formatCurrency(selectedOrder.balance_amount || (selectedOrder.total_amount * 0.5))}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      {selectedOrder.status === 'ready_to_ship'
                        ? 'Pengeluaran jersi anda telah selesai di kilang. Sila buat bayaran baki bagi membolehkan bungkusan dipos keluar serta-merta.'
                        : 'Deposit 50% telah diterima. Baki 50% boleh dibayar sekarang atau setelah status tempahan bertukar kepada Sedia Dipos.'}
                    </p>
                  </div>
                </div>

                {balanceError && (
                  <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-[11px] text-rose-700 flex items-center gap-2">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{balanceError}</span>
                  </div>
                )}

                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => handlePayBalance(selectedOrder)}
                    disabled={isPayingBalance}
                    className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                    <span>{isPayingBalance ? 'Memproses Gerbang CHIP...' : `Bayar Baki ${formatCurrency(selectedOrder.balance_amount || (selectedOrder.total_amount * 0.5))} (FPX / Kad)`}</span>
                  </button>
                </div>
              </div>
            )}
            
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
            <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h4 className="text-[11px] font-bold text-slate-900 uppercase tracking-wider">
                  Perincian Kewangan
                </h4>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                  selectedOrder.payment_status === 'paid'
                    ? 'bg-emerald-100 text-emerald-800'
                    : selectedOrder.payment_status === 'deposit_paid'
                    ? 'bg-sky-100 text-sky-800'
                    : selectedOrder.payment_status === 'deposit_pending' || selectedOrder.payment_status === 'balance_pending'
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-slate-100 text-slate-700'
                }`}>
                  {selectedOrder.payment_status === 'paid'
                    ? 'Lunas 100%'
                    : selectedOrder.payment_status === 'deposit_paid'
                    ? 'Deposit 50% Sah'
                    : selectedOrder.payment_status === 'deposit_pending'
                    ? 'Menunggu Bayaran Deposit'
                    : selectedOrder.payment_status === 'balance_pending'
                    ? 'Menunggu Bayaran Baki'
                    : 'Belum Dibayar'}
                </span>
              </div>

              <div className="space-y-2 text-xs">
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
                <div className="flex justify-between font-semibold text-slate-900 pt-2 border-t border-slate-100">
                  <span>Jumlah Keseluruhan ({selectedOrder.total_quantity} helai)</span>
                  <span className="font-mono text-sm font-bold text-slate-950">{formatCurrency(selectedOrder.total_amount)}</span>
                </div>

                {/* Struktur Bayaran: Deposit 50% vs Bayaran Penuh */}
                {(() => {
                  const total = Number(selectedOrder.total_amount) || 0;
                  const depAmt = Number(selectedOrder.deposit_amount) || Math.round(total * 0.5 * 100) / 100;
                  const balAmt = Number(selectedOrder.balance_amount) !== undefined && selectedOrder.balance_amount !== null
                    ? Number(selectedOrder.balance_amount)
                    : Math.round((total - depAmt) * 100) / 100;
                  const isDepPaid = selectedOrder.payment_status === 'deposit_paid' || selectedOrder.payment_status === 'paid' || Boolean(selectedOrder.deposit_paid_at);
                  const isBalPaid = selectedOrder.payment_status === 'paid' || Boolean(selectedOrder.balance_paid_at);

                  return (
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60 space-y-2.5 mt-2">
                      <div className="flex items-center justify-between text-xs">
                        <div>
                          <span className="font-medium text-slate-800 block">1. Bayaran Deposit 50%</span>
                          <span className="text-[10px] text-slate-400">Pengesahan permulaan proses kilang</span>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="font-mono font-bold text-slate-900">{formatCurrency(depAmt)}</span>
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                            isDepPaid ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {isDepPaid ? 'Telah Diterima' : 'Menunggu'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-200/60">
                        <div>
                          <span className="font-medium text-slate-800 block">2. Baki Pelunasan 50%</span>
                          <span className="text-[10px] text-slate-400">Dibayar apabila jersi siap sedia dipos</span>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="font-mono font-bold text-slate-900">{formatCurrency(balAmt)}</span>
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                            isBalPaid ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                          }`}>
                            {isBalPaid ? 'Selesai Lunas' : 'Belum Lunas'}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })()}
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

export default function HistoryPage() {
  return (
    <Suspense
      fallback={
        <div className="w-full min-h-screen bg-[#F2F2F7] flex items-center justify-center p-8">
          <div className="w-6 h-6 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <HistoryContent />
    </Suspense>
  );
}

'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import {
  ChevronLeft,
  Copy,
  Check,
  Package,
  Truck,
  CreditCard,
  AlertCircle,
  CheckCircle2,
  Clock,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
  FileText
} from 'lucide-react';
import { FaWhatsapp } from 'react-icons/fa6';
import { useAppStore } from '@/lib/store/app-store';
import { formatCurrency } from '@/lib/pricing-calculator';
import { buildWhatsAppInquiryUrl } from '@/lib/whatsapp/dynamic-link';
import { getOrderByNumberOrIdDb, clientApproveProofAction } from '@/app/actions/orderActions';
import { confirmPaymentReturnAction } from '@/app/actions/paymentActions';
import { Order, OrderStatus } from '@/types/database';

const STATUS_CONFIG: Record<
  OrderStatus,
  { label: string; stepIndex: number; color: string; bg: string; dot: string; desc: string }
> = {
  pending_proof: {
    label: 'Semakan Mockup',
    stepIndex: 1,
    color: 'text-amber-800',
    bg: 'bg-amber-50 border-amber-200/80',
    dot: 'bg-amber-500',
    desc: 'Artwork dan susun atur reka bentuk sedang disemak dan disediakan.',
  },
  proof_approved: {
    label: 'Mockup Diluluskan',
    stepIndex: 1,
    color: 'text-purple-800',
    bg: 'bg-purple-50 border-purple-200/80',
    dot: 'bg-purple-500',
    desc: 'Mockup telah disahkan dan sedia untuk memasuki giliran mesin cetak kilang.',
  },
  in_printing: {
    label: 'Dalam Cetakan',
    stepIndex: 2,
    color: 'text-blue-800',
    bg: 'bg-blue-50 border-blue-200/80',
    dot: 'bg-blue-500',
    desc: 'Fabrik sedang melalui proses cetakan sublimasi warna penuh / filem DTF.',
  },
  heat_press: {
    label: 'Proses Haba',
    stepIndex: 2,
    color: 'text-indigo-800',
    bg: 'bg-indigo-50 border-indigo-200/80',
    dot: 'bg-indigo-500',
    desc: 'Proses pemindahan haba (heat press) untuk menyerap dakwat ke serat fabrik.',
  },
  sewing: {
    label: 'Jahitan & QC',
    stepIndex: 3,
    color: 'text-sky-800',
    bg: 'bg-sky-50 border-sky-200/80',
    dot: 'bg-sky-500',
    desc: 'Proses pemotongan pola dan jahitan kemas oleh tukang jahit berpengalaman.',
  },
  qc_check: {
    label: 'Kawalan Kualiti',
    stepIndex: 3,
    color: 'text-teal-800',
    bg: 'bg-teal-50 border-teal-200/80',
    dot: 'bg-teal-500',
    desc: 'Pemeriksaan akhir bagi memastikan tiada kecacatan pada benang, cetakan, dan saiz.',
  },
  ready_to_ship: {
    label: 'Sedia Dipos',
    stepIndex: 4,
    color: 'text-emerald-800',
    bg: 'bg-emerald-50 border-emerald-200/80',
    dot: 'bg-emerald-500',
    desc: 'Jersi telah siap dibungkus dan menunggu pelepasan pelunasan baki untuk diambil oleh kurier.',
  },
  delivered: {
    label: 'Selesai & Dihantar',
    stepIndex: 4,
    color: 'text-slate-700',
    bg: 'bg-slate-100 border-slate-200',
    dot: 'bg-slate-500',
    desc: 'Bungkusan telah berjaya diserahkan kepada kurier atau diambil sendiri.',
  },
  cancelled: {
    label: 'Dibatalkan',
    stepIndex: 0,
    color: 'text-rose-800',
    bg: 'bg-rose-50 border-rose-200/80',
    dot: 'bg-rose-500',
    desc: 'Pesanan ini telah dibatalkan.',
  },
};

const TIMELINE_STEPS = [
  { step: 1, title: 'Reka Bentuk & Mockup', desc: 'Pengesahan artwork & susun atur' },
  { step: 2, title: 'Cetakan & Pemindahan Haba', desc: 'Proses sublimasi / cetakan DTF' },
  { step: 3, title: 'Jahitan & Pemeriksaan QC', desc: 'Jahitan kemas dan kawalan kualiti' },
  { step: 4, title: 'Penghantaran Kurier', desc: 'Bungkusan sedia dihantar kepada anda' },
];

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const rawId = Array.isArray(params?.id) ? params.id[0] : (params?.id as string) || '';
  const orderIdentifier = decodeURIComponent(rawId);

  const { orders, companySettings, refreshAllDb } = useAppStore();
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCopied, setIsCopied] = useState(false);
  const [isPayingBalance, setIsPayingBalance] = useState(false);
  const [balanceError, setBalanceError] = useState<string | null>(null);
  const [isApprovingProof, setIsApprovingProof] = useState(false);
  const [proofSuccessMsg, setProofSuccessMsg] = useState<string | null>(null);

  // Load Order Authoritatively from Database
  const fetchOrder = async () => {
    if (!orderIdentifier) return;
    setIsLoading(true);
    try {
      const res = await getOrderByNumberOrIdDb(orderIdentifier);
      if (res.success && res.order) {
        setOrder(res.order);
      } else {
        // Fallback search in store
        const baseQuery = orderIdentifier.replace(/-(DP|BAL)$/i, '');
        const matched = orders.find((o) => o.order_number === baseQuery || o.id === baseQuery);
        if (matched) setOrder(matched);
      }
    } catch (e) {
      console.error('Error fetching order detail:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();
  }, [orderIdentifier]);

  const handleCopyOrderNumber = () => {
    if (!order) return;
    navigator.clipboard.writeText(order.order_number);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleApproveProof = async () => {
    if (!order) return;
    setIsApprovingProof(true);
    setProofSuccessMsg(null);
    try {
      const res = await clientApproveProofAction(order.order_number);
      if (res.success) {
        setProofSuccessMsg(res.message || 'Mockup berjaya diluluskan!');
        setOrder((prev) => (prev ? { ...prev, status: 'proof_approved' } : prev));
        refreshAllDb?.();
      }
    } catch (e) {
      console.error('Error approving proof:', e);
    } finally {
      setIsApprovingProof(false);
    }
  };

  const handlePayBalance = async () => {
    if (!order) return;
    setIsPayingBalance(true);
    setBalanceError(null);
    try {
      const total = Number(order.total_amount) || 0;
      const depositAmt = Number(order.deposit_amount) || Math.round(total * 0.5 * 100) / 100;
      const balanceAmt =
        order.balance_amount !== undefined && order.balance_amount !== null && order.balance_amount > 0
          ? Number(order.balance_amount)
          : Math.max(0, Math.round((total - depositAmt) * 100) / 100);

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
      setBalanceError('Ralat sambungan gerbang pembayaran.');
      setIsPayingBalance(false);
    }
  };

  // Financial calculations
  const totalAmount = Number(order?.total_amount) || 0;
  const depositAmount = Number(order?.deposit_amount) || Math.round(totalAmount * 0.5 * 100) / 100;
  const balanceAmount =
    order?.balance_amount !== undefined && order.balance_amount !== null && order.balance_amount > 0
      ? Number(order.balance_amount)
      : Math.max(0, Math.round((totalAmount - depositAmount) * 100) / 100);

  const isDepositPaid =
    order?.payment_status === 'deposit_paid' ||
    order?.payment_status === 'paid' ||
    Boolean(order?.deposit_paid_at);

  const isBalancePaid =
    order?.payment_status === 'paid' || Boolean(order?.balance_paid_at);

  const statusConfig = order?.status ? STATUS_CONFIG[order.status] || STATUS_CONFIG.pending_proof : STATUS_CONFIG.pending_proof;

  if (isLoading) {
    return (
      <div className="w-full min-h-screen bg-[#F2F2F7] flex flex-col items-center justify-center p-6 space-y-3 font-ios">
        <div className="w-9 h-9 rounded-full border-2 border-sky-500 border-t-transparent animate-spin" />
        <p className="text-xs font-medium text-slate-500">Memuatkan perincian pesanan dari pangkalan data...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="w-full min-h-screen bg-[#F2F2F7] p-5 space-y-4 font-ios max-w-md mx-auto">
        <div className="pt-2">
          <Link
            href="/history"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-sky-600 hover:text-sky-700 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Kembali ke Senarai Pesanan</span>
          </Link>
        </div>

        <div className="bg-white rounded-3xl p-8 text-center shadow-xs space-y-3 border border-slate-200/70 mt-6">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <Package className="w-6 h-6 stroke-[1.5]" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-slate-900">Pesanan Tidak Ditemui</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Nombor pesanan <span className="font-mono font-semibold">{orderIdentifier}</span> tidak dijumpai dalam pangkalan data.
            </p>
          </div>
          <div className="pt-2">
            <Link
              href="/history"
              className="inline-flex items-center px-6 py-2.5 rounded-full bg-[#007AFF] text-white text-xs font-bold shadow-md shadow-blue-500/20 active:scale-95 transition-all"
            >
              <span>Lihat Semua Pesanan</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const mockupImg = order.mockup_url || '/placeholder-jersey.png';

  return (
    <div className="w-full min-h-screen bg-[#F2F2F7] pb-24 font-ios select-none">
      {/* 1. TOP STICKY NAVIGATION BAR */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-4 py-3 flex items-center justify-between">
        <button
          type="button"
          onClick={() => router.push('/history')}
          className="flex items-center gap-1 text-xs font-semibold text-sky-600 hover:text-sky-700 active:scale-95 transition-transform"
        >
          <ChevronLeft className="w-4 h-4 stroke-[2.5]" />
          <span>Pesanan</span>
        </button>

        <div className="flex items-center gap-2">
          <span className="font-mono text-xs font-bold text-slate-900">{order.order_number}</span>
          <button
            type="button"
            onClick={handleCopyOrderNumber}
            className="p-1 rounded-md text-slate-400 hover:text-slate-700 active:scale-90 transition-transform"
            title="Salin No. Pesanan"
          >
            {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>

        <button
          type="button"
          onClick={fetchOrder}
          className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 active:rotate-180 transition-all duration-300"
          title="Segar Semula Data"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </header>

      <main className="max-w-md mx-auto px-4 py-4 space-y-4">
        {/* 2. MAIN STATUS HEADER CARD */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-2xs space-y-3.5">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                Status Pesanan
              </span>
              <div className="flex items-center gap-2 mt-0.5">
                <span className={`w-2.5 h-2.5 rounded-full ${statusConfig.dot} animate-pulse`} />
                <h1 className="text-base font-bold text-slate-900">{statusConfig.label}</h1>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[10px] text-slate-400 block font-mono">Tarikh Tempahan</span>
              <span className="text-xs font-semibold text-slate-700 font-mono">
                {new Date(order.created_at).toLocaleDateString('ms-MY', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              </span>
            </div>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed bg-slate-50/80 p-3 rounded-2xl border border-slate-200/60">
            {statusConfig.desc}
          </p>

          {/* Client Proof Approval Callout if pending proof */}
          {order.status === 'pending_proof' && (
            <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 space-y-2.5">
              <div className="flex items-start gap-2.5 text-amber-900">
                <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-xs leading-relaxed">
                  <p className="font-bold">Pengesahan Mockup Diperlukan</p>
                  <p className="text-[11px] text-amber-800">
                    Sila semak visual mockup di bawah. Jika susun atur logo dan ejaan nama telah tepat, tekan butang di bawah untuk meluluskan.
                  </p>
                </div>
              </div>

              {proofSuccessMsg ? (
                <div className="p-2 rounded-xl bg-emerald-100 text-emerald-900 text-xs font-bold text-center">
                  {proofSuccessMsg}
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleApproveProof}
                  disabled={isApprovingProof}
                  className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:opacity-95 active:scale-[0.98] text-white font-bold text-xs shadow-sm transition-all flex items-center justify-center gap-1.5"
                >
                  {isApprovingProof ? (
                    <span>Mengesahkan Mockup...</span>
                  ) : (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Luluskan Mockup Reka Bentuk Ini</span>
                    </>
                  )}
                </button>
              )}
            </div>
          )}
        </div>

        {/* 3. PRODUCTION TIMELINE (4 STAGES) */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-2xs space-y-3.5">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Aliran Pengeluaran Kilang
            </h2>
            <span className="text-[10px] font-bold text-sky-600 bg-sky-50 px-2 py-0.5 rounded-md">
              Tahap {statusConfig.stepIndex} dari 4
            </span>
          </div>

          <div className="space-y-4 relative pl-5 border-l-2 border-slate-200 ml-2 pt-1">
            {TIMELINE_STEPS.map((step) => {
              const currentStepIdx = statusConfig.stepIndex || 1;
              const isPassed = step.step < currentStepIdx;
              const isCurrent = step.step === currentStepIdx;

              return (
                <div key={step.step} className="relative">
                  <div
                    className={`absolute -left-[27px] top-0.5 w-3.5 h-3.5 rounded-full border-2 border-white shadow-xs transition-all ${
                      isCurrent
                        ? 'bg-blue-600 ring-4 ring-blue-100 scale-110'
                        : isPassed
                        ? 'bg-emerald-500'
                        : 'bg-slate-300'
                    }`}
                  />
                  <div>
                    <p
                      className={`text-xs ${
                        isCurrent
                          ? 'font-bold text-blue-900'
                          : isPassed
                          ? 'font-semibold text-slate-800'
                          : 'font-medium text-slate-400'
                      }`}
                    >
                      {step.title}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">{step.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 4. FINANCIAL & PAYMENT BREAKDOWN (DOWNPAYMENT 50% & BALANCE) */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Struktur & Perincian Bayaran
            </h2>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                isBalancePaid
                  ? 'bg-emerald-100 text-emerald-800'
                  : isDepositPaid
                  ? 'bg-sky-100 text-sky-800'
                  : 'bg-amber-100 text-amber-800'
              }`}
            >
              {isBalancePaid ? 'Lunas 100%' : isDepositPaid ? 'Deposit 50% Sah' : 'Menunggu Bayaran'}
            </span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between text-slate-500">
              <span>Harga Seunit Asal</span>
              <span className="font-mono">{formatCurrency(order.raw_unit_price)}</span>
            </div>

            {order.discount_percentage > 0 && (
              <div className="flex justify-between text-emerald-600">
                <span>Diskaun Kuantiti Pukal ({order.discount_percentage}%)</span>
                <span className="font-mono">
                  -{formatCurrency(order.raw_unit_price - order.final_unit_price)} / helai
                </span>
              </div>
            )}

            <div className="flex justify-between text-slate-500">
              <span>Harga Seunit Akhir</span>
              <span className="font-mono">{formatCurrency(order.final_unit_price)}</span>
            </div>

            <div className="flex justify-between font-bold text-slate-900 pt-2 border-t border-slate-100">
              <span>Jumlah Keseluruhan ({order.total_quantity} helai + Pos)</span>
              <span className="font-mono text-sm text-slate-950">{formatCurrency(totalAmount)}</span>
            </div>

            {/* Downpayment & Balance Visual Cards */}
            <div className="pt-2 space-y-2.5">
              {/* Card 1: Deposit 50% */}
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/60 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-slate-900">1. Deposit 50%</span>
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                        isDepositPaid ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {isDepositPaid ? 'Telah Diterima' : 'Menunggu'}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 block mt-0.5">
                    {isDepositPaid ? 'Pengesahan permulaan proses kilang' : 'Wajib dijelaskan untuk mula proses'}
                  </span>
                </div>

                <div className="text-right">
                  <span className="font-mono text-xs font-bold text-slate-900 block">
                    {formatCurrency(depositAmount)}
                  </span>
                  {isDepositPaid && (
                    <span className="text-[10px] text-emerald-600 font-medium inline-flex items-center gap-0.5">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Disahkan</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Card 2: Baki Pelunasan 50% */}
              <div
                className={`p-3.5 rounded-2xl border transition-colors ${
                  order.status === 'ready_to_ship' && !isBalancePaid
                    ? 'bg-amber-50/80 border-amber-300 ring-1 ring-amber-400/30'
                    : 'bg-slate-50 border-slate-200/60'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-slate-900">2. Baki Pelunasan 50%</span>
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                          isBalancePaid
                            ? 'bg-emerald-100 text-emerald-800'
                            : order.status === 'ready_to_ship'
                            ? 'bg-amber-200 text-amber-900 font-extrabold'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {isBalancePaid
                          ? 'Selesai Lunas'
                          : order.status === 'ready_to_ship'
                          ? 'Sedia Dibayar Sekarang'
                          : 'Bayar Semasa Sedia Pos'}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400 block mt-0.5">
                      {isBalancePaid
                        ? 'Semua bayaran telah diselesaikan'
                        : order.status === 'ready_to_ship'
                        ? 'Jersi telah siap diproses dan sedia dipos'
                        : 'Dibayar apabila status kilang bertukar ke Sedia Dipos'}
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="font-mono text-xs font-bold text-slate-900 block">
                      {formatCurrency(balanceAmount)}
                    </span>
                    {isBalancePaid && (
                      <span className="text-[10px] text-emerald-600 font-medium inline-flex items-center gap-0.5">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Lunas Penuh</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Settlement Button if Ready to Ship & Unpaid */}
                {order.status === 'ready_to_ship' && !isBalancePaid && (
                  <div className="pt-3 mt-3 border-t border-amber-200/80 space-y-2">
                    {balanceError && (
                      <div className="p-2 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
                        {balanceError}
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={handlePayBalance}
                      disabled={isPayingBalance}
                      className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#0052FF] to-[#00BDFF] hover:opacity-95 active:scale-[0.98] text-white font-bold text-xs shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-2"
                    >
                      <CreditCard className="w-4 h-4" />
                      <span>
                        {isPayingBalance
                          ? 'Memproses Sesi CHIP...'
                          : `Bayar Pelunasan Baki ${formatCurrency(balanceAmount)} (CHIP Online)`}
                      </span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 5. JERSEY SPECIFICATIONS & MOCKUP PREVIEW */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-2xs space-y-4">
          <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider pb-2 border-b border-slate-100">
            Spesifikasi Jersi & Roster
          </h2>

          <div className="flex gap-4 items-start">
            <div className="w-20 h-20 rounded-2xl overflow-hidden bg-slate-100 shrink-0 border border-slate-200/80 relative">
              <Image src={mockupImg} alt={order.design_title} fill className="object-cover" />
            </div>

            <div className="flex-1 min-w-0 space-y-1">
              <h3 className="text-xs font-bold text-slate-900 leading-snug">{order.design_title}</h3>
              <p className="text-[11px] text-slate-600">
                {order.print_type === 'sublimation'
                  ? `Fabrik: ${order.fabric_name || 'Sublimasi'} • Potongan: ${order.cut_name || 'Standard'}`
                  : `DTF: ${order.dtf_dimension_name || 'Dimensi Standard'} • ${
                      order.dtf_option_type === 'with_garment' ? 'Bersama Baju' : 'Filem Sahaja'
                    }`}
              </p>
              <p className="text-[11px] font-semibold text-sky-600">Jumlah: {order.total_quantity} helai</p>
            </div>
          </div>

          {/* Sizing Breakdown Matrix */}
          {order.sizing_breakdown && Object.keys(order.sizing_breakdown).length > 0 && (
            <div className="space-y-1.5 pt-1">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                Pecahan Saiz
              </span>
              <div className="flex flex-wrap gap-2">
                {Object.entries(order.sizing_breakdown).map(([size, qty]) => (
                  <div
                    key={size}
                    className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200/80 font-mono text-xs flex items-center gap-2"
                  >
                    <span className="font-bold text-slate-800">{size}</span>
                    <span className="text-slate-500 font-medium">{qty} helai</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Production Notes / Custom Roster / Logo Info */}
          {order.production_notes && (
            <div className="space-y-1.5 pt-1">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                Nota & Maklumat Roster
              </span>
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/60 text-xs text-slate-700 whitespace-pre-line leading-relaxed font-mono">
                {order.production_notes}
              </div>
            </div>
          )}
        </div>

        {/* 6. SHIPPING & COURIER DETAILS */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-2xs space-y-3">
          <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider pb-2 border-b border-slate-100">
            Maklumat Penghantaran
          </h2>

          <div className="space-y-2 text-xs">
            <div className="flex items-start gap-2.5">
              <Truck className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
              <div>
                <span className="text-slate-400 block text-[10px]">Kurier Pilihan</span>
                <span className="font-semibold text-slate-800">{order.shipping_courier || 'Kurier Standard'}</span>
              </div>
            </div>

            <div className="flex items-start gap-2.5 pt-1">
              <Package className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
              <div>
                <span className="text-slate-400 block text-[10px]">Alamat Penerima</span>
                <span className="font-medium text-slate-800 leading-relaxed block">
                  {order.shipping_address || 'Ambil sendiri di kilang'}
                </span>
                <span className="text-slate-500 block mt-0.5">
                  {order.customer_name} • {order.customer_phone}
                </span>
              </div>
            </div>

            {order.tracking_number && (
              <div className="p-3 bg-sky-50 rounded-2xl border border-sky-200 flex items-center justify-between mt-2">
                <div>
                  <span className="text-[10px] text-sky-700 block font-medium">Nombor Penjejakan Pos</span>
                  <span className="font-mono text-xs font-bold text-sky-950">{order.tracking_number}</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(order.tracking_number || '');
                    alert('Nombor penjejakan disalin!');
                  }}
                  className="p-1.5 rounded-lg bg-sky-100 text-sky-700 hover:bg-sky-200 active:scale-90 transition-transform"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* 7. CUSTOMER ACTIONS FOOTER */}
        <div className="space-y-2 pt-2">
          <a
            href={buildWhatsAppInquiryUrl({
              phone: companySettings?.whatsapp_number,
              type: 'order',
              orderNumber: order.order_number,
            })}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full bg-[#25D366] hover:bg-emerald-600 text-white font-bold py-3.5 px-6 rounded-2xl text-center active:scale-[0.98] transition-all flex items-center justify-center space-x-2 shadow-md shadow-emerald-500/20 text-xs"
          >
            <FaWhatsapp className="w-4 h-4" />
            <span>Hubungi Pengurus Kilang (WhatsApp)</span>
          </a>

          <Link
            href="/history"
            className="w-full py-3 text-center text-xs font-semibold text-slate-500 hover:text-slate-800 block transition-colors"
          >
            Kembali ke Senarai Pesanan
          </Link>
        </div>
      </main>
    </div>
  );
}

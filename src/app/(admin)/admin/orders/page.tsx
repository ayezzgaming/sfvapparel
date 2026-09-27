'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useAppStore } from '@/lib/store/app-store';
import { formatCurrency } from '@/lib/pricing-calculator';
import { Order, OrderStatus, ProofRevision } from '@/types/database';
import {
  Search,
  Check,
  LayoutGrid,
  List,
  X,
  ChevronRight,
  ChevronLeft,
  Eye,
  Phone,
  MapPin,
  Package,
  Clock,
  Truck,
  Send,
  CreditCard,
  AlertCircle,
  FileText,
  Printer,
  Trash2,
  RefreshCw,
  CheckCircle2,
  SlidersHorizontal,
  Sparkles,
  ArrowRight,
  Layers,
  Download,
  ExternalLink,
  RotateCcw,
  UploadCloud,
  Loader2,
  Image as ImageIcon,
  ArrowLeft
} from 'lucide-react';
import { FaWhatsapp } from 'react-icons/fa6';
import {
  getOrdersDb,
  deleteOrderDb,
  markOrderBalancePaidAction,
  updateOrderStatusDb,
  uploadProofArtworkAction
} from '@/app/actions/orderActions';
import OrderInvoiceModal from '@/components/invoice/OrderInvoiceModal';
import ArtworkRevisionModal from '@/components/ui/ArtworkRevisionModal';

const STATUS_LIST: { status: OrderStatus; label: string; color: string; badgeBg: string }[] = [
  { status: 'pending_proof', label: 'Menunggu Proof', color: 'bg-amber-50 text-amber-800 border-amber-200', badgeBg: 'bg-amber-500' },
  { status: 'proof_approved', label: 'Proof Diluluskan', color: 'bg-sky-50 text-sky-800 border-sky-200', badgeBg: 'bg-sky-500' },
  { status: 'in_printing', label: 'Sedang Dicetak', color: 'bg-blue-50 text-blue-800 border-blue-200', badgeBg: 'bg-blue-500' },
  { status: 'heat_press', label: 'Heat Press', color: 'bg-orange-50 text-orange-800 border-orange-200', badgeBg: 'bg-orange-500' },
  { status: 'sewing', label: 'Jahitan', color: 'bg-purple-50 text-purple-800 border-purple-200', badgeBg: 'bg-purple-500' },
  { status: 'qc_check', label: 'QC', color: 'bg-teal-50 text-teal-800 border-teal-200', badgeBg: 'bg-teal-500' },
  { status: 'ready_to_ship', label: 'Sedia Dihantar', color: 'bg-emerald-50 text-emerald-800 border-emerald-200', badgeBg: 'bg-emerald-500' },
  { status: 'delivered', label: 'Selesai', color: 'bg-slate-100 text-slate-700 border-slate-200', badgeBg: 'bg-slate-500' },
  { status: 'cancelled', label: 'Batal', color: 'bg-rose-50 text-rose-700 border-rose-200', badgeBg: 'bg-rose-500' },
];

export default function AdminOrdersPage() {
  const { orders, updateOrderStatus, deleteOrder } = useAppStore();

  const [liveOrders, setLiveOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [filterType, setFilterType] = useState<'all' | 'sublimation' | 'dtf'>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);

  // Status edit form state
  const [newStatus, setNewStatus] = useState<OrderStatus>('pending_proof');
  const [newTracking, setNewTracking] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [updateSaved, setUpdateSaved] = useState(false);
  const [isSendingWa, setIsSendingWa] = useState(false);
  const [isMarkingBalancePaid, setIsMarkingBalancePaid] = useState(false);
  const [waToast, setWaToast] = useState<{ success: boolean; message: string } | null>(null);
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);

  // Proofing & Revision Upload State (VPS Storage & Sharp HD Compression)
  const [proofFrontUrl, setProofFrontUrl] = useState('');
  const [proofBackUrl, setProofBackUrl] = useState('');
  const [proofDesignerNotes, setProofDesignerNotes] = useState('');
  const [isUploadingProof, setIsUploadingProof] = useState(false);
  const [isUploadingFront, setIsUploadingFront] = useState(false);
  const [isUploadingBack, setIsUploadingBack] = useState(false);
  const [frontUploadMeta, setFrontUploadMeta] = useState<{ sizeBefore?: number; sizeAfter?: number; savedPercent?: number; name?: string } | null>(null);
  const [backUploadMeta, setBackUploadMeta] = useState<{ sizeBefore?: number; sizeAfter?: number; savedPercent?: number; name?: string } | null>(null);
  const [selectedRevisionForModal, setSelectedRevisionForModal] = useState<ProofRevision | null>(null);

  // Authoritative Database Fetch directly from Supabase
  const fetchLiveOrders = async () => {
    setIsLoading(true);
    try {
      const res = await getOrdersDb();
      if (res.success && Array.isArray(res.orders)) {
        setLiveOrders(res.orders);
        if (activeOrder) {
          const refreshedActive = res.orders.find((o) => o.id === activeOrder.id);
          if (refreshedActive) setActiveOrder(refreshedActive);
        }
      } else if (orders.length > 0) {
        setLiveOrders(orders);
      }
    } catch (e) {
      console.error('[AdminOrdersPage] Fetch error:', e);
      if (orders.length > 0) setLiveOrders(orders);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLiveOrders();
  }, []);

  useEffect(() => {
    if (orders.length > 0 && liveOrders.length === 0) {
      setLiveOrders(orders);
    }
  }, [orders]);

  const handleDeleteOrder = async (orderId: string, orderNumber: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();

    const isConfirmed = window.confirm(
      `ADAKAH ANDA PASTI mahu memadam pesanan "${orderNumber}" secara KEKAL dari pangkalan data Supabase?\n\nTindakan ini akan memadam rekod transaksi secara mutlak dan tidak boleh diundur.`
    );
    if (!isConfirmed) return;

    setIsDeletingId(orderId);
    try {
      const res = await deleteOrderDb(orderId);
      if (res.success) {
        deleteOrder(orderId);
        setLiveOrders((prev) => prev.filter((o) => o.id !== orderId));
        if (activeOrder?.id === orderId) {
          setActiveOrder(null);
        }
        setWaToast({ success: true, message: 'Pesanan berjaya dipadam secara kekal.' });
      } else {
        alert(res.message || 'Gagal memadam pesanan.');
      }
    } catch (err) {
      console.error('[AdminOrdersPage] Delete order error:', err);
      alert('Ralat semasa memadam pesanan.');
    } finally {
      setIsDeletingId(null);
      setTimeout(() => setWaToast(null), 3000);
    }
  };

  const handleSendWhatsAppNotification = async () => {
    if (!activeOrder) return;
    if (!activeOrder.customer_phone) {
      setWaToast({ success: false, message: 'Nombor telefon pelanggan tidak sah.' });
      setTimeout(() => setWaToast(null), 3000);
      return;
    }

    setIsSendingWa(true);
    try {
      const response = await fetch('/api/whatsapp/send-status-update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: activeOrder.id,
          orderNumber: activeOrder.order_number,
          customerName: activeOrder.customer_name,
          customerPhone: activeOrder.customer_phone,
          status: newStatus,
          trackingNumber: newTracking,
          productionNotes: newNotes,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setWaToast({ success: true, message: 'Notifikasi status berjaya dihantar ke WhatsApp!' });
      } else {
        setWaToast({ success: false, message: data.message || 'Gagal menghantar WhatsApp.' });
      }
    } catch (e: any) {
      setWaToast({ success: false, message: e.message || 'Ralat sambungan API WhatsApp.' });
    } finally {
      setIsSendingWa(false);
      setTimeout(() => setWaToast(null), 4000);
    }
  };

  const handleMarkBalancePaid = async () => {
    if (!activeOrder) return;
    setIsMarkingBalancePaid(true);
    try {
      const res = await markOrderBalancePaidAction(activeOrder.id);
      if (res.success) {
        const nowStr = new Date().toISOString();
        setActiveOrder((prev) =>
          prev
            ? {
                ...prev,
                payment_status: 'paid',
                balance_paid_at: nowStr,
              }
            : null
        );
        setLiveOrders((prev) =>
          prev.map((o) =>
            o.id === activeOrder.id
              ? {
                  ...o,
                  payment_status: 'paid',
                  balance_paid_at: nowStr,
                }
              : o
          )
        );
        setWaToast({ success: true, message: 'Baki 50% berjaya ditanda LUNAS (Manual/Cash)!' });
      } else {
        setWaToast({ success: false, message: res.message || 'Gagal mengemaskini status bayaran.' });
      }
    } catch (err: any) {
      setWaToast({ success: false, message: err.message || 'Ralat mengemaskini baki bayaran.' });
    } finally {
      setIsMarkingBalancePaid(false);
      setTimeout(() => setWaToast(null), 4000);
    }
  };

  const allOrders = useMemo(() => {
    return liveOrders.length > 0 ? liveOrders : orders;
  }, [liveOrders, orders]);

  const filteredOrders = useMemo(() => {
    return allOrders.filter((ord) => {
      if (filterType !== 'all' && ord.print_type !== filterType) return false;
      if (filterStatus !== 'all' && ord.status !== filterStatus) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchNum = ord.order_number.toLowerCase().includes(q);
        const matchName = ord.customer_name.toLowerCase().includes(q);
        const matchTitle = ord.design_title.toLowerCase().includes(q);
        if (!matchNum && !matchName && !matchTitle) return false;
      }
      return true;
    });
  }, [allOrders, filterType, filterStatus, searchQuery]);

  const handleOpenDetail = (ord: Order) => {
    setActiveOrder(ord);
    setNewStatus(ord.status);
    setNewTracking(ord.tracking_number || '');
    setNewNotes(ord.production_notes || '');
    setProofFrontUrl('');
    setProofBackUrl('');
    setProofDesignerNotes('');
    setFrontUploadMeta(null);
    setBackUploadMeta(null);
    setUpdateSaved(false);
  };

  const handleFileChangeFront = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeOrder) return;

    setIsUploadingFront(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', `order-proofs/${activeOrder.order_number}`);

      const res = await fetch('/api/media/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (data.success && data.url) {
        setProofFrontUrl(data.url);
        setFrontUploadMeta({
          sizeBefore: data.originalSizeBytes || file.size,
          sizeAfter: data.sizeBytes,
          savedPercent: data.savedPercentage,
          name: file.name,
        });
        setWaToast({
          success: true,
          message: `Artwork Hadapan berjaya dimuat naik ke VPS & dioptimum (${data.savedPercentage || 0}% lebih padat)!`,
        });
      } else {
        setWaToast({ success: false, message: data.message || 'Gagal memuat naik imej ke VPS.' });
      }
    } catch (err) {
      setWaToast({ success: false, message: 'Ralat sambungan muat naik fail ke VPS.' });
    } finally {
      setIsUploadingFront(false);
      setTimeout(() => setWaToast(null), 4000);
    }
  };

  const handleFileChangeBack = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeOrder) return;

    setIsUploadingBack(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', `order-proofs/${activeOrder.order_number}`);

      const res = await fetch('/api/media/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (data.success && data.url) {
        setProofBackUrl(data.url);
        setBackUploadMeta({
          sizeBefore: data.originalSizeBytes || file.size,
          sizeAfter: data.sizeBytes,
          savedPercent: data.savedPercentage,
          name: file.name,
        });
        setWaToast({
          success: true,
          message: `Artwork Belakang berjaya dimuat naik ke VPS & dioptimum (${data.savedPercentage || 0}% lebih padat)!`,
        });
      } else {
        setWaToast({ success: false, message: data.message || 'Gagal memuat naik imej ke VPS.' });
      }
    } catch (err) {
      setWaToast({ success: false, message: 'Ralat sambungan muat naik fail ke VPS.' });
    } finally {
      setIsUploadingBack(false);
      setTimeout(() => setWaToast(null), 4000);
    }
  };

  const handleUploadProof = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeOrder) return;
    if (!proofFrontUrl.trim()) {
      setWaToast({ success: false, message: 'Sila muat naik fail Artwork Hadapan terlebih dahulu.' });
      setTimeout(() => setWaToast(null), 3000);
      return;
    }

    setIsUploadingProof(true);
    try {
      const res = await uploadProofArtworkAction({
        orderIdOrNumber: activeOrder.id,
        artworkFrontUrl: proofFrontUrl.trim(),
        artworkBackUrl: proofBackUrl.trim() || undefined,
        designerNotes: proofDesignerNotes.trim() || undefined,
        adminName: 'Admin SFV Studio',
      });

      if (res.success) {
        setWaToast({ success: true, message: res.message || 'Visual Proof berjaya dihantar ke pelanggan!' });
        setProofFrontUrl('');
        setProofBackUrl('');
        setProofDesignerNotes('');
        setFrontUploadMeta(null);
        setBackUploadMeta(null);
        fetchLiveOrders();
      } else {
        setWaToast({ success: false, message: res.message || 'Gagal menghantar visual proof.' });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Ralat menghantar visual proof';
      setWaToast({ success: false, message: msg });
    } finally {
      setIsUploadingProof(false);
      setTimeout(() => setWaToast(null), 4000);
    }
  };

  const handleSaveStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeOrder) return;

    try {
      // 1. Update in Supabase Database & trigger background WhatsApp + N8N alerts
      const res = await updateOrderStatusDb(activeOrder.id, newStatus, newTracking, newNotes);
      if (res.success) {
        // 2. Update local state & Zustand store
        updateOrderStatus(activeOrder.id, newStatus, newTracking, newNotes);
        const updated = {
          ...activeOrder,
          status: newStatus,
          tracking_number: newTracking || activeOrder.tracking_number,
          production_notes: newNotes || activeOrder.production_notes,
        };
        setActiveOrder(updated);
        setLiveOrders((prev) =>
          prev.map((o) => (o.id === activeOrder.id ? updated : o))
        );
        setUpdateSaved(true);
        setWaToast({ success: true, message: `Status pesanan #${activeOrder.order_number} berjaya disimpan & diselaraskan!` });
      } else {
        setWaToast({ success: false, message: res.message || 'Gagal menyimpan status ke pangkalan data.' });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Ralat semasa menyimpan status.';
      setWaToast({ success: false, message: msg });
    } finally {
      setTimeout(() => {
        setUpdateSaved(false);
        setWaToast(null);
      }, 3500);
    }
  };

  return (
    <div className="w-full h-full overflow-y-auto bg-[#f8fafc] dark:bg-zinc-950 flex flex-col p-4 sm:p-6 gap-4 text-slate-900 dark:text-zinc-100 font-sans select-none">
      
      {/* Toast Notification */}
      {waToast && (
        <div
          className={`fixed top-5 right-5 z-50 px-4 py-2.5 rounded-2xl shadow-xl border flex items-center space-x-2 text-xs animate-in fade-in slide-in-from-top-2 ${
            waToast.success
              ? 'bg-emerald-900 text-white border-emerald-700'
              : 'bg-rose-900 text-white border-rose-700'
          }`}
        >
          {waToast.success ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          )}
          <span>{waToast.message}</span>
        </div>
      )}

      {/* =========================================================================
          VIEW MODE 1: DEDICATED ORDER DETAIL MANAGEMENT (WHEN ORDER IS SELECTED)
         ========================================================================= */}
      {activeOrder ? (
        <div className="space-y-5 animate-in fade-in duration-200">
          {/* Top Sticky Breadcrumb / Action Bar */}
          <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 border border-slate-200/80 dark:border-zinc-800 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setActiveOrder(null)}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 text-xs font-bold transition-all active:scale-95 cursor-pointer shadow-2xs"
              >
                <ArrowLeft className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Kembali ke Senarai Semua Pesanan</span>
              </button>
              <div className="h-4 w-px bg-slate-200 dark:bg-zinc-700 hidden sm:block" />
              <div>
                <h1 className="text-sm font-extrabold text-slate-900 dark:text-zinc-100">
                  Pesanan #{activeOrder.order_number}
                </h1>
                <p className="text-[11px] text-slate-500">{activeOrder.customer_name} • {new Date(activeOrder.created_at).toLocaleDateString('ms-MY', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsInvoiceOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 hover:border-slate-300 text-slate-700 dark:text-zinc-200 text-xs font-semibold transition-all shadow-2xs active:scale-95 cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5 text-[#00BDFF]" />
                <span>Invois Rasmi PDF</span>
              </button>

              <button
                type="button"
                onClick={fetchLiveOrders}
                disabled={isLoading}
                className="p-2 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 active:rotate-180 transition-all cursor-pointer"
                title="Segar Semula Data Pesanan Ini"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* 1. Header Spec & Customer Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-slate-200/80 dark:border-zinc-800 shadow-xs">
            <div className="flex items-start gap-4">
              {activeOrder.mockup_url && (
                <div className="w-24 h-24 rounded-2xl overflow-hidden bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 shrink-0 shadow-2xs">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={activeOrder.mockup_url}
                    alt={activeOrder.design_title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div className="space-y-1 min-w-0">
                <span className="text-[10px] font-extrabold text-[#00BDFF] uppercase tracking-wider block">
                  {activeOrder.print_type.toUpperCase()} · {activeOrder.fabric_name || activeOrder.dtf_dimension_name || 'Standard'}
                </span>
                <h2 className="text-sm font-bold text-slate-900 dark:text-zinc-100 leading-snug">
                  {activeOrder.design_title}
                </h2>
                {activeOrder.cut_name && (
                  <p className="text-xs text-slate-500">Potongan: <span className="font-semibold text-slate-700 dark:text-zinc-300">{activeOrder.cut_name}</span></p>
                )}
                <p className="text-xs font-mono font-bold text-slate-900 dark:text-zinc-100 pt-0.5">
                  {formatCurrency(activeOrder.total_amount)} <span className="text-slate-400 font-normal">({activeOrder.total_quantity} helai)</span>
                </p>
              </div>
            </div>

            <div className="space-y-2 text-xs border-t md:border-t-0 md:border-l border-slate-100 dark:border-zinc-800 pt-3 md:pt-0 md:pl-5">
              <div>
                <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">Maklumat Pelanggan</span>
                <p className="font-bold text-slate-900 dark:text-zinc-100 text-sm mt-0.5">{activeOrder.customer_name}</p>
                <a
                  href={`https://wa.me/${activeOrder.customer_phone.replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-[#00BDFF] font-mono font-semibold hover:underline mt-1"
                >
                  <FaWhatsapp className="w-4 h-4 text-emerald-500" />
                  <span>{activeOrder.customer_phone}</span>
                </a>
              </div>

              {activeOrder.shipping_address && (
                <div className="pt-1">
                  <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">Alamat Penghantaran</span>
                  <p className="text-slate-600 dark:text-zinc-300 text-xs leading-relaxed mt-0.5">{activeOrder.shipping_address}</p>
                </div>
              )}

              {activeOrder.custom_artwork_url && (
                <div className="pt-2 border-t border-slate-100 dark:border-zinc-800">
                  <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">Fail Logo / Artwork Kustom Pelanggan</span>
                  <a
                    href={activeOrder.custom_artwork_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-sky-50 dark:bg-zinc-800 text-sky-700 dark:text-sky-300 font-bold text-xs hover:bg-sky-100 transition-colors mt-1"
                  >
                    <Download className="w-3.5 h-3.5 text-[#00BDFF]" />
                    <span>Muat Turun Fail HD Asal Pelanggan</span>
                    <ExternalLink className="w-3 h-3 opacity-60 ml-0.5" />
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* 2. Payment & Settlement Breakdown */}
          <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 dark:text-zinc-100 uppercase tracking-wider">
                Status Bayaran & Pelunasan Baki 50%
              </span>
              <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                activeOrder.payment_status === 'paid'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : activeOrder.payment_status === 'deposit_paid'
                  ? 'bg-sky-50 text-sky-700 border-sky-200'
                  : 'bg-amber-50 text-amber-700 border-amber-200'
              }`}>
                {activeOrder.payment_status === 'paid'
                  ? 'Lunas 100%'
                  : activeOrder.payment_status === 'deposit_paid'
                  ? 'Deposit 50% Diterima'
                  : 'Menunggu Bayaran'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-1">
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200/80 dark:border-zinc-700/80">
                <span className="text-[10px] text-slate-400 uppercase block font-semibold">Jumlah Keseluruhan</span>
                <span className="font-mono font-bold text-slate-900 dark:text-zinc-100 text-base">{formatCurrency(activeOrder.total_amount)}</span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200/80 dark:border-zinc-700/80">
                <span className="text-[10px] text-slate-400 uppercase block font-semibold">Deposit 50%</span>
                <span className="font-mono font-bold text-slate-900 dark:text-zinc-100 text-base">
                  {formatCurrency(activeOrder.deposit_amount || (activeOrder.total_amount * 0.5))}
                </span>
                <span className={`text-[9.5px] font-bold block mt-0.5 ${activeOrder.deposit_paid_at || activeOrder.payment_status === 'deposit_paid' || activeOrder.payment_status === 'paid' ? 'text-emerald-600' : 'text-amber-600'}`}>
                  {activeOrder.deposit_paid_at || activeOrder.payment_status === 'deposit_paid' || activeOrder.payment_status === 'paid' ? '✓ Telah Dibayar' : 'Menunggu Bayaran'}
                </span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200/80 dark:border-zinc-700/80">
                <span className="text-[10px] text-slate-400 uppercase block font-semibold">Baki Pelunasan 50%</span>
                <span className="font-mono font-bold text-slate-900 dark:text-zinc-100 text-base">
                  {formatCurrency(activeOrder.balance_amount || (activeOrder.total_amount * 0.5))}
                </span>
                <span className={`text-[9.5px] font-bold block mt-0.5 ${activeOrder.balance_paid_at || activeOrder.payment_status === 'paid' ? 'text-emerald-600' : 'text-amber-600'}`}>
                  {activeOrder.balance_paid_at || activeOrder.payment_status === 'paid' ? '✓ Lunas Sepenuhnya' : 'Belum Selesai'}
                </span>
              </div>
            </div>

            {/* Action button if deposit is paid but balance is not yet cleared */}
            {activeOrder.payment_status === 'deposit_paid' && (activeOrder.balance_amount || 0) > 0 && (
              <div className="pt-3 border-t border-slate-100 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs text-slate-500">
                  Pelanggan telah melunaskan baki 50% melalui pemindahan bank manual / tunai luar talian?
                </p>
                <button
                  type="button"
                  onClick={handleMarkBalancePaid}
                  disabled={isMarkingBalancePaid}
                  className="px-4 py-2 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shrink-0 shadow-xs active:scale-95 transition-all flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>{isMarkingBalancePaid ? 'Mengemaskini...' : 'Tanda Baki Lunas (Manual/Cash)'}</span>
                </button>
              </div>
            )}
          </div>

          {/* 3. VISUAL PROOF & REVISION MANAGEMENT (VPS STORAGE + SHARP COMPRESSION) */}
          <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 shadow-xs space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 dark:border-zinc-800 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse" />
                  <h3 className="text-xs font-bold text-slate-900 dark:text-zinc-100 uppercase tracking-wider">
                    Pengurusan Visual Mockup & Histori Semakan (Proofing)
                  </h3>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Muat naik draf artwork terus ke storan VPS dengan mampatan HD tanpa menurunkan kualiti visual
                </p>
              </div>

              <span
                className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                  activeOrder.status === 'proof_approved' || activeOrder.proof_status === 'approved'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : activeOrder.proof_status === 'revision_requested'
                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                    : activeOrder.proof_artwork_url
                    ? 'bg-blue-50 text-blue-700 border-blue-200'
                    : 'bg-slate-100 text-slate-600 border-slate-200'
                }`}
              >
                {activeOrder.status === 'proof_approved' || activeOrder.proof_status === 'approved'
                  ? 'Mockup Telah Diluluskan'
                  : activeOrder.proof_status === 'revision_requested'
                  ? 'Pelanggan Minta Revisi'
                  : activeOrder.proof_artwork_url
                  ? 'Menunggu Pengesahan Pelanggan'
                  : 'Belum Ada Mockup Dihantar'}
              </span>
            </div>

            {/* Customer Revision Request Banner Alert */}
            {activeOrder.proof_status === 'revision_requested' && (
              <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 space-y-1.5 text-xs text-amber-900 dark:text-amber-200">
                <div className="flex items-center gap-2 font-bold">
                  <RotateCcw className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>PERMINTAAN PEMBETULAN DARIPADA PELANGGAN:</span>
                </div>
                <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed bg-white/80 dark:bg-zinc-900/80 p-2.5 rounded-lg border border-amber-200/80 font-medium">
                  &quot;{activeOrder.customer_feedback || 'Pelanggan meminta semakan susun atur rekaan.'}&quot;
                </p>
                <p className="text-[10.5px] text-amber-700 italic">
                  * Sila muat naik fail artwork yang telah dibetulkan di bawah untuk dihantar sebagai Revisi seterusnya.
                </p>
              </div>
            )}

            {/* Approved Banner */}
            {(activeOrder.status === 'proof_approved' || activeOrder.proof_status === 'approved') && (
              <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 text-emerald-900 dark:text-emerald-200 text-xs flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <div>
                  <span className="font-bold block">Mockup Reka Bentuk Telah Diluluskan Secara Rasmi</span>
                  <span className="text-[11px] text-emerald-700">
                    {activeOrder.proof_approved_at
                      ? `Disahkan pelanggan pada ${new Date(activeOrder.proof_approved_at).toLocaleDateString('ms-MY', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })} ${new Date(activeOrder.proof_approved_at).toLocaleTimeString('ms-MY', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}`
                      : 'Pesanan sedia memasuki giliran cetakan kilang.'}
                  </span>
                </div>
              </div>
            )}

            {/* Upload / Submit New Revision Form (VPS Storage + Sharp HD Compression) */}
            <form onSubmit={handleUploadProof} className="p-4 bg-slate-50 dark:bg-zinc-800/40 rounded-2xl border border-slate-200/80 dark:border-zinc-700/80 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 dark:text-zinc-100 block">
                  {activeOrder.proof_revisions && activeOrder.proof_revisions.length > 0
                    ? `Muat Naik Draf Baharu (REVISI ${(activeOrder.proof_revisions.length || 0) + 1})`
                    : 'Muat Naik Draf Mockup Pertama (REVISI 1)'}
                </span>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800">
                  ⚡ HD Compressed • Storan VPS
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* FRONT ARTWORK UPLOAD DROPZONE */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-800 dark:text-zinc-200 flex items-center justify-between">
                    <span>Artwork Hadapan (Front) <span className="text-rose-500">*</span></span>
                    {proofFrontUrl && (
                      <span className="text-[10px] text-emerald-600 font-semibold">Tersedia di VPS</span>
                    )}
                  </label>

                  {proofFrontUrl ? (
                    <div className="relative rounded-2xl overflow-hidden bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 p-2 group flex items-center gap-3">
                      <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-100 shrink-0 border border-slate-200 relative">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={proofFrontUrl} alt="Hadapan" className="w-full h-full object-cover" />
                      </div>
                      <div className="min-w-0 flex-1 text-xs space-y-0.5">
                        <p className="font-bold text-slate-800 dark:text-zinc-200 truncate">
                          {frontUploadMeta?.name || 'artwork-front.webp'}
                        </p>
                        {frontUploadMeta?.sizeAfter && (
                          <p className="text-[10.5px] text-slate-500">
                            Saiz: <span className="font-mono font-semibold">{(frontUploadMeta.sizeAfter / 1024).toFixed(0)} KB</span>
                            {frontUploadMeta.savedPercent ? ` • Jimat ${frontUploadMeta.savedPercent}%` : ''}
                          </p>
                        )}
                        <span className="text-[9.5px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
                          VPS Media Vault
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setProofFrontUrl('');
                          setFrontUploadMeta(null);
                        }}
                        className="p-1.5 rounded-full text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        title="Padam & Muat Naik Semula"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <label className="border-2 border-dashed border-slate-300 dark:border-zinc-700 hover:border-[#00BDFF] bg-white dark:bg-zinc-900 rounded-2xl p-4 flex flex-col items-center justify-center text-center cursor-pointer transition-colors group relative min-h-[110px]">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileChangeFront}
                        disabled={isUploadingFront}
                        className="sr-only"
                      />
                      {isUploadingFront ? (
                        <div className="flex flex-col items-center space-y-2 text-xs text-blue-600">
                          <Loader2 className="w-5 h-5 animate-spin" />
                          <span className="font-semibold">Mengoptimum & Memampatkan ke VPS...</span>
                        </div>
                      ) : (
                        <>
                          <UploadCloud className="w-6 h-6 text-slate-400 group-hover:text-[#00BDFF] transition-colors mb-1.5" />
                          <span className="text-xs font-bold text-slate-800 dark:text-zinc-200">
                            Pilih Fail Artwork Depan
                          </span>
                          <span className="text-[10px] text-slate-400 mt-0.5">
                            PNG, JPG, WebP (Auto-Compressed HD)
                          </span>
                        </>
                      )}
                    </label>
                  )}
                </div>

                {/* BACK ARTWORK UPLOAD DROPZONE */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-800 dark:text-zinc-200 flex items-center justify-between">
                    <span>Artwork Belakang (Back) <span className="text-slate-400 font-normal">(Pilihan)</span></span>
                    {proofBackUrl && (
                      <span className="text-[10px] text-emerald-600 font-semibold">Tersedia di VPS</span>
                    )}
                  </label>

                  {proofBackUrl ? (
                    <div className="relative rounded-2xl overflow-hidden bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 p-2 group flex items-center gap-3">
                      <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-100 shrink-0 border border-slate-200 relative">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={proofBackUrl} alt="Belakang" className="w-full h-full object-cover" />
                      </div>
                      <div className="min-w-0 flex-1 text-xs space-y-0.5">
                        <p className="font-bold text-slate-800 dark:text-zinc-200 truncate">
                          {backUploadMeta?.name || 'artwork-back.webp'}
                        </p>
                        {backUploadMeta?.sizeAfter && (
                          <p className="text-[10.5px] text-slate-500">
                            Saiz: <span className="font-mono font-semibold">{(backUploadMeta.sizeAfter / 1024).toFixed(0)} KB</span>
                            {backUploadMeta.savedPercent ? ` • Jimat ${backUploadMeta.savedPercent}%` : ''}
                          </p>
                        )}
                        <span className="text-[9.5px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
                          VPS Media Vault
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setProofBackUrl('');
                          setBackUploadMeta(null);
                        }}
                        className="p-1.5 rounded-full text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        title="Padam & Muat Naik Semula"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <label className="border-2 border-dashed border-slate-300 dark:border-zinc-700 hover:border-[#00BDFF] bg-white dark:bg-zinc-900 rounded-2xl p-4 flex flex-col items-center justify-center text-center cursor-pointer transition-colors group relative min-h-[110px]">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileChangeBack}
                        disabled={isUploadingBack}
                        className="sr-only"
                      />
                      {isUploadingBack ? (
                        <div className="flex flex-col items-center space-y-2 text-xs text-blue-600">
                          <Loader2 className="w-5 h-5 animate-spin" />
                          <span className="font-semibold">Mengoptimum & Memampatkan ke VPS...</span>
                        </div>
                      ) : (
                        <>
                          <UploadCloud className="w-6 h-6 text-slate-400 group-hover:text-[#00BDFF] transition-colors mb-1.5" />
                          <span className="text-xs font-bold text-slate-800 dark:text-zinc-200">
                            Pilih Fail Artwork Belakang
                          </span>
                          <span className="text-[10px] text-slate-400 mt-0.5">
                            PNG, JPG, WebP (Pilihan)
                          </span>
                        </>
                      )}
                    </label>
                  )}
                </div>
              </div>

              <div className="space-y-1 text-xs">
                <label className="font-bold text-slate-700 dark:text-zinc-300 block">
                  Nota Designer untuk Pelanggan <span className="text-slate-400 font-normal">(Penerangan penambahbaikan / pembetulan)</span>
                </label>
                <input
                  type="text"
                  value={proofDesignerNotes}
                  onChange={(e) => setProofDesignerNotes(e.target.value)}
                  placeholder="cth: Warna kolar ditukar kepada hitam, saiz logo dada dibesarkan 10% mengikut permintaan..."
                  className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-xs text-slate-800 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-[#00BDFF]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-200/60 dark:border-zinc-700/60">
                <button
                  type="submit"
                  disabled={isUploadingProof || isUploadingFront || isUploadingBack || !proofFrontUrl.trim()}
                  className="px-6 py-2.5 rounded-full bg-gradient-to-r from-[#00BDFF] to-[#007AFF] hover:opacity-95 text-white font-bold text-xs shadow-md shadow-blue-500/20 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  {isUploadingProof ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Menyimpan ke Log Audit...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>
                        Hantar Mockup{' '}
                        {activeOrder.proof_revisions && activeOrder.proof_revisions.length > 0
                          ? `(Revisi ${(activeOrder.proof_revisions.length || 0) + 1})`
                          : '(Revisi 1)'}{' '}
                        ke Pelanggan
                      </span>
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* Audit Trail: Historical Revisions Table */}
            {activeOrder.proof_revisions && activeOrder.proof_revisions.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-zinc-800">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 dark:text-zinc-100 uppercase tracking-wider">
                    Histori Rekod Semakan & Revisi ({activeOrder.proof_revisions.length} Versi)
                  </span>
                  <span className="text-[10.5px] text-slate-400 font-mono">Audit Trail Rasmi SFV Apparel</span>
                </div>

                <div className="space-y-2">
                  {activeOrder.proof_revisions.map((rev, idx) => (
                    <div
                      key={rev.id || idx}
                      className="p-3.5 rounded-xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                    >
                      <div className="space-y-1.5 min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-extrabold text-slate-900 dark:text-zinc-100 bg-white dark:bg-zinc-900 px-2 py-0.5 rounded border border-slate-200 dark:border-zinc-700">
                            REVISI {rev.revision_number}
                          </span>
                          <span
                            className={`text-[9.5px] font-bold px-2 py-0.5 rounded-full border ${
                              rev.status === 'approved'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : rev.status === 'revision_requested'
                                ? 'bg-amber-50 text-amber-700 border-amber-200'
                                : 'bg-blue-50 text-blue-700 border-blue-200'
                            }`}
                          >
                            {rev.status === 'approved'
                              ? 'Diluluskan Pelanggan'
                              : rev.status === 'revision_requested'
                              ? 'Minta Pembetulan'
                              : 'Menunggu Semakan'}
                          </span>
                          <span className="text-[10.5px] text-slate-400 font-mono">
                            {new Date(rev.created_at).toLocaleDateString('ms-MY', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}{' '}
                            •{' '}
                            {new Date(rev.created_at).toLocaleTimeString('ms-MY', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>

                        {rev.designer_notes && (
                          <p className="text-[11px] text-slate-600 dark:text-zinc-300 bg-white dark:bg-zinc-900 p-2 rounded-lg border border-slate-200/60 dark:border-zinc-700/60 leading-relaxed">
                            <span className="font-semibold text-slate-800 dark:text-zinc-200">Nota Designer:</span>{' '}
                            {rev.designer_notes}
                          </p>
                        )}

                        {rev.customer_feedback && (
                          <p className="text-[11px] text-amber-900 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 p-2 rounded-lg border border-amber-200/80 dark:border-amber-800/60 leading-relaxed">
                            <span className="font-semibold">Maklum Balas Pelanggan:</span>{' '}
                            {rev.customer_feedback}
                          </p>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => setSelectedRevisionForModal(rev)}
                        className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-full bg-white dark:bg-zinc-900 hover:bg-slate-100 dark:hover:bg-zinc-800 text-blue-600 dark:text-blue-400 text-xs font-bold border border-slate-200 dark:border-zinc-700 shadow-2xs shrink-0 active:scale-95 transition-all cursor-pointer"
                        title="Buka Imej Draf & Maklumat Lengkap"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Lihat Visual</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 4. Sizing Matrix */}
          <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 shadow-xs space-y-3">
            <span className="text-xs font-bold text-slate-900 dark:text-zinc-100 uppercase tracking-wider block">
              Pecahan Saiz Tempahan ({activeOrder.total_quantity} helai)
            </span>
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-2.5">
              {Object.entries(activeOrder.sizing_breakdown || {}).map(([s, q]) => (
                <div
                  key={s}
                  className="p-3 rounded-xl bg-slate-50 dark:bg-zinc-800/70 border border-slate-200 dark:border-zinc-700 text-center"
                >
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">{s}</span>
                  <span className="text-sm font-bold font-mono text-slate-900 dark:text-zinc-100">{q}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 5. Production Status Update Form */}
          <form onSubmit={handleSaveStatus} className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 shadow-xs space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-900 dark:text-zinc-100 block">
                Kemas Kini Status Pengeluaran Kilang
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                {STATUS_LIST.map((s) => {
                  const isSelected = newStatus === s.status;
                  return (
                    <button
                      key={s.status}
                      type="button"
                      onClick={() => setNewStatus(s.status)}
                      className={`p-2.5 rounded-xl border text-left text-xs font-semibold transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-[#00BDFF] text-white border-[#00BDFF] shadow-xs'
                          : 'bg-slate-50 dark:bg-zinc-800/60 text-slate-700 dark:text-zinc-300 border-slate-200 dark:border-zinc-700 hover:bg-slate-100'
                      }`}
                    >
                      {s.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-zinc-300">
                  Nombor Tracking Kurier
                </label>
                <input
                  type="text"
                  value={newTracking}
                  onChange={(e) => setNewTracking(e.target.value)}
                  placeholder="cth: JNT992019482 / PosLaju"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-xs text-slate-800 dark:text-zinc-100 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#00BDFF] font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-zinc-300">
                  Nota Pengeluaran
                </label>
                <input
                  type="text"
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  placeholder="Catatan tambahan kilang..."
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-xs text-slate-800 dark:text-zinc-100 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#00BDFF]"
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-zinc-800">
              <button
                type="button"
                onClick={handleSendWhatsAppNotification}
                disabled={isSendingWa || !activeOrder.customer_phone}
                title="Hantar status terkini terus ke WhatsApp pelanggan"
                className="px-4 py-2.5 rounded-full bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-semibold flex items-center justify-center gap-1.5 active:scale-95 transition-all cursor-pointer disabled:opacity-50 shadow-2xs"
              >
                <FaWhatsapp className={`w-3.5 h-3.5 text-emerald-600 ${isSendingWa ? 'animate-spin' : ''}`} />
                <span>{isSendingWa ? 'Menghantar WA...' : 'Hantar Status ke WhatsApp Pelanggan'}</span>
              </button>

              <div className="flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={(e) => activeOrder && handleDeleteOrder(activeOrder.id, activeOrder.order_number, e)}
                  disabled={isDeletingId === activeOrder.id}
                  className="px-4 py-2.5 rounded-full text-xs font-semibold text-rose-600 hover:bg-rose-50 border border-rose-200 transition-all cursor-pointer flex items-center gap-1 disabled:opacity-50"
                  title="Padam pesanan kekal dari pangkalan data"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Padam Pesanan</span>
                </button>

                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-full bg-[#00BDFF] hover:bg-[#00a6e0] text-white font-bold text-xs shadow-xs transition-all flex items-center space-x-1.5 cursor-pointer active:scale-95"
                >
                  {updateSaved ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Tersimpan!</span>
                    </>
                  ) : (
                    <span>Simpan Perubahan</span>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      ) : (
        /* =========================================================================
            VIEW MODE 2: FULL-WIDTH CLEAN ORDERS TABLE / GRID (DEFAULT LIST VIEW)
           ========================================================================= */
        <div className="space-y-4 animate-in fade-in duration-200">
          
          {/* Top Filter Bar & Search */}
          <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 border border-slate-200/80 dark:border-zinc-800 shadow-xs space-y-3.5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              
              {/* Category Filter Pills (Semua, Sublimasi, DTF) */}
              <div className="flex items-center space-x-1 bg-slate-100 dark:bg-zinc-800 p-1 rounded-full border border-slate-200 dark:border-zinc-700 w-fit">
                {[
                  { id: 'all', label: `Semua (${allOrders.length})` },
                  { id: 'sublimation', label: `Sublimasi (${allOrders.filter((d) => d.print_type === 'sublimation').length})` },
                  { id: 'dtf', label: `DTF (${allOrders.filter((d) => d.print_type === 'dtf').length})` },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setFilterType(tab.id as any)}
                    className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
                      filterType === tab.id
                        ? 'bg-[#00BDFF] text-white font-bold shadow-xs'
                        : 'text-slate-600 dark:text-zinc-400 hover:text-[#00BDFF]'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Right Controls: Search, Refresh, View Switcher */}
              <div className="flex items-center gap-2">
                <div className="relative flex-1 sm:w-72">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Cari no. pesanan, pelanggan, rekaan..."
                    className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-50 dark:bg-zinc-800 text-xs text-slate-800 dark:text-zinc-100 placeholder-slate-400 border border-slate-200 dark:border-zinc-700 focus:outline-none focus:ring-1 focus:ring-[#00BDFF] focus:border-[#00BDFF] font-medium"
                  />
                </div>

                <button
                  type="button"
                  onClick={fetchLiveOrders}
                  disabled={isLoading}
                  title="Segar semula pangkalan data"
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 hover:bg-slate-100 text-slate-700 dark:text-zinc-200 text-xs font-semibold transition-all cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-[#00BDFF]' : 'text-slate-500'}`} />
                  <span className="hidden sm:inline">Segar Semula</span>
                </button>

                <div className="flex items-center gap-0.5 bg-slate-100 dark:bg-zinc-800 p-1 rounded-xl border border-slate-200 dark:border-zinc-700">
                  <button
                    type="button"
                    onClick={() => setViewMode('list')}
                    className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                      viewMode === 'list' ? 'bg-white dark:bg-zinc-700 text-[#00BDFF] shadow-xs' : 'text-slate-500'
                    }`}
                    title="Paparan Jadual"
                  >
                    <List className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('grid')}
                    className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                      viewMode === 'grid' ? 'bg-white dark:bg-zinc-700 text-[#00BDFF] shadow-xs' : 'text-slate-500'
                    }`}
                    title="Paparan Grid Kad"
                  >
                    <LayoutGrid className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Horizontal Status Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto sparkle-scroll pt-1">
              <button
                type="button"
                onClick={() => setFilterStatus('all')}
                className={`px-3 py-1 rounded-full text-[10.5px] font-medium transition-all border whitespace-nowrap cursor-pointer ${
                  filterStatus === 'all'
                    ? 'bg-[#00BDFF] text-white border-[#00BDFF] shadow-xs font-bold'
                    : 'bg-white dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 border-slate-200 dark:border-zinc-700 hover:border-[#00BDFF]/50'
                }`}
              >
                Semua Status ({allOrders.length})
              </button>
              {STATUS_LIST.map((s) => {
                const count = allOrders.filter((o) => o.status === s.status).length;
                return (
                  <button
                    key={s.status}
                    type="button"
                    onClick={() => setFilterStatus(s.status)}
                    className={`px-3 py-1 rounded-full text-[10.5px] font-medium transition-all border whitespace-nowrap cursor-pointer ${
                      filterStatus === s.status
                        ? 'bg-[#00BDFF] text-white border-[#00BDFF] shadow-xs font-bold'
                        : 'bg-white dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 border-slate-200 dark:border-zinc-700 hover:border-[#00BDFF]/50'
                    }`}
                  >
                    {s.label} ({count})
                  </button>
                );
              })}
            </div>
          </div>

          {/* MAIN CONTENT: TABLE OR GRID */}
          {viewMode === 'list' ? (
            <div className="rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50/90 dark:bg-zinc-800/60 text-slate-500 dark:text-zinc-400 font-bold border-b border-slate-200 dark:border-zinc-800 uppercase tracking-wider text-[10.5px]">
                    <tr>
                      <th className="py-3.5 px-4">No. Pesanan</th>
                      <th className="py-3.5 px-4">Pelanggan & WhatsApp</th>
                      <th className="py-3.5 px-4">Rekaan & Kaedah</th>
                      <th className="py-3.5 px-4">Kuantiti</th>
                      <th className="py-3.5 px-4">Jumlah & Bayaran</th>
                      <th className="py-3.5 px-4">Status Kilang</th>
                      <th className="py-3.5 px-4">Status Visual Proof</th>
                      <th className="py-3.5 px-4 text-right">Tindakan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
                    {filteredOrders.length > 0 ? (
                      filteredOrders.map((ord) => {
                        const statusObj = STATUS_LIST.find((s) => s.status === ord.status) || STATUS_LIST[0];

                        return (
                          <tr
                            key={ord.id}
                            onClick={() => handleOpenDetail(ord)}
                            className="hover:bg-slate-50/90 dark:hover:bg-zinc-800/50 cursor-pointer transition-colors group"
                          >
                            {/* No. Pesanan & Tarikh */}
                            <td className="py-3.5 px-4 whitespace-nowrap">
                              <span className="font-mono text-xs font-bold text-slate-900 dark:text-zinc-100 block group-hover:text-[#00BDFF] transition-colors">
                                {ord.order_number}
                              </span>
                              <span className="text-[10px] text-slate-400 block font-mono">
                                {new Date(ord.created_at).toLocaleDateString()}
                              </span>
                            </td>

                            {/* Pelanggan & WhatsApp */}
                            <td className="py-3.5 px-4 whitespace-nowrap">
                              <span className="font-bold text-slate-800 dark:text-zinc-200 block text-xs">
                                {ord.customer_name}
                              </span>
                              <span className="text-[10.5px] text-slate-400 font-mono">
                                {ord.customer_phone}
                              </span>
                            </td>

                            {/* Rekaan */}
                            <td className="py-3.5 px-4">
                              <div className="flex items-center space-x-2.5 min-w-[200px]">
                                {ord.mockup_url && (
                                  <div className="w-9 h-9 rounded-xl overflow-hidden bg-slate-100 dark:bg-zinc-800 shrink-0 border border-slate-200 shadow-2xs">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                      src={ord.mockup_url}
                                      alt={ord.design_title}
                                      className="w-full h-full object-cover"
                                    />
                                  </div>
                                )}
                                <div className="min-w-0">
                                  <span className="font-bold text-slate-800 dark:text-zinc-200 block truncate text-xs">
                                    {ord.design_title}
                                  </span>
                                  <span className="text-[10px] text-slate-400 uppercase font-semibold">
                                    {ord.print_type} {ord.fabric_name ? `• ${ord.fabric_name}` : ''}
                                  </span>
                                </div>
                              </div>
                            </td>

                            {/* Kuantiti */}
                            <td className="py-3.5 px-4 whitespace-nowrap text-xs text-slate-700 dark:text-zinc-300 font-bold">
                              {ord.total_quantity} helai
                            </td>

                            {/* Jumlah & Bayaran */}
                            <td className="py-3.5 px-4 whitespace-nowrap">
                              <div className="space-y-0.5">
                                <span className="font-mono text-xs font-bold text-slate-900 dark:text-zinc-100 block">
                                  {formatCurrency(ord.total_amount)}
                                </span>
                                {ord.payment_status === 'paid' ? (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                    Lunas 100%
                                  </span>
                                ) : ord.payment_status === 'deposit_paid' ? (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold bg-sky-50 text-sky-700 border border-sky-200">
                                    DP 50%
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                    Menunggu Bayaran
                                  </span>
                                )}
                              </div>
                            </td>

                            {/* Status Kilang */}
                            <td className="py-3.5 px-4 whitespace-nowrap">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${statusObj.color}`}>
                                {statusObj.label}
                              </span>
                            </td>

                            {/* Status Visual Proof */}
                            <td className="py-3.5 px-4 whitespace-nowrap">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9.5px] font-bold border ${
                                ord.status === 'proof_approved' || ord.proof_status === 'approved'
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : ord.proof_status === 'revision_requested'
                                  ? 'bg-amber-50 text-amber-800 border-amber-300'
                                  : ord.proof_artwork_url
                                  ? 'bg-blue-50 text-blue-700 border-blue-200'
                                  : 'bg-slate-100 text-slate-500 border-slate-200'
                              }`}>
                                {ord.status === 'proof_approved' || ord.proof_status === 'approved'
                                  ? 'Diluluskan'
                                  : ord.proof_status === 'revision_requested'
                                  ? 'Minta Revisi'
                                  : ord.proof_artwork_url
                                  ? 'Menunggu Pelanggan'
                                  : 'Belum Ada Proof'}
                              </span>
                            </td>

                            {/* Tindakan */}
                            <td className="py-3.5 px-4 text-right whitespace-nowrap">
                              <div className="inline-flex items-center space-x-1.5">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleOpenDetail(ord);
                                  }}
                                  className="px-3 py-1 rounded-full bg-slate-100 hover:bg-[#00BDFF] hover:text-white text-slate-700 dark:bg-zinc-800 dark:text-zinc-200 text-xs font-bold transition-all cursor-pointer shadow-2xs flex items-center gap-1"
                                >
                                  <span>Urus</span>
                                  <ChevronRight className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => handleDeleteOrder(ord.id, ord.order_number, e)}
                                  disabled={isDeletingId === ord.id}
                                  className="p-1.5 rounded-full text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-zinc-800 transition-colors"
                                  title="Padam pesanan kekal"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={8} className="py-12 text-center text-slate-400 text-xs">
                          Tiada pesanan dijumpai mengikut tapisan anda.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* Grid Cards View */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredOrders.length > 0 ? (
                filteredOrders.map((ord) => {
                  const statusObj = STATUS_LIST.find((s) => s.status === ord.status) || STATUS_LIST[0];

                  return (
                    <div
                      key={ord.id}
                      onClick={() => handleOpenDetail(ord)}
                      className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200/80 dark:border-zinc-800 p-4 shadow-xs hover:shadow-md hover:border-[#00BDFF]/60 transition-all flex flex-col justify-between space-y-3 cursor-pointer group"
                    >
                      <div className="flex items-start justify-between gap-2 border-b border-slate-100 dark:border-zinc-800 pb-2.5">
                        <div>
                          <span className="text-xs font-mono font-bold text-slate-900 dark:text-zinc-100 block group-hover:text-[#00BDFF] transition-colors">
                            {ord.order_number}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {new Date(ord.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${statusObj.color}`}>
                            {statusObj.label}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => handleDeleteOrder(ord.id, ord.order_number, e)}
                            disabled={isDeletingId === ord.id}
                            className="w-7 h-7 rounded-full text-slate-400 hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center transition-colors cursor-pointer"
                            title="Padam pesanan kekal"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3">
                        {ord.mockup_url && (
                          <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-100 dark:bg-zinc-800 border border-slate-200 shrink-0 shadow-2xs">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={ord.mockup_url}
                              alt={ord.design_title}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <h4 className="font-bold text-xs text-slate-900 dark:text-zinc-100 truncate">{ord.design_title}</h4>
                          <p className="text-[11px] text-slate-600 dark:text-zinc-400 truncate mt-0.5">{ord.customer_name}</p>
                        </div>
                      </div>

                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-zinc-800/60 text-xs space-y-1.5 border border-slate-100 dark:border-zinc-800">
                        <div className="flex justify-between text-slate-600 dark:text-zinc-400">
                          <span>Kuantiti:</span>
                          <span className="font-bold text-slate-800 dark:text-zinc-200">{ord.total_quantity} helai</span>
                        </div>
                        <div className="flex justify-between items-center text-slate-600 dark:text-zinc-400 pt-1 border-t border-slate-200/60 dark:border-zinc-700/60">
                          <span>Jumlah:</span>
                          <span className="font-bold font-mono text-slate-900 dark:text-zinc-100">{formatCurrency(ord.total_amount)}</span>
                        </div>
                        <div className="flex justify-between items-center pt-0.5">
                          <span className="text-slate-500">Bayaran:</span>
                          {ord.payment_status === 'paid' ? (
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                              Lunas 100%
                            </span>
                          ) : ord.payment_status === 'deposit_paid' ? (
                            <span className="text-[10px] font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded-full border border-sky-200">
                              DP 50% Dibayar
                            </span>
                          ) : (
                            <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                              Belum Bayar
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="col-span-full bg-white dark:bg-zinc-900 rounded-3xl border border-slate-200 p-8 text-center text-slate-400 text-xs">
                  Tiada pesanan dijumpai.
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Official Invoice Modal */}
      {activeOrder && (
        <OrderInvoiceModal
          order={activeOrder}
          isOpen={isInvoiceOpen}
          onClose={() => setIsInvoiceOpen(false)}
        />
      )}

      {/* Artwork Revision Preview Modal */}
      <ArtworkRevisionModal
        isOpen={Boolean(selectedRevisionForModal)}
        onClose={() => setSelectedRevisionForModal(null)}
        revision={selectedRevisionForModal}
        orderNumber={activeOrder?.order_number}
        designTitle={activeOrder?.design_title}
      />
    </div>
  );
}

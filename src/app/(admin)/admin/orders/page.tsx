'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useAppStore } from '@/lib/store/app-store';
import { formatCurrency } from '@/lib/pricing-calculator';
import { Order, OrderStatus } from '@/types/database';
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
  Layers
} from 'lucide-react';
import { FaWhatsapp } from 'react-icons/fa6';
import { getOrdersDb, deleteOrderDb, markOrderBalancePaidAction } from '@/app/actions/orderActions';
import OrderInvoiceModal from '@/components/invoice/OrderInvoiceModal';

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
  const [isLeftPanelCollapsed, setIsLeftPanelCollapsed] = useState(false);
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
    setUpdateSaved(false);
  };

  const handleSaveStatus = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeOrder) return;

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
    setTimeout(() => {
      setUpdateSaved(false);
    }, 1500);
  };

  return (
    <div className="w-full h-full overflow-hidden bg-[#f0f4f9] dark:bg-zinc-950 flex flex-col p-4 gap-3 text-slate-900 dark:text-zinc-100 font-sans select-none">
      
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

      {/* ----------------- TOP TOOLBAR BAR ----------------- */}
      <div className="shrink-0 flex items-center justify-between gap-3 min-h-[38px]">
        {/* Tab Switcher */}
        <div className="flex items-center space-x-1 bg-slate-100/90 dark:bg-zinc-800/90 backdrop-blur-md p-1 rounded-full border border-slate-200/80 dark:border-zinc-700/80 shadow-2xs">
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
                  ? 'bg-[#00BDFF] text-white font-semibold shadow-xs'
                  : 'text-slate-600 dark:text-zinc-400 hover:text-[#00BDFF] dark:hover:text-zinc-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Toolbar Kanan */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 text-slate-700 dark:text-zinc-200 text-xs font-semibold shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>{filteredOrders.length} Pesanan</span>
          </div>

          <button
            type="button"
            onClick={fetchLiveOrders}
            disabled={isLoading}
            title="Segar semula daripada pangkalan data Supabase"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 hover:border-slate-300 text-slate-700 dark:text-zinc-200 text-xs font-medium transition-all shadow-2xs cursor-pointer disabled:opacity-50 active:scale-95"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-[#00BDFF]' : 'text-slate-500'}`} />
            <span className="hidden sm:inline">{isLoading ? 'Memuatkan...' : 'Segar Semula'}</span>
          </button>

          <div className="flex items-center gap-1 bg-slate-100/90 dark:bg-zinc-800/90 p-1 rounded-full border border-slate-200/80 dark:border-zinc-700/80 shadow-2xs">
            <button
              type="button"
              onClick={() => setViewMode('list')}
              title="Paparan Jadual"
              className={`p-1.5 rounded-full transition-colors cursor-pointer ${
                viewMode === 'list'
                  ? 'bg-[#00BDFF] text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-700 dark:text-zinc-400'
              }`}
            >
              <List className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              title="Paparan Grid"
              className={`p-1.5 rounded-full transition-colors cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-[#00BDFF] text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-700 dark:text-zinc-400'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* ----------------- SPLIT PANEL BODY ----------------- */}
      <div className="flex-1 min-h-0 overflow-hidden flex items-stretch gap-4 relative animate-in fade-in">
        
        {/* =========================================================================
            SISI KIRI: PANEL SENARAI PESANAN & PENAPIS
           ========================================================================= */}
        <div
          className={`flex flex-col h-full shrink-0 transition-all duration-300 ease-in-out select-none ${
            isLeftPanelCollapsed
              ? 'w-0 opacity-0 overflow-hidden pointer-events-none'
              : 'w-[320px] xl:w-[360px] opacity-100'
          }`}
        >
          {/* Search + Status Pills */}
          <div className="p-3.5 space-y-2.5 bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200/80 dark:border-zinc-800 shadow-2xs mb-2.5 shrink-0">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari no. pesanan, pelanggan, rekaan..."
                className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-50 dark:bg-zinc-800 text-xs text-slate-800 dark:text-zinc-100 placeholder-slate-400 border border-slate-200 dark:border-zinc-700 focus:outline-none focus:ring-1 focus:ring-[#00BDFF] focus:border-[#00BDFF] font-medium"
              />
            </div>

            {/* Status horizontal filter pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto sparkle-scroll pb-1">
              <button
                type="button"
                onClick={() => setFilterStatus('all')}
                className={`px-3 py-1 rounded-full text-[10px] font-medium transition-all border whitespace-nowrap cursor-pointer ${
                  filterStatus === 'all'
                    ? 'bg-[#00BDFF] text-white border-[#00BDFF] shadow-xs font-semibold'
                    : 'bg-white dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 border-slate-200 dark:border-zinc-700 hover:border-[#00BDFF]/40 hover:text-[#00BDFF]'
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
                    className={`px-3 py-1 rounded-full text-[10px] font-medium transition-all border whitespace-nowrap cursor-pointer ${
                      filterStatus === s.status
                        ? 'bg-[#00BDFF] text-white border-[#00BDFF] shadow-xs font-semibold'
                        : 'bg-white dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 border-slate-200 dark:border-zinc-700 hover:border-[#00BDFF]/40 hover:text-[#00BDFF]'
                    }`}
                  >
                    {s.label} ({count})
                  </button>
                );
              })}
            </div>
          </div>

          {/* List of Orders in Left Rail */}
          <div className="flex-1 min-h-0 overflow-y-auto space-y-2 pr-1 pb-2 sparkle-scroll">
            {filteredOrders.length > 0 ? (
              filteredOrders.map((ord) => {
                const isSelected = activeOrder?.id === ord.id;
                const statusObj = STATUS_LIST.find((s) => s.status === ord.status) || STATUS_LIST[0];

                return (
                  <div
                    key={ord.id}
                    onClick={() => handleOpenDetail(ord)}
                    className={`p-3 rounded-2xl border transition-all cursor-pointer relative group ${
                      isSelected
                        ? 'bg-sky-50/80 dark:bg-sky-950/40 border-2 border-[#00BDFF] ring-2 ring-[#00BDFF]/20 shadow-xs'
                        : 'bg-white dark:bg-zinc-900 border-slate-200/80 dark:border-zinc-800 hover:border-slate-300 hover:bg-slate-50/70 dark:hover:bg-zinc-800/60 shadow-2xs'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className={`font-mono text-xs font-bold ${isSelected ? 'text-[#00BDFF]' : 'text-slate-900 dark:text-zinc-100'}`}>
                            {ord.order_number}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            · {new Date(ord.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-xs font-semibold text-slate-800 dark:text-zinc-200 truncate mt-0.5">
                          {ord.customer_name}
                        </p>
                      </div>

                      <span className={`text-[9.5px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${statusObj.color}`}>
                        {statusObj.label}
                      </span>
                    </div>

                    <div className="flex items-center space-x-2.5 mt-2.5 pt-2 border-t border-slate-100 dark:border-zinc-800">
                      {ord.mockup_url && (
                        <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-zinc-800 overflow-hidden shrink-0 border border-slate-200/80">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={ord.mockup_url} alt="" className="w-full h-full object-cover" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-[11px] font-medium text-slate-600 dark:text-zinc-400 truncate">
                          {ord.design_title}
                        </p>
                        <div className="flex items-center justify-between text-[10.5px] mt-0.5">
                          <span className="text-slate-400">{ord.total_quantity} helai ({ord.print_type.toUpperCase()})</span>
                          <span className="font-mono font-bold text-slate-900 dark:text-zinc-100">{formatCurrency(ord.total_amount)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-10 bg-white dark:bg-zinc-900 rounded-2xl border border-dashed border-slate-200 dark:border-zinc-800 p-4">
                <Package className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-xs font-medium text-slate-500">Tiada pesanan dijumpai</p>
              </div>
            )}
          </div>
        </div>

        {/* =========================================================================
            SISI KANAN: KAD UTAMA KANDUNGAN & BUTIRAN PESANAN
           ========================================================================= */}
        <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-slate-200/80 dark:border-zinc-800 shadow-sm flex flex-col h-full relative overflow-hidden transition-all duration-300 ease-in-out flex-1 min-w-0 mr-0">
          
          {/* Gagang Toggle Kapsul Sisi Kiri */}
          <button
            type="button"
            onClick={() => setIsLeftPanelCollapsed((v) => !v)}
            title={isLeftPanelCollapsed ? 'Buka Panel Senarai' : 'Sembunyikan Panel Senarai'}
            className={`absolute left-[5px] top-1/2 -translate-y-1/2 h-12 rounded-full flex items-center justify-center cursor-pointer select-none z-40 transition-all duration-200 ease-out group p-0 border-0 outline-none origin-left ${
              isLeftPanelCollapsed
                ? 'w-5 bg-[#f0f4f9] hover:bg-[#e2e7ee] dark:bg-zinc-700'
                : 'w-1.5 hover:w-5 bg-[#f0f4f9] hover:bg-[#e2e7ee] dark:bg-zinc-700'
            }`}
          >
            <span
              className={`transition-opacity duration-150 flex items-center justify-center text-slate-500 dark:text-zinc-300 ${
                isLeftPanelCollapsed ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
              }`}
            >
              {isLeftPanelCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
            </span>
          </button>

          {/* ----------------- INTERNAL CARD HEADER ----------------- */}
          <div className="shrink-0 px-6 py-3.5 border-b border-slate-100 dark:border-zinc-800/80 flex items-center justify-between gap-4 bg-slate-50/50 dark:bg-zinc-900/50">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-zinc-100 tracking-tight flex items-center gap-2">
                {activeOrder ? (
                  <>
                    <span>Pesanan #{activeOrder.order_number}</span>
                    <span className="text-slate-400 font-normal">· {activeOrder.customer_name}</span>
                  </>
                ) : (
                  <span>Semua Saluran Pesanan Pelanggan</span>
                )}
              </h2>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {activeOrder
                  ? 'Pengurusan status pengeluaran, notifikasi WhatsApp, pecahan saiz, dan penjanaan invois rasmi'
                  : `Paparan ringkasan ${filteredOrders.length} rekod pesanan dalam pangkalan data Supabase`}
              </p>
            </div>

            {/* Action Bar */}
            <div className="flex items-center gap-2 shrink-0">
              {activeOrder && (
                <>
                  <button
                    type="button"
                    onClick={() => setIsInvoiceOpen(true)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 hover:border-slate-300 text-slate-700 dark:text-zinc-200 text-xs font-semibold transition-all shadow-2xs cursor-pointer active:scale-95"
                    title="Cetak Invois Rasmi / Packing Slip Kilang"
                  >
                    <FileText className="w-3.5 h-3.5 text-[#00BDFF]" />
                    <span>Invois PDF</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveOrder(null)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 text-slate-600 dark:text-zinc-300 text-xs font-medium transition-all cursor-pointer"
                  >
                    <span>Tutup Butiran</span>
                    <X className="w-3.5 h-3.5" />
                  </button>
                </>
              )}
            </div>
          </div>

          {/* ----------------- SCROLLABLE CARD BODY ----------------- */}
          <div className="flex-1 overflow-y-auto sparkle-scroll p-5 sm:p-6 space-y-6">

            {activeOrder ? (
              /* ======================= ACTIVE ORDER DETAIL VIEW ======================= */
              <div className="max-w-4xl space-y-6 animate-in fade-in">
                {/* 1. Header Spec & Customer Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50/70 dark:bg-zinc-800/40 p-4 rounded-2xl border border-slate-200/80 dark:border-zinc-700">
                  <div className="flex items-center gap-4">
                    {activeOrder.mockup_url && (
                      <div className="w-24 h-24 rounded-2xl overflow-hidden bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 shrink-0 shadow-xs">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={activeOrder.mockup_url}
                          alt={activeOrder.design_title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div className="space-y-1 min-w-0">
                      <span className="text-[10px] font-bold text-[#00BDFF] uppercase tracking-wider block">
                        {activeOrder.print_type.toUpperCase()} · {activeOrder.fabric_name || activeOrder.dtf_dimension_name || 'Standard'}
                      </span>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-zinc-100 truncate">
                        {activeOrder.design_title}
                      </h3>
                      {activeOrder.cut_name && (
                        <p className="text-xs text-slate-500">Potongan: <span className="font-semibold text-slate-700 dark:text-zinc-300">{activeOrder.cut_name}</span></p>
                      )}
                      <p className="text-xs font-mono font-bold text-slate-900 dark:text-zinc-100 pt-0.5">
                        {formatCurrency(activeOrder.total_amount)} <span className="text-slate-400 font-normal">({activeOrder.total_quantity} helai)</span>
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2 text-xs border-t md:border-t-0 md:border-l border-slate-200/60 dark:border-zinc-700/60 pt-3 md:pt-0 md:pl-4">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-semibold uppercase">Maklumat Pelanggan</span>
                      <p className="font-bold text-slate-900 dark:text-zinc-100 text-sm">{activeOrder.customer_name}</p>
                      <a
                        href={`https://wa.me/${activeOrder.customer_phone.replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[#00BDFF] font-mono hover:underline mt-0.5"
                      >
                        <FaWhatsapp className="w-3.5 h-3.5 text-emerald-500" />
                        <span>{activeOrder.customer_phone}</span>
                      </a>
                    </div>

                    {activeOrder.shipping_address && (
                      <div>
                        <span className="text-[10px] text-slate-400 block font-semibold uppercase">Alamat Penghantaran</span>
                        <p className="text-slate-600 dark:text-zinc-300 text-xs leading-relaxed">{activeOrder.shipping_address}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* 2. Payment & Settlement Summary Card */}
                <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200/90 dark:border-zinc-800 shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 dark:text-zinc-100 uppercase tracking-wider">
                      Status Pembayaran & Pelunasan
                    </span>
                    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                      activeOrder.payment_status === 'paid'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : activeOrder.payment_status === 'deposit_paid'
                        ? 'bg-sky-50 text-sky-700 border border-sky-200'
                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}>
                      {activeOrder.payment_status === 'paid'
                        ? 'Lunas 100%'
                        : activeOrder.payment_status === 'deposit_paid'
                        ? 'Deposit 50% Diterima'
                        : 'Menunggu Bayaran'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs pt-1">
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200/80 dark:border-zinc-700/80">
                      <span className="text-[10px] text-slate-400 uppercase block font-medium">Jumlah Pesanan</span>
                      <span className="font-mono font-bold text-slate-900 dark:text-zinc-100 text-sm">{formatCurrency(activeOrder.total_amount)}</span>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200/80 dark:border-zinc-700/80">
                      <span className="text-[10px] text-slate-400 uppercase block font-medium">Deposit 50%</span>
                      <span className="font-mono font-bold text-slate-900 dark:text-zinc-100 text-sm">
                        {formatCurrency(activeOrder.deposit_amount || (activeOrder.total_amount * 0.5))}
                      </span>
                      <span className={`text-[9px] font-bold block mt-0.5 ${activeOrder.deposit_paid_at || activeOrder.payment_status === 'deposit_paid' || activeOrder.payment_status === 'paid' ? 'text-emerald-600' : 'text-amber-600'}`}>
                        {activeOrder.deposit_paid_at || activeOrder.payment_status === 'deposit_paid' || activeOrder.payment_status === 'paid' ? 'Selesai Dibayar' : 'Belum Diterima'}
                      </span>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200/80 dark:border-zinc-700/80 col-span-2 sm:col-span-1">
                      <span className="text-[10px] text-slate-400 uppercase block font-medium">Baki Pelunasan 50%</span>
                      <span className="font-mono font-bold text-slate-900 dark:text-zinc-100 text-sm">
                        {formatCurrency(activeOrder.balance_amount || (activeOrder.total_amount * 0.5))}
                      </span>
                      <span className={`text-[9px] font-bold block mt-0.5 ${activeOrder.balance_paid_at || activeOrder.payment_status === 'paid' ? 'text-emerald-600' : 'text-amber-600'}`}>
                        {activeOrder.balance_paid_at || activeOrder.payment_status === 'paid' ? 'Lunas Sepenuhnya' : 'Belum Lunas'}
                      </span>
                    </div>
                  </div>

                  {/* Action button if deposit is paid but balance is not yet cleared */}
                  {activeOrder.payment_status === 'deposit_paid' && (activeOrder.balance_amount || 0) > 0 && (
                    <div className="pt-2 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-between gap-3">
                      <p className="text-[11px] text-slate-500">
                        Pelanggan telah membayar melalui pemindahan bank manual / tunai luar talian?
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

                {/* 3. Sizing Breakdown */}
                <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200/90 dark:border-zinc-800 shadow-xs space-y-2.5">
                  <span className="text-xs font-bold text-slate-900 dark:text-zinc-100 uppercase tracking-wider block">
                    Pecahan Saiz Tempahan ({activeOrder.total_quantity} helai)
                  </span>
                  <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                    {Object.entries(activeOrder.sizing_breakdown || {}).map(([s, q]) => (
                      <div
                        key={s}
                        className="p-2.5 rounded-xl bg-slate-50 dark:bg-zinc-800/70 border border-slate-200 dark:border-zinc-700 text-center"
                      >
                        <span className="text-[10px] text-slate-400 font-bold block uppercase">{s}</span>
                        <span className="text-sm font-bold font-mono text-slate-900 dark:text-zinc-100">{q}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 4. Status Update Form */}
                <form onSubmit={handleSaveStatus} className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200/90 dark:border-zinc-800 shadow-xs space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-900 dark:text-zinc-100 block">
                      Kemas Kini Status Pengeluaran Kilang
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
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

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                        Nombor Tracking Kurier
                      </label>
                      <input
                        type="text"
                        value={newTracking}
                        onChange={(e) => setNewTracking(e.target.value)}
                        placeholder="cth: JNT992019482 / PosLaju"
                        className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-xs text-slate-800 dark:text-zinc-100 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#00BDFF] focus:border-[#00BDFF] font-mono"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                        Nota Pengeluaran
                      </label>
                      <input
                        type="text"
                        value={newNotes}
                        onChange={(e) => setNewNotes(e.target.value)}
                        placeholder="Catatan tambahan..."
                        className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-xs text-slate-800 dark:text-zinc-100 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#00BDFF] focus:border-[#00BDFF]"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-zinc-800">
                    <button
                      type="button"
                      onClick={handleSendWhatsAppNotification}
                      disabled={isSendingWa || !activeOrder.customer_phone}
                      title="Hantar status terkini terus ke WhatsApp pelanggan"
                      className="px-4 py-2 rounded-full bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-semibold flex items-center justify-center gap-1.5 active:scale-95 transition-all cursor-pointer disabled:opacity-50 shadow-2xs"
                    >
                      <FaWhatsapp className={`w-3.5 h-3.5 text-emerald-600 ${isSendingWa ? 'animate-spin' : ''}`} />
                      <span>{isSendingWa ? 'Menghantar WA...' : 'Hantar Status ke WhatsApp'}</span>
                    </button>

                    <div className="flex items-center justify-end space-x-2">
                      <button
                        type="button"
                        onClick={(e) => activeOrder && handleDeleteOrder(activeOrder.id, activeOrder.order_number, e)}
                        disabled={isDeletingId === activeOrder.id}
                        className="px-4 py-2 rounded-full text-xs font-semibold text-rose-600 hover:bg-rose-50 border border-rose-200 transition-all cursor-pointer flex items-center gap-1 disabled:opacity-50"
                        title="Padam pesanan kekal dari pangkalan data"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Padam</span>
                      </button>

                      <button
                        type="submit"
                        className="px-6 py-2 rounded-full bg-[#00BDFF] hover:bg-[#00a6e0] text-white font-semibold text-xs shadow-xs transition-all flex items-center space-x-1.5 cursor-pointer active:scale-95"
                      >
                        {updateSaved ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>Tersimpan</span>
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
              /* ======================= FULL ORDERS OVERVIEW (TABLE / GRID) ======================= */
              <div className="space-y-4">
                {viewMode === 'list' ? (
                  <div className="rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 overflow-hidden shadow-2xs">
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs text-left">
                        <thead className="bg-slate-50/80 dark:bg-zinc-800/50 text-slate-500 dark:text-zinc-400 font-semibold border-b border-slate-200 dark:border-zinc-800">
                          <tr>
                            <th className="py-3 px-4">No Pesanan</th>
                            <th className="py-3 px-4">Pelanggan</th>
                            <th className="py-3 px-4">Rekaan</th>
                            <th className="py-3 px-4">Kuantiti</th>
                            <th className="py-3 px-4">Bayaran & Jumlah</th>
                            <th className="py-3 px-4">Status Pengeluaran</th>
                            <th className="py-3 px-4 text-right">Tindakan</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-zinc-800 font-normal">
                          {filteredOrders.length > 0 ? (
                            filteredOrders.map((ord) => {
                              const statusObj = STATUS_LIST.find((s) => s.status === ord.status) || STATUS_LIST[0];

                              return (
                                <tr
                                  key={ord.id}
                                  onClick={() => handleOpenDetail(ord)}
                                  className="hover:bg-slate-50/80 dark:hover:bg-zinc-800/40 cursor-pointer transition-colors group"
                                >
                                  {/* No Pesanan */}
                                  <td className="py-3 px-4 whitespace-nowrap">
                                    <span className="font-mono text-xs font-bold text-slate-900 dark:text-zinc-100 block group-hover:text-[#00BDFF] transition-colors">
                                      {ord.order_number}
                                    </span>
                                    <span className="text-[10.5px] text-slate-400 block">
                                      {new Date(ord.created_at).toLocaleDateString()}
                                    </span>
                                  </td>

                                  {/* Pelanggan */}
                                  <td className="py-3 px-4 whitespace-nowrap">
                                    <span className="font-semibold text-slate-800 dark:text-zinc-200 block text-xs">
                                      {ord.customer_name}
                                    </span>
                                  </td>

                                  {/* Rekaan */}
                                  <td className="py-3 px-4">
                                    <div className="flex items-center space-x-2.5 min-w-[180px]">
                                      {ord.mockup_url && (
                                        <div className="w-8 h-8 rounded-lg overflow-hidden bg-slate-100 dark:bg-zinc-800 shrink-0 border border-slate-200/80">
                                          {/* eslint-disable-next-line @next/next/no-img-element */}
                                          <img
                                            src={ord.mockup_url}
                                            alt={ord.design_title}
                                            className="w-full h-full object-cover"
                                          />
                                        </div>
                                      )}
                                      <div className="min-w-0">
                                        <span className="font-semibold text-slate-800 dark:text-zinc-200 block truncate text-xs">
                                          {ord.design_title}
                                        </span>
                                        <span className="text-[10px] text-slate-400 uppercase font-medium">
                                          {ord.print_type}
                                        </span>
                                      </div>
                                    </div>
                                  </td>

                                  {/* Kuantiti */}
                                  <td className="py-3 px-4 whitespace-nowrap text-xs text-slate-700 dark:text-zinc-300 font-medium">
                                    {ord.total_quantity} helai
                                  </td>

                                  {/* Bayaran & Jumlah */}
                                  <td className="py-3 px-4 whitespace-nowrap">
                                    <div className="space-y-0.5">
                                      <span className="font-mono text-xs font-bold text-slate-900 dark:text-zinc-100 block">
                                        {formatCurrency(ord.total_amount)}
                                      </span>
                                      {ord.payment_status === 'paid' ? (
                                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9.5px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                          Lunas 100%
                                        </span>
                                      ) : ord.payment_status === 'deposit_paid' ? (
                                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9.5px] font-bold bg-sky-50 text-sky-700 border border-sky-200">
                                          DP 50%
                                        </span>
                                      ) : (
                                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9.5px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                          Menunggu
                                        </span>
                                      )}
                                    </div>
                                  </td>

                                  {/* Status */}
                                  <td className="py-3 px-4 whitespace-nowrap">
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${statusObj.color}`}>
                                      {statusObj.label}
                                    </span>
                                  </td>

                                  {/* Tindakan */}
                                  <td className="py-3 px-4 text-right whitespace-nowrap">
                                    <div className="inline-flex items-center space-x-1">
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleOpenDetail(ord);
                                        }}
                                        className="p-1.5 rounded-full text-slate-500 hover:text-[#00BDFF] hover:bg-sky-50 dark:hover:bg-zinc-800 transition-colors"
                                        title="Buka Butiran"
                                      >
                                        <ChevronRight className="w-4 h-4" />
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
                              <td colSpan={7} className="py-12 text-center text-slate-400">
                                Tiada pesanan dijumpai.
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
                            className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200/80 dark:border-zinc-800 p-4 shadow-2xs hover:shadow-md hover:border-[#00BDFF]/60 transition-all flex flex-col justify-between space-y-3 cursor-pointer group"
                          >
                            <div className="flex items-start justify-between gap-2 border-b border-slate-100 dark:border-zinc-800 pb-2.5">
                              <div>
                                <span className="text-xs font-mono font-bold text-slate-900 dark:text-zinc-100 block group-hover:text-[#00BDFF] transition-colors">
                                  {ord.order_number}
                                </span>
                                <span className="text-[10.5px] text-slate-400">
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
                                <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-100 dark:bg-zinc-800 border border-slate-200 shrink-0">
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
                      <div className="col-span-full bg-white dark:bg-zinc-900 rounded-3xl border border-slate-200 p-8 text-center text-slate-400">
                        Tiada pesanan dijumpai.
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

          </div>
        </div>
      </div>

      {/* Official Invoice Modal */}
      {activeOrder && (
        <OrderInvoiceModal
          order={activeOrder}
          isOpen={isInvoiceOpen}
          onClose={() => setIsInvoiceOpen(false)}
        />
      )}
    </div>
  );
}

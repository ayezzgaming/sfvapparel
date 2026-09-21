'use client';

import React, { useState, useMemo } from 'react';
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
  Printer
} from 'lucide-react';
import { FaWhatsapp } from 'react-icons/fa6';
import OrderInvoiceModal from '@/components/invoice/OrderInvoiceModal';

const STATUS_LIST: { status: OrderStatus; label: string; color: string }[] = [
  { status: 'pending_proof', label: 'Menunggu Proof', color: 'bg-amber-50 text-amber-800 border-amber-200' },
  { status: 'proof_approved', label: 'Proof Diluluskan', color: 'bg-sky-50 text-sky-800 border-sky-200' },
  { status: 'in_printing', label: 'Sedang Dicetak', color: 'bg-blue-50 text-blue-800 border-blue-200' },
  { status: 'heat_press', label: 'Heat Press', color: 'bg-orange-50 text-orange-800 border-orange-200' },
  { status: 'sewing', label: 'Jahitan', color: 'bg-purple-50 text-purple-800 border-purple-200' },
  { status: 'qc_check', label: 'QC', color: 'bg-teal-50 text-teal-800 border-teal-200' },
  { status: 'ready_to_ship', label: 'Sedia Dihantar', color: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
  { status: 'delivered', label: 'Selesai', color: 'bg-slate-100 text-slate-700 border-slate-200' },
  { status: 'cancelled', label: 'Batal', color: 'bg-rose-50 text-rose-700 border-rose-200' },
];

export default function AdminOrdersPage() {
  const { orders, updateOrderStatus, markOrderBalancePaid } = useAppStore();

  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [filterType, setFilterType] = useState<'all' | 'sublimation' | 'dtf'>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);

  // Status edit modal state
  const [newStatus, setNewStatus] = useState<OrderStatus>('pending_proof');
  const [newTracking, setNewTracking] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [updateSaved, setUpdateSaved] = useState(false);
  const [isSendingWa, setIsSendingWa] = useState(false);
  const [isMarkingBalancePaid, setIsMarkingBalancePaid] = useState(false);
  const [waToast, setWaToast] = useState<{ success: boolean; message: string } | null>(null);
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);

  const handleSendWhatsAppNotification = async () => {
    if (!activeOrder || !activeOrder.customer_phone) {
      alert('Nombor telefon pelanggan tidak ditemui.');
      return;
    }

    setIsSendingWa(true);
    setWaToast(null);

    const statusLabel = STATUS_LIST.find((s) => s.status === newStatus)?.label || newStatus;
    let message = `Hai *${activeOrder.customer_name}*, pesanan jersi anda (*${activeOrder.order_number}* - ${activeOrder.design_title}) kini telah dikemaskini kepada: *${statusLabel}*.`;
    
    if (newTracking.trim()) {
      message += `\n\nNombor Penjejakan Pos: ${newTracking.trim()}`;
    }

    // Auto add settlement reminder if ready to ship and deposit only
    if (newStatus === 'ready_to_ship' && activeOrder.payment_status === 'deposit_paid' && (activeOrder.balance_amount || 0) > 0) {
      message += `\n\nStatus Pengeluaran: Jersi anda telah selesai diproses di kilang. Sila buat bayaran baki pelunasan 50% sebanyak *RM ${(activeOrder.balance_amount || (activeOrder.total_amount * 0.5)).toFixed(2)}* untuk pelepasan penghantaran kurier.`;
    }

    message += `\n\nTerima kasih kerana menempah dengan SFV Apparel!`;

    try {
      const res = await fetch('/api/whatsapp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: activeOrder.customer_phone,
          message,
        }),
      });
      const data = await res.json();

      if (data.success) {
        setWaToast({ success: true, message: 'Notifikasi WhatsApp berjaya dihantar ke pelanggan!' });
      } else {
        setWaToast({ success: false, message: data.error || 'Gagal menghantar WhatsApp.' });
      }
    } catch {
      setWaToast({ success: false, message: 'Ralat sambungan API WhatsApp' });
    } finally {
      setIsSendingWa(false);
      setTimeout(() => setWaToast(null), 4000);
    }
  };

  const handleMarkBalancePaid = async () => {
    if (!activeOrder) return;
    if (!confirm(`Sahkan penerimaan bayaran baki penuh bagi pesanan ${activeOrder.order_number}?`)) return;

    setIsMarkingBalancePaid(true);
    try {
      await markOrderBalancePaid(activeOrder.id, 'Manual / Cash / Bank Transfer');
      setActiveOrder((prev) => prev ? {
        ...prev,
        payment_status: 'paid',
        balance_amount: 0,
        paid_amount: prev.total_amount,
        balance_paid_at: new Date().toISOString(),
      } : null);
      setWaToast({ success: true, message: 'Baki pesanan berjaya ditandakan sebagai Lunas 100%!' });
    } catch (err) {
      console.error(err);
      setWaToast({ success: false, message: 'Ralat mengemaskini status bayaran baki.' });
    } finally {
      setIsMarkingBalancePaid(false);
      setTimeout(() => setWaToast(null), 4000);
    }
  };

  const filteredOrders = useMemo(() => {
    return orders.filter((ord) => {
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
  }, [orders, filterType, filterStatus, searchQuery]);

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
    setUpdateSaved(true);
    setTimeout(() => {
      setUpdateSaved(false);
      setActiveOrder(null);
    }, 600);
  };

  return (
    <div className="space-y-6 select-none max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-normal text-slate-800 tracking-normal">
            Pesanan
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Pengurusan pesanan pelanggan, status pengeluaran, dan penjejakan.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-xs text-slate-600 bg-white border border-slate-200 px-3.5 py-1.5 rounded-full font-medium shadow-xs">
            {filteredOrders.length} Pesanan
          </span>
        </div>
      </div>

      {/* Toolbar & Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari no. pesanan, pelanggan, atau nama rekaan..."
            className="w-full pl-9 pr-4 py-2 rounded-full bg-slate-50 border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-400 transition-all"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Filter Pills */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-full border border-slate-200">
            <button
              onClick={() => setFilterType('all')}
              className={`px-3.5 py-1 rounded-full text-xs font-medium transition-all ${
                filterType === 'all'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Semua
            </button>
            <button
              onClick={() => setFilterType('sublimation')}
              className={`px-3.5 py-1 rounded-full text-xs font-medium transition-all ${
                filterType === 'sublimation'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Sublimasi
            </button>
            <button
              onClick={() => setFilterType('dtf')}
              className={`px-3.5 py-1 rounded-full text-xs font-medium transition-all ${
                filterType === 'dtf'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              DTF
            </button>
          </div>

          {/* Status Select */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3.5 py-1.5 rounded-full bg-slate-50 border border-slate-200 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-slate-400 font-medium"
          >
            <option value="all">Semua Status</option>
            {STATUS_LIST.map((s) => (
              <option key={s.status} value={s.status}>
                {s.label}
              </option>
            ))}
          </select>

          {/* View Switcher */}
          <div className="flex items-center bg-slate-100 p-1 rounded-full border border-slate-200">
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-full transition-all ${
                viewMode === 'list'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
              title="Paparan Jadual"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-full transition-all ${
                viewMode === 'grid'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
              title="Paparan Grid"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area: Clean Table vs Grid */}
      {viewMode === 'list' ? (
        <div className="rounded-3xl bg-white border border-slate-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50/80 text-slate-500 text-xs font-medium border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4 font-medium">No Pesanan</th>
                  <th className="py-3.5 px-4 font-medium">Pelanggan</th>
                  <th className="py-3.5 px-4 font-medium">Rekaan</th>
                  <th className="py-3.5 px-4 font-medium">Kuantiti</th>
                  <th className="py-3.5 px-4 font-medium">Bayaran & Jumlah</th>
                  <th className="py-3.5 px-4 font-medium">Status Pengeluaran</th>
                  <th className="py-3.5 px-4 text-right font-medium">Tindakan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-normal">
                {filteredOrders.length > 0 ? (
                  filteredOrders.map((ord) => {
                    const statusObj = STATUS_LIST.find((s) => s.status === ord.status) || STATUS_LIST[0];

                    return (
                      <tr
                        key={ord.id}
                        onClick={() => handleOpenDetail(ord)}
                        className="hover:bg-slate-50/80 cursor-pointer transition-colors group"
                      >
                        {/* No Pesanan */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span className="font-mono text-xs font-medium text-slate-900 block group-hover:text-blue-600 transition-colors">
                            {ord.order_number}
                          </span>
                          <span className="text-[11px] text-slate-400 block font-normal">
                            {new Date(ord.created_at).toLocaleDateString()}
                          </span>
                        </td>

                        {/* Pelanggan */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span className="font-medium text-slate-800 block text-sm">
                            {ord.customer_name}
                          </span>
                        </td>

                        {/* Rekaan */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center space-x-3 min-w-[180px]">
                            {ord.mockup_url && (
                              <div className="w-9 h-9 rounded-xl overflow-hidden bg-slate-100 flex-shrink-0 border border-slate-200">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={ord.mockup_url}
                                  alt={ord.design_title}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            )}
                            <div className="min-w-0">
                              <span className="font-medium text-slate-800 block truncate text-sm">
                                {ord.design_title}
                              </span>
                              <span className="text-[11px] text-slate-400 uppercase">
                                {ord.print_type}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Kuantiti */}
                        <td className="py-3.5 px-4 whitespace-nowrap text-sm text-slate-700">
                          {ord.total_quantity} helai
                        </td>

                        {/* Bayaran & Jumlah */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="space-y-0.5">
                            <span className="font-mono text-sm font-medium text-slate-900 block">
                              {formatCurrency(ord.total_amount)}
                            </span>
                            {ord.payment_status === 'paid' ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                Lunas 100%
                              </span>
                            ) : ord.payment_status === 'deposit_paid' ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-sky-100 text-sky-800">
                                DP 50% (Baki: {formatCurrency(ord.balance_amount || (ord.total_amount * 0.5))})
                              </span>
                            ) : ord.payment_status === 'deposit_pending' || ord.payment_status === 'balance_pending' ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                                Menunggu Bayaran
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-700">
                                Belum Bayar
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium border ${statusObj.color}`}
                          >
                            {statusObj.label}
                          </span>
                        </td>

                        {/* Tindakan */}
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <div className="inline-flex items-center justify-center w-8 h-8 rounded-full text-slate-400 group-hover:text-slate-700 group-hover:bg-slate-100 transition-colors">
                            <ChevronRight className="w-4 h-4" />
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-400">
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
                  className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between space-y-3 cursor-pointer group"
                >
                  <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-3">
                    <div>
                      <span className="text-xs font-mono font-medium text-slate-900 block group-hover:text-blue-600 transition-colors">
                        {ord.order_number}
                      </span>
                      <span className="text-xs text-slate-400">
                        {new Date(ord.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusObj.color}`}>
                      {statusObj.label}
                    </span>
                  </div>

                  <div className="flex items-center space-x-3">
                    {ord.mockup_url && (
                      <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={ord.mockup_url}
                          alt={ord.design_title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <h4 className="font-medium text-sm text-slate-800 truncate">{ord.design_title}</h4>
                      <p className="text-xs text-slate-600 truncate">{ord.customer_name}</p>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 text-xs space-y-1.5">
                    <div className="flex justify-between text-slate-600">
                      <span>Kuantiti:</span>
                      <span className="font-medium text-slate-800">{ord.total_quantity} helai</span>
                    </div>
                    <div className="flex justify-between items-center text-slate-600 pt-1 border-t border-slate-200/60">
                      <span>Jumlah:</span>
                      <span className="font-medium font-mono text-slate-900">{formatCurrency(ord.total_amount)}</span>
                    </div>
                    <div className="flex justify-between items-center pt-0.5">
                      <span className="text-slate-500">Bayaran:</span>
                      {ord.payment_status === 'paid' ? (
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/80 px-1.5 py-0.5 rounded">
                          Lunas 100%
                        </span>
                      ) : ord.payment_status === 'deposit_paid' ? (
                        <span className="text-[10px] font-bold text-sky-700 bg-sky-100/80 px-1.5 py-0.5 rounded">
                          DP 50% Dibayar
                        </span>
                      ) : (
                        <span className="text-[10px] font-medium text-slate-600 bg-slate-200/80 px-1.5 py-0.5 rounded">
                          Belum Bayar
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="col-span-full bg-white rounded-3xl border border-slate-200 p-8 text-center text-slate-400">
              Tiada pesanan dijumpai.
            </div>
          )}
        </div>
      )}

      {/* ===================== FULL ORDER DETAIL & STATUS MODAL ===================== */}
      {activeOrder && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-xl bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-7 space-y-5 shadow-2xl max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-mono font-semibold text-slate-900 bg-slate-100 px-2.5 py-0.5 rounded-full">
                    {activeOrder.order_number}
                  </span>
                  <span className="text-xs text-slate-400">
                    {new Date(activeOrder.created_at).toLocaleDateString()}
                  </span>
                </div>
                <h3 className="text-base font-medium text-slate-800 mt-1">
                  {activeOrder.design_title}
                </h3>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setIsInvoiceOpen(true)}
                  className="px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
                  title="Cetak Invois Rasmi / Packing Slip Kilang"
                >
                  <FileText className="w-3.5 h-3.5 text-sky-600" />
                  <span>Invois PDF</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveOrder(null)}
                  className="w-8 h-8 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 flex items-center justify-center transition-all cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Mockup Preview & Info Card */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
              {activeOrder.mockup_url && (
                <div className="aspect-square rounded-xl overflow-hidden bg-white border border-slate-200">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={activeOrder.mockup_url}
                    alt={activeOrder.design_title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div className="space-y-2.5 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 block font-medium uppercase">Pelanggan</span>
                  <span className="font-medium text-slate-800 text-sm block">{activeOrder.customer_name}</span>
                  <span className="text-slate-500 font-mono text-xs">{activeOrder.customer_phone}</span>
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 block font-medium uppercase">Spesifikasi</span>
                  <span className="text-slate-700 block font-medium">
                    {activeOrder.fabric_name || activeOrder.dtf_dimension_name || 'Standard'}
                  </span>
                  {activeOrder.cut_name && (
                    <span className="text-slate-500 text-[11px] block">{activeOrder.cut_name}</span>
                  )}
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 block font-medium uppercase">Jumlah Bayaran</span>
                  <span className="font-mono text-slate-900 font-medium text-sm">
                    {formatCurrency(activeOrder.total_amount)}
                  </span>
                  <span className="text-slate-500 text-xs ml-1">({activeOrder.total_quantity} helai)</span>
                </div>

                {activeOrder.shipping_address && (
                  <div>
                    <span className="text-[10px] text-slate-400 block font-medium uppercase">Alamat Penghantaran</span>
                    <span className="text-slate-600 text-xs block">{activeOrder.shipping_address}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Payment & Settlement Summary Card */}
            <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-900 uppercase tracking-wider">
                  Status Pembayaran & Pelunasan
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                  activeOrder.payment_status === 'paid'
                    ? 'bg-emerald-100 text-emerald-800'
                    : activeOrder.payment_status === 'deposit_paid'
                    ? 'bg-sky-100 text-sky-800'
                    : 'bg-amber-100 text-amber-800'
                }`}>
                  {activeOrder.payment_status === 'paid'
                    ? 'Lunas 100%'
                    : activeOrder.payment_status === 'deposit_paid'
                    ? 'Deposit 50% Diterima'
                    : 'Menunggu Bayaran'}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs pt-1">
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
                  <span className="text-[10px] text-slate-400 uppercase block font-medium">Jumlah Pesanan</span>
                  <span className="font-mono font-bold text-slate-900 text-sm">{formatCurrency(activeOrder.total_amount)}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
                  <span className="text-[10px] text-slate-400 uppercase block font-medium">Deposit 50%</span>
                  <span className="font-mono font-bold text-slate-900 text-sm">
                    {formatCurrency(activeOrder.deposit_amount || (activeOrder.total_amount * 0.5))}
                  </span>
                  <span className={`text-[9px] font-bold block mt-0.5 ${activeOrder.deposit_paid_at || activeOrder.payment_status === 'deposit_paid' || activeOrder.payment_status === 'paid' ? 'text-emerald-600' : 'text-amber-600'}`}>
                    {activeOrder.deposit_paid_at || activeOrder.payment_status === 'deposit_paid' || activeOrder.payment_status === 'paid' ? 'Selesai Dibayar' : 'Belum Diterima'}
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 col-span-2 sm:col-span-1">
                  <span className="text-[10px] text-slate-400 uppercase block font-medium">Baki Pelunasan 50%</span>
                  <span className="font-mono font-bold text-slate-900 text-sm">
                    {formatCurrency(activeOrder.balance_amount || (activeOrder.total_amount * 0.5))}
                  </span>
                  <span className={`text-[9px] font-bold block mt-0.5 ${activeOrder.balance_paid_at || activeOrder.payment_status === 'paid' ? 'text-emerald-600' : 'text-amber-600'}`}>
                    {activeOrder.balance_paid_at || activeOrder.payment_status === 'paid' ? 'Lunas Sepenuhnya' : 'Belum Lunas'}
                  </span>
                </div>
              </div>

              {/* Action button if deposit is paid but balance is not yet cleared */}
              {activeOrder.payment_status === 'deposit_paid' && (activeOrder.balance_amount || 0) > 0 && (
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-3">
                  <p className="text-[11px] text-slate-500">
                    Pelanggan telah membayar melalui cash / bank transfer luar talian?
                  </p>
                  <button
                    type="button"
                    onClick={handleMarkBalancePaid}
                    disabled={isMarkingBalancePaid}
                    className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shrink-0 shadow-xs active:scale-95 transition-all flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                    <span>{isMarkingBalancePaid ? 'Mengemaskini...' : 'Tanda Baki Lunas (Manual/Cash)'}</span>
                  </button>
                </div>
              )}
            </div>

            {/* Sizing Breakdown */}
            <div className="space-y-2">
              <span className="text-xs font-medium text-slate-700 block">
                Pecahan Saiz ({activeOrder.total_quantity} helai)
              </span>
              <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                {Object.entries(activeOrder.sizing_breakdown || {}).map(([s, q]) => (
                  <div
                    key={s}
                    className="p-2 rounded-xl bg-slate-50 border border-slate-200 text-center"
                  >
                    <span className="text-[10px] text-slate-400 font-semibold block uppercase">{s}</span>
                    <span className="text-sm font-medium font-mono text-slate-800">{q}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Status Update Form */}
            <form onSubmit={handleSaveStatus} className="space-y-4 pt-3 border-t border-slate-100">
              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-700 block">
                  Kemas Kini Status Pengeluaran
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {STATUS_LIST.map((s) => {
                    const isSelected = newStatus === s.status;
                    return (
                      <button
                        key={s.status}
                        type="button"
                        onClick={() => setNewStatus(s.status)}
                        className={`p-2.5 rounded-xl border text-left text-xs font-medium transition-all ${
                          isSelected
                            ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {s.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-700 block mb-1">
                    Nombor Tracking Kurier
                  </label>
                  <input
                    type="text"
                    value={newTracking}
                    onChange={(e) => setNewTracking(e.target.value)}
                    placeholder="Contoh: JNT992019482 / PosLaju"
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-400 font-mono"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-700 block mb-1">
                    Nota Pengeluaran
                  </label>
                  <input
                    type="text"
                    value={newNotes}
                    onChange={(e) => setNewNotes(e.target.value)}
                    placeholder="Catatan tambahan..."
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-400"
                  />
                </div>
              </div>

              {waToast && (
                <div className={`p-2.5 rounded-xl text-xs flex items-center gap-2 ${
                  waToast.success 
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                    : 'bg-rose-50 text-rose-800 border border-rose-200'
                }`}>
                  <FaWhatsapp className="w-3.5 h-3.5 shrink-0 text-emerald-600" />
                  <span>{waToast.message}</span>
                </div>
              )}

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-100">
                {/* 1-Click WhatsApp Notification Trigger */}
                <button
                  type="button"
                  onClick={handleSendWhatsAppNotification}
                  disabled={isSendingWa || !activeOrder.customer_phone}
                  title="Hantar status terkini terus ke WhatsApp pelanggan"
                  className="px-4 py-2 rounded-full bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-semibold flex items-center justify-center gap-1.5 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
                >
                  <FaWhatsapp className={`w-3.5 h-3.5 text-emerald-600 ${isSendingWa ? 'animate-spin' : ''}`} />
                  <span>{isSendingWa ? 'Menghantar WA...' : 'Hantar Status ke WhatsApp'}</span>
                </button>

                <div className="flex items-center justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setActiveOrder(null)}
                    className="px-4 py-2 rounded-full text-xs font-medium text-slate-600 hover:bg-slate-100 transition-all cursor-pointer"
                  >
                    Tutup
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-full bg-[#00BDFF] hover:bg-sky-500 text-white font-medium text-xs shadow-xs transition-all flex items-center space-x-1.5 cursor-pointer"
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
    </div>
  );
}


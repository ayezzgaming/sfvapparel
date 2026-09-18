'use client';

import React, { useState, useMemo } from 'react';
import { useAppStore } from '@/lib/store/app-store';
import { formatCurrency } from '@/lib/pricing-calculator';
import { Order, OrderStatus } from '@/types/database';
import {
  ClipboardList,
  Search,
  Check,
  CheckCircle2,
  Clock,
  Truck,
  Layers,
  ArrowRight,
  ShieldAlert,
  ChevronDown,
  Printer,
  Scissors,
  LayoutGrid,
  List
} from 'lucide-react';

const STATUS_LIST: { status: OrderStatus; label: string; color: string }[] = [
  { status: 'pending_proof', label: 'Menunggu Proof', color: 'bg-rose-50 text-rose-700 border-rose-200' },
  { status: 'proof_approved', label: 'Proof Diluluskan', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  { status: 'in_printing', label: 'Sedang Dicetak', color: 'bg-blue-50 text-[#0052FF] border-blue-200' },
  { status: 'heat_press', label: 'Heat Press / Curing', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  { status: 'sewing', label: 'Jahitan & Pemasangan', color: 'bg-purple-50 text-purple-700 border-purple-200' },
  { status: 'qc_check', label: 'Pemeriksaan Kualiti (QC)', color: 'bg-cyan-50 text-cyan-700 border-cyan-200' },
  { status: 'ready_to_ship', label: 'Sedia Dihantar', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  { status: 'delivered', label: 'Telah Diterima', color: 'bg-slate-100 text-slate-700 border-slate-200' },
  { status: 'cancelled', label: 'Dibatalkan', color: 'bg-red-50 text-red-700 border-red-200' },
];

export default function AdminOrdersPage() {
  const { orders, updateOrderStatus } = useAppStore();

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

  const handleOpenEdit = (ord: Order) => {
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Saluran Pesanan Produksi
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Pantau status pesanan, periksa spesifikasi saiz, dan masukkan nombor penjejakan kurier.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-xs font-bold text-slate-700 bg-white border border-slate-200 px-3 py-1.5 rounded-xl shadow-xs">
            {filteredOrders.length} pesanan sepadan
          </span>
        </div>
      </div>

      {/* Filters & Search Toolbar */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nombor pesanan, pelanggan, atau nama rekaan..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0052FF]/30 focus:border-[#0052FF]"
          />
        </div>

        {/* Print Type Filter & Switcher */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="bg-slate-100 p-1 rounded-xl border border-slate-200 flex items-center">
            <button
              onClick={() => setFilterType('all')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                filterType === 'all'
                  ? 'bg-[#0052FF] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Semua Jenis
            </button>
            <button
              onClick={() => setFilterType('sublimation')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                filterType === 'sublimation'
                  ? 'bg-[#0052FF] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Sublimasi
            </button>
            <button
              onClick={() => setFilterType('dtf')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                filterType === 'dtf'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              DTF
            </button>
          </div>

          {/* Status Dropdown */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0052FF]/30 focus:border-[#0052FF]"
          >
            <option value="all">Semua Peringkat Produksi</option>
            {STATUS_LIST.map((s) => (
              <option key={s.status} value={s.status}>
                {s.label}
              </option>
            ))}
          </select>

          {/* List vs Grid Switcher */}
          <div className="bg-slate-100 p-1 rounded-xl border border-slate-200 flex items-center">
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                viewMode === 'list'
                  ? 'bg-white text-[#0052FF] shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
              title="Paparan Jadual / Senarai"
            >
              <List className="w-4 h-4" />
              <span className="hidden sm:inline text-[11px]">Jadual</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                viewMode === 'grid'
                  ? 'bg-white text-[#0052FF] shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
              title="Paparan Grid Kad"
            >
              <LayoutGrid className="w-4 h-4" />
              <span className="hidden sm:inline text-[11px]">Grid</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area: List Table vs Grid Cards */}
      {viewMode === 'list' ? (
        <div className="rounded-2xl bg-white border border-slate-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] font-bold tracking-wider border-b border-slate-200">
                <tr>
                  <th className="p-3.5">No Pesanan</th>
                  <th className="p-3.5">Rekaan & Pratonton</th>
                  <th className="p-3.5">Pelanggan & Telefon</th>
                  <th className="p-3.5">Teknik & Spesifikasi</th>
                  <th className="p-3.5">Kuantiti & Saiz</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Jumlah Sebut Harga</th>
                  <th className="p-3.5 text-center">Tindakan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredOrders.length > 0 ? (
                  filteredOrders.map((ord) => {
                    const statusObj = STATUS_LIST.find((s) => s.status === ord.status) || STATUS_LIST[0];

                    return (
                      <tr key={ord.id} className="hover:bg-slate-50 transition-colors">
                        {/* Order Number */}
                        <td className="p-3.5 font-mono font-bold text-[#0052FF] whitespace-nowrap">
                          {ord.order_number}
                          <span className="text-[10px] text-slate-400 block font-normal">
                            {new Date(ord.created_at).toLocaleDateString()}
                          </span>
                        </td>

                        {/* Design & Preview Thumbnail */}
                        <td className="p-3.5">
                          <div className="flex items-center space-x-2.5">
                            {ord.mockup_url && (
                              <div className="w-10 h-10 rounded-lg overflow-hidden bg-slate-100 flex-shrink-0 border border-slate-200">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={ord.mockup_url}
                                  alt={ord.design_title}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            )}
                            <div>
                              <span className="font-bold text-slate-900 block line-clamp-1 max-w-[160px]">
                                {ord.design_title}
                              </span>
                              <span className="text-[10px] text-slate-500 font-semibold">
                                {ord.print_type.toUpperCase()}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Customer */}
                        <td className="p-3.5">
                          <span className="font-bold text-slate-900 block">{ord.customer_name}</span>
                          <span className="text-[10px] text-slate-500 font-mono block">{ord.customer_phone}</span>
                        </td>

                        {/* Technique & Specs */}
                        <td className="p-3.5">
                          <span className="text-slate-800 block font-medium">
                            {ord.fabric_name || ord.dtf_dimension_name || 'Standard'}
                          </span>
                          {ord.cut_name && (
                            <span className="text-[10px] text-slate-500 block">Kolar: {ord.cut_name}</span>
                          )}
                        </td>

                        {/* Qty & Sizes */}
                        <td className="p-3.5 font-mono">
                          <span className="font-bold text-slate-900 block">{ord.total_quantity} helai</span>
                          <div className="text-[10px] text-slate-500 flex flex-wrap gap-1 max-w-[120px]">
                            {Object.entries(ord.sizing_breakdown || {}).map(([s, q]) => {
                              if (Number(q) <= 0) return null;
                              return (
                                <span key={s} className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-medium">
                                  {s}:{q}
                                </span>
                              );
                            })}
                          </div>
                        </td>

                        {/* Status Badge */}
                        <td className="p-3.5 whitespace-nowrap">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${statusObj.color}`}
                          >
                            {statusObj.label}
                          </span>
                        </td>

                        {/* Total */}
                        <td className="p-3.5 text-right font-mono font-bold text-slate-900 whitespace-nowrap">
                          {formatCurrency(ord.total_amount)}
                        </td>

                        {/* Action */}
                        <td className="p-3.5 text-center">
                          <button
                            onClick={() => handleOpenEdit(ord)}
                            className="px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-[#0052FF] text-[#0052FF] hover:text-white font-semibold text-xs transition-all border border-blue-200"
                          >
                            Semak & Status
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-slate-400">
                      Tiada pesanan sepadan dengan kriteria carian.
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
                  className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between space-y-3"
                >
                  <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-3">
                    <div>
                      <span className="text-xs font-mono font-bold text-[#0052FF] block">
                        {ord.order_number}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(ord.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${statusObj.color}`}>
                      {statusObj.label}
                    </span>
                  </div>

                  <div className="flex items-center space-x-3">
                    {ord.mockup_url && (
                      <div className="w-14 h-14 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={ord.mockup_url}
                          alt={ord.design_title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <h4 className="font-bold text-sm text-slate-900 truncate">{ord.design_title}</h4>
                      <p className="text-xs text-slate-600 font-semibold truncate">{ord.customer_name}</p>
                      <p className="text-[11px] text-slate-400 font-mono truncate">{ord.customer_phone}</p>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs space-y-1">
                    <div className="flex justify-between text-slate-600">
                      <span>Kuantiti:</span>
                      <span className="font-bold text-slate-900">{ord.total_quantity} helai</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Spesifikasi:</span>
                      <span className="font-medium text-slate-800">{ord.fabric_name || ord.dtf_dimension_name || 'Standard'}</span>
                    </div>
                    <div className="flex justify-between text-slate-600 pt-1 border-t border-slate-200/60">
                      <span>Jumlah:</span>
                      <span className="font-bold font-mono text-[#0052FF]">{formatCurrency(ord.total_amount)}</span>
                    </div>
                  </div>

                  <div className="pt-1">
                    <button
                      onClick={() => handleOpenEdit(ord)}
                      className="w-full py-2 rounded-xl bg-blue-50 hover:bg-[#0052FF] text-[#0052FF] hover:text-white font-bold text-xs transition-all border border-blue-200"
                    >
                      Semak & Kemaskini Status
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="col-span-full bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-400">
              Tiada pesanan sepadan dengan kriteria carian.
            </div>
          )}
        </div>
      )}

      {/* ===================== STATUS UPDATE MODAL ===================== */}
      {activeOrder && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-xl bg-white border border-slate-200 rounded-2xl p-6 space-y-5 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-mono font-bold text-[#0052FF]">
                    {activeOrder.order_number}
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded uppercase bg-slate-100 text-slate-700">
                    {activeOrder.print_type}
                  </span>
                </div>
                <h3 className="text-base font-bold text-slate-900 mt-0.5">
                  {activeOrder.design_title}
                </h3>
              </div>
              <button
                onClick={() => setActiveOrder(null)}
                className="text-xs text-slate-400 hover:text-slate-600 p-1 font-semibold"
              >
                Tutup
              </button>
            </div>

            {/* Mockup Preview & Detailed Specs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
              {activeOrder.mockup_url && (
                <div className="aspect-square rounded-lg overflow-hidden bg-white border border-slate-200">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={activeOrder.mockup_url}
                    alt={activeOrder.design_title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div className="space-y-2 text-xs">
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">Maklumat Pelanggan</span>
                  <span className="font-bold text-slate-900 block">{activeOrder.customer_name}</span>
                  <span className="text-slate-500 font-mono">{activeOrder.customer_phone}</span>
                </div>

                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">Fabrik & Potongan</span>
                  <span className="text-slate-800 block font-medium">
                    {activeOrder.fabric_name || activeOrder.dtf_dimension_name}
                  </span>
                  {activeOrder.cut_name && (
                    <span className="text-slate-500 text-[11px] block">{activeOrder.cut_name}</span>
                  )}
                </div>

                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">Kewangan</span>
                  <span className="font-mono text-emerald-700 font-bold">
                    {formatCurrency(activeOrder.total_amount)} ({activeOrder.total_quantity} helai)
                  </span>
                </div>

                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">Alamat Penghantaran</span>
                  <span className="text-slate-600 text-[11px] block">{activeOrder.shipping_address}</span>
                </div>
              </div>
            </div>

            {/* Sizing Breakdown Matrix */}
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600 block">
                Pecahan Saiz Pakaian
              </span>
              <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                {Object.entries(activeOrder.sizing_breakdown || {}).map(([s, q]) => (
                  <div
                    key={s}
                    className="p-2 rounded-lg bg-slate-50 border border-slate-200 text-center"
                  >
                    <span className="text-[10px] text-slate-500 font-bold block">{s}</span>
                    <span className="text-xs font-bold font-mono text-slate-900">{q}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Status Update Form */}
            <form onSubmit={handleSaveStatus} className="space-y-4 pt-2 border-t border-slate-100">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-800 block">
                  Kemas Kini Status Produksi
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {STATUS_LIST.map((s) => {
                    const isSelected = newStatus === s.status;
                    return (
                      <button
                        key={s.status}
                        type="button"
                        onClick={() => setNewStatus(s.status)}
                        className={`p-2.5 rounded-xl border text-left text-xs font-semibold transition-all ${
                          isSelected
                            ? 'bg-[#0052FF] text-white border-[#0052FF] shadow-xs'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {s.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-800 block mb-1">
                  Nombor Tracking Kurier (Waybill / No Resi)
                </label>
                <input
                  type="text"
                  value={newTracking}
                  onChange={(e) => setNewTracking(e.target.value)}
                  placeholder="cth: JNT992019482 / PosLaju / NinjaVan"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0052FF]/30 font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-800 block mb-1">
                  Nota Dalaman Kilang
                </label>
                <textarea
                  rows={2}
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  placeholder="Nota untuk juruteknik cetak, kelompok dakwat, penyelia jahitan..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0052FF]/30"
                />
              </div>

              <div className="flex items-center space-x-3 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-xl bg-[#0052FF] hover:bg-blue-600 text-white font-bold text-xs shadow-xs transition-all flex items-center justify-center space-x-1.5"
                >
                  {updateSaved ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Status Berjaya Dikemaskini!</span>
                    </>
                  ) : (
                    <span>Simpan Perubahan Status</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

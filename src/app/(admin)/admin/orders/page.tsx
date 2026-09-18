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
  SlidersHorizontal,
  X
} from 'lucide-react';

const STATUS_LIST: { status: OrderStatus; label: string; color: string }[] = [
  { status: 'pending_proof', label: 'Menunggu Proof', color: 'bg-amber-50 text-amber-800 border-amber-200' },
  { status: 'proof_approved', label: 'Proof Diluluskan', color: 'bg-blue-50 text-[#0B57D0] border-blue-200' },
  { status: 'in_printing', label: 'Sedang Dicetak', color: 'bg-sky-50 text-sky-800 border-sky-200' },
  { status: 'heat_press', label: 'Heat Press', color: 'bg-orange-50 text-orange-800 border-orange-200' },
  { status: 'sewing', label: 'Jahitan', color: 'bg-purple-50 text-purple-800 border-purple-200' },
  { status: 'qc_check', label: 'QC', color: 'bg-teal-50 text-teal-800 border-teal-200' },
  { status: 'ready_to_ship', label: 'Sedia Dihantar', color: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
  { status: 'delivered', label: 'Selesai', color: 'bg-slate-100 text-slate-700 border-slate-200' },
  { status: 'cancelled', label: 'Batal', color: 'bg-red-50 text-red-700 border-red-200' },
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-normal text-slate-800 tracking-tight">
            Pesanan
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Status pengeluaran, spesifikasi saiz, dan nombor penjejakan
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-xs text-slate-600 bg-white border border-slate-200 px-3.5 py-1.5 rounded-full font-medium shadow-xs">
            {filteredOrders.length} Pesanan
          </span>
        </div>
      </div>

      {/* Toolbar & Filters */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari no. pesanan, pelanggan, atau nama rekaan..."
            className="w-full pl-9 pr-4 py-2 rounded-full bg-slate-50 hover:bg-slate-100/70 border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0B57D0]/20 focus:border-[#0B57D0] transition-all"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Filter Pills */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-full border border-slate-200">
            <button
              onClick={() => setFilterType('all')}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                filterType === 'all'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Semua
            </button>
            <button
              onClick={() => setFilterType('sublimation')}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                filterType === 'sublimation'
                  ? 'bg-[#C2E7FF] text-[#001D35] font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Sublimasi
            </button>
            <button
              onClick={() => setFilterType('dtf')}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                filterType === 'dtf'
                  ? 'bg-amber-100 text-amber-900 font-semibold'
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
            className="px-3.5 py-1.5 rounded-full bg-slate-50 border border-slate-200 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#0B57D0]/20 font-medium"
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
                  ? 'bg-white text-[#0B57D0] shadow-xs'
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
                  ? 'bg-white text-[#0B57D0] shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
              title="Paparan Grid"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area: Table vs Grid */}
      {viewMode === 'list' ? (
        <div className="rounded-2xl bg-white border border-slate-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50/80 text-slate-500 uppercase text-[11px] font-medium tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">No Pesanan</th>
                  <th className="py-3 px-4">Rekaan</th>
                  <th className="py-3 px-4">Pelanggan</th>
                  <th className="py-3 px-4">Spesifikasi</th>
                  <th className="py-3 px-4">Kuantiti</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Jumlah</th>
                  <th className="py-3 px-4 text-center">Tindakan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-normal">
                {filteredOrders.length > 0 ? (
                  filteredOrders.map((ord) => {
                    const statusObj = STATUS_LIST.find((s) => s.status === ord.status) || STATUS_LIST[0];

                    return (
                      <tr key={ord.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-medium text-[#0B57D0] whitespace-nowrap">
                          {ord.order_number}
                          <span className="text-[11px] text-slate-400 block font-normal font-sans">
                            {new Date(ord.created_at).toLocaleDateString()}
                          </span>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="flex items-center space-x-2.5">
                            {ord.mockup_url && (
                              <div className="w-9 h-9 rounded-lg overflow-hidden bg-slate-100 flex-shrink-0 border border-slate-200">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={ord.mockup_url}
                                  alt={ord.design_title}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            )}
                            <div>
                              <span className="font-medium text-slate-800 block line-clamp-1 max-w-[160px]">
                                {ord.design_title}
                              </span>
                              <span className="text-[10px] text-slate-500 uppercase">
                                {ord.print_type}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <span className="font-medium text-slate-800 block">{ord.customer_name}</span>
                          <span className="text-[11px] text-slate-500 font-mono block">{ord.customer_phone}</span>
                        </td>

                        <td className="py-3.5 px-4">
                          <span className="text-slate-700 block font-normal">
                            {ord.fabric_name || ord.dtf_dimension_name || 'Standard'}
                          </span>
                          {ord.cut_name && (
                            <span className="text-[11px] text-slate-500 block">{ord.cut_name}</span>
                          )}
                        </td>

                        <td className="py-3.5 px-4 font-mono">
                          <span className="font-medium text-slate-800 block">{ord.total_quantity} helai</span>
                          <div className="text-[10px] text-slate-500 flex flex-wrap gap-1 max-w-[120px] mt-0.5">
                            {Object.entries(ord.sizing_breakdown || {}).map(([s, q]) => {
                              if (Number(q) <= 0) return null;
                              return (
                                <span key={s} className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                                  {s}:{q}
                                </span>
                              );
                            })}
                          </div>
                        </td>

                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[11px] font-medium border ${statusObj.color}`}
                          >
                            {statusObj.label}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-right font-mono font-medium text-slate-800 whitespace-nowrap">
                          {formatCurrency(ord.total_amount)}
                        </td>

                        <td className="py-3.5 px-4 text-center">
                          <button
                            onClick={() => handleOpenEdit(ord)}
                            className="px-3 py-1.5 rounded-full bg-slate-100 hover:bg-[#C2E7FF] text-[#001D35] font-medium text-xs transition-all"
                          >
                            Status
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-slate-400">
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
                  className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between space-y-3"
                >
                  <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-3">
                    <div>
                      <span className="text-xs font-mono font-medium text-[#0B57D0] block">
                        {ord.order_number}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {new Date(ord.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-medium border ${statusObj.color}`}>
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
                      <p className="text-[11px] text-slate-400 font-mono truncate">{ord.customer_phone}</p>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-50 text-xs space-y-1">
                    <div className="flex justify-between text-slate-600">
                      <span>Kuantiti:</span>
                      <span className="font-medium text-slate-800">{ord.total_quantity} helai</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Spesifikasi:</span>
                      <span className="text-slate-800">{ord.fabric_name || ord.dtf_dimension_name || 'Standard'}</span>
                    </div>
                    <div className="flex justify-between text-slate-600 pt-1 border-t border-slate-200/60">
                      <span>Jumlah:</span>
                      <span className="font-medium font-mono text-[#0B57D0]">{formatCurrency(ord.total_amount)}</span>
                    </div>
                  </div>

                  <div className="pt-1">
                    <button
                      onClick={() => handleOpenEdit(ord)}
                      className="w-full py-2 rounded-full bg-slate-100 hover:bg-[#C2E7FF] text-[#001D35] font-medium text-xs transition-all"
                    >
                      Kemas Kini Status
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="col-span-full bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-400">
              Tiada pesanan dijumpai.
            </div>
          )}
        </div>
      )}

      {/* ===================== STATUS UPDATE MODAL ===================== */}
      {activeOrder && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white border border-slate-200 rounded-3xl p-6 space-y-5 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-xs font-mono font-medium text-[#0B57D0]">
                  {activeOrder.order_number}
                </span>
                <h3 className="text-base font-medium text-slate-800 mt-0.5">
                  {activeOrder.design_title}
                </h3>
              </div>
              <button
                onClick={() => setActiveOrder(null)}
                className="w-8 h-8 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 flex items-center justify-center transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Mockup Preview & Detailed Specs */}
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
              <div className="space-y-2 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase">Pelanggan</span>
                  <span className="font-medium text-slate-800 block">{activeOrder.customer_name}</span>
                  <span className="text-slate-500 font-mono text-[11px]">{activeOrder.customer_phone}</span>
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 block uppercase">Spesifikasi</span>
                  <span className="text-slate-700 block">
                    {activeOrder.fabric_name || activeOrder.dtf_dimension_name}
                  </span>
                  {activeOrder.cut_name && (
                    <span className="text-slate-500 text-[11px] block">{activeOrder.cut_name}</span>
                  )}
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 block uppercase">Jumlah</span>
                  <span className="font-mono text-slate-800 font-medium">
                    {formatCurrency(activeOrder.total_amount)} ({activeOrder.total_quantity} helai)
                  </span>
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 block uppercase">Alamat</span>
                  <span className="text-slate-600 text-[11px] block">{activeOrder.shipping_address}</span>
                </div>
              </div>
            </div>

            {/* Sizing Breakdown */}
            <div className="space-y-1.5">
              <span className="text-xs font-medium text-slate-700 block">
                Pecahan Saiz
              </span>
              <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5">
                {Object.entries(activeOrder.sizing_breakdown || {}).map(([s, q]) => (
                  <div
                    key={s}
                    className="p-1.5 rounded-lg bg-slate-50 border border-slate-200 text-center"
                  >
                    <span className="text-[10px] text-slate-500 block">{s}</span>
                    <span className="text-xs font-medium font-mono text-slate-800">{q}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Status Update Form */}
            <form onSubmit={handleSaveStatus} className="space-y-4 pt-2 border-t border-slate-100">
              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-700 block">
                  Pilih Status Pengeluaran
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {STATUS_LIST.map((s) => {
                    const isSelected = newStatus === s.status;
                    return (
                      <button
                        key={s.status}
                        type="button"
                        onClick={() => setNewStatus(s.status)}
                        className={`p-2 rounded-xl border text-left text-xs font-medium transition-all ${
                          isSelected
                            ? 'bg-[#C2E7FF] text-[#001D35] border-[#7FCFFF]'
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
                <label className="text-xs font-medium text-slate-700 block mb-1">
                  Nombor Tracking Kurier
                </label>
                <input
                  type="text"
                  value={newTracking}
                  onChange={(e) => setNewTracking(e.target.value)}
                  placeholder="Contoh: JNT992019482 / PosLaju"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0B57D0]/20 font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-700 block mb-1">
                  Nota Pengeluaran
                </label>
                <textarea
                  rows={2}
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  placeholder="Catatan tambahan untuk proses kerja..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0B57D0]/20"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveOrder(null)}
                  className="px-4 py-2 rounded-full text-xs font-medium text-slate-600 hover:bg-slate-100 transition-all"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-full bg-[#0B57D0] hover:bg-[#0842A0] text-white font-medium text-xs shadow-xs transition-all flex items-center space-x-1.5"
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
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

'use client';

import React, { useState, useMemo } from 'react';
import { useAppStore } from '@/lib/store/app-store';
import { formatCurrency } from '@/lib/pricing-calculator';
import { Order, OrderStatus } from '@/types/database';
import {
  ClipboardList,
  Search,
  Filter,
  Eye,
  CheckCircle2,
  Clock,
  Truck,
  Layers,
  ArrowRight,
  ShieldAlert,
  ChevronDown,
  Printer,
  Scissors,
  Check
} from 'lucide-react';

const STATUS_LIST: { status: OrderStatus; label: string; color: string }[] = [
  { status: 'pending_proof', label: 'Pending Proof', color: 'bg-rose-500/10 text-rose-400 border-rose-500/20' },
  { status: 'proof_approved', label: 'Proof Approved', color: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' },
  { status: 'in_printing', label: 'In Printing', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  { status: 'heat_press', label: 'Heat Press / Curing', color: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
  { status: 'sewing', label: 'Sewing & Assembly', color: 'bg-purple-500/10 text-purple-400 border-purple-500/20' },
  { status: 'qc_check', label: 'Quality Check', color: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' },
  { status: 'ready_to_ship', label: 'Ready to Ship', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  { status: 'delivered', label: 'Delivered', color: 'bg-slate-500/10 text-slate-400 border-slate-500/20' },
  { status: 'cancelled', label: 'Cancelled', color: 'bg-red-500/10 text-red-400 border-red-500/20' },
];

export default function AdminOrdersPage() {
  const { orders, updateOrderStatus } = useAppStore();

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
          <h1 className="text-2xl font-extrabold text-white tracking-tight">
            Production Order Pipeline
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Track, update status, inspect mockups, and assign tracking numbers.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-xs font-bold text-slate-300 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl">
            {filteredOrders.length} matching jobs
          </span>
        </div>
      </div>

      {/* Filters & Search Toolbar */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search order #, customer, or design name..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Print Type Filter */}
        <div className="flex items-center space-x-2">
          <div className="bg-slate-950 p-1 rounded-xl border border-slate-800 flex items-center">
            <button
              onClick={() => setFilterType('all')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                filterType === 'all'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All Types
            </button>
            <button
              onClick={() => setFilterType('sublimation')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                filterType === 'sublimation'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Sublimation
            </button>
            <button
              onClick={() => setFilterType('dtf')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                filterType === 'dtf'
                  ? 'bg-orange-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              DTF
            </button>
          </div>

          {/* Status Dropdown */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Pipeline Stages</option>
            {STATUS_LIST.map((s) => (
              <option key={s.status} value={s.status}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Orders Data Table */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] font-bold tracking-wider border-b border-slate-800">
              <tr>
                <th className="p-3.5">Order Number</th>
                <th className="p-3.5">Design & Preview</th>
                <th className="p-3.5">Customer & Contact</th>
                <th className="p-3.5">Technique & Specs</th>
                <th className="p-3.5">Qty & Sizes</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right">Total Quote</th>
                <th className="p-3.5 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 font-medium">
              {filteredOrders.length > 0 ? (
                filteredOrders.map((ord) => {
                  const statusObj = STATUS_LIST.find((s) => s.status === ord.status) || STATUS_LIST[0];

                  return (
                    <tr key={ord.id} className="hover:bg-slate-800/50 transition-colors">
                      {/* Order Number */}
                      <td className="p-3.5 font-mono font-bold text-blue-400 whitespace-nowrap">
                        {ord.order_number}
                        <span className="text-[10px] text-slate-500 block font-normal">
                          {new Date(ord.created_at).toLocaleDateString()}
                        </span>
                      </td>

                      {/* Design & Preview Thumbnail */}
                      <td className="p-3.5">
                        <div className="flex items-center space-x-2.5">
                          {ord.mockup_url && (
                            <div className="w-10 h-10 rounded-lg overflow-hidden bg-slate-800 flex-shrink-0 border border-slate-700">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={ord.mockup_url}
                                alt={ord.design_title}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          )}
                          <div>
                            <span className="font-bold text-slate-200 block line-clamp-1 max-w-[160px]">
                              {ord.design_title}
                            </span>
                            <span className="text-[10px] text-slate-500">
                              {ord.print_type.toUpperCase()}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Customer */}
                      <td className="p-3.5">
                        <span className="font-bold text-slate-200 block">{ord.customer_name}</span>
                        <span className="text-[10px] text-slate-400 font-mono block">{ord.customer_phone}</span>
                      </td>

                      {/* Technique & Specs */}
                      <td className="p-3.5">
                        <span className="text-slate-300 block font-medium">
                          {ord.fabric_name || ord.dtf_dimension_name || 'Standard'}
                        </span>
                        {ord.cut_name && (
                          <span className="text-[10px] text-slate-500 block">Cut: {ord.cut_name}</span>
                        )}
                      </td>

                      {/* Qty & Sizes */}
                      <td className="p-3.5 font-mono">
                        <span className="font-bold text-slate-200 block">{ord.total_quantity} pcs</span>
                        <div className="text-[10px] text-slate-400 flex flex-wrap gap-1 max-w-[120px]">
                          {Object.entries(ord.sizing_breakdown || {}).map(([s, q]) => {
                            if (Number(q) <= 0) return null;
                            return (
                              <span key={s} className="px-1 py-0.2 rounded bg-slate-800 text-slate-300">
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
                      <td className="p-3.5 text-right font-mono font-bold text-slate-200 whitespace-nowrap">
                        {formatCurrency(ord.total_amount)}
                      </td>

                      {/* Action */}
                      <td className="p-3.5 text-center">
                        <button
                          onClick={() => handleOpenEdit(ord)}
                          className="px-3 py-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600 text-blue-400 hover:text-white font-semibold text-xs transition-all border border-blue-500/30"
                        >
                          Inspect & Status
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-500">
                    No orders matching selected criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ===================== STATUS UPDATE DRAWER / MODAL ===================== */}
      {activeOrder && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-mono font-bold text-blue-400">
                    {activeOrder.order_number}
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.2 rounded uppercase bg-slate-800 text-slate-300">
                    {activeOrder.print_type}
                  </span>
                </div>
                <h3 className="text-base font-bold text-white mt-0.5">
                  {activeOrder.design_title}
                </h3>
              </div>
              <button
                onClick={() => setActiveOrder(null)}
                className="text-xs text-slate-400 hover:text-white p-1 font-semibold"
              >
                Close
              </button>
            </div>

            {/* Mockup Preview & Detailed Specs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-950 p-4 rounded-xl border border-slate-800">
              {activeOrder.mockup_url && (
                <div className="aspect-square rounded-lg overflow-hidden bg-slate-900 border border-slate-800">
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
                  <span className="text-[10px] font-bold uppercase text-slate-500 block">Customer Info</span>
                  <span className="font-bold text-slate-200 block">{activeOrder.customer_name}</span>
                  <span className="text-slate-400 font-mono">{activeOrder.customer_phone}</span>
                </div>

                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-500 block">Fabric & Cut</span>
                  <span className="text-slate-300 block font-medium">
                    {activeOrder.fabric_name || activeOrder.dtf_dimension_name}
                  </span>
                  {activeOrder.cut_name && (
                    <span className="text-slate-400 text-[11px] block">{activeOrder.cut_name}</span>
                  )}
                </div>

                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-500 block">Financials</span>
                  <span className="font-mono text-emerald-400 font-bold">
                    {formatCurrency(activeOrder.total_amount)} ({activeOrder.total_quantity} pcs)
                  </span>
                </div>

                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-500 block">Delivery Address</span>
                  <span className="text-slate-400 text-[11px] block">{activeOrder.shipping_address}</span>
                </div>
              </div>
            </div>

            {/* Sizing Breakdown Matrix */}
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                Garment Sizing Matrix
              </span>
              <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                {Object.entries(activeOrder.sizing_breakdown || {}).map(([s, q]) => (
                  <div
                    key={s}
                    className="p-2 rounded-lg bg-slate-950 border border-slate-800 text-center"
                  >
                    <span className="text-[10px] text-slate-500 font-bold block">{s}</span>
                    <span className="text-xs font-bold font-mono text-white">{q}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Status Update Form */}
            <form onSubmit={handleSaveStatus} className="space-y-4 pt-2 border-t border-slate-800">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-200 block">
                  Update Production Status
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
                            ? 'bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-600/30'
                            : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                        }`}
                      >
                        {s.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-200 block mb-1">
                  Courier Tracking Number (Waybill / Resi)
                </label>
                <input
                  type="text"
                  value={newTracking}
                  onChange={(e) => setNewTracking(e.target.value)}
                  placeholder="e.g. JNE-992019482 / SiCepat / J&T"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-200 block mb-1">
                  Internal Production Notes
                </label>
                <textarea
                  rows={2}
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  placeholder="Notes for print technician, ink batch, sewing supervisor..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center space-x-3 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-600/20 transition-all flex items-center justify-center space-x-1.5"
                >
                  {updateSaved ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Pipeline Updated!</span>
                    </>
                  ) : (
                    <span>Save & Notify Customer</span>
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

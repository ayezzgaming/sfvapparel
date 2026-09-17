'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { useAppStore } from '@/lib/store/app-store';
import { formatCurrency } from '@/lib/pricing-calculator';
import {
  TrendingUp,
  DollarSign,
  Layers,
  Printer,
  Package,
  Users,
  ArrowUpRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  Sparkles
} from 'lucide-react';

export default function AdminDashboardPage() {
  const { orders, designs, customers, fabrics } = useAppStore();

  // Metrics computation
  const totalRevenue = useMemo(() => {
    return orders.reduce((sum, ord) => sum + (ord.total_amount || 0), 0);
  }, [orders]);

  const sublimationOrders = useMemo(() => {
    return orders.filter((o) => o.print_type === 'sublimation');
  }, [orders]);

  const dtfOrders = useMemo(() => {
    return orders.filter((o) => o.print_type === 'dtf');
  }, [orders]);

  const totalApparelPieces = useMemo(() => {
    return orders.reduce((sum, ord) => sum + (ord.total_quantity || 0), 0);
  }, [orders]);

  const pendingProofCount = useMemo(() => {
    return orders.filter((o) => o.status === 'pending_proof').length;
  }, [orders]);

  const inProductionCount = useMemo(() => {
    return orders.filter((o) => ['proof_approved', 'in_printing', 'heat_press', 'sewing', 'qc_check'].includes(o.status)).length;
  }, [orders]);

  return (
    <div className="space-y-6">
      {/* Top Welcome & KPI Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-extrabold text-white tracking-tight">
              Production Dashboard
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs font-semibold">
              Live Factory Metrics
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time pipeline monitoring for Sublimation Dye Presses and DTF Direct Transfer Systems.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <Link
            href="/admin/orders"
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-md shadow-blue-600/20 flex items-center space-x-1.5"
          >
            <span>Manage Orders</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
          <Link
            href="/admin/pricing-rules"
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-all border border-slate-700 flex items-center space-x-1.5"
          >
            <span>Pricing Config</span>
          </Link>
        </div>
      </div>

      {/* KPI Stats Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Revenue */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Total Order Revenue</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div>
            <span className="text-2xl font-black text-white font-mono block">
              {formatCurrency(totalRevenue)}
            </span>
            <div className="flex items-center space-x-1 text-emerald-400 text-xs mt-1 font-medium">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>+18.4% this month</span>
            </div>
          </div>
        </div>

        {/* Card 2: Total Apparel Output */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Apparel Pieces Queued</span>
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center justify-center">
              <Package className="w-5 h-5" />
            </div>
          </div>
          <div>
            <span className="text-2xl font-black text-white font-mono block">
              {totalApparelPieces} <span className="text-sm font-normal text-slate-400">pcs</span>
            </span>
            <div className="flex items-center space-x-2 text-xs text-slate-400 mt-1">
              <span>{sublimationOrders.length} Sublimation</span>
              <span>•</span>
              <span>{dtfOrders.length} DTF</span>
            </div>
          </div>
        </div>

        {/* Card 3: Active Production Pipeline */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">In Active Production</span>
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center">
              <Layers className="w-5 h-5" />
            </div>
          </div>
          <div>
            <span className="text-2xl font-black text-white font-mono block">
              {inProductionCount} <span className="text-sm font-normal text-slate-400">batches</span>
            </span>
            <div className="flex items-center space-x-1 text-amber-400 text-xs mt-1 font-medium">
              <Clock className="w-3.5 h-3.5" />
              <span>Heat press & sewing active</span>
            </div>
          </div>
        </div>

        {/* Card 4: Proof Verification Queue */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Pending Proof Approval</span>
            <div className="w-9 h-9 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center justify-center">
              <AlertCircle className="w-5 h-5" />
            </div>
          </div>
          <div>
            <span className="text-2xl font-black text-white font-mono block">
              {pendingProofCount} <span className="text-sm font-normal text-slate-400">orders</span>
            </span>
            <div className="text-xs text-slate-400 mt-1">
              Requires artwork prep & vector review
            </div>
          </div>
        </div>
      </div>

      {/* Production Technique Breakdown + Hardware Monitors */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Production Workload & Recent Pipeline */}
        <div className="lg:col-span-2 space-y-6">
          {/* Workload Bars */}
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white">Technique Output Distribution</h3>
                <p className="text-xs text-slate-400">Volume breakdown by apparel printing method</p>
              </div>
              <span className="text-xs font-mono text-slate-400 font-semibold">
                {orders.length} total orders
              </span>
            </div>

            <div className="space-y-3">
              {/* Sublimation bar */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-semibold text-blue-400 flex items-center space-x-1.5">
                    <span className="w-2 h-2 rounded-full bg-blue-500" />
                    <span>Sublimation Dye Printing (Jerseys & Kits)</span>
                  </span>
                  <span className="font-mono text-slate-300 font-bold">
                    {sublimationOrders.length} orders ({Math.round((sublimationOrders.length / (orders.length || 1)) * 100)}%)
                  </span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="bg-blue-500 h-full rounded-full"
                    style={{
                      width: `${(sublimationOrders.length / (orders.length || 1)) * 100}%`,
                    }}
                  />
                </div>
              </div>

              {/* DTF bar */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-semibold text-orange-400 flex items-center space-x-1.5">
                    <span className="w-2 h-2 rounded-full bg-orange-500" />
                    <span>DTF Direct Transfer (Gang Sheets & Cotton Tees)</span>
                  </span>
                  <span className="font-mono text-slate-300 font-bold">
                    {dtfOrders.length} orders ({Math.round((dtfOrders.length / (orders.length || 1)) * 100)}%)
                  </span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="bg-orange-500 h-full rounded-full"
                    style={{
                      width: `${(dtfOrders.length / (orders.length || 1)) * 100}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Recent Orders Table */}
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white">Latest Production Tickets</h3>
                <p className="text-xs text-slate-400">Incoming custom jobs from Mobile PWA</p>
              </div>
              <Link
                href="/admin/orders"
                className="text-xs font-semibold text-blue-400 hover:text-blue-300 flex items-center space-x-1"
              >
                <span>View Full Pipeline</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] font-bold tracking-wider">
                  <tr>
                    <th className="p-3 rounded-l-xl">Order #</th>
                    <th className="p-3">Customer / Team</th>
                    <th className="p-3">Method</th>
                    <th className="p-3">Quantity</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 rounded-r-xl text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 font-medium">
                  {orders.slice(0, 5).map((ord) => (
                    <tr key={ord.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="p-3 font-mono font-bold text-blue-400">
                        {ord.order_number}
                      </td>
                      <td className="p-3">
                        <span className="font-bold text-slate-200 block">{ord.customer_name}</span>
                        <span className="text-[10px] text-slate-500 line-clamp-1">{ord.design_title}</span>
                      </td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            ord.print_type === 'sublimation'
                              ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                              : 'bg-orange-500/10 text-orange-400 border border-orange-500/20'
                          }`}
                        >
                          {ord.print_type}
                        </span>
                      </td>
                      <td className="p-3 font-mono text-slate-300">{ord.total_quantity} pcs</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-800 text-slate-300 border border-slate-700 capitalize">
                          {ord.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-slate-200">
                        {formatCurrency(ord.total_amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right 1 Col: Production Hardware Status & Quick Actions */}
        <div className="space-y-6">
          {/* Quick Hardware / Materials Status */}
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center space-x-2">
              <Printer className="w-4 h-4 text-blue-400" />
              <span>Factory Hardware Status</span>
            </h3>

            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-200 block">
                    EPSON SureColor F9430H
                  </span>
                  <span className="text-[10px] text-slate-500">Fluorescent Sublimation Dye</span>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Ready (98%)
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-200 block">
                    Audley DTF 60cm Double I3200
                  </span>
                  <span className="text-[10px] text-slate-500">Auto Powder Shaker & Dryer</span>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Ready (100%)
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-200 block">
                    Monti Antonio Calender Heat Press
                  </span>
                  <span className="text-[10px] text-slate-500">Drum Temp: 205°C Target</span>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  Standby
                </span>
              </div>
            </div>
          </div>

          {/* Quick System Shortlinks */}
          <div className="p-6 rounded-2xl bg-gradient-to-br from-blue-950/60 to-slate-900 border border-blue-900/40 space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-400 block">
              Quick Admin Operations
            </span>

            <div className="space-y-2">
              <Link
                href="/admin/catalog"
                className="w-full p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-semibold text-slate-200 flex items-center justify-between transition-colors"
              >
                <span>Upload New Design Mockup</span>
                <ChevronRight className="w-4 h-4 text-slate-500" />
              </Link>

              <Link
                href="/admin/pricing-rules"
                className="w-full p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-semibold text-slate-200 flex items-center justify-between transition-colors"
              >
                <span>Adjust Base Fabric & Cut Rates</span>
                <ChevronRight className="w-4 h-4 text-slate-500" />
              </Link>

              <Link
                href="/admin/customers"
                className="w-full p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-semibold text-slate-200 flex items-center justify-between transition-colors"
              >
                <span>View Customer Registry</span>
                <ChevronRight className="w-4 h-4 text-slate-500" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

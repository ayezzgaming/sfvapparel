'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Users,
  Search,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowDownLeft,
  DollarSign,
  ExternalLink,
  ChevronRight,
  Filter,
  Check
} from 'lucide-react';
import { FaWhatsapp } from 'react-icons/fa6';
import { getCustomerReceivables, markOrderBalanceCollected } from '@/app/actions/financeActions';
import { Order } from '@/types/database';
import { toast } from '@/components/ui/Toast';

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('ms-MY', {
    style: 'currency',
    currency: 'MYR',
    minimumFractionDigits: 2,
  }).format(amount || 0);
}

export default function AdminFinanceReceivablesPage() {
  const [receivables, setReceivables] = useState<
    Array<{
      order: Order;
      totalAmount: number;
      depositPaid: number;
      balancePending: number;
      dueDate?: string;
    }>
  >([]);
  const [totalReceivable, setTotalReceivable] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const loadData = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const res = await getCustomerReceivables();
      if (res.success) {
        setReceivables(res.data || []);
        setTotalReceivable(res.totalReceivable || 0);
      }
    } catch (err) {
      console.error('Error fetching receivables:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredReceivables = useMemo(() => {
    if (!searchQuery.trim()) return receivables;
    const q = searchQuery.toLowerCase();
    return receivables.filter(
      (r) =>
        r.order.order_number?.toLowerCase().includes(q) ||
        r.order.customer_name?.toLowerCase().includes(q) ||
        r.order.customer_phone?.toLowerCase().includes(q) ||
        r.order.design_title?.toLowerCase().includes(q)
    );
  }, [receivables, searchQuery]);

  const handleMarkCollected = async (orderId: string, balance: number) => {
    if (!confirm(`Sahkan kutipan baki penuh ${formatCurrency(balance)} untuk pesanan ini? Status pesanan akan bertukar kepada Bayaran Penuh (fully_paid).`)) {
      return;
    }

    setActionLoadingId(orderId);
    try {
      const res = await markOrderBalanceCollected(orderId, balance);
      if (res.success) {
        loadData(true);
        toast.success('Baki Direkod', 'Kutipan baki pesanan berjaya direkod.');
      } else {
        toast.error('Gagal Merekod', res.message || 'Gagal merekod kutipan baki.');
      }
    } catch (err) {
      console.error(err);
      toast.error('Ralat Sistem', 'Ralat semasa merekod kutipan.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const generateWhatsAppReminderUrl = (order: Order, balance: number) => {
    let cleanPhone = order.customer_phone?.replace(/[^0-9]/g, '') || '';
    if (cleanPhone.startsWith('0')) cleanPhone = '60' + cleanPhone.slice(1);
    else if (!cleanPhone.startsWith('60')) cleanPhone = '60' + cleanPhone;

    const msg = `Salam sejahtera ${order.customer_name},\n\n` +
      `Pesanan jersi anda (*#${order.order_number || order.id.slice(0, 8)}* - ${order.design_title || 'Tempahan Jersi'}) kini sedang diproses / siap untuk penghantaran.\n\n` +
      `📌 *Ringkasan Baki Bayaran:*\n` +
      `• Jumlah Keseluruhan: ${formatCurrency(Number(order.total_amount) || 0)}\n` +
      `• Baki Tertunggak: *${formatCurrency(balance)}*\n\n` +
      `Sila buat bayaran baki ke akaun syarikat SVF APPAREL dan hantarkan resit bayaran di sini untuk kami teruskan penghantaran.\n\n` +
      `Terima kasih atas sokongan anda! ✨`;

    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`;
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Kutipan Baki Pelanggan (A/R)</h1>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
              Accounts Receivable
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Pantau baki 50% atau pesanan belum selesai bayaran dan hantar peringatan rasmi WhatsApp 1-klik.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => loadData(true)}
            disabled={refreshing || loading}
            title="Muat semula data"
            className="p-2.5 text-gray-500 hover:text-[#00BDFF] hover:bg-sky-50 rounded-xl border border-gray-200 transition-colors bg-white shadow-sm"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-[#00BDFF]' : ''}`} />
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Receivables */}
        <div className="bg-white rounded-2xl p-5 border border-gray-200/80 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Jumlah Baki Tertunggak</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2">
            <h3 className="text-2xl font-bold text-emerald-600">
              {loading ? '...' : formatCurrency(totalReceivable)}
            </h3>
            <p className="text-xs text-gray-500 mt-1">Baki kutipan yang menunggu penyelesaian pelanggan</p>
          </div>
        </div>

        {/* Orders Count */}
        <div className="bg-white rounded-2xl p-5 border border-gray-200/80 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Bilangan Pesanan Belum Selesai</span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#00BDFF] flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2">
            <h3 className="text-2xl font-bold text-gray-900">
              {loading ? '...' : receivables.length} <span className="text-sm font-normal text-gray-500">Pesanan</span>
            </h3>
            <p className="text-xs text-gray-500 mt-1">Deposit 50% atau belum terima baki akhir</p>
          </div>
        </div>

        {/* Average Receivable */}
        <div className="bg-white rounded-2xl p-5 border border-gray-200/80 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Purata Baki / Pesanan</span>
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2">
            <h3 className="text-2xl font-bold text-gray-900">
              {loading ? '...' : receivables.length > 0 ? formatCurrency(totalReceivable / receivables.length) : 'RM 0.00'}
            </h3>
            <p className="text-xs text-gray-500 mt-1">Nilai purata kutipan tertunggak</p>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="text-xs font-semibold text-gray-700">
          Senarai Pesanan Menunggu Kutipan Baki ({filteredReceivables.length})
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari nama pelanggan, no. tel, ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00BDFF] focus:border-transparent transition-all shadow-sm"
          />
        </div>
      </div>

      {/* Receivables Table */}
      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-gray-500">
            <RefreshCw className="w-6 h-6 animate-spin text-[#00BDFF] mx-auto mb-2" />
            <p className="text-xs">Memuatkan senarai kutipan baki...</p>
          </div>
        ) : filteredReceivables.length === 0 ? (
          <div className="py-16 text-center text-gray-500">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-3" />
            <p className="text-sm font-semibold text-gray-700">Semua kutipan pelanggan telah selesai!</p>
            <p className="text-xs text-gray-400 mt-1">Tiada baki tertunggak untuk pesanan semasa.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-gray-50/80 border-b border-gray-200 text-gray-500 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">No. Pesanan</th>
                  <th className="py-3 px-4">Maklumat Pelanggan</th>
                  <th className="py-3 px-4">Status Semasa</th>
                  <th className="py-3 px-4 text-right">Jumlah Pesanan</th>
                  <th className="py-3 px-4 text-right">Deposit Dibayar</th>
                  <th className="py-3 px-4 text-right font-bold text-gray-900">Baki Tertunggak</th>
                  <th className="py-3 px-4 text-center">Tindakan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredReceivables.map(({ order, totalAmount, depositPaid, balancePending }) => (
                  <tr key={order.id} className="hover:bg-sky-50/40 transition-colors">
                    {/* Order Number */}
                    <td className="py-3.5 px-4 font-mono font-bold text-gray-900">
                      <Link
                        href={`/admin/orders?search=${order.order_number || order.id}`}
                        className="hover:text-[#00BDFF] transition-colors"
                      >
                        {order.order_number || `#${order.id.slice(0, 8)}`}
                      </Link>
                      <div className="text-[10px] text-gray-400 font-normal">
                        {order.created_at ? new Date(order.created_at).toLocaleDateString('ms-MY') : '-'}
                      </div>
                    </td>

                    {/* Customer */}
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-gray-900">{order.customer_name || 'Pelanggan'}</div>
                      <div className="text-[11px] text-gray-500">{order.customer_phone || '-'}</div>
                      {order.design_title && (
                        <div className="text-[10px] text-[#00BDFF] font-medium">{order.design_title}</div>
                      )}
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                          order.payment_status === 'deposit_paid'
                            ? 'bg-blue-50 text-[#00BDFF] border border-blue-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {order.payment_status === 'deposit_paid' ? 'Deposit 50% Dibayar' : 'Belum Bayar'}
                      </span>
                    </td>

                    {/* Total Amount */}
                    <td className="py-3.5 px-4 text-right font-medium text-gray-700">
                      {formatCurrency(totalAmount)}
                    </td>

                    {/* Deposit Paid */}
                    <td className="py-3.5 px-4 text-right text-emerald-600 font-medium">
                      {formatCurrency(depositPaid)}
                    </td>

                    {/* Balance Pending */}
                    <td className="py-3.5 px-4 text-right">
                      <span className="font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-100">
                        {formatCurrency(balancePending)}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center justify-center gap-1.5">
                        {/* 1-Click WhatsApp Reminder */}
                        <a
                          href={generateWhatsAppReminderUrl(order, balancePending)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-[#25D366] hover:bg-[#20ba59] text-white text-[11px] font-semibold rounded-lg shadow-sm transition-all"
                          title="Hantar Peringatan Baki WhatsApp"
                        >
                          <FaWhatsapp className="w-3.5 h-3.5" />
                          <span>Peringatan WA</span>
                        </a>

                        {/* Mark Paid Button */}
                        <button
                          onClick={() => handleMarkCollected(order.id, balancePending)}
                          disabled={actionLoadingId === order.id}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-semibold rounded-lg shadow-sm transition-all disabled:opacity-50"
                          title="Tandakan Telah Dibayar Penuh"
                        >
                          {actionLoadingId === order.id ? (
                            <RefreshCw className="w-3 h-3 animate-spin" />
                          ) : (
                            <Check className="w-3 h-3" />
                          )}
                          <span>Selesai Bayar</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

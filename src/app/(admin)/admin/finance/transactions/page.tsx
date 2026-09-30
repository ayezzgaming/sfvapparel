'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { toast } from '@/components/ui/Toast';
import {
  CreditCard,
  Plus,
  Search,
  RefreshCw,
  ArrowDownLeft,
  ArrowUpRight,
  TrendingDown,
  Building2,
  Megaphone,
  Briefcase,
  Trash2,
  Edit2,
  X,
  CheckCircle2,
  AlertCircle,
  FileText,
  Calendar,
  Layers,
  Filter
} from 'lucide-react';
import {
  getFinancialTransactions,
  getOperatingExpenses,
  saveOperatingExpense,
  deleteOperatingExpense
} from '@/app/actions/financeActions';
import {
  FinancialTransaction,
  OperatingExpense,
  ExpenseCategory,
  PaymentMethod
} from '@/types/database';

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('ms-MY', {
    style: 'currency',
    currency: 'MYR',
    minimumFractionDigits: 2,
  }).format(amount || 0);
}

const CATEGORY_MAP: Record<ExpenseCategory, { label: string; group: 'ads' | 'opex' }> = {
  ads_meta: { label: 'Iklan Meta (FB/IG)', group: 'ads' },
  ads_google: { label: 'Iklan Google Ads', group: 'ads' },
  ads_tiktok: { label: 'Iklan TikTok Ads', group: 'ads' },
  utilities_rent: { label: 'Sewa & Utiliti Pejabat', group: 'opex' },
  staff_salary: { label: 'Gaji & Elaun Staf/Pereka', group: 'opex' },
  software_saas: { label: 'Langganan Software & Server', group: 'opex' },
  packaging_logistic: { label: 'Bungkusan & Kurier Ekstra', group: 'opex' },
  general_opex: { label: 'Kos Operasi Umum', group: 'opex' },
};

export default function AdminFinanceTransactionsPage() {
  const [activeTab, setActiveTab] = useState<'all' | 'inflow' | 'outflow_factory' | 'outflow_expenses'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [transactions, setTransactions] = useState<FinancialTransaction[]>([]);
  const [expenses, setExpenses] = useState<OperatingExpense[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Expense Modal State
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [expenseSubmitting, setExpenseSubmitting] = useState(false);
  const [expenseError, setExpenseError] = useState<string | null>(null);
  const [expenseFormData, setExpenseFormData] = useState<{
    id?: string;
    category: ExpenseCategory;
    title: string;
    amount: number;
    expense_date: string;
    payment_method: PaymentMethod;
    vendor_merchant: string;
    notes: string;
  }>({
    category: 'ads_meta',
    title: '',
    amount: 0,
    expense_date: new Date().toISOString().split('T')[0],
    payment_method: 'bank_transfer',
    vendor_merchant: '',
    notes: '',
  });

  const loadData = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const [trxRes, expRes] = await Promise.all([
        getFinancialTransactions(),
        getOperatingExpenses(),
      ]);

      if (trxRes.success) setTransactions(trxRes.data || []);
      if (expRes.success) setExpenses(expRes.data || []);
    } catch (err) {
      console.error('Error fetching transactions:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenNewExpense = () => {
    setExpenseFormData({
      id: undefined,
      category: 'ads_meta',
      title: '',
      amount: 0,
      expense_date: new Date().toISOString().split('T')[0],
      payment_method: 'bank_transfer',
      vendor_merchant: '',
      notes: '',
    });
    setExpenseError(null);
    setIsExpenseModalOpen(true);
  };

  const handleEditExpense = (item: OperatingExpense) => {
    setExpenseFormData({
      id: item.id,
      category: item.category,
      title: item.title,
      amount: item.amount,
      expense_date: item.expense_date,
      payment_method: (item.payment_method as PaymentMethod) || 'bank_transfer',
      vendor_merchant: item.vendor_merchant || '',
      notes: item.notes || '',
    });
    setExpenseError(null);
    setIsExpenseModalOpen(true);
  };

  const handleSubmitExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expenseFormData.title.trim()) {
      setExpenseError('Sila masukkan penerangan atau tajuk perbelanjaan.');
      return;
    }
    if (expenseFormData.amount <= 0) {
      setExpenseError('Jumlah perbelanjaan mestilah lebih daripada RM 0.00.');
      return;
    }

    setExpenseSubmitting(true);
    setExpenseError(null);

    try {
      const res = await saveOperatingExpense(expenseFormData);
      if (res.success) {
        setIsExpenseModalOpen(false);
        loadData(true);
      } else {
        setExpenseError(res.message || 'Gagal menyimpan perbelanjaan.');
      }
    } catch (err: unknown) {
      setExpenseError(err instanceof Error ? err.message : 'Ralat semasa menyimpan perbelanjaan.');
    } finally {
      setExpenseSubmitting(false);
    }
  };

  const handleDeleteExpense = async (id: string) => {
    if (!confirm('Adakah anda pasti untuk memadam rekod perbelanjaan ini?')) return;
    try {
      const res = await deleteOperatingExpense(id);
      if (res.success) {
        loadData(true);
        toast.success('Perbelanjaan Dipadam', 'Rekod perbelanjaan berjaya dipadam.');
      } else {
        toast.error('Gagal Memadam', res.message || 'Gagal memadam.');
      }
    } catch (err) {
      console.error(err);
      toast.error('Ralat Sistem', 'Ralat semasa memadam rekod.');
    }
  };

  // Filtered Transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter((trx) => {
      // Tab filter
      if (activeTab === 'inflow' && trx.transaction_type !== 'customer_payment') return false;
      if (activeTab === 'outflow_factory' && trx.transaction_type !== 'factory_payout') return false;
      if (activeTab === 'outflow_expenses' && trx.transaction_type !== 'opex_expense') return false;

      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchNum = trx.transaction_number?.toLowerCase().includes(q);
        const matchDesc = trx.description?.toLowerCase().includes(q);
        const matchMethod = trx.payment_method?.toLowerCase().includes(q);
        return matchNum || matchDesc || matchMethod;
      }
      return true;
    });
  }, [transactions, activeTab, searchQuery]);

  // Aggregate Stats
  const totalInflows = useMemo(() => {
    return transactions
      .filter((t) => t.transaction_type === 'customer_payment')
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
  }, [transactions]);

  const totalFactoryOutflows = useMemo(() => {
    return transactions
      .filter((t) => t.transaction_type === 'factory_payout')
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
  }, [transactions]);

  const totalExpenseOutflows = useMemo(() => {
    return transactions
      .filter((t) => t.transaction_type === 'opex_expense')
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
  }, [transactions]);

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Lejar Transaksi & Perbelanjaan</h1>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-100 text-[#00BDFF]">
              Buku Tunai Agensi
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Rekod lengkap aliran wang masuk jualan pelanggan dan aliran keluar kos kilang serta perbelanjaan operasi / iklan.
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

          <button
            onClick={handleOpenNewExpense}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#00BDFF] hover:bg-[#00a6e0] text-white text-sm font-semibold rounded-xl shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Rekod Perbelanjaan Baru</span>
          </button>
        </div>
      </div>

      {/* Mini Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-4 border border-gray-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600">Aliran Masuk (Inflow)</span>
            <p className="text-xl font-bold text-gray-900 mt-1">{formatCurrency(totalInflows)}</p>
            <p className="text-[11px] text-gray-500">Bayaran deposit & baki pelanggan</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <ArrowDownLeft className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-gray-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-600">Kos Kilang (COGS Outflow)</span>
            <p className="text-xl font-bold text-gray-900 mt-1">{formatCurrency(totalFactoryOutflows)}</p>
            <p className="text-[11px] text-gray-500">Bayaran ke kilang sublimasi</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Building2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-gray-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-rose-600">Iklan & Overhed (OPEX)</span>
            <p className="text-xl font-bold text-gray-900 mt-1">{formatCurrency(totalExpenseOutflows)}</p>
            <p className="text-[11px] text-gray-500">Ads Meta/Google + Sewa + Gaji</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
            <ArrowUpRight className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Subtabs */}
        <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-xl p-1 shadow-sm overflow-x-auto text-xs font-medium">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-all ${
              activeTab === 'all' ? 'bg-[#00BDFF] text-white font-semibold shadow-sm' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Semua Transaksi ({transactions.length})
          </button>
          <button
            onClick={() => setActiveTab('inflow')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-all ${
              activeTab === 'inflow' ? 'bg-[#00BDFF] text-white font-semibold shadow-sm' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Jualan Masuk
          </button>
          <button
            onClick={() => setActiveTab('outflow_factory')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-all ${
              activeTab === 'outflow_factory' ? 'bg-[#00BDFF] text-white font-semibold shadow-sm' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Bayaran Kilang
          </button>
          <button
            onClick={() => setActiveTab('outflow_expenses')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-all ${
              activeTab === 'outflow_expenses' ? 'bg-[#00BDFF] text-white font-semibold shadow-sm' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Iklan & OPEX ({expenses.length})
          </button>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari no rujukan / keterangan..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00BDFF] focus:border-transparent transition-all shadow-sm"
          />
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-gray-500">
            <RefreshCw className="w-6 h-6 animate-spin text-[#00BDFF] mx-auto mb-2" />
            <p className="text-xs">Memuatkan lejar transaksi...</p>
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="py-16 text-center text-gray-500">
            <CreditCard className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-sm font-semibold text-gray-700">Tiada rekod transaksi dijumpai</p>
            <p className="text-xs text-gray-400 mt-1">Gunakan butang di atas untuk merekod perbelanjaan baru.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-gray-50/80 border-b border-gray-200 text-gray-500 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">No. Transaksi</th>
                  <th className="py-3 px-4">Jenis & Kategori</th>
                  <th className="py-3 px-4">Keterangan</th>
                  <th className="py-3 px-4">Kaedah Bayaran</th>
                  <th className="py-3 px-4">Tarikh</th>
                  <th className="py-3 px-4 text-right">Jumlah</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredTransactions.map((trx) => {
                  const isInflow = trx.transaction_type === 'customer_payment';
                  const isFactory = trx.transaction_type === 'factory_payout';

                  return (
                    <tr key={trx.id} className="hover:bg-sky-50/40 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-medium text-gray-900">
                        {trx.transaction_number}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                            isInflow
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : isFactory
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {isInflow && <ArrowDownLeft className="w-3 h-3" />}
                          {!isInflow && <ArrowUpRight className="w-3 h-3" />}
                          {isInflow ? 'Inflow Pelanggan' : isFactory ? 'Outflow Kilang' : 'Outflow OPEX'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-gray-800 font-medium max-w-xs truncate">
                        {trx.description || '-'}
                      </td>
                      <td className="py-3.5 px-4 text-gray-600 capitalize">
                        {trx.payment_method?.replace('_', ' ') || '-'}
                      </td>
                      <td className="py-3.5 px-4 text-gray-500">
                        {trx.transaction_date ? new Date(trx.transaction_date).toLocaleDateString('ms-MY') : '-'}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <span
                          className={`font-bold ${
                            isInflow ? 'text-emerald-600' : 'text-gray-900'
                          }`}
                        >
                          {isInflow ? '+ ' : '- '}
                          {formatCurrency(trx.amount)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Operating Expenses List (with Edit/Delete Action) */}
      <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <div>
            <h3 className="text-base font-bold text-gray-900">Senarai Terperinci Perbelanjaan Operasi & Iklan</h3>
            <p className="text-xs text-gray-500">Semua perbelanjaan bulanan agensi yang dimasukkan.</p>
          </div>
          <span className="text-xs font-semibold px-2 py-0.5 rounded bg-gray-100 text-gray-700">
            {expenses.length} Rekod
          </span>
        </div>

        {expenses.length === 0 ? (
          <div className="py-8 text-center text-xs text-gray-400">
            Belum ada perbelanjaan operasi direkodkan.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-gray-100 text-gray-400 font-medium uppercase text-[10px]">
                  <th className="py-2.5 px-3">No. Rekod</th>
                  <th className="py-2.5 px-3">Kategori</th>
                  <th className="py-2.5 px-3">Tajuk / Merchant</th>
                  <th className="py-2.5 px-3">Tarikh</th>
                  <th className="py-2.5 px-3 text-right">Jumlah</th>
                  <th className="py-2.5 px-3 text-right">Tindakan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {expenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="py-2.5 px-3 font-mono font-medium text-gray-700">{exp.expense_number}</td>
                    <td className="py-2.5 px-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-gray-100 text-gray-800">
                        {CATEGORY_MAP[exp.category]?.label || exp.category}
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="font-semibold text-gray-900">{exp.title}</div>
                      {exp.vendor_merchant && <div className="text-[10px] text-gray-500">{exp.vendor_merchant}</div>}
                    </td>
                    <td className="py-2.5 px-3 text-gray-500">{exp.expense_date}</td>
                    <td className="py-2.5 px-3 text-right font-bold text-gray-900">{formatCurrency(exp.amount)}</td>
                    <td className="py-2.5 px-3 text-right space-x-1">
                      <button
                        onClick={() => handleEditExpense(exp)}
                        className="p-1 text-gray-400 hover:text-[#00BDFF] rounded transition-colors"
                        title="Edit"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteExpense(exp.id)}
                        className="p-1 text-gray-400 hover:text-rose-600 rounded transition-colors"
                        title="Padam"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Rekod Perbelanjaan Baru */}
      {isExpenseModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden border border-gray-100 animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-gray-100 bg-gray-50/50">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-sky-50 text-[#00BDFF] flex items-center justify-center font-bold">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-sm">
                    {expenseFormData.id ? 'Kemaskini Perbelanjaan' : 'Rekod Perbelanjaan Baru'}
                  </h3>
                  <p className="text-xs text-gray-500">Iklan Pemasaran (Ads) atau Overhed Operasi Agensi</p>
                </div>
              </div>
              <button
                onClick={() => setIsExpenseModalOpen(false)}
                className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmitExpense} className="p-5 space-y-4">
              {expenseError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{expenseError}</span>
                </div>
              )}

              {/* Kategori Perbelanjaan */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Kategori Perbelanjaan *</label>
                <select
                  value={expenseFormData.category}
                  onChange={(e) =>
                    setExpenseFormData({ ...expenseFormData, category: e.target.value as ExpenseCategory })
                  }
                  className="w-full px-3 py-2 text-xs bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#00BDFF] focus:outline-none"
                >
                  <optgroup label="Iklan & Pemasaran (Marketing Ads)">
                    <option value="ads_meta">Iklan Meta (Facebook / Instagram Ads)</option>
                    <option value="ads_google">Iklan Google Search / Display Ads</option>
                    <option value="ads_tiktok">Iklan TikTok Ads</option>
                  </optgroup>
                  <optgroup label="Overhed Operasi Agensi (General OPEX)">
                    <option value="utilities_rent">Sewa Pejabat & Utiliti</option>
                    <option value="staff_salary">Gaji Staf & Pereka Grafik</option>
                    <option value="software_saas">Langganan Software, Domain & Server</option>
                    <option value="packaging_logistic">Bungkusan & Kurier Ekstra</option>
                    <option value="general_opex">Kos Operasi Lain-lain</option>
                  </optgroup>
                </select>
              </div>

              {/* Tajuk Perbelanjaan */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Tajuk / Penerangan Perbelanjaan *</label>
                <input
                  type="text"
                  placeholder="Cth: Kempen Meta Ads Bulan Ini / Sewa Premis"
                  value={expenseFormData.title}
                  onChange={(e) => setExpenseFormData({ ...expenseFormData, title: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#00BDFF] focus:outline-none"
                  required
                />
              </div>

              {/* Grid: Jumlah & Tarikh */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Jumlah (RM) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    placeholder="0.00"
                    value={expenseFormData.amount || ''}
                    onChange={(e) =>
                      setExpenseFormData({ ...expenseFormData, amount: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full px-3 py-2 text-xs bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#00BDFF] focus:outline-none font-bold text-gray-900"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Tarikh Bayaran *</label>
                  <input
                    type="date"
                    value={expenseFormData.expense_date}
                    onChange={(e) => setExpenseFormData({ ...expenseFormData, expense_date: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#00BDFF] focus:outline-none"
                    required
                  />
                </div>
              </div>

              {/* Grid: Vendor & Kaedah Bayaran */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Nama Vendor / Merchant</label>
                  <input
                    type="text"
                    placeholder="Cth: Meta Platforms Ireland / TNB"
                    value={expenseFormData.vendor_merchant}
                    onChange={(e) => setExpenseFormData({ ...expenseFormData, vendor_merchant: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#00BDFF] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Kaedah Bayaran</label>
                  <select
                    value={expenseFormData.payment_method}
                    onChange={(e) =>
                      setExpenseFormData({ ...expenseFormData, payment_method: e.target.value as PaymentMethod })
                    }
                    className="w-full px-3 py-2 text-xs bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#00BDFF] focus:outline-none"
                  >
                    <option value="bank_transfer">Bank Transfer (FPX/IBG)</option>
                    <option value="credit_card">Kad Kredit / Debit Korporat</option>
                    <option value="cash">Tunai / Duit Runcit</option>
                    <option value="other">Lain-lain</option>
                  </select>
                </div>
              </div>

              {/* Nota Tambahan */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Nota Tambahan</label>
                <textarea
                  rows={2}
                  placeholder="Catatan rujukan atau maklumat invois..."
                  value={expenseFormData.notes}
                  onChange={(e) => setExpenseFormData({ ...expenseFormData, notes: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#00BDFF] focus:outline-none"
                />
              </div>

              {/* Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsExpenseModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={expenseSubmitting}
                  className="px-5 py-2 text-xs font-semibold bg-[#00BDFF] hover:bg-[#00a6e0] text-white rounded-xl shadow-sm transition-all flex items-center gap-2"
                >
                  {expenseSubmitting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>{expenseFormData.id ? 'Simpan Kemaskini' : 'Rekod Sekarang'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

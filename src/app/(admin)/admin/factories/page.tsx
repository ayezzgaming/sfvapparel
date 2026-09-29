'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Building2,
  Plus,
  Search,
  RefreshCw,
  Edit2,
  Trash2,
  Phone,
  Clock,
  CheckCircle2,
  AlertCircle,
  Layers,
  Shirt,
  DollarSign,
  Percent,
  SlidersHorizontal,
  ChevronRight,
  Calculator,
  Tag,
  FileText
} from 'lucide-react';
import { FaWhatsapp } from 'react-icons/fa6';
import { PartnerFactory } from '@/types/database';
import { getPartnerFactories, deletePartnerFactory } from '@/app/actions/factoryActions';

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('ms-MY', {
    style: 'currency',
    currency: 'MYR',
    minimumFractionDigits: 2,
  }).format(amount || 0);
}

export default function AdminFactoriesPage() {
  const [factories, setFactories] = useState<PartnerFactory[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const loadData = async () => {
    try {
      const res = await getPartnerFactories();
      if (res.success && res.data) {
        setFactories(res.data);
      }
    } catch {
      // no-op
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Adakah anda pasti mahu memadam kilang rakan kongsi "${name}"?`)) return;
    try {
      const res = await deletePartnerFactory(id);
      if (res.success) {
        await loadData();
      } else {
        alert(res.message || 'Gagal memadam kilang.');
      }
    } catch {
      alert('Ralat sambungan.');
    }
  };

  const filteredFactories = useMemo(() => {
    if (!searchQuery.trim()) return factories;
    const q = searchQuery.toLowerCase();
    return factories.filter(
      (f) =>
        f.factory_name.toLowerCase().includes(q) ||
        (f.pic_name && f.pic_name.toLowerCase().includes(q)) ||
        (f.phone && f.phone.includes(q)) ||
        (f.address && f.address.toLowerCase().includes(q))
    );
  }, [factories, searchQuery]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
            <Link href="/admin/factory-jobs" className="hover:text-[#00BDFF] transition-colors">
              Job Sheet Kilang
            </Link>
            <span>/</span>
            <span className="text-slate-800 font-semibold">Direktori & Pengurusan Kilang</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <Building2 className="w-6 h-6 text-[#00BDFF]" />
            <span>Pengurusan Kilang & Kad Kadar Harga</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Senarai pembekal pengeluaran cetak & jahit sublimasi agensi serta pengurusan formula harga seunit.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/admin/factories/pricing"
            className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 hover:border-[#00BDFF] text-slate-700 rounded-xl text-xs font-semibold shadow-xs transition-all cursor-pointer"
          >
            <SlidersHorizontal className="w-4 h-4 text-[#00BDFF]" />
            <span>Formula & Matriks Harga</span>
          </Link>

          <Link
            href="/admin/factories/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#00BDFF] hover:bg-[#00a6e0] text-white rounded-xl text-xs font-semibold shadow-xs transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Daftar Kilang Baru</span>
          </Link>

          <button
            type="button"
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-2 text-slate-500 hover:text-slate-700 bg-white border border-slate-200 rounded-xl transition-colors cursor-pointer"
            title="Muat Semula Senarai"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Quick Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500">Jumlah Kilang Rakan Kongsi</span>
            <p className="text-2xl font-bold text-slate-900 mt-1">{factories.length}</p>
            <p className="text-xs text-slate-500 mt-0.5">Semua aktif dalam sistem</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-sky-50 text-[#00BDFF] flex items-center justify-center font-bold">
            <Building2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500">Purata Kos Asas Seunit</span>
            <p className="text-2xl font-bold text-slate-900 mt-1">
              {factories.length > 0
                ? formatCurrency(
                    factories.reduce((sum, f) => sum + (Number(f.default_unit_cost) || 0), 0) / factories.length
                  )
                : 'RM 0.00'}
            </p>
            <p className="text-xs text-slate-500 mt-0.5">Kadar purata sebelum diskaun kuantiti</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500">Integrasi Job Sheet</span>
            <p className="text-2xl font-bold text-[#00BDFF] mt-1">Automatik</p>
            <p className="text-xs text-slate-500 mt-0.5">Kira kos pesanan secara langsung</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
            <Calculator className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Search & Navigation Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari nama kilang, PIC, no. telefon, lokasi..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00BDFF] focus:border-transparent transition-all"
          />
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span>Menunjukkan <strong>{filteredFactories.length}</strong> daripada <strong>{factories.length}</strong> kilang</span>
        </div>
      </div>

      {/* Factories Grid */}
      {loading ? (
        <div className="py-20 text-center text-slate-500">
          <RefreshCw className="w-6 h-6 animate-spin text-[#00BDFF] mx-auto mb-2" />
          <p className="text-xs">Memuatkan direktori kilang...</p>
        </div>
      ) : filteredFactories.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-500">
          <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-800">Tiada Kilang Rakan Kongsi Dijumpai</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            {searchQuery
              ? 'Tiada kilang sepadan dengan carian anda. Cuba kata kunci lain.'
              : 'Daftar kilang rakan kongsi pertama anda untuk memulakan pengiraan kos Job Sheet secara automatik.'}
          </p>
          <div className="mt-4">
            <Link
              href="/admin/factories/new"
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#00BDFF] hover:bg-[#00a6e0] text-white rounded-xl text-xs font-semibold shadow-xs transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Daftar Kilang Baru</span>
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredFactories.map((factory) => {
            const cleanPhone = factory.phone?.replace(/[^0-9]/g, '') || '';
            const matrix = factory.pricing_matrix;
            const tiersCount = matrix?.tier_discounts?.length || 0;
            const fabricCount = Object.keys(matrix?.fabric_surcharges || {}).length;

            return (
              <div
                key={factory.id}
                className="bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:border-[#00BDFF] transition-all flex flex-col justify-between overflow-hidden group"
              >
                {/* Card Header */}
                <div className="p-5 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-sky-50 text-[#00BDFF] flex items-center justify-center font-bold shrink-0">
                        <Building2 className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 text-sm group-hover:text-[#00BDFF] transition-colors line-clamp-1">
                          {factory.factory_name}
                        </h3>
                        <p className="text-[11px] text-slate-500">
                          PIC: <span className="text-slate-800 font-medium">{factory.pic_name || '-'}</span>
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Pricing Badge Bar */}
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Kadar Asas</span>
                      <span className="text-sm font-black text-slate-900">
                        {formatCurrency(Number(factory.default_unit_cost) || 0)}
                        <span className="text-[10px] text-slate-500 font-normal"> / helai</span>
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Lead Time</span>
                      <span className="text-xs font-semibold text-slate-700 flex items-center gap-1 justify-end">
                        <Clock className="w-3 h-3 text-[#00BDFF]" />
                        <span>{factory.lead_time_days || 7} Hari</span>
                      </span>
                    </div>
                  </div>

                  {/* Matrix Specs Pills */}
                  <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                    <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-[#0052FF] font-semibold border border-blue-100">
                      {tiersCount} Tangga Kuantiti
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-semibold border border-slate-200">
                      {fabricCount} Surcaj Kain
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-semibold border border-emerald-100">
                      All-in-One Sublimasi
                    </span>
                  </div>

                  {/* Address & Notes */}
                  {factory.address && (
                    <p className="text-xs text-slate-500 line-clamp-2 pt-1 border-t border-slate-100">
                      {factory.address}
                    </p>
                  )}
                </div>

                {/* Card Action Footer */}
                <div className="px-5 py-3.5 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    {cleanPhone && (
                      <a
                        href={`https://wa.me/${cleanPhone}?text=${encodeURIComponent(
                          `Salam ${factory.pic_name || 'Tuan'}, ini perhubungan dari SVF APPAREL.`
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-600 transition-colors"
                        title="WhatsApp Kilang"
                      >
                        <FaWhatsapp className="w-4 h-4" />
                      </a>
                    )}
                    <button
                      type="button"
                      onClick={() => handleDelete(factory.id, factory.factory_name)}
                      className="p-2 rounded-xl bg-white hover:bg-rose-50 text-slate-400 hover:text-rose-600 border border-slate-200 hover:border-rose-200 transition-colors cursor-pointer"
                      title="Padam Kilang"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <Link
                    href={`/admin/factories/${factory.id}`}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-white border border-slate-200 hover:border-[#00BDFF] text-slate-700 hover:text-[#00BDFF] rounded-xl text-xs font-semibold shadow-xs transition-all"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Kemaskini & Formula</span>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

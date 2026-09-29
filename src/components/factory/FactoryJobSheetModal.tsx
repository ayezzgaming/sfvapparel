'use client';

import React, { useState } from 'react';
import {
  Printer,
  Download,
  X,
  FileText,
  Eye,
  EyeOff,
  User,
  PackageCheck,
  Scissors,
  Shirt
} from 'lucide-react';
import { FaWhatsapp } from 'react-icons/fa6';
import { FactoryJob, FactoryJobStatus } from '@/types/database';
import { useAppStore } from '@/lib/store/app-store';

interface FactoryJobSheetModalProps {
  job: FactoryJob;
  isOpen: boolean;
  onClose: () => void;
  onUpdateStatus?: (jobId: string, status: FactoryJobStatus) => void;
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('ms-MY', {
    style: 'currency',
    currency: 'MYR',
    minimumFractionDigits: 2,
  }).format(amount || 0);
}

const STATUS_CONFIG: Record<
  FactoryJobStatus,
  { label: string; badgeClass: string }
> = {
  draft: {
    label: 'Draf',
    badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
  },
  sent_to_factory: {
    label: 'Dihantar ke Kilang',
    badgeClass: 'bg-blue-50 text-blue-700 border-blue-200',
  },
  in_production: {
    label: 'Sedang Dijahit & Cetak',
    badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
  },
  factory_completed: {
    label: 'Siap di Kilang',
    badgeClass: 'bg-purple-50 text-purple-700 border-purple-200',
  },
  received_at_svf: {
    label: 'Diterima di SVF (QC)',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
  closed: {
    label: 'Selesai / Ditutup',
    badgeClass: 'bg-slate-100 text-slate-600 border-slate-200',
  },
};

export default function FactoryJobSheetModal({
  job,
  isOpen,
  onClose,
  onUpdateStatus,
}: FactoryJobSheetModalProps) {
  const { companySettings } = useAppStore();
  const [showInternalFinancials, setShowInternalFinancials] = useState(false);

  if (!isOpen || !job) return null;

  const brandName = companySettings?.brand_name || 'SVF APPAREL';
  const companyPhone = companySettings?.phone || companySettings?.whatsapp_number || '+6012-3456789';
  const companyEmail = companySettings?.email || 'produksi@svfapparel.my';
  const companyAddress = companySettings?.address || 'Kuala Lumpur, Malaysia';

  const orderDate = job.created_at
    ? new Date(job.created_at).toLocaleDateString('ms-MY', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : '-';

  const targetReadyDate = job.target_ready_date
    ? new Date(job.target_ready_date).toLocaleDateString('ms-MY', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : '7 Hari Bekerja';

  const sizingEntries = Object.entries(job.sizing_breakdown || {}).filter(
    ([, qty]) => Number(qty) > 0
  );

  const playerRoster = Array.isArray(job.player_roster) ? job.player_roster : [];

  const handlePrint = () => {
    window.print();
  };

  const cleanFactoryPhone = job.factory?.phone?.replace(/[^0-9]/g, '') || '';
  const waShareText = `Salam ${job.factory?.pic_name || 'Tuan'},\n\nBerikut adalah rujukan rasmi Job Sheet Produksi SVF APPAREL:\n• No. Job Sheet: ${job.job_number}\n• No. Pesanan: ${job.order?.order_number || '-'}\n• Kuantiti: ${job.total_quantity} helai\n• Material Kain: ${job.fabric_spec || 'Microfiber Eyelet 160gsm'}\n• Potongan / Kolar: ${job.cutting_spec || 'Regular Fit'} / ${job.collar_spec || 'Standard'}\n• Tarikh Siap Sasaran: ${targetReadyDate}\n${job.artwork_hd_url ? `• Pautan Fail Cetak HD: ${job.artwork_hd_url}\n` : ''}\nMohon semak spesifikasi tech pack ini untuk proses cetakan & jahitan. Terima kasih.`;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-0 sm:p-4 overflow-y-auto print:p-0 print:bg-white print:static">
      <div className="bg-white w-full h-full sm:h-auto sm:max-h-[95vh] sm:max-w-4xl sm:rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden print:max-h-none print:shadow-none print:border-none print:w-full print:rounded-none">
        
        {/* Navigation / Action Toolbar (Hidden in Print) */}
        <header className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between shrink-0 print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-sky-50 text-[#00BDFF] flex items-center justify-center font-bold">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-slate-900 text-sm">{job.job_number}</span>
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                    STATUS_CONFIG[job.status]?.badgeClass
                  }`}
                >
                  {STATUS_CONFIG[job.status]?.label}
                </span>
              </div>
              <p className="text-xs text-slate-500">Pratonton Rasmi Job Sheet Produksi & Tech Pack Kilang</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Toggle Financials */}
            <button
              type="button"
              onClick={() => setShowInternalFinancials(!showInternalFinancials)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                showInternalFinancials
                  ? 'bg-sky-50 text-[#00BDFF] border-sky-200'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
              title="Papar/Sembunyikan Maklumat Kewangan Internal SVF"
            >
              {showInternalFinancials ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
              <span className="hidden md:inline">{showInternalFinancials ? 'Mod Internal (SVF)' : 'Mod Kilang (PO)'}</span>
            </button>

            {/* WhatsApp Kilang */}
            {cleanFactoryPhone && (
              <a
                href={`https://wa.me/${cleanFactoryPhone}?text=${encodeURIComponent(waShareText)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-all cursor-pointer"
                title="Hantar Ringkasan Job Sheet ke WhatsApp Kilang"
              >
                <FaWhatsapp className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">WhatsApp Kilang</span>
              </a>
            )}

            {/* Print / Save PDF */}
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#00BDFF] hover:bg-[#00a6e0] text-white rounded-xl text-xs font-semibold shadow-xs transition-all cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak / PDF</span>
            </button>

            {/* Close */}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200/60 transition-colors cursor-pointer ml-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Printable Document Sheet Container */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-100/60 print:bg-white print:p-0 print:overflow-visible">
          <div className="max-w-3xl mx-auto bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs print:border-none print:shadow-none print:p-0 print:max-w-none text-slate-800 font-sans">
            
            {/* Header Document */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-6 border-b-2 border-slate-800 gap-4">
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight uppercase">
                  {brandName}
                </h1>
                <p className="text-xs font-semibold text-[#00BDFF] uppercase tracking-wider">
                  Arahan Pengeluaran Kilang & Tech Pack Sublimasi
                </p>
                <div className="text-[11px] text-slate-500 mt-1 space-y-0.5">
                  <p>{companyAddress}</p>
                  <p>Tel: {companyPhone} | Emel: {companyEmail}</p>
                </div>
              </div>

              <div className="sm:text-right bg-slate-50 p-3 rounded-xl border border-slate-200 sm:min-w-[220px]">
                <span className="text-[10px] font-bold uppercase text-slate-400 block tracking-wider">Dokumen Job Sheet</span>
                <span className="text-base font-black font-mono text-slate-900 block">{job.job_number}</span>
                <div className="text-[11px] text-slate-600 mt-1 space-y-0.5">
                  <p><span className="font-semibold text-slate-500">Ref Pesanan:</span> <span className="font-mono font-bold text-slate-800">{job.order?.order_number || '-' }</span></p>
                  <p><span className="font-semibold text-slate-500">Tarikh Keluar:</span> {orderDate}</p>
                  <p><span className="font-semibold text-rose-600">Tarikh Sasaran:</span> <span className="font-bold text-slate-900">{targetReadyDate}</span></p>
                </div>
              </div>
            </div>

            {/* Two Column Details: Factory & Order Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-5 border-b border-slate-200 text-xs">
              {/* Kilang Rakan Kongsi */}
              <div className="p-3.5 bg-slate-50/80 rounded-xl border border-slate-200/80">
                <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider block mb-1">
                  Kilang Pengeluaran (Tugasan)
                </span>
                <h3 className="font-bold text-slate-900 text-sm">{job.factory?.factory_name || 'Kilang Rakan Kongsi'}</h3>
                <div className="mt-1.5 space-y-1 text-slate-600">
                  <p><span className="font-medium text-slate-500">PIC Kilang:</span> {job.factory?.pic_name || '-'}</p>
                  <p><span className="font-medium text-slate-500">Telefon / WA:</span> {job.factory?.phone || '-'}</p>
                  {job.factory?.address && (
                    <p className="text-[11px] text-slate-500 line-clamp-2">{job.factory.address}</p>
                  )}
                </div>
              </div>

              {/* Rujukan Pelanggan & Kuantiti */}
              <div className="p-3.5 bg-slate-50/80 rounded-xl border border-slate-200/80">
                <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider block mb-1">
                  Maklumat Pesanan Pelanggan
                </span>
                <h3 className="font-bold text-slate-900 text-sm">
                  {job.order?.customer_name || 'Pelanggan SVF'}
                </h3>
                <div className="mt-1.5 space-y-1 text-slate-600">
                  <p><span className="font-medium text-slate-500">Pakej / Kategori:</span> {(job.order as any)?.package_name || (job.order as any)?.category_name || 'Jersi Sublimasi'}</p>
                  <p>
                    <span className="font-medium text-slate-500">Jumlah Tempahan:</span>{' '}
                    <span className="font-bold text-slate-900 text-sm">{job.total_quantity} Helai</span>
                  </p>
                  <p>
                    <span className="font-medium text-slate-500">Status Semasa:</span>{' '}
                    <span className="font-semibold text-slate-800">{STATUS_CONFIG[job.status]?.label}</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Technical Specifications Grid */}
            <div className="py-5 border-b border-slate-200">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-3 flex items-center gap-2">
                <Scissors className="w-3.5 h-3.5 text-[#00BDFF]" />
                <span>Spesifikasi Teknikal Jahitan & Cetak</span>
              </h2>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">Material Kain</span>
                  <span className="font-bold text-slate-900 block mt-0.5">{job.fabric_spec || 'Microfiber Eyelet 160gsm'}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">Potongan (Cutting)</span>
                  <span className="font-bold text-slate-900 block mt-0.5">{job.cutting_spec || 'Regular Fit'}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">Kolar & Leher</span>
                  <span className="font-bold text-slate-900 block mt-0.5">{job.collar_spec || 'V-Neck Rib Hitam'}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">Teknologi Cetakan</span>
                  <span className="font-bold text-slate-900 block mt-0.5">Full Sublimation (CMYK)</span>
                </div>
              </div>
            </div>

            {/* Sizing Distribution Table */}
            <div className="py-5 border-b border-slate-200">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-3 flex items-center gap-2">
                <Shirt className="w-3.5 h-3.5 text-[#00BDFF]" />
                <span>Jadual Pecahan Saiz ({job.total_quantity} Helai)</span>
              </h2>

              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-xs text-center border-collapse">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold">
                      {sizingEntries.length > 0 ? (
                        sizingEntries.map(([sz]) => (
                          <th key={sz} className="py-2.5 px-3 uppercase border-r border-slate-200 last:border-r-0">
                            {sz}
                          </th>
                        ))
                      ) : (
                        <th className="py-2.5 px-3">Semua Saiz</th>
                      )}
                      <th className="py-2.5 px-4 bg-slate-200/70 font-black text-slate-900">JUMLAH</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="font-mono text-sm font-bold text-slate-900">
                      {sizingEntries.length > 0 ? (
                        sizingEntries.map(([sz, qty]) => (
                          <td key={sz} className="py-2.5 px-3 border-r border-slate-200 last:border-r-0 bg-white">
                            {qty}
                          </td>
                        ))
                      ) : (
                        <td className="py-2.5 px-3 bg-white">{job.total_quantity}</td>
                      )}
                      <td className="py-2.5 px-4 bg-slate-50 font-black text-base text-[#00BDFF]">
                        {job.total_quantity}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Player Roster / Senarai Nama & Nombor Jersi (If applicable) */}
            {playerRoster.length > 0 && (
              <div className="py-5 border-b border-slate-200">
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-3 flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <User className="w-3.5 h-3.5 text-[#00BDFF]" />
                    <span>Senarai Nama & Nombor Jersi ({playerRoster.length} Pemain)</span>
                  </span>
                  <span className="text-[10px] text-slate-500 font-normal">Pastikan ejaan & nombor tepat</span>
                </h2>

                <div className="overflow-x-auto rounded-xl border border-slate-200 max-h-60 overflow-y-auto print:max-h-none">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead className="bg-slate-100 border-b border-slate-200 text-slate-700 sticky top-0 print:static">
                      <tr>
                        <th className="py-2 px-3 font-bold w-12 text-center">#</th>
                        <th className="py-2 px-3 font-bold">Nama Cetak Belakang</th>
                        <th className="py-2 px-3 font-bold text-center w-20">No. Jersi</th>
                        <th className="py-2 px-3 font-bold text-center w-20">Saiz</th>
                        <th className="py-2 px-3 font-bold">Jenis Lengan / Nota</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {playerRoster.map((item: any, idx: number) => (
                        <tr key={idx} className="hover:bg-slate-50/60">
                          <td className="py-1.5 px-3 text-center text-slate-400 font-mono">{idx + 1}</td>
                          <td className="py-1.5 px-3 font-bold text-slate-900 uppercase">{item.name || '-'}</td>
                          <td className="py-1.5 px-3 text-center font-mono font-bold text-slate-900">{item.number || '-'}</td>
                          <td className="py-1.5 px-3 text-center font-bold text-slate-800">{item.size || '-'}</td>
                          <td className="py-1.5 px-3 text-slate-600">{item.sleeve || item.type || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Artwork Link & Production Instructions */}
            <div className="py-5 border-b border-slate-200 space-y-4">
              {job.artwork_hd_url && (
                <div className="p-4 bg-sky-50/60 rounded-xl border border-sky-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-bold uppercase text-sky-700 block tracking-wider">
                      Pautan Fail Cetakan Resolusi Tinggi (HD / AI / PDF)
                    </span>
                    <p className="font-mono text-xs text-slate-800 break-all mt-0.5">{job.artwork_hd_url}</p>
                  </div>
                  <a
                    href={job.artwork_hd_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#00BDFF] hover:bg-[#00a6e0] text-white font-semibold rounded-xl text-xs transition-all shrink-0 print:hidden"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Buka / Muat Turun Fail HD</span>
                  </a>
                </div>
              )}

              {/* Special Factory Instructions */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[10px] font-bold uppercase text-slate-400 block tracking-wider mb-1">
                  Arahan Khusus & Catatan Kilang
                </span>
                <p className="text-xs text-slate-700 whitespace-pre-line leading-relaxed">
                  {job.factory_notes || 'Sila pastikan padanan warna mengikut fail master, jahitan kemas, label saiz dilekatkan tepat, dan setiap helai dibungkus dalam individual transparent polybag.'}
                </p>
              </div>
            </div>

            {/* Internal Financial Breakdown (Only shown in internal mode) */}
            {showInternalFinancials && (
              <div className="py-5 border-b border-slate-200 bg-amber-50/40 p-4 rounded-xl border border-amber-200 print:hidden my-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold uppercase text-amber-900 tracking-wider">
                    Ringkasan Kos & Margin Agensi SVF (SULIT)
                  </span>
                  <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-semibold">
                    Paparan Internal Sahaja
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="p-2.5 bg-white rounded-lg border border-amber-100">
                    <span className="text-[10px] text-slate-400 block uppercase">Jualan Pelanggan</span>
                    <span className="text-sm font-bold text-slate-900">{formatCurrency(job.customer_price_total)}</span>
                  </div>
                  <div className="p-2.5 bg-white rounded-lg border border-amber-100">
                    <span className="text-[10px] text-amber-700 block uppercase">Kos Kilang (RM {job.cost_per_unit}/unit)</span>
                    <span className="text-sm font-bold text-amber-700">{formatCurrency(job.total_factory_cost)}</span>
                  </div>
                  <div className="p-2.5 bg-white rounded-lg border border-amber-100">
                    <span className="text-[10px] text-emerald-700 block uppercase">Untung Kasar SVF</span>
                    <span className="text-sm font-bold text-emerald-600">
                      {formatCurrency(job.gross_profit)} ({job.gross_margin_percent}%)
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Quality Control (QC) Checklist & Signatures */}
            <div className="pt-5 space-y-6">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-2 flex items-center gap-2">
                  <PackageCheck className="w-3.5 h-3.5 text-[#00BDFF]" />
                  <span>Senarai Semak Kawalan Kualiti (QC Checklist)</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-700">
                  <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg border border-slate-200">
                    <span className="w-3.5 h-3.5 rounded border border-slate-400 inline-block bg-white" />
                    <span>Padanan Warna Sublimasi (Color Matching)</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg border border-slate-200">
                    <span className="w-3.5 h-3.5 rounded border border-slate-400 inline-block bg-white" />
                    <span>Ketepatan Ejaan Nama & Nombor Jersi</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg border border-slate-200">
                    <span className="w-3.5 h-3.5 rounded border border-slate-400 inline-block bg-white" />
                    <span>Kualiti Jahitan & Benang (Seam Quality)</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg border border-slate-200">
                    <span className="w-3.5 h-3.5 rounded border border-slate-400 inline-block bg-white" />
                    <span>Jumlah Kuantiti & Pecahan Saiz Tepat</span>
                  </div>
                </div>
              </div>

              {/* Signature Blocks */}
              <div className="grid grid-cols-3 gap-4 pt-4 text-center text-xs">
                <div className="border-t border-slate-400 pt-3">
                  <p className="font-bold text-slate-800">Dikeluarkan Oleh</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">{brandName} Produksi</p>
                  <div className="h-10"></div>
                  <p className="text-[10px] text-slate-400 font-mono">Tarikh: ____________</p>
                </div>
                <div className="border-t border-slate-400 pt-3">
                  <p className="font-bold text-slate-800">Diterima & Disahkan</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">{job.factory?.factory_name || 'PIC Kilang'}</p>
                  <div className="h-10"></div>
                  <p className="text-[10px] text-slate-400 font-mono">Tarikh: ____________</p>
                </div>
                <div className="border-t border-slate-400 pt-3">
                  <p className="font-bold text-slate-800">Pemeriksaan QC Akhir</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">Pegawai QC SVF</p>
                  <div className="h-10"></div>
                  <p className="text-[10px] text-slate-400 font-mono">Tarikh: ____________</p>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Status update footer bar */}
        {onUpdateStatus && (
          <footer className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs print:hidden">
            <span className="font-semibold text-slate-700">Kemas Kini Status Produksi:</span>
            <div className="flex flex-wrap items-center gap-1.5">
              {(['sent_to_factory', 'in_production', 'factory_completed', 'received_at_svf'] as FactoryJobStatus[]).map(
                (st) => {
                  const isCurrent = job.status === st;
                  return (
                    <button
                      key={st}
                      type="button"
                      onClick={() => onUpdateStatus(job.id, st)}
                      className={`px-3 py-1.5 rounded-xl font-semibold transition-all cursor-pointer ${
                        isCurrent
                          ? 'bg-[#00BDFF] text-white shadow-xs'
                          : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {STATUS_CONFIG[st].label}
                    </button>
                  );
                }
              )}
            </div>
          </footer>
        )}

      </div>
    </div>
  );
}

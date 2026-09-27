'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { X, Eye, CheckCircle2, AlertCircle, Clock, FileText, ExternalLink, Download, ArrowRight } from 'lucide-react';
import { ProofRevision } from '@/types/database';

interface ArtworkRevisionModalProps {
  isOpen: boolean;
  onClose: () => void;
  revision: ProofRevision | null;
  orderNumber?: string;
  designTitle?: string;
}

export default function ArtworkRevisionModal({
  isOpen,
  onClose,
  revision,
  orderNumber,
  designTitle,
}: ArtworkRevisionModalProps) {
  const [activeTab, setActiveTab] = useState<'front' | 'back'>('front');

  if (!isOpen || !revision) return null;

  const hasBack = Boolean(revision.artwork_back_url);
  const currentImg = activeTab === 'back' && revision.artwork_back_url ? revision.artwork_back_url : revision.artwork_front_url;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-zinc-800 w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between bg-slate-50/80 dark:bg-zinc-800/60">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs shrink-0 border border-blue-100">
              R{revision.revision_number}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-bold text-slate-900 dark:text-zinc-100 uppercase tracking-wider">
                  REVISI {revision.revision_number}
                </h3>
                <span
                  className={`text-[9.5px] font-bold px-2 py-0.5 rounded-full border ${
                    revision.status === 'approved'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : revision.status === 'revision_requested'
                      ? 'bg-amber-50 text-amber-700 border-amber-200'
                      : 'bg-blue-50 text-blue-700 border-blue-200'
                  }`}
                >
                  {revision.status === 'approved'
                    ? 'Diluluskan Pelanggan'
                    : revision.status === 'revision_requested'
                    ? 'Minta Pembetulan'
                    : 'Menunggu Semakan'}
                </span>
              </div>
              <p className="text-[10.5px] text-slate-400 truncate">
                {orderNumber ? `#${orderNumber}` : ''} {designTitle ? `• ${designTitle}` : ''}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Front / Back Toggle Tabs */}
          {hasBack && (
            <div className="flex items-center justify-center gap-1.5 p-1 bg-slate-100 dark:bg-zinc-800 rounded-full max-w-xs mx-auto">
              <button
                type="button"
                onClick={() => setActiveTab('front')}
                className={`flex-1 py-1.5 px-3 rounded-full text-xs font-semibold transition-all ${
                  activeTab === 'front'
                    ? 'bg-white dark:bg-zinc-900 text-slate-900 dark:text-zinc-100 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Pandangan Hadapan
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('back')}
                className={`flex-1 py-1.5 px-3 rounded-full text-xs font-semibold transition-all ${
                  activeTab === 'back'
                    ? 'bg-white dark:bg-zinc-900 text-slate-900 dark:text-zinc-100 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Pandangan Belakang
              </button>
            </div>
          )}

          {/* Visual Artwork Viewer */}
          <div className="rounded-2xl overflow-hidden bg-slate-100 dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700 relative min-h-[280px] sm:min-h-[360px] flex items-center justify-center">
            {currentImg ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={currentImg}
                alt={`Revisi ${revision.revision_number}`}
                className="w-full h-auto max-h-[500px] object-contain"
              />
            ) : (
              <div className="text-center p-6 text-slate-400 text-xs">Tiada imej visual ditemui.</div>
            )}
          </div>

          {/* Open HD in New Tab Button */}
          {currentImg && (
            <div className="flex justify-end">
              <a
                href={currentImg}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Buka Imej HD Penuh di Tab Baharu</span>
              </a>
            </div>
          )}

          {/* Timestamp & Notes Audit Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            {/* Designer / Kilang Upload Box */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-zinc-800/50 border border-slate-200/80 dark:border-zinc-700/80 space-y-1.5">
              <div className="flex items-center justify-between text-slate-400 text-[10px] font-semibold uppercase">
                <span>Dihantar oleh Designer</span>
                <span className="font-mono">
                  {new Date(revision.created_at).toLocaleDateString('ms-MY', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}{' '}
                  •{' '}
                  {new Date(revision.created_at).toLocaleTimeString('ms-MY', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
              <p className="font-bold text-slate-800 dark:text-zinc-200">
                {revision.reviewed_by || 'Designer SFV Apparel'}
              </p>
              {revision.designer_notes ? (
                <div className="p-2 bg-white dark:bg-zinc-900 rounded-xl border border-slate-200/60 dark:border-zinc-800 text-[11px] text-slate-600 dark:text-zinc-300 leading-relaxed">
                  <span className="font-semibold text-slate-700 dark:text-zinc-200 block mb-0.5">Nota Designer:</span>
                  {revision.designer_notes}
                </div>
              ) : (
                <p className="text-[11px] text-slate-400 italic">Tiada nota tambahan dilampirkan.</p>
              )}
            </div>

            {/* Customer Review / Feedback Box */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-zinc-800/50 border border-slate-200/80 dark:border-zinc-700/80 space-y-1.5">
              <div className="flex items-center justify-between text-slate-400 text-[10px] font-semibold uppercase">
                <span>Maklum Balas Pelanggan</span>
                {revision.feedback_at && (
                  <span className="font-mono">
                    {new Date(revision.feedback_at).toLocaleDateString('ms-MY', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}{' '}
                    •{' '}
                    {new Date(revision.feedback_at).toLocaleTimeString('ms-MY', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                )}
              </div>

              {revision.status === 'approved' ? (
                <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block">Diluluskan Secara Rasmi</span>
                    <span className="text-[11px] text-emerald-700">Pelanggan telah mengesahkan susun atur reka bentuk ini tanpa sebarang perubahan lagi.</span>
                  </div>
                </div>
              ) : revision.customer_feedback ? (
                <div className="p-2 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 rounded-xl text-amber-900 dark:text-amber-200 text-[11px] leading-relaxed">
                  <span className="font-bold block mb-0.5">Permintaan Pembetulan:</span>
                  {revision.customer_feedback}
                </div>
              ) : (
                <p className="text-[11px] text-slate-400 italic pt-1">
                  Menunggu semakan atau pelanggan belum memberi maklum balas untuk draf ini.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-between bg-slate-50/50 dark:bg-zinc-800/40">
          <span className="text-[10px] text-slate-400">
            Log Audit Rasmi SFV Apparel • Tidak Boleh Diubah
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-full bg-slate-200 hover:bg-slate-300 dark:bg-zinc-700 text-slate-700 dark:text-zinc-200 text-xs font-semibold transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}

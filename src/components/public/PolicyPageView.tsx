import React from 'react';
import Link from 'next/link';
import { ChevronLeft, ShieldCheck, FileText, CheckCircle2 } from 'lucide-react';
import { INITIAL_CMS_POLICIES } from '@/lib/store/seed-data';
import { CmsPolicy } from '@/types/database';

interface PolicyPageViewProps {
  policyKey: 'privacy' | 'terms' | 'warranty' | 'shipping';
}

export default function PolicyPageView({ policyKey }: PolicyPageViewProps) {
  const policy: CmsPolicy = INITIAL_CMS_POLICIES[policyKey] || INITIAL_CMS_POLICIES.privacy;

  return (
    <div className="w-full min-h-full bg-[#F2F2F7] font-ios antialiased select-none pb-20">
      {/* Top Header */}
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 py-3 flex items-center justify-between shadow-2xs">
        <Link
          href="/"
          className="flex items-center text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ChevronLeft className="w-4 h-4 mr-0.5" />
          <span>Utama</span>
        </Link>
        <span className="text-xs font-bold text-slate-900 truncate max-w-[200px]">
          {policy.badge}
        </span>
        <div className="w-6" />
      </div>

      <div className="p-4 max-w-lg mx-auto space-y-4 pt-4">
        {/* Title Header */}
        <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-2">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 text-[#0052FF] text-[10px] font-bold border border-blue-100">
            <ShieldCheck className="w-3 h-3" />
            <span>{policy.badge}</span>
          </div>
          <h1 className="text-lg font-bold text-slate-900 tracking-tight leading-snug">
            {policy.title}
          </h1>
          <p className="text-xs text-slate-500 leading-relaxed">
            {policy.description}
          </p>
        </div>

        {/* Sections */}
        <div className="space-y-3">
          {policy.sections.map((section, idx) => (
            <div
              key={idx}
              className="p-4 rounded-2xl bg-white border border-slate-200/70 shadow-xs space-y-1.5"
            >
              <h2 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#00BDFF] shrink-0" />
                <span>{section.heading}</span>
              </h2>
              <p className="text-[11.5px] text-slate-600 leading-relaxed pl-5">
                {section.text}
              </p>
            </div>
          ))}
        </div>

        {/* Footer info */}
        <div className="text-center pt-2">
          <p className="text-[10.5px] text-slate-400">
            SFV APPAREL &bull; SF Ventures Marketing (No. Pendaftaran: 202303194821)
          </p>
        </div>
      </div>
    </div>
  );
}

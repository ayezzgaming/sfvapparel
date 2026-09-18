'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Globe,
  ClipboardList,
  Shirt,
  DollarSign,
  Users,
  ExternalLink,
  Search,
  Menu,
  X,
  Palette,
  CheckCircle2
} from 'lucide-react';

const ADMIN_NAV = [
  { href: '/admin', label: 'Papan Pemuka', icon: LayoutDashboard, exact: true },
  { href: '/admin/cms', label: 'Pengurus Web & Tema', icon: Globe },
  { href: '/admin/orders', label: 'Saluran Pesanan', icon: ClipboardList },
  { href: '/admin/catalog', label: 'Katalog & Mockup', icon: Shirt },
  { href: '/admin/pricing-rules', label: 'Formula Harga', icon: DollarSign },
  { href: '/admin/customers', label: 'Senarai Pelanggan', icon: Users },
];

export default function AdminLayoutShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  return (
    <div className="h-full w-full bg-slate-50 text-slate-900 flex flex-col md:flex-row antialiased overflow-hidden">
      {/* ----------------- LEFT PERSISTENT DESKTOP SIDEBAR ----------------- */}
      <aside className="hidden md:flex md:w-64 flex-col justify-between bg-white border-r border-slate-200 p-5 flex-shrink-0">
        <div className="space-y-6">
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-[#0052FF] flex items-center justify-center text-white font-extrabold text-sm shadow-sm">
              SVF
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="font-extrabold text-sm tracking-tight text-slate-900">
                  SVF APPAREL
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-50 text-[#0052FF] border border-blue-100">
                  ADMIN
                </span>
              </div>
              <span className="text-[11px] text-slate-500 block font-medium">
                Pusat Kawalan Kilang
              </span>
            </div>
          </div>

          {/* Navigation Items */}
          <nav className="space-y-1 pt-1">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 pb-1">
              Menu Utama
            </div>
            {ADMIN_NAV.map((item) => {
              const Icon = item.icon;
              const isActive = item.exact
                ? pathname === item.href
                : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-blue-50 text-[#0052FF] border border-blue-200/60 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-[#0052FF]' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom Switch to Mobile App & System Status */}
        <div className="space-y-3 pt-5 border-t border-slate-100">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between text-[11px]">
            <span className="text-slate-600 flex items-center space-x-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Sistem & Data</span>
            </span>
            <span className="text-emerald-700 font-semibold text-[10px] bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              Diselaraskan
            </span>
          </div>

          <Link
            href="/"
            target="_blank"
            className="w-full py-2.5 px-3 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center justify-center space-x-2 transition-colors border border-slate-200 shadow-xs"
          >
            <ExternalLink className="w-4 h-4 text-[#0052FF]" />
            <span>Buka Laman Awam</span>
          </Link>
        </div>
      </aside>

      {/* ----------------- MOBILE HEADER ON SMALL SCREENS ----------------- */}
      <header className="md:hidden flex items-center justify-between bg-white border-b border-slate-200 px-4 py-3 z-30">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#0052FF] flex items-center justify-center text-white font-bold text-xs">
            SVF
          </div>
          <span className="font-bold text-sm text-slate-900">SVF Admin</span>
        </div>

        <div className="flex items-center space-x-2">
          <Link
            href="/"
            target="_blank"
            className="text-[11px] font-semibold px-2.5 py-1.5 rounded-lg bg-blue-50 text-[#0052FF] border border-blue-200 flex items-center space-x-1"
          >
            <span>Awam</span>
            <ExternalLink className="w-3 h-3" />
          </Link>
          <button
            onClick={() => setIsMobileNavOpen(!isMobileNavOpen)}
            className="p-1.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200"
          >
            {isMobileNavOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Mobile Drawer */}
      {isMobileNavOpen && (
        <div className="md:hidden bg-white border-b border-slate-200 p-4 space-y-1.5 z-30 shadow-md">
          {ADMIN_NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setIsMobileNavOpen(false)}
              className="flex items-center space-x-3 px-3 py-2 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-100"
            >
              <item.icon className="w-4 h-4 text-[#0052FF]" />
              <span>{item.label}</span>
            </Link>
          ))}
        </div>
      )}

      {/* ----------------- MAIN DESKTOP CONTENT AREA ----------------- */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-slate-50">
        {/* Top Desktop Bar */}
        <div className="hidden md:flex items-center justify-between border-b border-slate-200 bg-white px-8 py-3.5 shadow-xs">
          <div className="flex items-center space-x-3 w-96">
            <div className="relative w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari pesanan, mockup, maklumat pelanggan..."
                className="w-full pl-9 pr-4 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0052FF]/30 focus:border-[#0052FF]"
              />
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-xs text-slate-500 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>Pangkalan Data Tempatan & Awan Aktif</span>
            </div>

            <div className="h-4 w-px bg-slate-200" />

            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center text-xs font-bold text-[#0052FF]">
                SV
              </div>
              <div className="text-left">
                <span className="text-xs font-bold text-slate-800 block leading-tight">
                  Pengurus Pentadbir
                </span>
                <span className="text-[10px] text-slate-500 block leading-none">
                  SVF Apparel Management
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Scrollable View Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}

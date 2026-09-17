'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  ClipboardList,
  Shirt,
  DollarSign,
  Users,
  Smartphone,
  Sparkles,
  Layers,
  Search,
  Bell,
  ChevronDown,
  Activity,
  Menu,
  X
} from 'lucide-react';

const ADMIN_NAV = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/admin/orders', label: 'Order Pipeline', icon: ClipboardList },
  { href: '/admin/catalog', label: 'Mockup Assets', icon: Shirt },
  { href: '/admin/pricing-rules', label: 'Dynamic Pricing', icon: DollarSign },
  { href: '/admin/customers', label: 'Customers', icon: Users },
];

export default function AdminLayoutShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  return (
    <div className="h-full w-full bg-slate-950 text-slate-100 flex flex-col md:flex-row antialiased overflow-hidden">
      {/* ----------------- LEFT PERSISTENT DESKTOP SIDEBAR ----------------- */}
      <aside className="hidden md:flex md:w-64 flex-col justify-between bg-slate-900 border-r border-slate-800 p-5 flex-shrink-0">
        <div className="space-y-6">
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white font-extrabold text-base shadow-lg shadow-blue-500/20">
              SVF
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="font-extrabold text-base tracking-tight text-white">
                  SVF APPAREL
                </span>
                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">
                  ADMIN
                </span>
              </div>
              <span className="text-[11px] text-slate-400 block font-medium">
                Production Control Center
              </span>
            </div>
          </div>

          {/* Navigation Items */}
          <nav className="space-y-1.5 pt-2">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 px-3 pb-1">
              Main Navigation
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
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom Switch to Mobile PWA & Production Health */}
        <div className="space-y-3 pt-6 border-t border-slate-800">
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1.5">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-400 flex items-center space-x-1.5">
                <Activity className="w-3.5 h-3.5 text-emerald-400" />
                <span>RIP Print Engine</span>
              </span>
              <span className="text-emerald-400 font-bold font-mono">ONLINE</span>
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-400">Calender Press</span>
              <span className="text-amber-400 font-bold font-mono">205°C OK</span>
            </div>
          </div>

          <Link
            href="/"
            target="_blank"
            className="w-full py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center space-x-2 transition-colors border border-slate-700"
          >
            <Smartphone className="w-4 h-4 text-blue-400" />
            <span>Launch Public iOS PWA</span>
          </Link>
        </div>
      </aside>

      {/* ----------------- MOBILE HEADER ON SMALL SCREENS ----------------- */}
      <header className="md:hidden flex items-center justify-between bg-slate-900 border-b border-slate-800 px-4 py-3 z-30">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-xs">
            SVF
          </div>
          <span className="font-bold text-sm text-white">SVF Admin</span>
        </div>

        <div className="flex items-center space-x-2">
          <Link
            href="/"
            className="text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-blue-600 text-white"
          >
            Public PWA
          </Link>
          <button
            onClick={() => setIsMobileNavOpen(!isMobileNavOpen)}
            className="p-1.5 rounded-lg bg-slate-800 text-slate-300"
          >
            {isMobileNavOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Mobile Drawer */}
      {isMobileNavOpen && (
        <div className="md:hidden bg-slate-900 border-b border-slate-800 p-4 space-y-2 z-30">
          {ADMIN_NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setIsMobileNavOpen(false)}
              className="flex items-center space-x-3 px-3 py-2 rounded-lg text-xs font-semibold text-slate-300 hover:bg-slate-800"
            >
              <item.icon className="w-4 h-4 text-blue-400" />
              <span>{item.label}</span>
            </Link>
          ))}
        </div>
      )}

      {/* ----------------- MAIN DESKTOP CONTENT AREA ----------------- */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-slate-950">
        {/* Top Desktop Bar */}
        <div className="hidden md:flex items-center justify-between border-b border-slate-800/80 bg-slate-900/50 backdrop-blur-md px-8 py-3.5">
          <div className="flex items-center space-x-3 w-96">
            <div className="relative w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Global search orders, mockups, clients..."
                className="w-full pl-9 pr-4 py-1.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-xs text-slate-400 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Supabase & Local DB Active</span>
            </div>

            <div className="h-4 w-px bg-slate-800" />

            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-white">
                AD
              </div>
              <div className="text-left">
                <span className="text-xs font-bold text-slate-200 block leading-tight">
                  Admin Supervisor
                </span>
                <span className="text-[10px] text-slate-500 block leading-none">
                  Production Manager
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

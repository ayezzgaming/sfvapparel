'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Menu,
  Home,
  ClipboardList,
  Shirt,
  Globe,
  Users,
  SlidersHorizontal,
  Plus,
  Grip,
  HelpCircle,
  ExternalLink,
  ChevronRight,
  Megaphone
} from 'lucide-react';

const ADMIN_NAV = [
  { href: '/admin', label: 'Beranda', icon: Home, exact: true },
  { href: '/admin/orders', label: 'Saluran Pesanan', icon: ClipboardList },
  { href: '/admin/catalog', label: 'Katalog Rekaan', icon: Shirt },
  { href: '/admin/ads-generator', label: 'Ads Generator', icon: Megaphone },
  { href: '/admin/cms', label: 'Pengurus Web', icon: Globe },
  { href: '/admin/customers', label: 'Pelanggan', icon: Users },
  { href: '/admin/pricing-rules', label: 'Formula Harga', icon: SlidersHorizontal },
];

export default function AdminLayoutShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Find active nav item for breadcrumb
  const activeNavItem = ADMIN_NAV.find((item) =>
    item.exact ? pathname === item.href : pathname.startsWith(item.href)
  );

  return (
    <div className="h-full w-full bg-white text-slate-800 flex flex-col antialiased overflow-hidden font-sans">
      {/* ----------------- GOOGLE WORKSPACE TOP BAR ----------------- */}
      <header className="h-16 border-b border-slate-200 bg-white px-4 flex items-center justify-between shrink-0 z-30 select-none">
        {/* Left: Hamburger Menu & Brand / Breadcrumb */}
        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="w-10 h-10 rounded-full flex items-center justify-center text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors cursor-pointer"
            title="Menu Utama"
            aria-label="Toggle Sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Logo & Brand Name */}
          <Link href="/admin" className="flex items-center space-x-2.5 hover:opacity-90 transition-opacity">
            <div className="w-9 h-9 rounded-lg bg-[#0052FF] flex items-center justify-center text-white font-extrabold text-xs shadow-xs">
              SFV
            </div>
            <span className="font-normal text-lg tracking-normal text-slate-800 hidden sm:inline">
              SFV APPAREL
            </span>
          </Link>

          {/* Breadcrumb if inside child page */}
          {activeNavItem && activeNavItem.href !== '/admin' && (
            <div className="hidden md:flex items-center space-x-2 text-slate-500 text-sm">
              <ChevronRight className="w-4 h-4 text-slate-400" />
              <span className="text-slate-700 font-medium">{activeNavItem.label}</span>
            </div>
          )}
        </div>

        {/* Right: Quick Action +, Apps Grid, Profile Avatar */}
        <div className="flex items-center space-x-2">
          {/* Quick Add Action */}
          <Link
            href="/admin/catalog"
            className="w-10 h-10 rounded-full flex items-center justify-center text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
            title="Tambah Mockup Rekaan"
          >
            <Plus className="w-5 h-5" />
          </Link>

          {/* Public Store link (App Grid Icon style) */}
          <Link
            href="/"
            target="_blank"
            className="w-10 h-10 rounded-full flex items-center justify-center text-slate-600 hover:bg-slate-100 hover:text-[#0052FF] transition-colors"
            title="Buka Laman Web Awam"
          >
            <Grip className="w-5 h-5" />
          </Link>

          {/* User Profile Avatar */}
          <div className="pl-1">
            <div className="w-9 h-9 rounded-full bg-[#0052FF] text-white flex items-center justify-center font-bold text-xs shadow-xs border-2 border-white ring-1 ring-slate-200">
              A
            </div>
          </div>
        </div>
      </header>

      {/* ----------------- BODY: SIDEBAR + MAIN CONTENT ----------------- */}
      <div className="flex-1 flex min-h-0 overflow-hidden bg-white">
        {/* Material 3 / Classroom Sidebar */}
        <aside
          className={`shrink-0 transition-all duration-300 ease-in-out border-r border-slate-100 bg-white flex flex-col justify-between py-3 select-none ${
            isSidebarOpen ? 'w-60 px-3' : 'w-[72px] px-2.5'
          }`}
        >
          <nav className="space-y-1">
            {ADMIN_NAV.map((item) => {
              const Icon = item.icon;
              const isActive = item.exact
                ? pathname === item.href
                : pathname.startsWith(item.href);

              if (isSidebarOpen) {
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center space-x-3.5 px-4 py-2.5 rounded-full text-[13.5px] transition-colors ${
                      isActive
                        ? 'bg-[#C2E7FF] text-[#001D35] font-semibold'
                        : 'text-slate-700 hover:bg-slate-100 font-normal'
                    }`}
                  >
                    <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-[#001D35]' : 'text-slate-600'}`} />
                    <span className="truncate">{item.label}</span>
                  </Link>
                );
              }

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={item.label}
                  className={`w-11 h-11 mx-auto rounded-full flex items-center justify-center transition-colors ${
                    isActive
                      ? 'bg-[#C2E7FF] text-[#001D35]'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </Link>
              );
            })}
          </nav>

          {/* Sidebar Footer Link */}
          <div className="pt-2 border-t border-slate-100">
            {isSidebarOpen ? (
              <Link
                href="/"
                target="_blank"
                className="flex items-center space-x-3 px-4 py-2 rounded-full text-xs text-slate-500 hover:bg-slate-100 transition-colors"
              >
                <ExternalLink className="w-4 h-4 text-slate-400 shrink-0" />
                <span className="truncate">Laman Awam</span>
              </Link>
            ) : (
              <Link
                href="/"
                target="_blank"
                title="Laman Awam"
                className="w-10 h-10 mx-auto rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
              </Link>
            )}
          </div>
        </aside>

        {/* ----------------- MAIN VIEW CONTENT AREA ----------------- */}
        {pathname === '/admin/ads-generator' || pathname === '/admin/catalog' ? (
          <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden bg-white relative">
            <main className="flex-1 h-full overflow-hidden p-0">
              {children}
            </main>
          </div>
        ) : (
          <div className="flex-1 flex flex-col min-w-0 overflow-y-auto bg-white relative">
            <main className="flex-1 p-4 sm:p-6 md:p-8 max-w-[1700px] w-full mx-auto">
              {children}
            </main>

            {/* Google Style Floating Help Icon Button (Bottom Right) */}
            <div className="fixed bottom-4 right-4 z-20">
              <button
                type="button"
                className="w-10 h-10 rounded-full bg-white hover:bg-slate-100 text-slate-600 shadow-sm border border-slate-200 flex items-center justify-center transition-transform active:scale-95 cursor-pointer"
                title="Bantuan & Panduan"
              >
                <HelpCircle className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


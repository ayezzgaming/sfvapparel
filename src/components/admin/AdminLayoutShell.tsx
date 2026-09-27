'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAdminAuth } from '@/hooks/useAdminAuth';
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
  Megaphone,
  CreditCard,
  ShieldCheck,
  LogOut,
  User,
  Settings,
  Loader2,
  ChevronDown
} from 'lucide-react';
import { FaWhatsapp } from 'react-icons/fa6';

const ADMIN_NAV = [
  { href: '/admin', label: 'Beranda', icon: Home, exact: true },
  { href: '/admin/orders', label: 'Saluran Pesanan', icon: ClipboardList },
  { href: '/admin/catalog', label: 'Katalog Rekaan', icon: Shirt },
  { href: '/admin/payment-settings', label: 'Gerbang Pembayaran', icon: CreditCard },
  { href: '/admin/ads-generator', label: 'Ads Generator', icon: Megaphone },
  { href: '/admin/whatsapp-hub', label: 'WhatsApp Hub', icon: FaWhatsapp },
  { href: '/admin/cms', label: 'Pengurus Web', icon: Globe },
  { href: '/admin/customers', label: 'Pelanggan', icon: Users },
  { href: '/admin/pricing-rules', label: 'Formula Harga', icon: SlidersHorizontal },
  { href: '/admin/admins', label: 'Pengurusan Admin', icon: ShieldCheck },
];

export default function AdminLayoutShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { admin, isAuthenticated, isLoading: authLoading, logout } = useAdminAuth();

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [whatsappStatus, setWhatsappStatus] = useState<'WORKING' | 'SCAN_QR_CODE' | 'DISCONNECTED' | 'LOADING'>('LOADING');
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  // If on login page, render children directly without shell
  const isLoginPage = pathname === '/admin/login';

  // Live check of WhatsApp engine status
  useEffect(() => {
    if (isLoginPage) return;

    let isMounted = true;
    const checkWaStatus = async () => {
      try {
        const res = await fetch('/api/whatsapp/status', { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          if (isMounted) {
            setWhatsappStatus(data.status === 'WORKING' ? 'WORKING' : 'SCAN_QR_CODE');
          }
        } else if (isMounted) {
          setWhatsappStatus('DISCONNECTED');
        }
      } catch {
        if (isMounted) setWhatsappStatus('DISCONNECTED');
      }
    };

    checkWaStatus();
    const interval = setInterval(checkWaStatus, 20000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [isLoginPage]);

  // Auth Guard: redirect to /admin/login if not authenticated
  useEffect(() => {
    if (!isLoginPage && !authLoading && !isAuthenticated) {
      router.replace(`/admin/login?redirect=${encodeURIComponent(pathname)}`);
    }
  }, [isLoginPage, authLoading, isAuthenticated, router, pathname]);

  // Click outside listener for profile menu dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Return bare page if on /admin/login
  if (isLoginPage) {
    return <>{children}</>;
  }

  // Show auth loading state
  if (authLoading || !isAuthenticated) {
    return (
      <div className="h-screen w-full bg-slate-950 flex flex-col items-center justify-center space-y-3">
        <Loader2 className="w-8 h-8 animate-spin text-[#00BDFF]" />
        <p className="text-xs text-slate-400 font-medium">Mengesahkan sesi pentadbir...</p>
      </div>
    );
  }

  // Find active nav item for breadcrumb
  const activeNavItem = ADMIN_NAV.find((item) =>
    item.exact ? pathname === item.href : pathname.startsWith(item.href)
  );

  return (
    <div className="h-full w-full bg-white text-slate-800 flex flex-col antialiased overflow-hidden font-sans select-none">
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
          <Link href="/admin" className="flex items-center gap-2 hover:opacity-90 transition-opacity">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo.svg"
              alt="SFV APPAREL"
              className="h-7 sm:h-7.5 w-auto object-contain shrink-0"
            />
            <span className="text-[15px] tracking-tight text-slate-900 leading-none flex items-center">
              <span className="font-extrabold tracking-normal">SFV</span>
              <span className="font-light ml-1 text-slate-700 tracking-wide">APPAREL</span>
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

        {/* Right: WhatsApp Live Status Alert Pill, Quick Action +, Apps Grid, Profile Avatar */}
        <div className="flex items-center space-x-2.5">
          {/* Live WhatsApp Connection Monitor Badge */}
          {whatsappStatus === 'WORKING' ? (
            <Link
              href="/admin/whatsapp-hub"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200/80 text-emerald-700 text-xs font-semibold hover:bg-emerald-100 transition-colors shadow-2xs"
              title="WhatsApp AI CS Aktif"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>WhatsApp Aktif</span>
            </Link>
          ) : whatsappStatus !== 'LOADING' ? (
            <Link
              href="/admin/whatsapp-hub"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-rose-50 border border-rose-300 text-rose-700 text-xs font-bold hover:bg-rose-100 transition-colors shadow-xs animate-bounce"
              title="WhatsApp Terputus! Klik untuk Scan QR"
            >
              <span className="w-2 h-2 rounded-full bg-rose-600 animate-ping" />
              <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
              <span>WhatsApp Terputus - Scan QR</span>
            </Link>
          ) : null}

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
            className="w-10 h-10 rounded-full flex items-center justify-center text-slate-600 hover:bg-slate-100 hover:text-[#00BDFF] transition-colors"
            title="Buka Laman Web Awam"
          >
            <Grip className="w-5 h-5" />
          </Link>

          {/* User Profile Avatar with Dropdown Menu */}
          <div className="relative pl-1" ref={profileMenuRef}>
            <button
              type="button"
              onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
              className="flex items-center gap-1.5 p-1 rounded-full hover:bg-slate-100 transition-all cursor-pointer focus:outline-none ring-2 ring-transparent focus:ring-[#00BDFF]"
              title="Akaun Pentadbir"
            >
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#0052FF] to-[#00BDFF] text-white flex items-center justify-center font-bold text-xs shadow-xs border-2 border-white ring-1 ring-slate-200">
                {admin?.full_name?.charAt(0)?.toUpperCase() || 'A'}
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-500 hidden sm:block" />
            </button>

            {/* Profile Dropdown Menu */}
            {isProfileMenuOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl border border-slate-200 shadow-xl py-2 z-50 animate-scale-in text-left">
                <div className="px-4 py-3 border-b border-slate-100">
                  <p className="text-xs font-bold text-slate-900 truncate">{admin?.full_name}</p>
                  <p className="text-[11px] text-slate-500 truncate">{admin?.email}</p>
                  <div className="mt-1.5">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 text-[#0052FF] text-[10px] font-bold border border-blue-100">
                      <ShieldCheck className="w-3 h-3" />
                      <span className="capitalize">{admin?.role?.replace('_', ' ') || 'Admin'}</span>
                    </span>
                  </div>
                </div>

                <div className="py-1">
                  <Link
                    href="/admin/admins?tab=team"
                    onClick={() => setIsProfileMenuOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    <Users className="w-4 h-4 text-slate-400" />
                    <span>Pengurusan Pentadbir</span>
                  </Link>

                  <Link
                    href="/admin/admins?tab=profile"
                    onClick={() => setIsProfileMenuOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    <Settings className="w-4 h-4 text-slate-400" />
                    <span>Tetapan Profil & Sekuriti</span>
                  </Link>
                </div>

                <div className="pt-1 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => {
                      setIsProfileMenuOpen(false);
                      setIsLogoutModalOpen(true);
                    }}
                    className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer text-left font-semibold"
                  >
                    <LogOut className="w-4 h-4 text-rose-500" />
                    <span>Log Keluar</span>
                  </button>
                </div>
              </div>
            )}
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
        {pathname.startsWith('/admin/orders') ||
        pathname.startsWith('/admin/catalog') ||
        pathname.startsWith('/admin/payment-settings') ||
        pathname.startsWith('/admin/ads-generator') ||
        pathname.startsWith('/admin/cms') ||
        pathname.startsWith('/admin/whatsapp-hub') ||
        pathname.startsWith('/admin/customers') ||
        pathname.startsWith('/admin/pricing-rules') ? (
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
              <Link
                href="/admin/admins"
                className="w-10 h-10 rounded-full bg-white hover:bg-slate-100 text-slate-600 shadow-sm border border-slate-200 flex items-center justify-center transition-transform active:scale-95 cursor-pointer"
                title="Pengurusan Pentadbir & Keselamatan"
              >
                <HelpCircle className="w-5 h-5" />
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Logout Confirmation Modal */}
      {isLogoutModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 max-w-sm w-full p-6 shadow-2xl space-y-4 animate-scale-in text-center">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold mx-auto ring-4 ring-rose-100/50">
              <LogOut className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-900">Log Keluar Pentadbir?</h3>
              <p className="text-xs text-slate-500">
                Adakah anda pasti mahu menamatkan sesi pentadbir ini?
              </p>
            </div>

            <div className="flex items-center justify-center gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setIsLogoutModalOpen(false)}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors w-1/2"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsLogoutModalOpen(false);
                  logout();
                }}
                className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md shadow-rose-500/20 active:scale-95 transition-all w-1/2 flex items-center justify-center gap-1.5"
              >
                <LogOut className="w-4 h-4" />
                <span>Log Keluar</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

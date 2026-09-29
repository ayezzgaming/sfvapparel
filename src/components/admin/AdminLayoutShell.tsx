'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { AdminAuthProvider, useAdminAuth } from '@/hooks/useAdminAuth';
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
  Settings,
  Loader2,
  ChevronDown,
  AlertCircle,
  KeyRound,
  Eye,
  EyeOff,
  CheckCircle2,
  X,
  Lock,
  Factory,
  TrendingUp,
  Receipt,
  Hourglass,
  Building2,
  FileSpreadsheet,
  Wallet
} from 'lucide-react';

// Official WhatsApp Logo Icon with standard 24x24 viewBox for perfect optical alignment and size uniformity with Lucide icons
function OfficialWhatsAppIcon({ className = "w-4.5 h-4.5", ...props }: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.414-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.888 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.456 5.711 1.457h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

interface NavItem {
  href: string;
  label: string;
  icon: any;
  exact?: boolean;
}

interface NavGroup {
  id: string;
  title: string;
  items: NavItem[];
}

const PRIMARY_NAV_GROUPS: NavGroup[] = [
  {
    id: 'operations',
    title: 'Operasi',
    items: [
      { href: '/admin', label: 'Beranda', icon: Home, exact: true },
      { href: '/admin/orders', label: 'Saluran Pesanan', icon: ClipboardList },
      { href: '/admin/factory-jobs', label: 'Job Sheet Kilang', icon: Factory },
      { href: '/admin/catalog', label: 'Katalog Rekaan', icon: Shirt },
      { href: '/admin/customers', label: 'Pelanggan', icon: Users },
    ],
  },
  {
    id: 'marketing',
    title: 'Komunikasi & Iklan',
    items: [
      { href: '/admin/whatsapp-hub', label: 'WhatsApp Hub', icon: OfficialWhatsAppIcon },
      { href: '/admin/ads-generator', label: 'Ads Generator', icon: Megaphone },
    ],
  },
];

const FINANCE_NAV_ITEMS: NavItem[] = [
  { href: '/admin/finance', label: 'Penyata P&L', icon: TrendingUp, exact: true },
  { href: '/admin/finance/transactions', label: 'Lejar Transaksi', icon: Receipt },
  { href: '/admin/finance/receivables', label: 'Kutipan Baki (A/R)', icon: Hourglass },
  { href: '/admin/finance/payables', label: 'Bayaran Kilang (A/P)', icon: Building2 },
  { href: '/admin/finance/reports', label: 'Laporan & Eksport', icon: FileSpreadsheet },
];

const SETTINGS_NAV_ITEMS: NavItem[] = [
  { href: '/admin/payment-settings', label: 'Gerbang Pembayaran', icon: CreditCard },
  { href: '/admin/pricing-rules', label: 'Formula Harga', icon: SlidersHorizontal },
  { href: '/admin/cms', label: 'Pengurus Web', icon: Globe },
  { href: '/admin/admins', label: 'Pengurusan Admin', icon: ShieldCheck },
];

const ALL_ADMIN_NAV_ITEMS: NavItem[] = [
  ...PRIMARY_NAV_GROUPS.flatMap((g) => g.items),
  ...FINANCE_NAV_ITEMS,
  ...SETTINGS_NAV_ITEMS,
];

function AdminLayoutInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { admin, isAuthenticated, isLoading: authLoading, logout, updateProfile } = useAdminAuth();

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [whatsappStatus, setWhatsappStatus] = useState<'WORKING' | 'SCAN_QR_CODE' | 'DISCONNECTED' | 'LOADING'>('LOADING');
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  // Finance Sub-menu Expand State
  const isInsideFinance = FINANCE_NAV_ITEMS.some((item) =>
    item.exact ? pathname === item.href : pathname.startsWith(item.href)
  );
  const [isFinanceOpen, setIsFinanceOpen] = useState(true);

  useEffect(() => {
    if (isInsideFinance) {
      setIsFinanceOpen(true);
    }
  }, [isInsideFinance]);

  // Settings Sub-menu Expand State (Auto-expand if currently inside settings)
  const isInsideSettings = SETTINGS_NAV_ITEMS.some((item) => pathname.startsWith(item.href));
  const [isSettingsOpen, setIsSettingsOpen] = useState(true);

  useEffect(() => {
    if (isInsideSettings) {
      setIsSettingsOpen(true);
    }
  }, [isInsideSettings]);
  
  // Quick Change Password Modal
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordFeedback, setPasswordFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

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

  const handleChangePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isChangingPassword) return;

    setPasswordFeedback(null);

    if (!currentPassword) {
      setPasswordFeedback({ type: 'error', message: 'Sila masukkan kata laluan semasa anda.' });
      return;
    }

    if (!newPassword || newPassword.length < 6) {
      setPasswordFeedback({ type: 'error', message: 'Kata laluan baru mestilah sekurang-kurangnya 6 aksara.' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordFeedback({ type: 'error', message: 'Pengesahan kata laluan baru tidak sepadan.' });
      return;
    }

    setIsChangingPassword(true);
    try {
      const res = await updateProfile({
        current_password: currentPassword,
        new_password: newPassword,
      });

      if (res.success) {
        setPasswordFeedback({ type: 'success', message: 'Kata laluan pentadbir berjaya ditukar!' });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setTimeout(() => {
          setIsPasswordModalOpen(false);
          setPasswordFeedback(null);
        }, 1500);
      } else {
        setPasswordFeedback({ type: 'error', message: res.message || 'Gagal menukar kata laluan.' });
      }
    } catch {
      setPasswordFeedback({ type: 'error', message: 'Ralat sambungan pelayan.' });
    } finally {
      setIsChangingPassword(false);
    }
  };

  // Return bare page if on /admin/login
  if (isLoginPage) {
    return <>{children}</>;
  }

  // Show auth loading state
  if (authLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen h-screen w-full bg-slate-50 flex flex-col items-center justify-center space-y-3 font-sans">
        <Loader2 className="w-8 h-8 animate-spin text-[#00BDFF]" />
        <p className="text-xs text-slate-500 font-medium">Mengesahkan sesi pentadbir...</p>
      </div>
    );
  }

  // Find active nav item for breadcrumb
  const activeNavItem = ALL_ADMIN_NAV_ITEMS.find((item) =>
    item.exact ? pathname === item.href : pathname.startsWith(item.href)
  );
  const activeFinanceItem = FINANCE_NAV_ITEMS.find((item) =>
    item.exact ? pathname === item.href : pathname.startsWith(item.href)
  );
  const activeSettingsItem = SETTINGS_NAV_ITEMS.find((item) => pathname.startsWith(item.href));

  return (
    <div className="min-h-screen h-screen w-full bg-white text-slate-800 flex flex-col antialiased overflow-hidden font-sans select-none">
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
              width={120}
              height={28}
              style={{ maxHeight: '28px', maxWidth: '120px', width: 'auto', height: '28px', display: 'inline-block' }}
              className="h-7 w-auto max-h-7 max-w-[120px] object-contain shrink-0"
            />
            <span className="text-[15px] tracking-tight text-slate-900 leading-none flex items-center">
              <span className="font-extrabold tracking-normal">SFV</span>
              <span className="font-light ml-1 text-slate-700 tracking-wide">APPAREL</span>
            </span>
          </Link>

          {/* Breadcrumb if inside child page */}
          {activeFinanceItem ? (
            <div className="hidden md:flex items-center space-x-2 text-slate-500 text-sm">
              <ChevronRight className="w-4 h-4 text-slate-400" />
              <span className="text-slate-500 font-normal">Kewangan & Akaun</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-slate-800 font-semibold">{activeFinanceItem.label}</span>
            </div>
          ) : activeSettingsItem ? (
            <div className="hidden md:flex items-center space-x-2 text-slate-500 text-sm">
              <ChevronRight className="w-4 h-4 text-slate-400" />
              <span className="text-slate-500 font-normal">Pengaturan</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-slate-800 font-semibold">{activeSettingsItem.label}</span>
            </div>
          ) : activeNavItem && activeNavItem.href !== '/admin' ? (
            <div className="hidden md:flex items-center space-x-2 text-slate-500 text-sm">
              <ChevronRight className="w-4 h-4 text-slate-400" />
              <span className="text-slate-800 font-semibold">{activeNavItem.label}</span>
            </div>
          ) : null}
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
                  {/* DIRECT BUTTON: TUKAR KATA LALUAN */}
                  <button
                    type="button"
                    onClick={() => {
                      setIsProfileMenuOpen(false);
                      setPasswordFeedback(null);
                      setCurrentPassword('');
                      setNewPassword('');
                      setConfirmPassword('');
                      setIsPasswordModalOpen(true);
                    }}
                    className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors text-left cursor-pointer"
                  >
                    <KeyRound className="w-4 h-4 text-[#0052FF]" />
                    <span>Tukar Kata Laluan</span>
                  </button>

                  <Link
                    href="/admin/admins?tab=profile"
                    onClick={() => setIsProfileMenuOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    <Settings className="w-4 h-4 text-slate-400" />
                    <span>Tetapan Emel & Profil</span>
                  </Link>

                  <Link
                    href="/admin/admins?tab=team"
                    onClick={() => setIsProfileMenuOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    <Users className="w-4 h-4 text-slate-400" />
                    <span>Pengurusan Pentadbir</span>
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
          <nav className="space-y-4 overflow-y-auto sparkle-scroll flex-1 pr-1">
            {PRIMARY_NAV_GROUPS.map((group) => (
              <div key={group.id} className="space-y-1">
                {isSidebarOpen && (
                  <p className="px-3.5 text-[10.5px] font-bold text-slate-400 uppercase tracking-wider select-none mb-1">
                    {group.title}
                  </p>
                )}
                <div className="space-y-0.5">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = item.exact
                      ? pathname === item.href
                      : pathname.startsWith(item.href);

                    if (isSidebarOpen) {
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          className={`flex items-center space-x-3 px-3.5 py-2 rounded-full text-[13px] transition-colors ${
                            isActive
                              ? 'bg-[#C2E7FF] text-[#001D35] font-semibold'
                              : 'text-slate-700 hover:bg-slate-100 font-medium'
                          }`}
                        >
                          <Icon className={`w-4.5 h-4.5 shrink-0 ${isActive ? 'text-[#001D35]' : 'text-slate-600'}`} />
                          <span className="truncate">{item.label}</span>
                        </Link>
                      );
                    }

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        title={item.label}
                        className={`w-10 h-10 mx-auto rounded-full flex items-center justify-center transition-colors ${
                          isActive
                            ? 'bg-[#C2E7FF] text-[#001D35]'
                            : 'text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        <Icon className="w-4.5 h-4.5" />
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}

            {/* KEWANGAN & AKAUN SUB-MENU GROUP */}
            <div className="space-y-1 pt-2 border-t border-slate-100">
              {isSidebarOpen ? (
                <div>
                  <button
                    type="button"
                    onClick={() => setIsFinanceOpen(!isFinanceOpen)}
                    className={`w-full flex items-center justify-between px-3.5 py-2 rounded-full text-[13px] transition-colors cursor-pointer ${
                      isInsideFinance && !isFinanceOpen
                        ? 'bg-[#C2E7FF] text-[#001D35] font-semibold'
                        : 'text-slate-700 hover:bg-slate-100 font-semibold'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <Wallet className={`w-4.5 h-4.5 shrink-0 ${isInsideFinance ? 'text-[#001D35]' : 'text-slate-600'}`} />
                      <span>Kewangan & Akaun</span>
                    </div>
                    <ChevronDown
                      className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
                        isFinanceOpen ? 'rotate-180 text-slate-600' : ''
                      }`}
                    />
                  </button>

                  {/* Collapsible Sub-menu Items */}
                  {isFinanceOpen && (
                    <div className="mt-1 space-y-0.5 pl-3 border-l-2 border-slate-100 ml-5">
                      {FINANCE_NAV_ITEMS.map((item) => {
                        const Icon = item.icon;
                        const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href);
                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            className={`flex items-center space-x-2.5 px-3 py-1.5 rounded-full text-xs transition-colors ${
                              isActive
                                ? 'bg-sky-50 text-[#00BDFF] font-bold border border-sky-200/60'
                                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 font-medium'
                            }`}
                          >
                            <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-[#00BDFF]' : 'text-slate-500'}`} />
                            <span className="truncate">{item.label}</span>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-1">
                  {FINANCE_NAV_ITEMS.map((item) => {
                    const Icon = item.icon;
                    const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href);
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        title={`Kewangan: ${item.label}`}
                        className={`w-10 h-10 mx-auto rounded-full flex items-center justify-center transition-colors ${
                          isActive
                            ? 'bg-[#C2E7FF] text-[#001D35]'
                            : 'text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        <Icon className="w-4.5 h-4.5" />
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>

            {/* PENGATURAN SUB-MENU GROUP */}
            <div className="space-y-1 pt-2 border-t border-slate-100">
              {isSidebarOpen ? (
                <div>
                  <button
                    type="button"
                    onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                    className={`w-full flex items-center justify-between px-3.5 py-2 rounded-full text-[13px] transition-colors cursor-pointer ${
                      isInsideSettings && !isSettingsOpen
                        ? 'bg-[#C2E7FF] text-[#001D35] font-semibold'
                        : 'text-slate-700 hover:bg-slate-100 font-semibold'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <Settings className={`w-4.5 h-4.5 shrink-0 ${isInsideSettings ? 'text-[#001D35]' : 'text-slate-600'}`} />
                      <span>Pengaturan</span>
                    </div>
                    <ChevronDown
                      className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
                        isSettingsOpen ? 'rotate-180 text-slate-600' : ''
                      }`}
                    />
                  </button>

                  {/* Collapsible Sub-menu Items */}
                  {isSettingsOpen && (
                    <div className="mt-1 space-y-0.5 pl-3 border-l-2 border-slate-100 ml-5">
                      {SETTINGS_NAV_ITEMS.map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname.startsWith(item.href);
                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            className={`flex items-center space-x-2.5 px-3 py-1.5 rounded-full text-xs transition-colors ${
                              isActive
                                ? 'bg-sky-50 text-[#00BDFF] font-bold border border-sky-200/60'
                                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 font-medium'
                            }`}
                          >
                            <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-[#00BDFF]' : 'text-slate-500'}`} />
                            <span className="truncate">{item.label}</span>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-1">
                  {SETTINGS_NAV_ITEMS.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname.startsWith(item.href);
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        title={`Pengaturan: ${item.label}`}
                        className={`w-10 h-10 mx-auto rounded-full flex items-center justify-center transition-colors ${
                          isActive
                            ? 'bg-[#C2E7FF] text-[#001D35]'
                            : 'text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        <Icon className="w-4.5 h-4.5" />
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
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

      {/* =========================================================================
          MODAL: DIRECT TUKAR KATA LALUAN (ACCESSIBLE FROM HEADER EVERYWHERE)
         ========================================================================= */}
      {isPasswordModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 max-w-md w-full p-6 shadow-2xl space-y-4 animate-scale-in">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#0052FF] flex items-center justify-center font-bold">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Tukar Kata Laluan Pentadbir</h3>
                  <p className="text-[11px] text-slate-400">{admin?.email}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsPasswordModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {passwordFeedback && (
              <div
                className={`p-3 rounded-2xl border text-xs flex items-start gap-2.5 ${
                  passwordFeedback.type === 'success'
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                    : 'bg-rose-50 border-rose-200 text-rose-700'
                }`}
              >
                {passwordFeedback.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                )}
                <span className="leading-snug">{passwordFeedback.message}</span>
              </div>
            )}

            <form onSubmit={handleChangePasswordSubmit} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Kata Laluan Semasa <span className="text-rose-500">*</span>
                </label>
                <div className="flex items-center rounded-xl bg-slate-50 border border-slate-200 px-3 py-2.5 focus-within:bg-white focus-within:border-[#00BDFF] transition-all">
                  <Lock className="w-4 h-4 text-slate-400 mr-2.5" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Masukkan kata laluan semasa"
                    required
                    className="w-full text-xs font-semibold text-slate-900 bg-transparent focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-slate-400 hover:text-slate-700 ml-2 focus:outline-none cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Kata Laluan Baru <span className="text-rose-500">*</span>
                </label>
                <div className="flex items-center rounded-xl bg-slate-50 border border-slate-200 px-3 py-2.5 focus-within:bg-white focus-within:border-[#00BDFF] transition-all">
                  <KeyRound className="w-4 h-4 text-slate-400 mr-2.5" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Min 6 aksara"
                    required
                    className="w-full text-xs font-semibold text-slate-900 bg-transparent focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Sahkan Kata Laluan Baru <span className="text-rose-500">*</span>
                </label>
                <div className="flex items-center rounded-xl bg-slate-50 border border-slate-200 px-3 py-2.5 focus-within:bg-white focus-within:border-[#00BDFF] transition-all">
                  <KeyRound className="w-4 h-4 text-slate-400 mr-2.5" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Ulang kata laluan baru"
                    required
                    className="w-full text-xs font-semibold text-slate-900 bg-transparent focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsPasswordModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isChangingPassword || !currentPassword || !newPassword || !confirmPassword}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#0052FF] to-[#00BDFF] hover:opacity-95 text-white font-bold text-xs shadow-md shadow-blue-500/20 active:scale-95 disabled:opacity-40 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  {isChangingPassword ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Simpan Kata Laluan Baru</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors w-1/2 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsLogoutModalOpen(false);
                  logout();
                }}
                className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md shadow-rose-500/20 active:scale-95 transition-all w-1/2 flex items-center justify-center gap-1.5 cursor-pointer"
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

export default function AdminLayoutShell({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminAuthProvider>
      <AdminLayoutInner>{children}</AdminLayoutInner>
    </AdminAuthProvider>
  );
}

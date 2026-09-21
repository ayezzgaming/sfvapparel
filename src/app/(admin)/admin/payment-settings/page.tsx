'use client';

import React, { useState, useEffect } from 'react';
import { 
  CreditCard, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle, 
  ExternalLink, 
  Copy, 
  Check, 
  Eye, 
  EyeOff, 
  RefreshCw, 
  Save, 
  Key, 
  Zap, 
  Lock, 
  Globe, 
  Layers,
  HelpCircle,
  Building2,
  ChevronLeft,
  ChevronRight,
  Search,
  Activity,
  QrCode,
  Wallet,
  Smartphone,
  CheckCheck
} from 'lucide-react';
import { 
  getPaymentConfigAction, 
  savePaymentConfigAction, 
  testChipConnectionAction 
} from '@/app/actions/paymentActions';
import { PaymentGatewayConfig } from '@/types/database';

type PaymentTabKey = 'status' | 'credentials' | 'methods' | 'webhooks' | 'diagnostics';

export default function AdminPaymentSettingsPage() {
  const [config, setConfig] = useState<PaymentGatewayConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isLeftPanelCollapsed, setIsLeftPanelCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState<PaymentTabKey>('status');
  const [searchFilter, setSearchFilter] = useState('');

  // Form states
  const [brandId, setBrandId] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [publicKey, setPublicKey] = useState('');
  const [isActive, setIsActive] = useState(false);
  const [isSandbox, setIsSandbox] = useState(true);
  const [selectedMethods, setSelectedMethods] = useState<string[]>([
    'fpx',
    'card',
    'duitnow_qr',
    'ewallet',
  ]);

  // UI helpers
  const [showApiKey, setShowApiKey] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    latencyMs: number;
    message: string;
    brandTitle?: string;
  } | null>(null);

  // Computed Host / Base URL for webhook
  const [originUrl, setOriginUrl] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setOriginUrl(window.location.origin);
    }
  }, []);

  const webhookUrl = `${originUrl || 'https://sfvapparel.my'}/api/payment/chip/webhook`;
  const successRedirectUrl = `${originUrl || 'https://sfvapparel.my'}/history`;

  // Load initial config
  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      const res = await getPaymentConfigAction();
      if (res.success && res.config) {
        setConfig(res.config);
        setBrandId(res.config.brand_id || '');
        setApiKey(res.config.api_key || '');
        setPublicKey(res.config.public_key || '');
        setIsActive(res.config.is_active);
        setIsSandbox(res.config.is_sandbox);
        if (res.config.payment_methods) {
          setSelectedMethods(res.config.payment_methods);
        }
      }
      setIsLoading(false);
    }
    loadData();
  }, []);

  const handleCopy = (text: string, fieldKey: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldKey);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleToggleMethod = (methodId: string) => {
    setSelectedMethods((prev) =>
      prev.includes(methodId) ? prev.filter((m) => m !== methodId) : [...prev, methodId]
    );
  };

  // Test API Connection
  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    setNotification(null);

    const res = await testChipConnectionAction(brandId, apiKey, isSandbox);
    setTestResult(res);
    setIsTesting(false);
  };

  // Save Settings
  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSaving(true);
    setNotification(null);

    const res = await savePaymentConfigAction({
      provider: 'chip',
      brand_id: brandId.trim(),
      api_key: apiKey.trim(),
      public_key: publicKey.trim(),
      is_active: isActive,
      is_sandbox: isSandbox,
      payment_methods: selectedMethods,
    });

    setIsSaving(false);

    if (res.success && res.config) {
      setConfig(res.config);
      setApiKey(res.config.api_key || '');
      setNotification({
        type: 'success',
        message: 'Konfigurasi CHIP Payment Gateway berjaya disimpan ke pangkalan data.',
      });
      setTimeout(() => setNotification(null), 4000);
    } else {
      setNotification({
        type: 'error',
        message: res.message || 'Gagal menyimpan konfigurasi.',
      });
    }
  };

  const SECTIONS: { id: PaymentTabKey; label: string; desc: string; icon: React.ElementType }[] = [
    { id: 'status', label: 'Status & Mod Operasi', desc: 'Pengaktifan gateway & Sandbox/Live', icon: Zap },
    { id: 'credentials', label: 'Kunci API & Kredensial', desc: 'Brand ID, Secret Key & Public Key', icon: Key },
    { id: 'methods', label: 'Kaedah Pembayaran', desc: 'FPX, Kad, DuitNow QR & e-Wallet', icon: Layers },
    { id: 'webhooks', label: 'Webhook & Callback', desc: 'URL notifikasi transaksi automatik', icon: Globe },
    { id: 'diagnostics', label: 'Ujian Sambungan API', desc: 'Pemeriksaan status & latency CHIP', icon: Activity },
  ];

  const filteredSections = SECTIONS.filter(
    (s) => s.label.toLowerCase().includes(searchFilter.toLowerCase()) || s.desc.toLowerCase().includes(searchFilter.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center p-8 space-y-3 bg-[#f0f4f9] dark:bg-zinc-950 text-slate-700">
        <RefreshCw className="w-8 h-8 animate-spin text-[#00BDFF]" />
        <p className="text-xs font-semibold text-slate-500">Memuatkan tetapan gerbang pembayaran...</p>
      </div>
    );
  }

  return (
    <div className="w-full h-full overflow-hidden bg-[#f0f4f9] dark:bg-zinc-950 flex flex-col p-4 gap-3 text-slate-900 dark:text-zinc-100 font-sans select-none">
      
      {/* Toast Notification */}
      {notification && (
        <div
          className={`fixed top-5 right-5 z-50 px-4 py-2.5 rounded-2xl shadow-xl border flex items-center space-x-2 text-xs animate-in fade-in slide-in-from-top-2 ${
            notification.type === 'success'
              ? 'bg-emerald-900 text-white border-emerald-700'
              : 'bg-rose-900 text-white border-rose-700'
          }`}
        >
          {notification.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          )}
          <span>{notification.message}</span>
        </div>
      )}

      {/* ----------------- TOP TOOLBAR BAR ----------------- */}
      <div className="shrink-0 flex items-center justify-between gap-3 min-h-[38px]">
        {/* Title & Status */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold text-slate-800 dark:text-zinc-100 tracking-tight">
              Gerbang Pembayaran CHIP
            </span>
            <span className="text-[10px] font-semibold text-[#00BDFF] bg-sky-50 dark:bg-sky-950/50 px-2.5 py-0.5 rounded-full border border-sky-200/60 dark:border-sky-900">
              portal.chip-in.asia
            </span>
          </div>
        </div>

        {/* Toolbar Kanan */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 text-slate-700 dark:text-zinc-200 text-xs font-semibold shadow-2xs">
            <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
            <span>{isActive ? (isSandbox ? 'Sandbox Aktif' : 'Produksi Live Aktif') : 'Gateway Nyahaktif'}</span>
          </div>

          <button
            type="button"
            onClick={handleTestConnection}
            disabled={isTesting}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 hover:border-slate-300 text-slate-700 dark:text-zinc-200 text-xs font-semibold transition-all shadow-2xs cursor-pointer disabled:opacity-50 active:scale-95"
          >
            <Activity className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin text-[#00BDFF]' : 'text-slate-500'}`} />
            <span>{isTesting ? 'Menguji API...' : 'Uji Sambungan'}</span>
          </button>

          <a
            href="https://portal.chip-in.asia"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 hover:border-slate-300 text-slate-700 dark:text-zinc-200 text-xs font-medium transition-all shadow-2xs cursor-pointer active:scale-95"
          >
            <span className="hidden sm:inline">Portal CHIP</span>
            <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
          </a>

          <button
            type="button"
            onClick={() => handleSave()}
            disabled={isSaving}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-[#00BDFF] hover:bg-[#00a6e0] text-white text-xs font-semibold shadow-xs transition-all cursor-pointer active:scale-95 disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{isSaving ? 'Menyimpan...' : 'Simpan Tetapan'}</span>
          </button>
        </div>
      </div>

      {/* ----------------- SPLIT PANEL BODY ----------------- */}
      <div className="flex-1 min-h-0 overflow-hidden flex items-stretch gap-4 relative animate-in fade-in">
        
        {/* =========================================================================
            SISI KIRI: PANEL NAVIGASI MODUL PEMBAYARAN
           ========================================================================= */}
        <div
          className={`flex flex-col h-full shrink-0 transition-all duration-300 ease-in-out select-none ${
            isLeftPanelCollapsed
              ? 'w-0 opacity-0 overflow-hidden pointer-events-none'
              : 'w-[280px] xl:w-[320px] opacity-100'
          }`}
        >
          {/* Search / Filter */}
          <div className="p-3 bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200/80 dark:border-zinc-800 shadow-2xs mb-2.5 shrink-0">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="Cari tetapan pembayaran..."
                className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-50 dark:bg-zinc-800 text-xs text-slate-800 dark:text-zinc-100 placeholder-slate-400 border border-slate-200 dark:border-zinc-700 focus:outline-none focus:ring-1 focus:ring-[#00BDFF] focus:border-[#00BDFF] font-medium"
              />
            </div>
          </div>

          {/* Nav Items List */}
          <div className="flex-1 min-h-0 overflow-y-auto space-y-1.5 pr-1 pb-2 sparkle-scroll">
            {filteredSections.map((sec) => {
              const Icon = sec.icon;
              const isActiveTab = activeTab === sec.id;
              return (
                <button
                  key={sec.id}
                  type="button"
                  onClick={() => setActiveTab(sec.id)}
                  className={`w-full flex items-center justify-between p-3 rounded-2xl text-left transition-all cursor-pointer ${
                    isActiveTab
                      ? 'bg-sky-50/80 dark:bg-sky-950/40 border-2 border-[#00BDFF] ring-2 ring-[#00BDFF]/20 shadow-xs'
                      : 'bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 hover:border-slate-300 hover:bg-slate-50/70 dark:hover:bg-zinc-800/60 shadow-2xs'
                  }`}
                >
                  <div className="flex items-center space-x-3 min-w-0">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                        isActiveTab
                          ? 'bg-[#00BDFF] text-white shadow-xs'
                          : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className={`text-xs truncate ${isActiveTab ? 'font-bold text-sky-950 dark:text-sky-100' : 'font-semibold text-slate-800 dark:text-zinc-200'}`}>
                        {sec.label}
                      </p>
                      <p className={`text-[10.5px] truncate mt-0.5 ${isActiveTab ? 'text-[#00BDFF] dark:text-sky-300 font-medium' : 'text-slate-400 dark:text-zinc-500'}`}>
                        {sec.desc}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* =========================================================================
            SISI KANAN: KAD UTAMA KANDUNGAN & EDITOR GERBANG PEMBAYARAN
           ========================================================================= */}
        <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-slate-200/80 dark:border-zinc-800 shadow-sm flex flex-col h-full relative overflow-hidden transition-all duration-300 ease-in-out flex-1 min-w-0 mr-0">
          
          {/* Gagang Toggle Kapsul Sisi Kiri */}
          <button
            type="button"
            onClick={() => setIsLeftPanelCollapsed((v) => !v)}
            title={isLeftPanelCollapsed ? 'Buka Panel Navigasi' : 'Sembunyikan Panel Navigasi'}
            className={`absolute left-[5px] top-1/2 -translate-y-1/2 h-12 rounded-full flex items-center justify-center cursor-pointer select-none z-40 transition-all duration-200 ease-out group p-0 border-0 outline-none origin-left ${
              isLeftPanelCollapsed
                ? 'w-5 bg-[#f0f4f9] hover:bg-[#e2e7ee] dark:bg-zinc-700'
                : 'w-1.5 hover:w-5 bg-[#f0f4f9] hover:bg-[#e2e7ee] dark:bg-zinc-700'
            }`}
          >
            <span
              className={`transition-opacity duration-150 flex items-center justify-center text-slate-500 dark:text-zinc-300 ${
                isLeftPanelCollapsed ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
              }`}
            >
              {isLeftPanelCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
            </span>
          </button>

          {/* ----------------- INTERNAL CARD HEADER ----------------- */}
          <div className="shrink-0 px-6 py-3.5 border-b border-slate-100 dark:border-zinc-800/80 flex items-center justify-between gap-4 bg-slate-50/50 dark:bg-zinc-900/50">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-zinc-100 tracking-tight">
                {activeTab === 'status' && 'Status Gateway & Mod Persekitaran'}
                {activeTab === 'credentials' && 'Kunci API & Pengesahan Kredensial'}
                {activeTab === 'methods' && 'Kaedah Pembayaran Digital Pelanggan'}
                {activeTab === 'webhooks' && 'Webhook Endpoint & Pautan Pengalihan'}
                {activeTab === 'diagnostics' && 'Diagnostik & Ujian Sambungan Langsung'}
              </h2>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {activeTab === 'status' && 'Kawal pengaktifan pembayaran dan pilih persekitaran Sandbox atau Produksi Live'}
                {activeTab === 'credentials' && 'Konfigurasi Brand ID, Secret API Key, dan Public Key daripada akaun CHIP anda'}
                {activeTab === 'methods' && 'Pilih saluran pembayaran digital yang ingin dipaparkan kepada pelanggan di portal'}
                {activeTab === 'webhooks' && 'Daftar webhook URL pada portal CHIP untuk pengesahan pembayaran automatik 24/7'}
                {activeTab === 'diagnostics' && 'Periksa kesihatan sambungan API dan latency pelayan CHIP'}
              </p>
            </div>
          </div>

          {/* ----------------- SCROLLABLE CARD BODY ----------------- */}
          <div className="flex-1 overflow-y-auto sparkle-scroll p-5 sm:p-6 space-y-6">

            {/* TAB 1: STATUS & ENVIRONMENT */}
            {activeTab === 'status' && (
              <div className="max-w-2xl space-y-4 animate-in fade-in">
                <div className="p-4 rounded-2xl bg-sky-50/70 dark:bg-sky-950/30 border border-sky-200/70 dark:border-sky-900/60 flex items-start gap-3">
                  <div className="w-7 h-7 rounded-full bg-[#00BDFF] text-white flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                    <Zap className="w-4 h-4" />
                  </div>
                  <div className="text-xs space-y-0.5">
                    <p className="font-bold text-sky-950 dark:text-sky-100">
                      Integrasi Pembayaran Automatik CHIP
                    </p>
                    <p className="text-sky-800/80 dark:text-sky-300 text-[11px] leading-relaxed">
                      Sistem ini membolehkan pelanggan membayar deposit 50% atau lunas 100% serta-merta semasa membuat pesanan jersi. Status pesanan akan dikemaskini secara automatik setelah pembayaran selesai.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Toggle: Enable Gateway */}
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200/80 dark:border-zinc-700 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-slate-900 dark:text-zinc-100 block">Dayakan Pembayaran CHIP</span>
                      <span className="text-[11px] text-slate-500 block mt-0.5">
                        Aktifkan pilihan pembayaran digital di checkout awam.
                      </span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer shrink-0 ml-3">
                      <input
                        type="checkbox"
                        checked={isActive}
                        onChange={(e) => setIsActive(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-200 dark:bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#00BDFF]"></div>
                    </label>
                  </div>

                  {/* Toggle: Sandbox vs Live */}
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200/80 dark:border-zinc-700 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-slate-900 dark:text-zinc-100 block">Mod Sandbox (Ujian)</span>
                      <span className="text-[11px] text-slate-500 block mt-0.5">
                        {isSandbox ? 'Menggunakan kunci percubaan staging.' : 'Menggunakan akaun transaksi pengeluaran sebenar.'}
                      </span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer shrink-0 ml-3">
                      <input
                        type="checkbox"
                        checked={isSandbox}
                        onChange={(e) => setIsSandbox(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-200 dark:bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                    </label>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => handleSave()}
                    disabled={isSaving}
                    className="px-5 py-2.5 rounded-full bg-[#00BDFF] hover:bg-[#00a6e0] text-white text-xs font-semibold shadow-xs transition-all active:scale-95 cursor-pointer disabled:opacity-50"
                  >
                    {isSaving ? 'Menyimpan...' : 'Simpan Status Gateway'}
                  </button>
                </div>
              </div>
            )}

            {/* TAB 2: CREDENTIALS */}
            {activeTab === 'credentials' && (
              <div className="max-w-2xl space-y-4 animate-in fade-in">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 flex items-center justify-between">
                    <span>Brand ID (UUID) <span className="text-rose-500">*</span></span>
                    <span className="text-[10px] text-slate-400">Didapati di Portal CHIP → Brands</span>
                  </label>
                  <input
                    type="text"
                    value={brandId}
                    onChange={(e) => setBrandId(e.target.value)}
                    placeholder="cth: 3fa85f64-5717-4562-b3fc-2c963f66afa6"
                    className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 text-xs font-mono text-slate-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-[#00BDFF] focus:border-[#00BDFF]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 flex items-center justify-between">
                    <span>Secret API Key (Bearer Token) <span className="text-rose-500">*</span></span>
                    <button
                      type="button"
                      onClick={() => setShowApiKey(!showApiKey)}
                      className="text-[11px] text-[#00BDFF] hover:underline cursor-pointer inline-flex items-center gap-1"
                    >
                      {showApiKey ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                      <span>{showApiKey ? 'Sembunyikan' : 'Papar Kunci'}</span>
                    </button>
                  </label>
                  <input
                    type={showApiKey ? 'text' : 'password'}
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="cth: secret_..."
                    className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 text-xs font-mono text-slate-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-[#00BDFF] focus:border-[#00BDFF]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 flex items-center justify-between">
                    <span>Public Key (Pilihan untuk Enkripsi Webhook)</span>
                    <span className="text-[10px] text-slate-400">Pilihan keselamatan tambahan</span>
                  </label>
                  <textarea
                    rows={2}
                    value={publicKey}
                    onChange={(e) => setPublicKey(e.target.value)}
                    placeholder="-----BEGIN PUBLIC KEY-----..."
                    className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 text-xs font-mono text-slate-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-[#00BDFF] focus:border-[#00BDFF]"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => handleSave()}
                    disabled={isSaving}
                    className="px-5 py-2.5 rounded-full bg-[#00BDFF] hover:bg-[#00a6e0] text-white text-xs font-semibold shadow-xs transition-all active:scale-95 cursor-pointer disabled:opacity-50"
                  >
                    {isSaving ? 'Menyimpan...' : 'Simpan Kredensial'}
                  </button>
                </div>
              </div>
            )}

            {/* TAB 3: PAYMENT METHODS */}
            {activeTab === 'methods' && (
              <div className="max-w-2xl space-y-4 animate-in fade-in">
                <p className="text-xs text-slate-600 dark:text-zinc-400">
                  Tandakan kaedah pembayaran digital yang disokong oleh akaun CHIP anda untuk ditawarkan kepada pelanggan:
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { id: 'fpx', label: 'FPX Online Banking', desc: 'Maybank2u, CIMB Clicks, Bank Islam, RHB, dll.', icon: Building2 },
                    { id: 'card', label: 'Kad Debit / Kredit', desc: 'Visa & MasterCard dengan 3D Secure OTP.', icon: CreditCard },
                    { id: 'duitnow_qr', label: 'DuitNow QR Kebangsaan', desc: 'Imbas QR dari mana-mana aplikasi e-Wallet perbankan.', icon: QrCode },
                    { id: 'ewallet', label: 'e-Wallet Digital', desc: 'Touch n Go eWallet, GrabPay & Boost.', icon: Wallet },
                  ].map((m) => {
                    const isChecked = selectedMethods.includes(m.id);
                    const Icon = m.icon;
                    return (
                      <div
                        key={m.id}
                        onClick={() => handleToggleMethod(m.id)}
                        className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 ${
                          isChecked
                            ? 'bg-sky-50/80 dark:bg-sky-950/40 border-[#00BDFF] ring-1 ring-[#00BDFF]/30'
                            : 'bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-700 hover:border-slate-300'
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${isChecked ? 'bg-[#00BDFF] text-white shadow-xs' : 'bg-slate-100 dark:bg-zinc-800 text-slate-500'}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-900 dark:text-zinc-100">{m.label}</span>
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => handleToggleMethod(m.id)}
                              className="rounded border-slate-300 text-[#00BDFF] accent-[#00BDFF] focus:ring-[#00BDFF] w-4 h-4 cursor-pointer"
                            />
                          </div>
                          <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5 leading-relaxed">{m.desc}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => handleSave()}
                    disabled={isSaving}
                    className="px-5 py-2.5 rounded-full bg-[#00BDFF] hover:bg-[#00a6e0] text-white text-xs font-semibold shadow-xs transition-all active:scale-95 cursor-pointer disabled:opacity-50"
                  >
                    {isSaving ? 'Menyimpan...' : 'Simpan Kaedah Pembayaran'}
                  </button>
                </div>
              </div>
            )}

            {/* TAB 4: WEBHOOKS & CALLBACKS */}
            {activeTab === 'webhooks' && (
              <div className="max-w-2xl space-y-4 animate-in fade-in">
                <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200/90 dark:border-zinc-800 shadow-xs space-y-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                      Webhook Callback URL (Salin ke Portal CHIP)
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        readOnly
                        value={webhookUrl}
                        className="flex-1 px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-xs font-mono text-slate-800 dark:text-zinc-200 select-all"
                      />
                      <button
                        type="button"
                        onClick={() => handleCopy(webhookUrl, 'webhook')}
                        className="px-4 py-2 rounded-full bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 text-xs font-semibold text-slate-700 dark:text-zinc-300 transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs active:scale-95 shrink-0"
                      >
                        {copiedField === 'webhook' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedField === 'webhook' ? 'Disalin' : 'Salin'}</span>
                      </button>
                    </div>
                    <p className="text-[10.5px] text-slate-400">
                      CHIP akan menghantar payload JSON ke pautan ini apabila status pembayaran berubah (paid / expired / cancelled).
                    </p>
                  </div>

                  <div className="space-y-1 pt-2 border-t border-slate-100 dark:border-zinc-800">
                    <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                      Success Redirect URL (Pautan Selepas Selesai Bayar)
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        readOnly
                        value={successRedirectUrl}
                        className="flex-1 px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-xs font-mono text-slate-800 dark:text-zinc-200 select-all"
                      />
                      <button
                        type="button"
                        onClick={() => handleCopy(successRedirectUrl, 'redirect')}
                        className="px-4 py-2 rounded-full bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 text-xs font-semibold text-slate-700 dark:text-zinc-300 transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs active:scale-95 shrink-0"
                      >
                        {copiedField === 'redirect' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedField === 'redirect' ? 'Disalin' : 'Salin'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 5: DIAGNOSTICS & TEST */}
            {activeTab === 'diagnostics' && (
              <div className="max-w-2xl space-y-4 animate-in fade-in">
                <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200/90 dark:border-zinc-800 shadow-xs space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xs font-bold text-slate-900 dark:text-zinc-100">Ujian Sambungan API CHIP Langsung</h3>
                      <p className="text-[11px] text-slate-500 mt-0.5">Semak ketepatan Brand ID dan Secret Key secara terus dengan pelayan CHIP.</p>
                    </div>
                    <button
                      type="button"
                      onClick={handleTestConnection}
                      disabled={isTesting}
                      className="px-5 py-2 rounded-full bg-[#00BDFF] hover:bg-[#00a6e0] text-white text-xs font-semibold shadow-xs transition-all active:scale-95 cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                    >
                      <Activity className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
                      <span>{isTesting ? 'Menguji...' : 'Uji Sekarang'}</span>
                    </button>
                  </div>

                  {testResult && (
                    <div
                      className={`p-4 rounded-2xl border text-xs space-y-1.5 animate-in fade-in ${
                        testResult.success
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-100'
                          : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-100'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold flex items-center gap-1.5">
                          {testResult.success ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-rose-600" />}
                          {testResult.success ? 'Sambungan Berjaya' : 'Sambungan Gagal'}
                        </span>
                        <span className="font-mono text-[10px] bg-white/60 dark:bg-zinc-800/60 px-2 py-0.5 rounded-full">
                          Latency: {testResult.latencyMs}ms
                        </span>
                      </div>
                      <p className="text-[11px] leading-relaxed opacity-90">{testResult.message}</p>
                      {testResult.brandTitle && (
                        <p className="text-[11px] font-semibold pt-1">Nama Jenama CHIP: {testResult.brandTitle}</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}

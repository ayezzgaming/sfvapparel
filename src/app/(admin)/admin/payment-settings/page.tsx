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
  Building2
} from 'lucide-react';
import { 
  getPaymentConfigAction, 
  savePaymentConfigAction, 
  testChipConnectionAction 
} from '@/app/actions/paymentActions';
import { PaymentGatewayConfig } from '@/types/database';

export default function AdminPaymentSettingsPage() {
  const [config, setConfig] = useState<PaymentGatewayConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);

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
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
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

  if (isLoading) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-[400px] space-y-3">
        <RefreshCw className="w-8 h-8 animate-spin text-[#00BDFF]" />
        <p className="text-sm font-medium text-slate-500">Memuatkan tetapan gerbang pembayaran...</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6 pb-24 font-sans antialiased select-none">
      
      {/* 1. Header & Quick Brand Badges */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#00BDFF] to-[#0052FF] text-white flex items-center justify-center shadow-xs">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                Gerbang Pembayaran CHIP
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-[#0052FF] border border-blue-200/60">
                  portal.chip-in.asia
                </span>
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Konfigurasi pembayaran digital automatik FPX, Kad Debit/Kredit, DuitNow QR & e-Wallet untuk SVF Apparel.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <a
            href="https://portal.chip-in.asia"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 active:scale-95 transition-all shadow-2xs"
          >
            <span>Buka Portal CHIP</span>
            <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
          </a>
        </div>
      </div>

      {/* Notifications Alert */}
      {notification && (
        <div
          className={`p-4 rounded-2xl border text-xs flex items-center justify-between animate-in fade-in duration-200 ${
            notification.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {notification.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span className="font-medium">{notification.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setNotification(null)}
            className="text-slate-400 hover:text-slate-600 font-bold ml-4"
          >
            &times;
          </button>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">

        {/* 2. Main Gateway Status & Environment Card */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-[#00BDFF]" />
              <h2 className="text-sm font-bold text-slate-900">Status & Mod Persekitaran</h2>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                  isActive
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-slate-100 text-slate-500 border-slate-200'
                }`}
              >
                {isActive ? 'Aktif' : 'Nyahaktif'}
              </span>
              <span
                className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                  isSandbox
                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                    : 'bg-blue-50 text-blue-700 border-blue-200'
                }`}
              >
                {isSandbox ? 'Sandbox (Ujian)' : 'Live (Produksi)'}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
            {/* Toggle 1: Active Gateway */}
            <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50/80 border border-slate-200/60">
              <div>
                <span className="text-xs font-bold text-slate-900 block">Dayakan Pembayaran CHIP</span>
                <span className="text-[11px] text-slate-500">
                  Pelanggan boleh memilih untuk membayar serta-merta semasa menempah jersi.
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0 ml-3">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#00BDFF]"></div>
              </label>
            </div>

            {/* Toggle 2: Sandbox vs Live Mode */}
            <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50/80 border border-slate-200/60">
              <div>
                <span className="text-xs font-bold text-slate-900 block">Mod Sandbox (Staging / Ujian)</span>
                <span className="text-[11px] text-slate-500">
                  Gunakan akaun percubaan sebelum beralih ke kunci pengeluaran Live.
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0 ml-3">
                <input
                  type="checkbox"
                  checked={isSandbox}
                  onChange={(e) => setIsSandbox(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
              </label>
            </div>
          </div>
        </div>

        {/* 3. API Credentials (Industry Standard Security Card) */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Key className="w-4 h-4 text-[#0052FF]" />
              <h2 className="text-sm font-bold text-slate-900">Kredensial API & Keselamatan</h2>
            </div>
            <div className="flex items-center gap-1 text-[11px] text-slate-500">
              <Lock className="w-3.5 h-3.5 text-slate-400" />
              <span>Disimpan selamat di pelayan (Server-side RLS)</span>
            </div>
          </div>

          <div className="space-y-4">
            {/* Brand ID */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                Brand ID (UUID) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={brandId}
                  onChange={(e) => setBrandId(e.target.value)}
                  placeholder="e.g. 1a2b3c4d-5e6f-7a8b-9c0d-1e2f3a4b5c6d"
                  className="w-full text-xs font-mono px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#00BDFF] bg-slate-50/50 focus:bg-white transition-all"
                  required
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Diperoleh daripada menu <strong>Brands</strong> di portal CHIP.
              </p>
            </div>

            {/* Secret API Key */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                Secret API Key / Bearer Token <span className="text-rose-500">*</span>
              </label>
              <div className="relative flex items-center">
                <input
                  type={showApiKey ? 'text' : 'password'}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Masukkan Secret API Key daripada portal CHIP"
                  className="w-full text-xs font-mono px-3.5 py-2.5 pr-10 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#00BDFF] bg-slate-50/50 focus:bg-white transition-all"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="absolute right-3 text-slate-400 hover:text-slate-600 p-1"
                  title={showApiKey ? 'Sembunyi kunci' : 'Papar kunci'}
                >
                  {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Kunci rahsia pelayan. Dijamin tidak akan didedahkan kepada pelayar awam.
              </p>
            </div>

            {/* Webhook Public Key (RSA PEM) */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                Webhook Public Key (RSA PEM) <span className="text-slate-400 font-normal">(Pilihan tetapi Disyorkan)</span>
              </label>
              <textarea
                rows={3}
                value={publicKey}
                onChange={(e) => setPublicKey(e.target.value)}
                placeholder="-----BEGIN PUBLIC KEY-----&#10;MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8A...&#10;-----END PUBLIC KEY-----"
                className="w-full text-[11px] font-mono p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#00BDFF] bg-slate-50/50 focus:bg-white transition-all resize-none"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Digunakan untuk mengesahkan integriti signature kriptografi <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-600">X-Signature</code> pada setiap panggilan webhook bayaran.
              </p>
            </div>
          </div>
        </div>

        {/* 4. URLs to Put Inside CHIP Portal (Easy Copy Card) */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-emerald-600" />
              <h2 className="text-sm font-bold text-slate-900">URL Sistem untuk Dimasukkan ke Portal CHIP</h2>
            </div>
            <span className="text-[11px] text-slate-400">Salin & tampal ke tetapan Brand CHIP</span>
          </div>

          <div className="space-y-3">
            {/* Webhook Callback URL */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="min-w-0 flex-1">
                <span className="text-[11px] font-bold text-slate-700 block">Webhook Callback URL:</span>
                <span className="text-xs font-mono text-slate-900 break-all select-all font-semibold">
                  {webhookUrl}
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleCopy(webhookUrl, 'webhook')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-100 active:scale-95 transition-all shrink-0 self-start sm:self-center"
              >
                {copiedField === 'webhook' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-700 font-semibold">Disalin</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-500" />
                    <span>Salin URL</span>
                  </>
                )}
              </button>
            </div>

            {/* Success Return URL */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="min-w-0 flex-1">
                <span className="text-[11px] font-bold text-slate-700 block">Success Return URL:</span>
                <span className="text-xs font-mono text-slate-900 break-all select-all font-semibold">
                  {successRedirectUrl}
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleCopy(successRedirectUrl, 'redirect')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-100 active:scale-95 transition-all shrink-0 self-start sm:self-center"
              >
                {copiedField === 'redirect' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-700 font-semibold">Disalin</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-500" />
                    <span>Salin URL</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* 5. Payment Methods Selection */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-purple-600" />
              <h2 className="text-sm font-bold text-slate-900">Saluran Pembayaran Disokong</h2>
            </div>
            <span className="text-[11px] text-slate-400">Diproses secara automatik oleh CHIP</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { id: 'fpx', label: 'FPX Online Banking', desc: 'Maybank2u, CIMB, Bank Islam, dll.' },
              { id: 'card', label: 'Kad Kredit / Debit', desc: 'Visa, Mastercard & MyDebit' },
              { id: 'duitnow_qr', label: 'DuitNow QR', desc: 'Imbas terus dari mana-mana app bank' },
              { id: 'ewallet', label: 'e-Wallet Tempatan', desc: 'Touch n Go, GrabPay, ShopeePay' },
            ].map((method) => {
              const isSelected = selectedMethods.includes(method.id);
              return (
                <div
                  key={method.id}
                  onClick={() => handleToggleMethod(method.id)}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-blue-50/50 border-[#00BDFF] ring-1 ring-[#00BDFF]/40'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900">{method.label}</span>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => {}}
                      className="rounded text-[#00BDFF] focus:ring-[#00BDFF]"
                    />
                  </div>
                  <p className="text-[10.5px] text-slate-500 mt-1">{method.desc}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* 6. Live Diagnostic Test Connection Result */}
        {testResult && (
          <div
            className={`p-4 rounded-2xl border text-xs space-y-1.5 animate-in fade-in duration-200 ${
              testResult.success
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : 'bg-rose-50 border-rose-200 text-rose-900'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-bold flex items-center gap-1.5">
                {testResult.success ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600" />
                )}
                {testResult.success ? 'Ujian Sambungan Berjaya' : 'Ujian Sambungan Gagal'}
              </span>
              <span className="text-[11px] font-mono opacity-75">
                Masa Respon: {testResult.latencyMs}ms
              </span>
            </div>
            <p className="text-xs leading-relaxed">{testResult.message}</p>
            {testResult.brandTitle && (
              <p className="text-[11px] font-semibold text-emerald-700">{testResult.brandTitle}</p>
            )}
          </div>
        )}

        {/* 7. Bottom Actions: Test & Save Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
          <button
            type="button"
            onClick={handleTestConnection}
            disabled={isTesting || !brandId.trim() || !apiKey.trim()}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer active:scale-95 shadow-2xs"
          >
            {isTesting ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Menguji Sambungan CHIP...</span>
              </>
            ) : (
              <>
                <Zap className="w-3.5 h-3.5 text-[#0052FF]" />
                <span>Uji Sambungan API</span>
              </>
            )}
          </button>

          <button
            type="submit"
            disabled={isSaving}
            className="w-full sm:w-auto px-7 py-2.5 rounded-xl bg-[#0052FF] hover:bg-[#0041CC] text-white text-xs font-bold transition-all shadow-md shadow-blue-500/20 active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
          >
            {isSaving ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-white" />
                <span>Menyimpan Konfigurasi...</span>
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5 text-white" />
                <span>Simpan Konfigurasi Pembayaran</span>
              </>
            )}
          </button>
        </div>

      </form>

    </div>
  );
}

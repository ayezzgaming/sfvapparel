'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  QrCode, 
  RefreshCw, 
  Smartphone, 
  CheckCircle2, 
  AlertCircle, 
  Send, 
  LogOut, 
  Radio, 
  Layers, 
  ShieldCheck,
  Bell,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { FaWhatsapp } from 'react-icons/fa6';

interface WahaStatusData {
  name: string;
  status: 'WORKING' | 'SCAN_QR_CODE' | 'STARTING' | 'STOPPED' | 'FAILED' | 'UNKNOWN';
  me?: {
    id: string;
    pushName?: string;
  };
  qr?: string | null;
}

export default function WhatsAppHubPage() {
  const [statusData, setStatusData] = useState<WahaStatusData>({ name: 'default', status: 'UNKNOWN' });
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Test Message State
  const [testPhone, setTestPhone] = useState('60148599138');
  const [testMessage, setTestMessage] = useState('Hai! Ini adalah ujian integrasi automasi WhatsApp SFV Apparel.');
  const [sendResult, setSendResult] = useState<{ success: boolean; message: string } | null>(null);
  const [sending, setSending] = useState(false);

  // Fetch status and QR if needed
  const fetchStatus = useCallback(async (isManual: boolean = false) => {
    if (isManual) setRefreshing(true);
    try {
      const res = await fetch('/api/whatsapp/qr', { cache: 'no-store' });
      const data = await res.json();
      
      setStatusData({
        name: 'default',
        status: data.status || 'UNKNOWN',
        me: data.me,
      });

      if (data.qr) {
        setQrCode(data.qr);
      } else if (data.status === 'WORKING') {
        setQrCode(null);
      }
    } catch {
      setStatusData({ name: 'default', status: 'UNKNOWN' });
    } finally {
      setLoading(false);
      if (isManual) setRefreshing(false);
    }
  }, []);

  // Poll status every 4 seconds when in QR scanning mode
  useEffect(() => {
    fetchStatus();

    const interval = setInterval(() => {
      fetchStatus();
    }, 4000);

    return () => clearInterval(interval);
  }, [fetchStatus]);

  // Restart / Get Fresh QR
  const handleRestartSession = async () => {
    setActionLoading(true);
    try {
      await fetch('/api/whatsapp/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'start' }),
      });
      await fetchStatus(true);
    } catch {
      alert('Gagal memulakan sesi WhatsApp');
    } finally {
      setActionLoading(false);
    }
  };

  // Logout / Unlink Device
  const handleLogout = async () => {
    if (!confirm('Adakah anda pasti ingin memutuskan sambungan akaun WhatsApp ini?')) return;
    setActionLoading(true);
    try {
      await fetch('/api/whatsapp/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'logout' }),
      });
      setQrCode(null);
      await fetchStatus(true);
    } catch {
      alert('Gagal memutuskan sambungan WhatsApp');
    } finally {
      setActionLoading(false);
    }
  };

  // Send Test Message
  const handleSendTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testPhone || !testMessage) return;
    setSending(true);
    setSendResult(null);

    try {
      const res = await fetch('/api/whatsapp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: testPhone,
          message: testMessage,
        }),
      });
      const data = await res.json();

      if (data.success) {
        setSendResult({
          success: true,
          message: `Mesej berjaya dihantar ke ${testPhone}!`,
        });
      } else {
        setSendResult({
          success: false,
          message: data.error || 'Gagal menghantar mesej.',
        });
      }
    } catch (err: unknown) {
      const error = err instanceof Error ? err.message : 'Ralat sambungan API';
      setSendResult({
        success: false,
        message: error,
      });
    } finally {
      setSending(false);
    }
  };

  const isConnected = statusData.status === 'WORKING';
  const isScanning = statusData.status === 'SCAN_QR_CODE' || (statusData.status !== 'WORKING' && qrCode);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-6 font-sans">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center shadow-xs">
              <FaWhatsapp className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                Pusat Automasi WhatsApp (WhatsApp Hub)
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Sambungkan akaun WhatsApp kilang untuk automasi notifikasi pesanan dan invois pelanggan.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => fetchStatus(true)}
            disabled={refreshing || loading}
            className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold flex items-center gap-1.5 shadow-2xs active:scale-95 transition-all cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-[#00BDFF]' : ''}`} />
            <span>{refreshing ? 'Menyemak...' : 'Muat Semula Status'}</span>
          </button>
        </div>
      </div>

      {/* Main Status Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Device Connection & QR Scanner (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 sm:p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2">
                <Radio className={`w-4 h-4 ${isConnected ? 'text-emerald-500 animate-pulse' : 'text-amber-500'}`} />
                <h2 className="text-sm font-bold text-slate-900">
                  Status Sambungan WhatsApp
                </h2>
              </div>

              {/* Status Badge */}
              {loading ? (
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-500 animate-pulse">
                  Menyemak sambungan...
                </span>
              ) : isConnected ? (
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-600 border border-emerald-200/80 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  Terhubung (Online)
                </span>
              ) : (
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-600 border border-amber-200 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                  Sedia Untuk Imbas QR
                </span>
              )}
            </div>

            {/* State A: CONNECTED (Active WhatsApp Session) */}
            {isConnected ? (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-100/80 flex items-start justify-between gap-4">
                  <div className="flex items-center space-x-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-md shadow-emerald-500/20 shrink-0">
                      <Smartphone className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-slate-900">
                          {statusData.me?.pushName || 'SFV Apparel Official'}
                        </h3>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white text-emerald-700 border border-emerald-200">
                          Aktif
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 font-mono mt-0.5">
                        +{statusData.me?.id?.split('@')[0] || '60148599138'}
                      </p>
                      <p className="text-[11px] text-emerald-700 mt-1 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Sedia menerima dan menghantar notifikasi automatik</span>
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <div className="flex items-center gap-1.5 text-xs text-slate-500">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>Engine: WAHA VPS (High Performance)</span>
                  </div>

                  <button
                    type="button"
                    onClick={handleLogout}
                    disabled={actionLoading}
                    className="px-3.5 py-1.5 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200 text-xs font-semibold flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Putuskan Sambungan</span>
                  </button>
                </div>
              </div>
            ) : (
              /* State B: QR CODE SCANNER */
              <div className="space-y-5">
                <div className="flex flex-col sm:flex-row items-center gap-6 p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
                  {/* QR Image Box */}
                  <div className="w-52 h-52 bg-white rounded-2xl p-2 shadow-md border border-slate-200/80 flex items-center justify-center shrink-0 relative overflow-hidden">
                    {qrCode ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img 
                        src={qrCode} 
                        alt="WhatsApp QR Code" 
                        className="w-full h-full object-contain rounded-xl"
                      />
                    ) : (
                      <div className="text-center space-y-2 p-4">
                        <RefreshCw className="w-6 h-6 animate-spin text-slate-400 mx-auto" />
                        <p className="text-xs text-slate-500 font-medium">
                          Menjana Kod QR WhatsApp...
                        </p>
                      </div>
                    )}
                  </div>

                  {/* 3 Step Apple Guide */}
                  <div className="flex-1 space-y-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                      Cara Menyambungkan WhatsApp:
                    </h3>
                    <div className="space-y-2.5 text-xs text-slate-600">
                      <div className="flex items-start gap-2">
                        <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-800 font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                          1
                        </span>
                        <span>Buka aplikasi <strong>WhatsApp</strong> di telefon bimbit anda.</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-800 font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                          2
                        </span>
                        <span>Tekan <strong>Tetapan (Settings)</strong> atau <strong>Menu (⋮)</strong> ➔ <strong>Perangkat Tertaut (Linked Devices)</strong>.</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="w-5 h-5 rounded-full bg-[#00BDFF] text-white font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                          3
                        </span>
                        <span>Tekan <strong>Tautkan Perangkat (Link a Device)</strong> dan halakan kamera telefon anda ke kod QR di sebelah.</span>
                      </div>
                    </div>

                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={handleRestartSession}
                        disabled={actionLoading}
                        className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer shadow-xs disabled:opacity-50"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${actionLoading ? 'animate-spin' : ''}`} />
                        <span>Jana Semula Kod QR</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Automated Notification Features Info Card */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Bell className="w-4 h-4 text-[#00BDFF]" />
              <span>Ciri-ciri Notifikasi Automatik Yang Aktif</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-1">
                <span className="font-bold text-slate-900">1. Pesanan Baru Pelanggan</span>
                <p className="text-slate-500 leading-relaxed">
                  Menghantar ringkasan tempahan jersi/baju & pautan semakan status terus ke WhatsApp pelanggan.
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-1">
                <span className="font-bold text-slate-900">2. Notifikasi Tempahan Kilang</span>
                <p className="text-slate-500 leading-relaxed">
                  Menghantar amaran tempahan baru kepada admin kilang berserta saiz & kuantiti secara automatik.
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-1">
                <span className="font-bold text-slate-900">3. Status Siap & Tracking Pos</span>
                <p className="text-slate-500 leading-relaxed">
                  Pelanggan menerima WhatsApp automatik apabila tempahan mereka telah siap dicetak atau dipos.
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-1">
                <span className="font-bold text-slate-900">4. n8n Workflow AI Automation</span>
                <p className="text-slate-500 leading-relaxed">
                  Menyokong alur kerja automasi pintar & follow-up pelanggan berkala tanpa kos per-mesej.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Live Message Testing Tool (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 sm:p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Send className="w-4 h-4 text-slate-700" />
                <h2 className="text-sm font-bold text-slate-900">
                  Uji Penghantaran WhatsApp
                </h2>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Ujian Langsung
              </span>
            </div>

            <form onSubmit={handleSendTest} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">
                  Nombor WhatsApp Penerima
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={testPhone}
                    onChange={(e) => setTestPhone(e.target.value)}
                    placeholder="Contoh: 60148599138 atau 0148599138"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#00BDFF]/30 focus:border-[#00BDFF] font-mono transition-all"
                  />
                </div>
                <p className="text-[10.5px] text-slate-400">
                  Format disokong: 6014xxxxxxx atau 014xxxxxxx
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">
                  Kandungan Mesej
                </label>
                <textarea
                  rows={4}
                  required
                  value={testMessage}
                  onChange={(e) => setTestMessage(e.target.value)}
                  placeholder="Taip mesej ujian di sini..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#00BDFF]/30 focus:border-[#00BDFF] transition-all resize-none"
                />
              </div>

              {sendResult && (
                <div className={`p-3 rounded-xl text-xs flex items-start gap-2 ${
                  sendResult.success 
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                    : 'bg-rose-50 text-rose-800 border border-rose-200'
                }`}>
                  {sendResult.success ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  )}
                  <span>{sendResult.message}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={sending || !isConnected}
                className={`w-full py-3 px-4 rounded-xl text-xs font-bold text-white flex items-center justify-center space-x-2 transition-all shadow-md ${
                  isConnected 
                    ? 'bg-[#00BDFF] hover:bg-sky-500 active:scale-[0.98] shadow-sky-400/20 cursor-pointer' 
                    : 'bg-slate-300 cursor-not-allowed shadow-none'
                }`}
              >
                <Send className={`w-3.5 h-3.5 ${sending ? 'animate-spin' : ''}`} />
                <span>{sending ? 'Sedang Menghantar...' : isConnected ? 'Hantar Mesej WhatsApp' : 'Sambungkan WhatsApp Terlebih Dahulu'}</span>
              </button>
            </form>
          </div>

          {/* Engine & n8n Quick Access Box */}
          <div className="p-4 rounded-2xl bg-slate-900 text-white space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold flex items-center gap-1.5 text-zinc-200">
                <Layers className="w-4 h-4 text-sky-400" />
                n8n Workflow Automation
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-400/20 text-sky-300 border border-sky-400/30">
                Port 5678
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              Workflow engine n8n di VPS Hostinger sedia menerima webhook dari SFV Apparel untuk automasi tahap lanjutan.
            </p>
            <a
              href="http://187.127.223.53:5678"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-sky-300 hover:text-sky-200 font-semibold transition-colors"
            >
              <span>Buka Editor Alur Kerja n8n</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

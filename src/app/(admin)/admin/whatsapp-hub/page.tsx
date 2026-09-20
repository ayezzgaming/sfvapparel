'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
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
  MessageSquare,
  Search,
  CheckCheck,
  Sparkles,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  SendHorizontal,
  Bot,
  Ticket,
  UserCheck,
  PauseCircle,
  PlayCircle,
  User,
  Phone
} from 'lucide-react';
import { FaWhatsapp } from 'react-icons/fa6';
import { useAppStore } from '@/lib/store/app-store';
import { WahaChatSummary, WahaChatMessage } from '@/lib/whatsapp/waha-client';
import { SupportTicket } from '@/app/api/whatsapp/tickets/route';

type HubSectionKey = 'inbox' | 'device' | 'automation' | 'tickets' | 'tester';

interface WahaStatusData {
  name: string;
  status: 'WORKING' | 'SCAN_QR_CODE' | 'STARTING' | 'STOPPED' | 'FAILED' | 'UNKNOWN';
  me?: {
    id: string;
    pushName?: string;
  };
  qr?: string | null;
}

const QUICK_TEMPLATES = [
  'Hai! Terima kasih kerana menghubungi SFV Apparel. Ada apa-apa yang boleh kami bantu?',
  'Pesanan jersi anda telah diterima dan sedang diproses di bahagian cetakan.',
  'Tempahan anda telah siap sepenuhnya! Kami akan menghantar nombor penjejakan kurier sebentar lagi.',
  'Deposit tempahan telah disahkan. Kami akan memulakan proses rekaan grafik segera.',
];

function parseVCard(body: string): { name: string; phone: string } | null {
  if (!body || !body.includes('BEGIN:VCARD')) return null;
  let name = 'Kenalan';
  let phone = '';

  const fnMatch = body.match(/FN:(.+)/i);
  if (fnMatch && fnMatch[1]) {
    name = fnMatch[1].trim();
  } else {
    const nMatch = body.match(/N:([^;]+)/i);
    if (nMatch && nMatch[1]) name = nMatch[1].replace(/;/g, ' ').trim();
  }

  const telMatch = body.match(/waid=(\d+)/i) || body.match(/TEL[^:]*:(.+)/i);
  if (telMatch && telMatch[1]) {
    phone = telMatch[1].replace(/[\s\-\+\(\)]/g, '').trim();
  }

  return { name, phone };
}

export default function WhatsAppHubPage() {
  const { companySettings } = useAppStore();

  // Navigation & Panel states
  const [activeTab, setActiveTab] = useState<HubSectionKey>('inbox');
  const [isLeftPanelCollapsed, setIsLeftPanelCollapsed] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');

  // Status & Connection States
  const [statusData, setStatusData] = useState<WahaStatusData>({ name: 'default', status: 'UNKNOWN' });
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Omnichannel Chat State
  const [chats, setChats] = useState<WahaChatSummary[]>([]);
  const [selectedChat, setSelectedChat] = useState<WahaChatSummary | null>(null);
  const [messages, setMessages] = useState<WahaChatMessage[]>([]);
  const [chatSearch, setChatSearch] = useState('');
  const [replyText, setReplyText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [pausedChatIds, setPausedChatIds] = useState<Record<string, boolean>>({});
  const [privateChatIds, setPrivateChatIds] = useState<Record<string, boolean>>({});
  const [chatCategoryFilter, setChatCategoryFilter] = useState<'all' | 'customers' | 'private'>('all');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load privateChatIds from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('sfv_wa_private_chats');
      if (saved) {
        setPrivateChatIds(JSON.parse(saved));
      }
    } catch {}
  }, []);

  const togglePrivateForChat = (chatId: string) => {
    setPrivateChatIds((prev) => {
      const next = { ...prev, [chatId]: !prev[chatId] };
      try {
        localStorage.setItem('sfv_wa_private_chats', JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  // Support Tickets State
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loadingTickets, setLoadingTickets] = useState(false);

  // Test Message State
  const [testPhone, setTestPhone] = useState('');
  const [testMessage, setTestMessage] = useState('Hai! Ini adalah ujian integrasi automasi WhatsApp SFV Apparel.');
  const [sendResult, setSendResult] = useState<{ success: boolean; message: string } | null>(null);
  const [sending, setSending] = useState(false);

  // References for tracking changes without triggering re-render loops
  const messagesCountRef = useRef<number>(0);
  const lastMsgIdRef = useRef<string>('');

  // Fetch status & QR
  const fetchStatus = useCallback(async (isManual: boolean = false) => {
    if (isManual) setRefreshing(true);
    try {
      const res = await fetch('/api/whatsapp/qr', { cache: 'no-store' });
      const data = await res.json();
      const newStatus = data.status || 'UNKNOWN';
      setStatusData({
        name: 'default',
        status: newStatus,
        me: data.me,
      });

      if (data.qr) {
        setQrCode(data.qr);
      } else if (newStatus === 'WORKING') {
        setQrCode(null);
      }
    } catch {
      setStatusData({ name: 'default', status: 'UNKNOWN' });
    } finally {
      setLoading(false);
      if (isManual) setRefreshing(false);
    }
  }, []);

  // Fetch chats (silently in background without causing parent re-render loops)
  const fetchChats = useCallback(async () => {
    try {
      const res = await fetch('/api/whatsapp/chats', { cache: 'no-store' });
      const data = await res.json();
      if (data.connected && Array.isArray(data.chats)) {
        setChats(data.chats);
        // If nothing is selected, select the first chat
        setSelectedChat((prev) => {
          if (!prev && data.chats.length > 0) return data.chats[0];
          if (prev) {
            const updated = data.chats.find((c: WahaChatSummary) => c.id === prev.id);
            return updated || prev;
          }
          return prev;
        });
      }
    } catch {}
  }, []);

  // Fetch tickets
  const fetchTickets = useCallback(async () => {
    setLoadingTickets(true);
    try {
      const res = await fetch('/api/whatsapp/tickets', { cache: 'no-store' });
      const data = await res.json();
      if (Array.isArray(data.tickets)) {
        setTickets(data.tickets);
      }
    } catch {
    } finally {
      setLoadingTickets(false);
    }
  }, []);

  // Fetch messages for active chat
  const fetchMessages = useCallback(async (chatId: string, isInitial: boolean = false) => {
    if (isInitial) setLoadingMessages(true);
    try {
      const res = await fetch(`/api/whatsapp/messages?chatId=${encodeURIComponent(chatId)}`, { cache: 'no-store' });
      const data = await res.json();
      if (Array.isArray(data.messages)) {
        const newMsgs = data.messages as WahaChatMessage[];
        const latestId = newMsgs.length > 0 ? newMsgs[newMsgs.length - 1].id : '';
        
        // Only update state if message array changed
        if (isInitial || newMsgs.length !== messagesCountRef.current || latestId !== lastMsgIdRef.current) {
          messagesCountRef.current = newMsgs.length;
          lastMsgIdRef.current = latestId;
          setMessages(newMsgs);
          setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: isInitial ? 'auto' : 'smooth' });
          }, 60);
        }
      }
    } catch {
      if (isInitial) setMessages([]);
    } finally {
      if (isInitial) setLoadingMessages(false);
    }
  }, []);

  // Polling Status & Tickets every 10s
  useEffect(() => {
    fetchStatus();
    fetchTickets();
    const interval = setInterval(() => {
      fetchStatus();
    }, 10000);
    return () => clearInterval(interval);
  }, [fetchStatus, fetchTickets]);

  // Polling Chats list every 6s
  useEffect(() => {
    if (statusData.status === 'WORKING') {
      fetchChats();
      const chatInterval = setInterval(() => {
        fetchChats();
      }, 6000);
      return () => clearInterval(chatInterval);
    }
  }, [statusData.status, fetchChats]);

  // When selectedChat changes, load initial messages
  useEffect(() => {
    if (selectedChat?.id) {
      messagesCountRef.current = 0;
      lastMsgIdRef.current = '';
      fetchMessages(selectedChat.id, true);

      const msgInterval = setInterval(() => {
        fetchMessages(selectedChat.id, false);
      }, 4000);
      return () => clearInterval(msgInterval);
    } else {
      setMessages([]);
    }
  }, [selectedChat?.id, fetchMessages]);

  // Send Reply (also pauses bot for 30m)
  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedChat || !replyText.trim() || sendingReply) return;
    setSendingReply(true);

    const messageText = replyText.trim();
    const tempMsg: WahaChatMessage = {
      id: String(Date.now()),
      timestamp: Date.now(),
      from: statusData.me?.id || 'me',
      fromMe: true,
      body: messageText,
      ack: 1,
    };
    setMessages((prev) => [...prev, tempMsg]);
    setReplyText('');

    // Mark as paused for human CS takeover
    setPausedChatIds((prev) => ({ ...prev, [selectedChat.id]: true }));

    try {
      const res = await fetch('/api/whatsapp/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chatId: selectedChat.id,
          message: messageText,
        }),
      });
      const data = await res.json();
      if (data.success) {
        fetchMessages(selectedChat.id);
      }
    } catch {
      alert('Gagal menghantar mesej balasan.');
    } finally {
      setSendingReply(false);
    }
  };

  const toggleBotForChat = (chatId: string) => {
    setPausedChatIds((prev) => ({
      ...prev,
      [chatId]: !prev[chatId],
    }));
  };

  // Restart / Fresh QR
  const handleRestartSession = async () => {
    setActionLoading(true);
    setQrCode(null);
    try {
      await fetch('/api/whatsapp/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'restart' }),
      });
      // Allow 2 seconds for engine restart
      await new Promise((r) => setTimeout(r, 2000));
      await fetchStatus(true);
    } catch {
      alert('Gagal memulakan sesi WhatsApp');
    } finally {
      setActionLoading(false);
    }
  };

  // Logout
  const handleLogout = async () => {
    if (!confirm('Putuskan sambungan akaun WhatsApp ini dari sistem?')) return;
    setActionLoading(true);
    try {
      await fetch('/api/whatsapp/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'logout' }),
      });
      setQrCode(null);
      setChats([]);
      setSelectedChat(null);
      await fetchStatus(true);
    } catch {
      alert('Gagal memutuskan sambungan');
    } finally {
      setActionLoading(false);
    }
  };

  // Test Message
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

  // Navigation Items Definition (Clean Apple Style)
  const navSections = [
    {
      id: 'inbox' as HubSectionKey,
      title: 'Live Chat Inbox',
      subtitle: 'Perbualan WhatsApp pelanggan',
      icon: MessageSquare,
      badge: chats.length > 0 ? `${chats.length}` : undefined,
    },
    {
      id: 'tickets' as HubSectionKey,
      title: 'Tiket Sokongan (ID TIKET)',
      subtitle: 'Isu khas & tindakan susulan',
      icon: Ticket,
      badge: tickets.length > 0 ? `${tickets.length}` : undefined,
    },
    {
      id: 'device' as HubSectionKey,
      title: 'Peranti & Imbas QR',
      subtitle: 'Status sambungan nombor kilang',
      icon: Smartphone,
      statusDot: isConnected ? 'bg-emerald-500' : 'bg-amber-500',
    },
    {
      id: 'automation' as HubSectionKey,
      title: 'Automasi Pesanan',
      subtitle: 'Pemicu notifikasi jersi & invois',
      icon: Bell,
    },
    {
      id: 'tester' as HubSectionKey,
      title: 'Uji Penghantaran',
      subtitle: 'Ujian mesej langsung',
      icon: Send,
    },
  ];

  const filteredNavSections = navSections.filter((sec) =>
    sec.title.toLowerCase().includes(searchFilter.toLowerCase()) ||
    sec.subtitle.toLowerCase().includes(searchFilter.toLowerCase())
  );

  const customerCount = chats.filter((c) => !privateChatIds[c.id]).length;
  const privateCount = chats.filter((c) => !!privateChatIds[c.id]).length;

  const filteredChats = chats.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(chatSearch.toLowerCase()) ||
      c.phone.includes(chatSearch);
    if (!matchesSearch) return false;

    const isPrivate = !!privateChatIds[c.id];
    if (chatCategoryFilter === 'customers') return !isPrivate;
    if (chatCategoryFilter === 'private') return isPrivate;
    return true;
  });

  return (
    <div className="h-full flex flex-col p-4 sm:p-5 lg:p-6 select-none font-sans overflow-hidden bg-slate-50/50">
      
      {/* ----------------- TOP HEADER TOOLBAR ----------------- */}
      <div className="shrink-0 flex items-center justify-between gap-4 pb-4 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-sky-50 text-[#00BDFF] border border-sky-100 flex items-center justify-center shadow-2xs shrink-0">
              <FaWhatsapp className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight leading-tight">
                Pusat Automasi WhatsApp & AI Brain
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Pengurusan perbualan multi-device, AI Agent berkepintaran pangkalan data, dan automasi kilang.
              </p>
            </div>
          </div>
        </div>

        {/* Right Toolbar Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border border-slate-200/80 text-xs shadow-2xs">
            <Radio className={`w-3.5 h-3.5 ${isConnected ? 'text-emerald-500 animate-pulse' : 'text-amber-500'}`} />
            <span className="font-semibold text-slate-700">
              {loading ? 'Menyemak...' : isConnected ? 'WhatsApp Terhubung' : 'Perlu Imbas QR'}
            </span>
          </div>

          <button
            type="button"
            onClick={() => fetchStatus(true)}
            disabled={refreshing || loading}
            title="Segar semula status"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200/80 hover:border-slate-300 text-slate-700 text-xs font-medium transition-all shadow-2xs cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${refreshing ? 'animate-spin text-[#00BDFF]' : ''}`} />
            <span className="hidden sm:inline">{refreshing ? 'Menyemak...' : 'Segar Semula'}</span>
          </button>
        </div>
      </div>

      {/* ----------------- SPLIT PANEL BODY ----------------- */}
      <div className="flex-1 min-h-0 overflow-hidden flex items-stretch gap-4 relative pt-4 animate-in fade-in">
        
        {/* =========================================================================
            SISI KIRI: PANEL NAVIGASI MODUL WHATSAPP HUB
           ========================================================================= */}
        <div
          className={`flex flex-col h-full shrink-0 transition-all duration-300 ease-in-out select-none ${
            isLeftPanelCollapsed
              ? 'w-0 opacity-0 overflow-hidden pointer-events-none'
              : 'w-[280px] xl:w-[310px] opacity-100'
          }`}
        >
          {/* Search / Filter Box */}
          <div className="p-2.5 bg-white rounded-2xl border border-slate-200/80 shadow-2xs mb-2.5 shrink-0">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="Cari navigasi WhatsApp..."
                className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-50 text-xs text-slate-800 placeholder-slate-400 border border-slate-200 focus:outline-none focus:ring-1 focus:ring-sky-400 font-medium"
              />
            </div>
          </div>

          {/* Module Nav Items List */}
          <div className="flex-1 min-h-0 overflow-y-auto space-y-1.5 pr-1 pb-2 sparkle-scroll">
            {filteredNavSections.map((sec) => {
              const Icon = sec.icon;
              const isActive = activeTab === sec.id;
              return (
                <button
                  key={sec.id}
                  type="button"
                  onClick={() => setActiveTab(sec.id)}
                  className={`w-full flex items-center justify-between p-3 rounded-2xl text-left transition-all cursor-pointer ${
                    isActive
                      ? 'bg-sky-50/80 border-2 border-[#00BDFF] ring-2 ring-sky-400/20 shadow-xs'
                      : 'bg-white border border-slate-200/80 hover:border-slate-300 hover:bg-slate-50/70 shadow-2xs'
                  }`}
                >
                  <div className="flex items-center space-x-3 min-w-0">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                      isActive ? 'bg-[#00BDFF] text-white shadow-2xs' : 'bg-slate-100 text-slate-600'
                    }`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className={`text-xs font-bold truncate ${isActive ? 'text-[#00BDFF]' : 'text-slate-800'}`}>
                          {sec.title}
                        </span>
                        {sec.statusDot && (
                          <span className={`w-1.5 h-1.5 rounded-full ${sec.statusDot} shrink-0`} />
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 truncate mt-0.5">
                        {sec.subtitle}
                      </p>
                    </div>
                  </div>

                  {sec.badge && (
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ml-2 ${
                      isActive ? 'bg-[#00BDFF] text-white' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {sec.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* VPS & Privacy Info Mini Card at Left Footer */}
          <div className="p-3 bg-white rounded-2xl border border-slate-200/80 shadow-2xs mt-auto shrink-0 space-y-1.5">
            <div className="flex items-center justify-between text-[11px] font-semibold text-slate-700">
              <span className="flex items-center gap-1 text-slate-700 font-bold">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                Privasi Terjamin
              </span>
              <span className="text-[9.5px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-500 font-mono">Live Stream</span>
            </div>
            <p className="text-[10px] text-slate-400 leading-snug">
              Mesej dibaca secara live tanpa disimpan di database. Apabila anda Logout, seluruh sesi dipadam serta-merta.
            </p>
          </div>
        </div>

        {/* =========================================================================
            SISI KANAN: KAD UTAMA KANDUNGAN DENGAN TUAS TOGGLE KIRI
           ========================================================================= */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm flex flex-col h-full relative overflow-hidden transition-all duration-300 ease-in-out flex-1 min-w-0 mr-0">
          
          {/* Gagang Toggle Kapsul Sisi Kiri (Tuas Pengatur Luas Panel) */}
          <button
            type="button"
            onClick={() => setIsLeftPanelCollapsed((v) => !v)}
            title={isLeftPanelCollapsed ? 'Buka Panel Navigasi' : 'Sembunyikan Panel Navigasi'}
            className={`absolute left-[5px] top-1/2 -translate-y-1/2 h-12 rounded-full flex items-center justify-center cursor-pointer select-none z-40 transition-all duration-200 ease-out group p-0 border-0 outline-none origin-left ${
              isLeftPanelCollapsed
                ? 'w-5 bg-[#f0f4f9] hover:bg-[#e2e7ee]'
                : 'w-1.5 hover:w-5 bg-[#f0f4f9] hover:bg-[#e2e7ee]'
            }`}
          >
            <span
              className={`transition-opacity duration-150 flex items-center justify-center text-slate-500 ${
                isLeftPanelCollapsed ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
              }`}
            >
              {isLeftPanelCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
            </span>
          </button>

          {/* ----------------- INTERNAL CARD HEADER ----------------- */}
          <div className="shrink-0 px-6 py-3.5 border-b border-slate-100 flex items-center justify-between gap-4 bg-slate-50/50">
            <div>
              <h2 className="text-sm font-bold text-slate-900 tracking-tight">
                {activeTab === 'inbox' && 'Omnichannel Live Chat Inbox'}
                {activeTab === 'tickets' && 'Pengurusan Tiket Sokongan Pelanggan (ID TIKET)'}
                {activeTab === 'device' && 'Pengurusan Peranti & Imbasan Kod QR'}
                {activeTab === 'automation' && 'Alur Automasi & Notifikasi Pesanan'}
                {activeTab === 'tester' && 'Ujian Penghantaran Mesej WhatsApp'}
              </h2>
              <p className="text-[11.5px] text-slate-500 mt-0.5">
                {activeTab === 'inbox' && 'Baca dan balas mesej pelanggan secara dua arah serentak dari web & telefon.'}
                {activeTab === 'tickets' && 'Senarai isu khusus dan tempahan khas yang dijana oleh AI untuk tindakan staf.'}
                {activeTab === 'device' && 'Sambungkan atau putuskan akaun WhatsApp rasmi kilang.'}
                {activeTab === 'automation' && 'Pemicu mesej automatik untuk tempahan baharu, status produksi dan invois.'}
                {activeTab === 'tester' && 'Hantar mesej ujian ke nombor telefon untuk memastikan bot berfungsi.'}
              </p>
            </div>

            {/* Context Actions */}
            {activeTab === 'inbox' && isConnected && (
              <button
                type="button"
                onClick={() => fetchChats()}
                className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 hover:border-slate-300 text-slate-700 text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
                <span>Segar Semula Chat</span>
              </button>
            )}

            {activeTab === 'tickets' && (
              <button
                type="button"
                onClick={() => fetchTickets()}
                className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 hover:border-slate-300 text-slate-700 text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${loadingTickets ? 'animate-spin text-[#00BDFF]' : ''}`} />
                <span>Segar Semula Tiket</span>
              </button>
            )}
          </div>

          {/* ----------------- CARD CONTENT BODY ----------------- */}
          <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
            
            {/* VIEW 1: LIVE OMNICHANNEL INBOX */}
            {activeTab === 'inbox' && (
              !isConnected ? (
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4">
                  <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-500 border border-amber-200/80 flex items-center justify-center">
                    <Smartphone className="w-7 h-7" />
                  </div>
                  <div className="max-w-sm space-y-1">
                    <h3 className="text-sm font-bold text-slate-900">
                      WhatsApp Belum Disambungkan
                    </h3>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Sila imbas kod QR di menu <strong>Peranti & Imbas QR</strong> untuk mula membalas chat pelanggan dari web ini.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab('device')}
                    className="px-4 py-2 rounded-xl bg-[#00BDFF] hover:bg-sky-500 text-white text-xs font-bold shadow-md shadow-sky-400/20 active:scale-95 transition-all cursor-pointer flex items-center gap-2"
                  >
                    <span>Buka Imbasan QR</span>
                    <Smartphone className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex-1 flex overflow-hidden">
                  {/* Left Column: Contacts List */}
                  <div className="w-72 sm:w-80 border-r border-slate-200/80 flex flex-col shrink-0 bg-slate-50/40">
                    <div className="p-3 border-b border-slate-200/80 bg-white space-y-2">
                      {/* Filter Category Tabs: Semua | Pelanggan | Peribadi */}
                      <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl text-[11px] font-semibold">
                        <button
                          type="button"
                          onClick={() => setChatCategoryFilter('all')}
                          className={`flex-1 py-1 rounded-lg transition-all text-center cursor-pointer ${
                            chatCategoryFilter === 'all'
                              ? 'bg-white text-slate-900 shadow-2xs font-bold'
                              : 'text-slate-500 hover:text-slate-900'
                          }`}
                        >
                          Semua ({chats.length})
                        </button>
                        <button
                          type="button"
                          onClick={() => setChatCategoryFilter('customers')}
                          className={`flex-1 py-1 rounded-lg transition-all text-center cursor-pointer ${
                            chatCategoryFilter === 'customers'
                              ? 'bg-white text-[#00BDFF] shadow-2xs font-bold'
                              : 'text-slate-500 hover:text-slate-900'
                          }`}
                        >
                          Pelanggan ({customerCount})
                        </button>
                        <button
                          type="button"
                          onClick={() => setChatCategoryFilter('private')}
                          className={`flex-1 py-1 rounded-lg transition-all text-center cursor-pointer ${
                            chatCategoryFilter === 'private'
                              ? 'bg-white text-slate-800 shadow-2xs font-bold'
                              : 'text-slate-500 hover:text-slate-900'
                          }`}
                        >
                          🔒 Peribadi ({privateCount})
                        </button>
                      </div>

                      <div className="relative">
                        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={chatSearch}
                          onChange={(e) => setChatSearch(e.target.value)}
                          placeholder="Cari perbualan..."
                          className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-sky-400 placeholder:text-slate-400"
                        />
                      </div>
                    </div>

                    <div className="flex-1 overflow-y-auto divide-y divide-slate-100 sparkle-scroll">
                      {filteredChats.length === 0 ? (
                        <div className="p-8 text-center space-y-2">
                          <MessageSquare className="w-6 h-6 text-slate-300 mx-auto" />
                          <p className="text-xs text-slate-400">
                            {chatCategoryFilter === 'private'
                              ? 'Tiada perbualan ditandakan sebagai peribadi.'
                              : 'Tiada perbualan aktif.'}
                          </p>
                        </div>
                      ) : (
                        filteredChats.map((chat) => {
                          const isSelected = selectedChat?.id === chat.id;
                          const isBotPaused = pausedChatIds[chat.id];
                          const isPrivate = !!privateChatIds[chat.id];

                          return (
                            <div
                              key={chat.id}
                              onClick={() => setSelectedChat(chat)}
                              className={`p-3 flex items-start gap-3 cursor-pointer transition-all ${
                                isSelected 
                                  ? 'bg-sky-50/80 border-l-4 border-[#00BDFF]' 
                                  : 'hover:bg-slate-100/70 bg-white'
                              }`}
                            >
                              <div className={`w-10 h-10 rounded-xl text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs ${
                                isPrivate 
                                  ? 'bg-gradient-to-tr from-slate-600 to-slate-700' 
                                  : 'bg-gradient-to-tr from-slate-800 to-slate-900'
                              }`}>
                                {chat.name.charAt(0).toUpperCase()}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                  <h4 className="text-xs font-bold text-slate-900 truncate">
                                    {chat.name}
                                  </h4>
                                  {chat.lastMessage && (
                                    <span className="text-[10px] text-slate-400">
                                      {new Date(chat.lastMessage.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center justify-between mt-0.5">
                                  <p className="text-[11px] text-slate-400 font-mono truncate">
                                    +{chat.phone}
                                  </p>
                                  {isPrivate ? (
                                    <span className="text-[9.5px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 border border-slate-200 flex items-center gap-0.5">
                                      🔒 Peribadi
                                    </span>
                                  ) : isBotPaused ? (
                                    <span className="text-[9.5px] px-1.5 py-0.2 rounded bg-amber-50 text-amber-700 border border-amber-200">
                                      Staf CS
                                    </span>
                                  ) : (
                                    <span className="text-[9.5px] px-1.5 py-0.2 rounded bg-sky-50 text-[#00BDFF] border border-sky-200">
                                      Bot AI
                                    </span>
                                  )}
                                </div>
                                {chat.lastMessage && (
                                  <p className="text-[11px] text-slate-500 truncate mt-0.5">
                                    {chat.lastMessage.fromMe && <span className="font-semibold text-slate-700">Anda: </span>}
                                    {chat.lastMessage.body}
                                  </p>
                                )}
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>

                  {/* Right Column: Chat Content */}
                  {selectedChat ? (
                    <div className="flex-1 flex flex-col bg-[#F8FAFC]">
                      {/* Active Chat Bar with Bot Pause Toggle */}
                      <div className="p-3 px-5 bg-white border-b border-slate-200/80 flex items-center justify-between shrink-0">
                        <div className="flex items-center space-x-3">
                          <div className={`w-8 h-8 rounded-xl text-white font-bold text-xs flex items-center justify-center ${
                            privateChatIds[selectedChat.id] ? 'bg-slate-600' : 'bg-slate-800'
                          }`}>
                            {selectedChat.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="text-xs font-bold text-slate-900">
                                {selectedChat.name}
                              </h3>
                              {privateChatIds[selectedChat.id] ? (
                                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 flex items-center gap-1">
                                  🔒 Perbualan Peribadi (Bot Dimatikan)
                                </span>
                              ) : pausedChatIds[selectedChat.id] ? (
                                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1">
                                  <PauseCircle className="w-3 h-3" />
                                  Bot Dijeda (Staf Manusia)
                                </span>
                              ) : (
                                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-sky-50 text-[#00BDFF] border border-sky-200 flex items-center gap-1">
                                  <Bot className="w-3 h-3" />
                                  Bot AI Aktif
                                </span>
                              )}
                            </div>
                            <p className="text-[10.5px] text-slate-400 font-mono">
                              +{selectedChat.phone}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => togglePrivateForChat(selectedChat.id)}
                            title={privateChatIds[selectedChat.id] ? "Tukar kepada Pelanggan" : "Tandakan Sebagai Peribadi / Teman"}
                            className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                              privateChatIds[selectedChat.id]
                                ? 'bg-slate-100 text-slate-700 border-slate-300'
                                : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200/80'
                            }`}
                          >
                            {privateChatIds[selectedChat.id] ? (
                              <>
                                <UserCheck className="w-3.5 h-3.5 text-slate-600" />
                                <span>Tukar ke Pelanggan</span>
                              </>
                            ) : (
                              <>
                                <ShieldCheck className="w-3.5 h-3.5 text-slate-500" />
                                <span>Tanda Peribadi</span>
                              </>
                            )}
                          </button>

                          {!privateChatIds[selectedChat.id] && (
                            <button
                              type="button"
                              onClick={() => toggleBotForChat(selectedChat.id)}
                              className="px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200/80 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                            >
                              {pausedChatIds[selectedChat.id] ? (
                                <>
                                  <PlayCircle className="w-3.5 h-3.5 text-emerald-600" />
                                  <span>Aktifkan Semula Bot</span>
                                </>
                              ) : (
                                <>
                                  <PauseCircle className="w-3.5 h-3.5 text-amber-600" />
                                  <span>Jeda Bot (Ambil Alih)</span>
                                </>
                              )}
                            </button>
                          )}

                          <a
                            href={`https://wa.me/${selectedChat.phone}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200/80 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            <span>WhatsApp Web</span>
                          </a>
                        </div>
                      </div>

                      {privateChatIds[selectedChat.id] && (
                        <div className="mx-4 mt-3 p-2.5 rounded-xl bg-amber-50/90 border border-amber-200/80 text-[11.5px] text-amber-800 flex items-center gap-2">
                          <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0" />
                          <span>
                            <strong>Perbualan Peribadi:</strong> Bot AI dinyahaktifkan secara mutlak untuk nombor ini bagi menjaga privasi keluarga/rakan anda.
                          </span>
                        </div>
                      )}

                      {/* Chat Messages List */}
                      <div className="flex-1 overflow-y-auto p-4 sm:p-6 sparkle-scroll bg-slate-50/50">
                        <div className="max-w-3xl mx-auto w-full space-y-3">
                          {loadingMessages ? (
                            <div className="py-16 text-center text-xs text-slate-400 flex flex-col items-center justify-center gap-2">
                              <RefreshCw className="w-5 h-5 animate-spin text-[#00BDFF]" />
                              <span>Memuatkan mesej perbualan...</span>
                            </div>
                          ) : messages.length === 0 ? (
                            <div className="py-16 text-center text-xs text-slate-400 bg-white/60 rounded-2xl border border-dashed border-slate-200">
                              Tiada rekod mesej lagi dalam sesi ini.
                            </div>
                          ) : (
                            messages.map((msg) => {
                              const vcard = parseVCard(msg.body);
                              return (
                                <div
                                  key={msg.id}
                                  className={`flex ${msg.fromMe ? 'justify-end' : 'justify-start'}`}
                                >
                                  <div
                                    className={`max-w-[85%] sm:max-w-[70%] rounded-2xl px-4 py-2.5 text-xs shadow-xs space-y-1.5 transition-all ${
                                      msg.fromMe
                                        ? 'bg-[#00BDFF] text-white rounded-tr-xs'
                                        : 'bg-white text-slate-800 border border-slate-200/80 rounded-tl-xs'
                                    }`}
                                  >
                                    {vcard ? (
                                      <div className={`p-2.5 rounded-xl border space-y-2 ${
                                        msg.fromMe 
                                          ? 'bg-sky-600/30 border-sky-400/40 text-white' 
                                          : 'bg-slate-50 border-slate-200 text-slate-800'
                                      }`}>
                                        <div className="flex items-center gap-2.5">
                                          <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                                            msg.fromMe ? 'bg-white/20 text-white' : 'bg-[#00BDFF]/10 text-[#00BDFF]'
                                          }`}>
                                            <User className="w-4 h-4" />
                                          </div>
                                          <div className="min-w-0 flex-1">
                                            <p className="font-bold text-xs truncate">{vcard.name}</p>
                                            <p className={`text-[10px] font-mono truncate ${msg.fromMe ? 'text-sky-100' : 'text-slate-500'}`}>
                                              {vcard.phone ? `+${vcard.phone}` : 'Kad Kenalan'}
                                            </p>
                                          </div>
                                        </div>
                                        {vcard.phone && (
                                          <a
                                            href={`https://wa.me/${vcard.phone}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className={`inline-flex items-center justify-center gap-1.5 w-full py-1.5 rounded-lg font-semibold text-[11px] transition-colors ${
                                              msg.fromMe 
                                                ? 'bg-white text-[#00BDFF] hover:bg-sky-50' 
                                                : 'bg-[#00BDFF] text-white hover:bg-sky-600'
                                            }`}
                                          >
                                            <Phone className="w-3 h-3" />
                                            <span>Mesej Nombor Ini</span>
                                          </a>
                                        )}
                                      </div>
                                    ) : (
                                      <p className="leading-relaxed whitespace-pre-wrap break-words">{msg.body}</p>
                                    )}

                                    <div className={`flex items-center justify-end gap-1 text-[9.5px] ${
                                      msg.fromMe ? 'text-sky-100' : 'text-slate-400'
                                    }`}>
                                      <span>
                                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                      </span>
                                      {msg.fromMe && <CheckCheck className="w-3 h-3" />}
                                    </div>
                                  </div>
                                </div>
                              );
                            })
                          )}
                          <div ref={messagesEndRef} />
                        </div>
                      </div>

                      {/* Quick Templates Bar */}
                      <div className="px-4 py-2 bg-white/95 border-t border-slate-200/70 overflow-x-auto flex items-center gap-2 scrollbar-none">
                        <div className="max-w-3xl mx-auto w-full flex items-center gap-2">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0 flex items-center gap-1">
                            <Sparkles className="w-3 h-3 text-[#00BDFF]" />
                            Templat:
                          </span>
                          {QUICK_TEMPLATES.map((tmpl, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => setReplyText(tmpl)}
                              className="px-2.5 py-1 rounded-full bg-slate-50 hover:bg-sky-50 hover:text-[#00BDFF] hover:border-sky-200 border border-slate-200/70 text-[11px] text-slate-600 truncate max-w-xs shrink-0 transition-colors cursor-pointer"
                            >
                              {tmpl}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Reply Form */}
                      <div className="p-3 bg-white border-t border-slate-200/80">
                        <form onSubmit={handleSendReply} className="max-w-3xl mx-auto w-full flex items-center gap-2">
                          <input
                            type="text"
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            placeholder="Tulis mesej balasan (staf mengambil alih perbualan)..."
                            className="flex-1 px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-sky-400"
                          />
                          <button
                            type="submit"
                            disabled={sendingReply || !replyText.trim()}
                            className="px-4 py-2.5 rounded-xl bg-[#00BDFF] hover:bg-sky-500 active:scale-95 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-all cursor-pointer disabled:opacity-50"
                          >
                            <SendHorizontal className={`w-3.5 h-3.5 ${sendingReply ? 'animate-spin' : ''}`} />
                            <span>Hantar</span>
                          </button>
                        </form>
                      </div>
                    </div>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400 space-y-2">
                      <MessageSquare className="w-8 h-8 text-slate-300" />
                      <p className="text-xs">Pilih salah satu perbualan di sebelah kiri untuk melihat mesej.</p>
                    </div>
                  )}
                </div>
              )
            )}

            {/* VIEW 2: SUPPORT TICKETS (ID TIKET) */}
            {activeTab === 'tickets' && (
              <div className="flex-1 overflow-y-auto p-6 space-y-4 sparkle-scroll">
                <div className="flex items-center justify-between max-w-4xl mx-auto pb-2">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Senarai Tiket Tindakan Lanjutan</h3>
                    <p className="text-xs text-slate-500">Isu khas atau tempahan korporat yang dijana AI untuk perhatian staf kilang.</p>
                  </div>
                  <span className="text-xs font-semibold px-3 py-1 rounded-full bg-sky-50 text-[#00BDFF] border border-sky-200">
                    {tickets.length} Tiket Didaftarkan
                  </span>
                </div>

                <div className="max-w-4xl mx-auto space-y-3">
                  {tickets.length === 0 ? (
                    <div className="p-12 text-center text-xs text-slate-400 bg-white rounded-2xl border border-slate-200/80">
                      Tiada tiket sokongan terbuka pada masa ini.
                    </div>
                  ) : (
                    tickets.map((t) => (
                      <div key={t.id} className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-2xs space-y-2.5">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center space-x-2">
                            <span className="font-mono font-bold text-xs px-2.5 py-0.5 rounded-lg bg-slate-100 text-slate-800 border border-slate-200">
                              {t.ticketNumber}
                            </span>
                            <span className="text-xs font-bold text-slate-900">
                              {t.customerName || 'Pelanggan'}
                            </span>
                            <span className="text-[11px] font-mono text-slate-400">
                              (+{t.customerPhone})
                            </span>
                          </div>

                          <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase ${
                            t.status === 'open' 
                              ? 'bg-amber-50 text-amber-700 border border-amber-200' 
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          }`}>
                            {t.status === 'open' ? 'Perlu Tindakan' : 'Selesai'}
                          </span>
                        </div>

                        <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-200/60">
                          {t.summary}
                        </p>

                        <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                          <span>Didaftarkan: {new Date(t.createdAt).toLocaleString()}</span>
                          <a
                            href={`https://wa.me/${t.customerPhone}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#00BDFF] hover:underline font-semibold flex items-center gap-1"
                          >
                            <span>Hubungi Pelanggan di WhatsApp →</span>
                          </a>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* VIEW 3: DEVICE & QR SCANNER */}
            {activeTab === 'device' && (
              <div className="flex-1 overflow-y-auto p-6 space-y-6 sparkle-scroll">
                {isConnected ? (
                  <div className="max-w-2xl mx-auto space-y-5">
                    <div className="p-5 rounded-2xl bg-emerald-50/60 border border-emerald-200/80 flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-md shadow-emerald-500/20">
                          <Smartphone className="w-6 h-6" />
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-slate-900">
                            {statusData.me?.pushName || 'SFV Apparel Official'}
                          </h3>
                          <p className="text-xs text-slate-600 font-mono mt-0.5">
                            +{statusData.me?.id?.split('@')[0] || companySettings?.whatsapp_number || ''}
                          </p>
                          <p className="text-[11px] text-emerald-700 mt-1 flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Akaun WhatsApp aktif dan bersambung secara 2-way sync</span>
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                      <span className="text-xs text-slate-500">
                        Hostinger VPS Engine (IP: 187.127.223.53)
                      </span>

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
                  <div className="max-w-2xl mx-auto flex flex-col sm:flex-row items-center gap-6 p-6 rounded-2xl bg-slate-50 border border-slate-200/80">
                    <div className="w-52 h-52 bg-white rounded-2xl p-2.5 shadow-md border border-slate-200/80 flex items-center justify-center shrink-0">
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

                    <div className="flex-1 space-y-3">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                        Langkah Menyambungkan WhatsApp:
                      </h3>
                      <div className="space-y-2.5 text-xs text-slate-600">
                        <div className="flex items-start gap-2">
                          <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-800 font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">1</span>
                          <span>Buka aplikasi <strong>WhatsApp</strong> di telefon bimbit anda.</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-800 font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">2</span>
                          <span>Tekan <strong>Tetapan</strong> ➔ <strong>Perangkat Tertaut (Linked Devices)</strong>.</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="w-5 h-5 rounded-full bg-[#00BDFF] text-white font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">3</span>
                          <span>Tekan <strong>Tautkan Perangkat</strong> dan halakan kamera ke kod QR.</span>
                        </div>
                      </div>

                      <div className="pt-2">
                        <button
                          type="button"
                          onClick={handleRestartSession}
                          disabled={actionLoading}
                          className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer shadow-xs disabled:opacity-50"
                        >
                          <RefreshCw className={`w-3.5 h-3.5 ${actionLoading ? 'animate-spin' : ''}`} />
                          <span>Jana Semula Kod QR</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* VIEW 4: AUTOMATION TRIGGERS */}
            {activeTab === 'automation' && (
              <div className="flex-1 overflow-y-auto p-6 space-y-4 sparkle-scroll">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 max-w-4xl mx-auto text-xs">
                  <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">1. Notifikasi Pesanan Baharu</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">Aktif</span>
                    </div>
                    <p className="text-slate-500 leading-relaxed">
                      Menghantar ringkasan tempahan jersi & pautan invois ke WhatsApp pelanggan secara automatik.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">2. Amaran Tempahan Kilang</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">Aktif</span>
                    </div>
                    <p className="text-slate-500 leading-relaxed">
                      Menghantar butiran saiz & kuantiti terus ke WhatsApp admin kilang.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">3. Status Siap Cetak</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">Aktif</span>
                    </div>
                    <p className="text-slate-500 leading-relaxed">
                      WhatsApp dihantar kepada pelanggan apabila jersi/baju mereka telah siap dicetak.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">4. Nombor Tracking Pos</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">Aktif</span>
                    </div>
                    <p className="text-slate-500 leading-relaxed">
                      Menghantar nombor tracking pos laju automatik kepada pelanggan sebaik sahaja bungkusan dipos.
                    </p>
                  </div>
                </div>

                {/* n8n Engine Link Card */}
                <div className="max-w-4xl mx-auto p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-9 h-9 rounded-xl bg-sky-50 text-[#00BDFF] border border-sky-100 flex items-center justify-center shrink-0">
                      <Layers className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">
                        LiteLLM Multi-Key Router & n8n Engine
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        Router Port 4000 aktif menyalurkan AI Groq Llama 3.3 70B tanpa sekatan rate-limit.
                      </p>
                    </div>
                  </div>

                  <a
                    href="http://187.127.223.53:5678"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 hover:border-slate-300 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs"
                  >
                    <span>Editor n8n</span>
                    <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                  </a>
                </div>
              </div>
            )}

            {/* VIEW 5: TEST SENDER */}
            {activeTab === 'tester' && (
              <div className="flex-1 overflow-y-auto p-6 sparkle-scroll">
                <div className="max-w-md mx-auto p-5 bg-white rounded-2xl border border-slate-200/80 shadow-2xs space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                    Uji Penghantaran Mesej
                  </h3>

                  <form onSubmit={handleSendTest} className="space-y-3.5">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-700">Nombor Telefon Penerima</label>
                      <input
                        type="text"
                        required
                        value={testPhone}
                        onChange={(e) => setTestPhone(e.target.value)}
                        placeholder="Contoh: 60148599138"
                        className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 font-mono focus:outline-none focus:ring-1 focus:ring-sky-400"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-700">Kandungan Mesej</label>
                      <textarea
                        rows={3}
                        required
                        value={testMessage}
                        onChange={(e) => setTestMessage(e.target.value)}
                        className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 resize-none focus:outline-none focus:ring-1 focus:ring-sky-400"
                      />
                    </div>

                    {sendResult && (
                      <div className={`p-3 rounded-xl text-xs flex items-start gap-2 ${
                        sendResult.success 
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                          : 'bg-rose-50 text-rose-800 border border-rose-200'
                      }`}>
                        {sendResult.success ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" /> : <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />}
                        <span>{sendResult.message}</span>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={sending || !isConnected}
                      className="w-full py-2.5 rounded-xl bg-[#00BDFF] hover:bg-sky-500 active:scale-95 text-white font-bold text-xs shadow-md shadow-sky-400/20 transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
                    >
                      <Send className={`w-3.5 h-3.5 ${sending ? 'animate-spin' : ''}`} />
                      <span>{sending ? 'Sedang Menghantar...' : 'Hantar Mesej Ujian'}</span>
                    </button>
                  </form>
                </div>
              </div>
            )}

          </div>
        </div>

      </div>
    </div>
  );
}

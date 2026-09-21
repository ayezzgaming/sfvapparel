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
  Phone,
  X,
  FileText,
  Image as ImageIcon
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

function isMediaFilename(text: string): boolean {
  if (!text) return false;
  const trimmed = text.trim();
  if (trimmed.startsWith('[Media') || trimmed.startsWith('[Gambar') || trimmed.startsWith('[Audio') || trimmed.startsWith('[Dokumen')) {
    return true;
  }
  return /\.(png|jpe?g|webp|gif|pdf|docx?|xlsx?|mp4|opus|ogg|mp3)$/i.test(trimmed);
}

function stripWhatsAppFormatting(text: string): string {
  if (!text) return '';
  return text
    .replace(/```[\s\S]*?```/g, (m) => m.slice(3, -3))
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/_(.*?)_/g, '$1')
    .replace(/~(.*?)~/g, '$1')
    .trim();
}

function renderFormattedTokens(text: string, keyPrefix: string): React.ReactNode {
  if (!text) return null;

  const tokenRegex = /(```[\s\S]*?```|\*\*[^\*]+?\*\*|\*[^\*]+?\*|_[^_]+?_|~[^~]+?~)/g;
  const segments = text.split(tokenRegex);

  return segments.map((seg, idx) => {
    const key = `${keyPrefix}-${idx}`;
    if (!seg) return null;

    if (seg.startsWith('```') && seg.endsWith('```') && seg.length >= 6) {
      const code = seg.slice(3, -3);
      return (
        <code key={key} className="bg-slate-200/80 dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 px-1.5 py-0.5 rounded font-mono text-[11.5px]">
          {code}
        </code>
      );
    }

    if (seg.startsWith('**') && seg.endsWith('**') && seg.length > 4) {
      const boldText = seg.slice(2, -2);
      return <strong key={key} className="font-extrabold text-[#0a1014] dark:text-white">{boldText}</strong>;
    }

    if (seg.startsWith('*') && seg.endsWith('*') && seg.length > 2) {
      const boldText = seg.slice(1, -1);
      return <strong key={key} className="font-extrabold text-[#0a1014] dark:text-white">{boldText}</strong>;
    }

    if (seg.startsWith('_') && seg.endsWith('_') && seg.length > 2) {
      const italicText = seg.slice(1, -1);
      return <em key={key} className="italic text-slate-800 dark:text-zinc-200">{italicText}</em>;
    }

    if (seg.startsWith('~') && seg.endsWith('~') && seg.length > 2) {
      const strikeText = seg.slice(1, -1);
      return <del key={key} className="line-through text-slate-500 opacity-75">{strikeText}</del>;
    }

    return <span key={key}>{seg}</span>;
  });
}

function formatWhatsAppText(text: string): React.ReactNode {
  if (!text) return null;

  const lines = text.split('\n');

  return lines.map((line, lineIdx) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = line.split(urlRegex);

    return (
      <React.Fragment key={lineIdx}>
        {lineIdx > 0 && <br />}
        {parts.map((part, partIdx) => {
          if (part.match(urlRegex)) {
            return (
              <a
                key={partIdx}
                href={part}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sky-700 dark:text-sky-400 font-medium underline break-all hover:text-sky-900 inline-flex items-center gap-0.5"
                onClick={(e) => e.stopPropagation()}
              >
                <span>{part}</span>
                <ExternalLink className="w-2.5 h-2.5 inline shrink-0" />
              </a>
            );
          }

          return renderFormattedTokens(part, `${lineIdx}-${partIdx}`);
        })}
      </React.Fragment>
    );
  });
}

export default function WhatsAppHubPage() {
  const { companySettings } = useAppStore();

  // Navigation & Panel states
  const [activeTab, setActiveTab] = useState<HubSectionKey>('inbox');
  const [isLeftPanelCollapsed, setIsLeftPanelCollapsed] = useState(false);

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
    } catch {
      // ignore
    }
  }, []);

  const togglePrivateForChat = (chatId: string) => {
    setPrivateChatIds((prev) => {
      const updated = { ...prev, [chatId]: !prev[chatId] };
      try {
        localStorage.setItem('sfv_wa_private_chats', JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });
  };

  // Support Tickets State
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loadingTickets, setLoadingTickets] = useState(false);

  // Test Message Form
  const [testPhone, setTestPhone] = useState('');
  const [testMessage, setTestMessage] = useState('Salam dari Kilang SFV Apparel! Ujian sambungan WhatsApp berjaya.');
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState<{ success: boolean; message: string } | null>(null);

  // Fetch Session Status & QR
  const fetchStatus = useCallback(async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const res = await fetch('/api/whatsapp/session');
      const data = await res.json();
      if (data.success && data.data) {
        setStatusData(data.data);
        if (data.data.status === 'SCAN_QR_CODE' && data.data.qr) {
          setQrCode(data.data.qr);
        } else {
          setQrCode(null);
        }
      }
    } catch (err) {
      console.error('Failed to fetch WA session status', err);
    } finally {
      setLoading(false);
      if (isManual) setRefreshing(false);
    }
  }, []);

  // Fetch Tickets
  const fetchTickets = useCallback(async () => {
    setLoadingTickets(true);
    try {
      const res = await fetch('/api/whatsapp/tickets');
      const data = await res.json();
      if (data.success && data.tickets) {
        setTickets(data.tickets);
      }
    } catch (err) {
      console.error('Failed to fetch support tickets', err);
    } finally {
      setLoadingTickets(false);
    }
  }, []);

  // Fetch Chats List
  const fetchChats = useCallback(async () => {
    try {
      const res = await fetch('/api/whatsapp/chats');
      const data = await res.json();
      if (data.success && Array.isArray(data.chats)) {
        setChats(data.chats);
        if (!selectedChat && data.chats.length > 0) {
          setSelectedChat(data.chats[0]);
        }
      }
    } catch (err) {
      console.error('Failed to fetch WA chats', err);
    }
  }, [selectedChat]);

  // Fetch Messages for Selected Chat
  const fetchMessages = useCallback(async (chatId: string) => {
    setLoadingMessages(true);
    try {
      const res = await fetch(`/api/whatsapp/messages?chatId=${encodeURIComponent(chatId)}&limit=40`);
      const data = await res.json();
      if (data.success && Array.isArray(data.messages)) {
        setMessages(data.messages);
      }
    } catch (err) {
      console.error('Failed to fetch messages for', chatId, err);
    } finally {
      setLoadingMessages(false);
    }
  }, []);

  // Initial Load & Polling
  useEffect(() => {
    fetchStatus();
    fetchTickets();
    const interval = setInterval(() => {
      fetchStatus();
    }, 15000);
    return () => clearInterval(interval);
  }, [fetchStatus, fetchTickets]);

  // Auto load chats when status is WORKING
  useEffect(() => {
    if (statusData.status === 'WORKING') {
      fetchChats();
      const chatInterval = setInterval(fetchChats, 12000);
      return () => clearInterval(chatInterval);
    }
  }, [statusData.status, fetchChats]);

  // Load messages when selectedChat changes
  useEffect(() => {
    if (selectedChat) {
      fetchMessages(selectedChat.id);
    }
  }, [selectedChat, fetchMessages]);

  // Scroll messages to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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
    <div className="w-full h-full overflow-hidden bg-[#f0f4f9] dark:bg-zinc-950 flex flex-col p-4 gap-3 text-slate-900 dark:text-zinc-100 font-sans select-none">
      
      {/* ----------------- TOP HEADER TOOLBAR ----------------- */}
      <div className="shrink-0 flex items-center justify-between gap-3 min-h-[38px]">
        {/* Title & Top Tabs Switcher */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 rounded-full bg-sky-50 dark:bg-sky-950 text-[#00BDFF] border border-sky-100 dark:border-sky-900 flex items-center justify-center shadow-2xs shrink-0">
              <FaWhatsapp className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold text-slate-800 dark:text-zinc-100 tracking-tight">
              Hab WhatsApp & AI Brain
            </span>
          </div>

          {/* Module Switcher Tabs (Top Bar like Ads Generator & Catalog) */}
          <div className="flex items-center space-x-1 bg-slate-100/90 dark:bg-zinc-800/90 backdrop-blur-md p-1 rounded-full border border-slate-200/80 dark:border-zinc-700/80 shadow-2xs">
            {[
              { id: 'inbox', label: `Live Chat (${chats.length})`, icon: MessageSquare },
              { id: 'tickets', label: `Tiket (${tickets.length})`, icon: Ticket },
              { id: 'device', label: 'Peranti & QR', icon: Smartphone, statusDot: isConnected ? 'bg-emerald-500' : 'bg-amber-500' },
              { id: 'automation', label: 'Automasi Pesanan', icon: Bell },
              { id: 'tester', label: 'Uji Mesej', icon: Send },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-[#00BDFF] text-white shadow-xs'
                      : 'text-slate-600 dark:text-zinc-400 hover:text-[#00BDFF] dark:hover:text-zinc-200'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                  {tab.statusDot && (
                    <span className={`w-1.5 h-1.5 rounded-full ${tab.statusDot} shrink-0`} />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Toolbar Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 text-[11px] font-semibold">
            <Radio className={`w-3 h-3 ${isConnected ? 'text-emerald-500 animate-pulse' : 'text-amber-500'}`} />
            <span className={isConnected ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}>
              {loading ? 'Menyemak...' : isConnected ? 'WhatsApp Terhubung' : 'Perlu Imbas QR'}
            </span>
          </div>

          <button
            type="button"
            onClick={() => fetchStatus(true)}
            disabled={refreshing || loading}
            title="Segar semula status"
            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-white hover:bg-slate-50 text-slate-700 dark:bg-zinc-900 dark:hover:bg-zinc-800 dark:text-zinc-200 text-xs font-medium border border-slate-200 dark:border-zinc-700 shadow-2xs transition-all cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${refreshing ? 'animate-spin text-[#00BDFF]' : ''}`} />
            <span>{refreshing ? 'Menyemak...' : 'Segar Semula'}</span>
          </button>
        </div>
      </div>

      {/* ----------------- 1 MAIN CARD (SPLIT LAYOUT) ----------------- */}
      <div className="flex-1 min-h-0 flex overflow-hidden bg-white dark:bg-zinc-900 rounded-3xl border border-slate-200/80 dark:border-zinc-800 shadow-xs relative">
        
        {/* TAB 1: LIVE CHAT INBOX (Split: Contact List + Conversation) */}
        {activeTab === 'inbox' && (
          !isConnected ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4">
              <div className="w-14 h-14 rounded-full bg-amber-50 text-amber-500 border border-amber-200/80 flex items-center justify-center shadow-xs">
                <Smartphone className="w-7 h-7" />
              </div>
              <div className="max-w-sm space-y-1">
                <h3 className="text-sm font-bold text-slate-900 dark:text-zinc-100">
                  WhatsApp Belum Disambungkan
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Sila imbas kod QR di tab <strong>Peranti & QR</strong> untuk mula membalas chat pelanggan secara langsung.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('device')}
                className="px-5 py-2.5 rounded-full bg-[#00BDFF] hover:bg-sky-500 text-white text-xs font-bold shadow-xs active:scale-95 transition-all cursor-pointer flex items-center gap-2"
              >
                <span>Buka Imbasan QR</span>
                <Smartphone className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex-1 min-h-0 flex overflow-hidden relative">
              
              {/* LEFT PANEL: CONTACTS LIST (Collapsible) */}
              <div
                className={`shrink-0 transition-all duration-300 ease-in-out border-r border-slate-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex flex-col h-full overflow-hidden ${
                  isLeftPanelCollapsed ? 'w-0 border-r-0 overflow-hidden' : 'w-72 sm:w-80 md:w-88'
                }`}
              >
                {/* Search & Category Filter Header */}
                <div className="p-3 border-b border-slate-100 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-800/50 space-y-2 shrink-0">
                  <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-zinc-800 rounded-full text-[11px] font-semibold border border-slate-200/60 dark:border-zinc-700/60">
                    <button
                      type="button"
                      onClick={() => setChatCategoryFilter('all')}
                      className={`flex-1 py-1 rounded-full transition-all text-center cursor-pointer ${
                        chatCategoryFilter === 'all'
                          ? 'bg-white dark:bg-zinc-900 text-slate-900 dark:text-zinc-100 shadow-2xs font-bold'
                          : 'text-slate-500 hover:text-slate-900'
                      }`}
                    >
                      Semua ({chats.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setChatCategoryFilter('customers')}
                      className={`flex-1 py-1 rounded-full transition-all text-center cursor-pointer ${
                        chatCategoryFilter === 'customers'
                          ? 'bg-white dark:bg-zinc-900 text-[#00BDFF] shadow-2xs font-bold'
                          : 'text-slate-500 hover:text-slate-900'
                      }`}
                    >
                      Pelanggan ({customerCount})
                    </button>
                    <button
                      type="button"
                      onClick={() => setChatCategoryFilter('private')}
                      className={`flex-1 py-1 rounded-full transition-all text-center cursor-pointer ${
                        chatCategoryFilter === 'private'
                          ? 'bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-200 shadow-2xs font-bold'
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
                      className="w-full pl-8 pr-3 py-1.5 rounded-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 text-xs text-slate-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#00BDFF]/40 placeholder:text-slate-400 shadow-2xs"
                    />
                  </div>
                </div>

                {/* Contacts List */}
                <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-zinc-800 sparkle-scroll">
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
                          className={`p-3.5 flex items-start gap-3 cursor-pointer transition-all ${
                            isSelected 
                              ? 'bg-sky-50/90 dark:bg-sky-950/40 border-l-4 border-[#00BDFF]' 
                              : 'hover:bg-slate-50/80 dark:hover:bg-zinc-800/40 bg-white dark:bg-zinc-900'
                          }`}
                        >
                          <div className={`w-9 h-9 rounded-full text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs ${
                            isPrivate 
                              ? 'bg-gradient-to-tr from-slate-600 to-slate-700' 
                              : 'bg-gradient-to-tr from-slate-800 to-slate-900'
                          }`}>
                            {chat.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <h4 className="text-xs font-bold text-slate-900 dark:text-zinc-100 truncate">
                                {chat.name}
                              </h4>
                              {chat.lastMessage && (
                                <span className="text-[10px] text-slate-400 font-mono">
                                  {new Date(chat.lastMessage.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center justify-between mt-0.5">
                              <p className="text-[11px] text-slate-400 font-mono truncate">
                                +{chat.phone}
                              </p>
                              {isPrivate ? (
                                <span className="text-[9.5px] px-2 py-0.2 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 border border-slate-200 dark:border-zinc-700 flex items-center gap-0.5">
                                  🔒 Peribadi
                                </span>
                              ) : isBotPaused ? (
                                <span className="text-[9.5px] px-2 py-0.2 rounded-full bg-amber-50 text-amber-700 border border-amber-200 font-medium">
                                  Staf CS
                                </span>
                              ) : (
                                <span className="text-[9.5px] px-2 py-0.2 rounded-full bg-sky-50 text-[#00BDFF] border border-sky-200 font-medium">
                                  Bot AI
                                </span>
                              )}
                            </div>
                            {chat.lastMessage && (
                              <p className="text-[11px] text-slate-500 dark:text-zinc-400 truncate mt-0.5">
                                {chat.lastMessage.fromMe && <span className="font-semibold text-slate-700 dark:text-zinc-300">Anda: </span>}
                                {stripWhatsAppFormatting(chat.lastMessage.body)}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* RIGHT PANEL: CHAT CONVERSATION */}
              <div className="flex-1 min-w-0 flex flex-col h-full overflow-hidden bg-[#efeae2]/50 dark:bg-zinc-950 relative">
                
                {/* FLOATING CAPSULE TOGGLE HANDLE (LEFT EDGE OF RIGHT PANEL) */}
                <button
                  type="button"
                  onClick={() => setIsLeftPanelCollapsed(!isLeftPanelCollapsed)}
                  className="absolute left-0 top-1/2 -translate-y-1/2 z-20 w-5 h-12 bg-white dark:bg-zinc-800 border-y border-r border-slate-200 dark:border-zinc-700 rounded-r-full shadow-md flex items-center justify-center text-slate-500 hover:text-[#00BDFF] dark:hover:text-[#00BDFF] transition-all cursor-pointer"
                  title={isLeftPanelCollapsed ? 'Buka Senarai Perbualan' : 'Tutup Senarai Perbualan'}
                  aria-label="Toggle Contacts List"
                >
                  {isLeftPanelCollapsed ? (
                    <ChevronRight className="w-3.5 h-3.5" />
                  ) : (
                    <ChevronLeft className="w-3.5 h-3.5" />
                  )}
                </button>

                {selectedChat ? (
                  <div className="flex-1 flex flex-col h-full overflow-hidden">
                    {/* Active Chat Top Bar */}
                    <div className="p-3 px-5 bg-white dark:bg-zinc-900 border-b border-slate-200/80 dark:border-zinc-800 flex items-center justify-between shrink-0 shadow-2xs">
                      <div className="flex items-center space-x-3">
                        <div className={`w-9 h-9 rounded-full text-white font-bold text-xs flex items-center justify-center shadow-xs ${
                          privateChatIds[selectedChat.id] ? 'bg-slate-600' : 'bg-[#00BDFF]'
                        }`}>
                          {selectedChat.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-xs font-bold text-slate-900 dark:text-zinc-100">
                              {selectedChat.name}
                            </h3>
                            {privateChatIds[selectedChat.id] ? (
                              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 border border-slate-200 dark:border-zinc-700 flex items-center gap-1">
                                🔒 Perbualan Peribadi
                              </span>
                            ) : pausedChatIds[selectedChat.id] ? (
                              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1">
                                <PauseCircle className="w-3 h-3" />
                                Bot Dijeda (Staf)
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
                          className={`px-3.5 py-1.5 rounded-full border text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                            privateChatIds[selectedChat.id]
                              ? 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-zinc-800 dark:text-zinc-200'
                              : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200/80 dark:bg-zinc-800 dark:text-zinc-300'
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
                            className="px-3.5 py-1.5 rounded-full bg-slate-50 hover:bg-slate-100 dark:bg-zinc-800 dark:hover:bg-zinc-700 border border-slate-200/80 dark:border-zinc-700 text-slate-700 dark:text-zinc-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                          >
                            {pausedChatIds[selectedChat.id] ? (
                              <>
                                <PlayCircle className="w-3.5 h-3.5 text-emerald-600" />
                                <span>Aktifkan Bot</span>
                              </>
                            ) : (
                              <>
                                <PauseCircle className="w-3.5 h-3.5 text-amber-600" />
                                <span>Jeda Bot</span>
                              </>
                            )}
                          </button>
                        )}

                        <a
                          href={`https://wa.me/${selectedChat.phone}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3.5 py-1.5 rounded-full bg-slate-50 hover:bg-slate-100 dark:bg-zinc-800 dark:hover:bg-zinc-700 border border-slate-200/80 dark:border-zinc-700 text-slate-700 dark:text-zinc-200 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>WhatsApp Web</span>
                        </a>
                      </div>
                    </div>

                    {privateChatIds[selectedChat.id] && (
                      <div className="mx-4 mt-3 p-2.5 rounded-2xl bg-amber-50/90 border border-amber-200/80 text-[11.5px] text-amber-800 flex items-center gap-2 shrink-0">
                        <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0" />
                        <span>
                          <strong>Perbualan Peribadi:</strong> Bot AI dinyahaktifkan secara mutlak untuk nombor ini bagi menjaga privasi anda.
                        </span>
                      </div>
                    )}

                    {/* Messages Body */}
                    <div className="flex-1 overflow-y-auto p-4 sm:p-6 sparkle-scroll">
                      <div className="max-w-3xl mx-auto w-full space-y-3.5">
                        {loadingMessages ? (
                          <div className="py-16 text-center text-xs text-slate-400 flex flex-col items-center justify-center gap-2">
                            <RefreshCw className="w-5 h-5 animate-spin text-[#00BDFF]" />
                            <span>Memuatkan mesej perbualan...</span>
                          </div>
                        ) : messages.length === 0 ? (
                          <div className="py-16 text-center text-xs text-slate-400 bg-white/80 dark:bg-zinc-900/80 rounded-2xl border border-dashed border-slate-300 dark:border-zinc-800">
                            Tiada rekod mesej lagi dalam sesi ini.
                          </div>
                        ) : (
                          messages.map((msg) => {
                            const vcard = parseVCard(msg.body);
                            const isMedia = !vcard && isMediaFilename(msg.body);

                            return (
                              <div
                                key={msg.id}
                                className={`flex ${msg.fromMe ? 'justify-end' : 'justify-start'}`}
                              >
                                <div
                                  className={`max-w-[85%] sm:max-w-[75%] lg:max-w-[68%] rounded-2xl px-4 py-2.5 text-[12.5px] shadow-xs space-y-1.5 transition-all select-text ${
                                    msg.fromMe
                                      ? 'bg-[#D9FDD3] dark:bg-[#005C4B] text-[#111B21] dark:text-[#E9EDEF] border border-[#C2EBBB] dark:border-[#005C4B] rounded-tr-xs'
                                      : 'bg-white dark:bg-zinc-900 text-[#111B21] dark:text-[#E9EDEF] border border-slate-200/90 dark:border-zinc-800 rounded-tl-xs'
                                  }`}
                                >
                                  {vcard ? (
                                    <div className={`p-2.5 rounded-xl border space-y-2 ${
                                      msg.fromMe 
                                        ? 'bg-emerald-100/60 border-emerald-300/60 text-[#111B21]' 
                                        : 'bg-slate-50 dark:bg-zinc-800 border-slate-200 dark:border-zinc-700 text-slate-800 dark:text-zinc-100'
                                    }`}>
                                      <div className="flex items-center gap-2.5">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                                          msg.fromMe ? 'bg-emerald-600 text-white' : 'bg-[#00BDFF]/10 text-[#00BDFF]'
                                        }`}>
                                          <User className="w-4 h-4" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                          <p className="font-bold text-xs truncate">{vcard.name}</p>
                                          <p className={`text-[10px] font-mono truncate ${msg.fromMe ? 'text-emerald-800' : 'text-slate-500'}`}>
                                            {vcard.phone ? `+${vcard.phone}` : 'Kad Kenalan'}
                                          </p>
                                        </div>
                                      </div>
                                      {vcard.phone && (
                                        <a
                                          href={`https://wa.me/${vcard.phone}`}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className={`inline-flex items-center justify-center gap-1.5 w-full py-1.5 rounded-full font-semibold text-[11px] transition-colors ${
                                            msg.fromMe 
                                              ? 'bg-emerald-700 text-white hover:bg-emerald-800' 
                                              : 'bg-[#00BDFF] text-white hover:bg-sky-600'
                                          }`}
                                        >
                                          <Phone className="w-3 h-3" />
                                          <span>Mesej Nombor Ini</span>
                                        </a>
                                      )}
                                    </div>
                                  ) : isMedia ? (
                                    <div className={`p-2.5 rounded-xl border flex items-center gap-2.5 ${
                                      msg.fromMe
                                        ? 'bg-emerald-100/50 border-emerald-300/50 text-[#111B21]'
                                        : 'bg-slate-50 dark:bg-zinc-800 border-slate-200 dark:border-zinc-700 text-slate-800 dark:text-zinc-100'
                                    }`}>
                                      <div className="w-9 h-9 rounded-lg bg-[#00BDFF]/10 text-[#00BDFF] flex items-center justify-center shrink-0">
                                        {msg.body.match(/\.(png|jpe?g|webp|gif)$/i) ? (
                                          <ImageIcon className="w-4 h-4" />
                                        ) : (
                                          <FileText className="w-4 h-4" />
                                        )}
                                      </div>
                                      <div className="min-w-0 flex-1">
                                        <p className="font-bold text-xs truncate">{msg.body}</p>
                                        <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                                          Lampiran Fail / Gambar
                                        </span>
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="leading-relaxed whitespace-pre-wrap break-words">
                                      {formatWhatsAppText(msg.body)}
                                    </div>
                                  )}

                                  <div className={`flex items-center justify-end gap-1 text-[10px] font-mono ${
                                    msg.fromMe ? 'text-[#54656f] dark:text-[#8696a0]' : 'text-slate-400'
                                  }`}>
                                    <span>
                                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                    {msg.fromMe && <CheckCheck className="w-3.5 h-3.5 text-[#53bdeb]" />}
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
                    <div className="px-4 py-2 bg-white/95 dark:bg-zinc-900/95 border-t border-slate-200/70 dark:border-zinc-800 overflow-x-auto flex items-center gap-2 scrollbar-none shrink-0">
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
                            className="px-3 py-1 rounded-full bg-slate-50 hover:bg-sky-50 hover:text-[#00BDFF] hover:border-sky-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 border border-slate-200/70 dark:border-zinc-700 text-[11px] text-slate-600 dark:text-zinc-300 truncate max-w-xs shrink-0 transition-colors cursor-pointer"
                          >
                            {tmpl}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Reply Form */}
                    <div className="p-3 bg-white dark:bg-zinc-900 border-t border-slate-200/80 dark:border-zinc-800 shrink-0">
                      <form onSubmit={handleSendReply} className="max-w-3xl mx-auto w-full flex items-center gap-2">
                        <input
                          type="text"
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          placeholder="Tulis mesej balasan (staf mengambil alih perbualan)..."
                          className="flex-1 px-4 py-2 rounded-full bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-xs text-slate-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#00BDFF]/40"
                        />
                        <button
                          type="submit"
                          disabled={sendingReply || !replyText.trim()}
                          className="px-5 py-2 rounded-full bg-[#00BDFF] hover:bg-sky-500 active:scale-95 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-all cursor-pointer disabled:opacity-50"
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
            </div>
          )
        )}

        {/* TAB 2: SUPPORT TICKETS (ID TIKET) */}
        {activeTab === 'tickets' && (
          <div className="flex-1 overflow-y-auto p-6 space-y-4 sparkle-scroll">
            <div className="flex items-center justify-between max-w-4xl mx-auto pb-2">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-zinc-100">Senarai Tiket Tindakan Lanjutan</h3>
                <p className="text-xs text-slate-500">Isu khas atau tempahan korporat yang dijana AI untuk perhatian staf kilang.</p>
              </div>
              <span className="text-xs font-semibold px-3 py-1 rounded-full bg-sky-50 dark:bg-sky-950/50 text-[#00BDFF] border border-sky-200/60 dark:border-sky-900">
                {tickets.length} Tiket Didaftarkan
              </span>
            </div>

            <div className="max-w-4xl mx-auto space-y-3">
              {tickets.length === 0 ? (
                <div className="p-12 text-center text-xs text-slate-400 bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200/80 dark:border-zinc-800">
                  Tiada tiket sokongan terbuka pada masa ini.
                </div>
              ) : (
                tickets.map((t) => (
                  <div key={t.id} className="p-4 bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200/80 dark:border-zinc-800 shadow-2xs space-y-2.5">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="font-mono font-bold text-xs px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-800 dark:text-zinc-200 border border-slate-200 dark:border-zinc-700">
                          {t.ticketNumber}
                        </span>
                        <span className="text-xs font-bold text-slate-900 dark:text-zinc-100">
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

                    <p className="text-xs text-slate-600 dark:text-zinc-300 leading-relaxed bg-slate-50 dark:bg-zinc-800/60 p-3 rounded-xl border border-slate-200/60 dark:border-zinc-700/60">
                      {formatWhatsAppText(t.summary)}
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

        {/* TAB 3: DEVICE & QR SCANNER */}
        {activeTab === 'device' && (
          <div className="flex-1 overflow-y-auto p-6 space-y-6 sparkle-scroll">
            {isConnected ? (
              <div className="max-w-2xl mx-auto space-y-5">
                <div className="p-5 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800 flex items-center justify-between shadow-xs">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-md shadow-emerald-500/20">
                      <Smartphone className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-zinc-100">
                        {statusData.me?.pushName || 'SFV Apparel Official'}
                      </h3>
                      <p className="text-xs text-slate-600 dark:text-zinc-400 font-mono mt-0.5">
                        +{statusData.me?.id?.split('@')[0] || companySettings?.whatsapp_number || ''}
                      </p>
                      <p className="text-[11px] text-emerald-700 dark:text-emerald-400 mt-1 flex items-center gap-1 font-semibold">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Akaun WhatsApp aktif dan bersambung secara 2-way sync</span>
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-zinc-800">
                  <span className="text-xs text-slate-500">
                    Hostinger VPS Engine (IP: 187.127.223.53)
                  </span>

                  <button
                    type="button"
                    onClick={handleLogout}
                    disabled={actionLoading}
                    className="px-4 py-2 rounded-full bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200 text-xs font-semibold flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Putuskan Sambungan</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="max-w-2xl mx-auto flex flex-col sm:flex-row items-center gap-6 p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 shadow-xs">
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
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-zinc-100">
                    Langkah Menyambungkan WhatsApp:
                  </h3>
                  <div className="space-y-2.5 text-xs text-slate-600 dark:text-zinc-300">
                    <div className="flex items-start gap-2">
                      <span className="w-5 h-5 rounded-full bg-slate-200 dark:bg-zinc-700 text-slate-800 dark:text-zinc-200 font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">1</span>
                      <span>Buka aplikasi <strong>WhatsApp</strong> di telefon bimbit anda.</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="w-5 h-5 rounded-full bg-slate-200 dark:bg-zinc-700 text-slate-800 dark:text-zinc-200 font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">2</span>
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
                      className="px-4 py-2 rounded-full bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer shadow-xs disabled:opacity-50"
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

        {/* TAB 4: AUTOMATION TRIGGERS */}
        {activeTab === 'automation' && (
          <div className="flex-1 overflow-y-auto p-6 space-y-4 sparkle-scroll">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 max-w-4xl mx-auto text-xs">
              <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 shadow-2xs space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 dark:text-zinc-100">1. Notifikasi Pesanan Baharu</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">Aktif</span>
                </div>
                <p className="text-slate-500 leading-relaxed">
                  Menghantar ringkasan tempahan jersi & pautan invois ke WhatsApp pelanggan secara automatik.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 shadow-2xs space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 dark:text-zinc-100">2. Amaran Tempahan Kilang</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">Aktif</span>
                </div>
                <p className="text-slate-500 leading-relaxed">
                  Menghantar butiran saiz & kuantiti terus ke WhatsApp admin kilang.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 shadow-2xs space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 dark:text-zinc-100">3. Status Siap Cetak</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">Aktif</span>
                </div>
                <p className="text-slate-500 leading-relaxed">
                  WhatsApp dihantar kepada pelanggan apabila jersi/baju mereka telah siap dicetak.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 shadow-2xs space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 dark:text-zinc-100">4. Nombor Tracking Pos</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">Aktif</span>
                </div>
                <p className="text-slate-500 leading-relaxed">
                  Menghantar nombor tracking pos laju automatik kepada pelanggan sebaik sahaja bungkusan dipos.
                </p>
              </div>
            </div>

            {/* n8n Engine Link Card */}
            <div className="max-w-4xl mx-auto p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 flex items-center justify-between shadow-2xs">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-full bg-sky-50 dark:bg-sky-950 text-[#00BDFF] border border-sky-100 dark:border-sky-900 flex items-center justify-center shrink-0">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-zinc-100">
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
                className="px-4 py-1.5 rounded-full bg-slate-50 hover:bg-slate-100 dark:bg-zinc-800 dark:hover:bg-zinc-700 border border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-200 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs"
              >
                <span>Editor n8n</span>
                <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
              </a>
            </div>
          </div>
        )}

        {/* TAB 5: TEST SENDER */}
        {activeTab === 'tester' && (
          <div className="flex-1 overflow-y-auto p-6 sparkle-scroll">
            <div className="max-w-md mx-auto p-5 bg-white dark:bg-zinc-900 rounded-3xl border border-slate-200/80 dark:border-zinc-800 shadow-xs space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-zinc-100">
                Uji Penghantaran Mesej
              </h3>

              <form onSubmit={handleSendTest} className="space-y-3.5">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">Nombor Telefon Penerima</label>
                  <input
                    type="text"
                    required
                    value={testPhone}
                    onChange={(e) => setTestPhone(e.target.value)}
                    placeholder="Contoh: 60148599138"
                    className="w-full px-4 py-2 rounded-full bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-xs text-slate-900 dark:text-zinc-100 font-mono focus:outline-none focus:ring-2 focus:ring-[#00BDFF]/40"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">Kandungan Mesej</label>
                  <textarea
                    rows={3}
                    required
                    value={testMessage}
                    onChange={(e) => setTestMessage(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-xs text-slate-900 dark:text-zinc-100 resize-none focus:outline-none focus:ring-2 focus:ring-[#00BDFF]/40"
                  />
                </div>

                {sendResult && (
                  <div className={`p-3 rounded-2xl text-xs flex items-start gap-2 ${
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
                  className="w-full py-2.5 rounded-full bg-[#00BDFF] hover:bg-sky-500 active:scale-95 text-white font-bold text-xs shadow-xs transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
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
  );
}

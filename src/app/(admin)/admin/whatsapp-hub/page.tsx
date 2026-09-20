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
  Check,
  CheckCheck,
  Clock,
  Sparkles,
  ExternalLink,
  Phone,
  User
} from 'lucide-react';
import { FaWhatsapp } from 'react-icons/fa6';
import { WahaChatSummary, WahaChatMessage } from '@/lib/whatsapp/waha-client';

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
  'Hai! Terima kasih kerana menghubungi SFV Apparel. Ada apa yang boleh kami bantu?',
  'Pesanan jersi anda telah diterima dan sedang diproses di bahagian rekaan & cetakan.',
  'Tempahan anda telah siap sepenuhnya! Kami akan menghantar nombor penjejakan pos sebentar lagi.',
  'Deposit tempahan telah disahkan. Kami akan memulakan proses pembuatan hari ini.',
];

export default function WhatsAppHubPage() {
  const [activeTab, setActiveTab] = useState<'inbox' | 'device' | 'automation'>('inbox');
  const [statusData, setStatusData] = useState<WahaStatusData>({ name: 'default', status: 'UNKNOWN' });
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Omnichannel Chat State
  const [chats, setChats] = useState<WahaChatSummary[]>([]);
  const [selectedChat, setSelectedChat] = useState<WahaChatSummary | null>(null);
  const [messages, setMessages] = useState<WahaChatMessage[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [replyText, setReplyText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Test Message State
  const [testPhone, setTestPhone] = useState('60148599138');
  const [testMessage, setTestMessage] = useState('Hai! Ini adalah ujian integrasi automasi WhatsApp SFV Apparel.');
  const [sendResult, setSendResult] = useState<{ success: boolean; message: string } | null>(null);
  const [sending, setSending] = useState(false);

  // Fetch status and QR
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

  // Fetch chats list
  const fetchChats = useCallback(async () => {
    if (statusData.status !== 'WORKING') return;
    try {
      const res = await fetch('/api/whatsapp/chats', { cache: 'no-store' });
      const data = await res.json();
      if (data.connected && Array.isArray(data.chats)) {
        setChats(data.chats);
        // Auto select first chat if none selected
        if (!selectedChat && data.chats.length > 0) {
          setSelectedChat(data.chats[0]);
        }
      }
    } catch {}
  }, [statusData.status, selectedChat]);

  // Fetch messages for selected chat
  const fetchMessages = useCallback(async (chatId: string) => {
    setLoadingMessages(true);
    try {
      const res = await fetch(`/api/whatsapp/messages?chatId=${encodeURIComponent(chatId)}`, { cache: 'no-store' });
      const data = await res.json();
      if (Array.isArray(data.messages)) {
        setMessages(data.messages);
      }
    } catch {
      setMessages([]);
    } finally {
      setLoadingMessages(false);
    }
  }, []);

  // Polling for live status & live chats
  useEffect(() => {
    fetchStatus();
    const interval = setInterval(() => {
      fetchStatus();
    }, 5000);
    return () => clearInterval(interval);
  }, [fetchStatus]);

  // Load chats when connected
  useEffect(() => {
    if (statusData.status === 'WORKING') {
      fetchChats();
      const chatInterval = setInterval(() => {
        fetchChats();
      }, 7000);
      return () => clearInterval(chatInterval);
    }
  }, [statusData.status, fetchChats]);

  // Load messages when selected chat changes
  useEffect(() => {
    if (selectedChat) {
      fetchMessages(selectedChat.id);
      const msgInterval = setInterval(() => {
        fetchMessages(selectedChat.id);
      }, 5000);
      return () => clearInterval(msgInterval);
    }
  }, [selectedChat, fetchMessages]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Send Reply in Omnichannel Chat
  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedChat || !replyText.trim() || sendingReply) return;
    setSendingReply(true);

    const messageText = replyText.trim();
    // Optimistic message append
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
      setChats([]);
      setSelectedChat(null);
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
  const filteredChats = chats.filter((c) => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    c.phone.includes(searchQuery)
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 font-sans">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center shadow-xs">
              <FaWhatsapp className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                  Pusat Automasi & Omnichannel WhatsApp
                </h1>
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                  Multi-Device Sync
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Balas mesej pelanggan secara serentak dari web & HP, serta automasikan notifikasi pesanan kilang.
              </p>
            </div>
          </div>
        </div>

        {/* Action Bar */}
        <div className="flex items-center gap-2">
          {/* Status Indicator Pill */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
            <Radio className={`w-3.5 h-3.5 ${isConnected ? 'text-emerald-500 animate-pulse' : 'text-amber-500'}`} />
            <span className="font-semibold text-slate-700">
              {loading ? 'Menyemak...' : isConnected ? 'WhatsApp Aktif' : 'Perlu Disambung'}
            </span>
          </div>

          <button
            type="button"
            onClick={() => fetchStatus(true)}
            disabled={refreshing || loading}
            className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold flex items-center gap-1.5 shadow-2xs active:scale-95 transition-all cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-[#00BDFF]' : ''}`} />
            <span>{refreshing ? '...' : 'Segar Semula'}</span>
          </button>
        </div>
      </div>

      {/* Main Tab Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('inbox')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'inbox'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>💬 Omnichannel Live Inbox</span>
          {chats.length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-[#00BDFF] text-white text-[10px]">
              {chats.length}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('device')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'device'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Smartphone className="w-4 h-4" />
          <span>📱 Peranti & Sambungan QR</span>
          {isConnected && (
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('automation')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'automation'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Bell className="w-4 h-4" />
          <span>⚡ Automasi Notifikasi Pesanan</span>
        </button>
      </div>

      {/* TAB 1: OMNICHANNEL LIVE INBOX */}
      {activeTab === 'inbox' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden h-[750px] flex flex-col">
          {!isConnected ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-amber-50 text-amber-500 border border-amber-200 flex items-center justify-center">
                <Smartphone className="w-8 h-8" />
              </div>
              <div className="max-w-md space-y-1">
                <h3 className="text-base font-bold text-slate-900">
                  WhatsApp Belum Disambungkan
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Sila imbas kod QR di tab <strong>&ldquo;Peranti & Sambungan QR&rdquo;</strong> terlebih dahulu untuk melihat perbualan dan membalas chat pelanggan secara langsung.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('device')}
                className="px-4 py-2.5 rounded-xl bg-[#00BDFF] hover:bg-sky-500 text-white text-xs font-bold shadow-md shadow-sky-400/20 active:scale-95 transition-all cursor-pointer flex items-center gap-2"
              >
                <span>Pergi ke Tab Imbas QR</span>
                <Smartphone className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex-1 flex overflow-hidden">
              {/* Left Column: Contact & Chat List */}
              <div className="w-80 sm:w-96 border-r border-slate-200 flex flex-col shrink-0 bg-slate-50/50">
                {/* Search Bar */}
                <div className="p-3 border-b border-slate-200 bg-white">
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Cari pelanggan / nombor..."
                      className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-slate-100 border-none text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#00BDFF]/30 placeholder:text-slate-400"
                    />
                  </div>
                </div>

                {/* Chat Contacts List */}
                <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
                  {filteredChats.length === 0 ? (
                    <div className="p-8 text-center space-y-2">
                      <MessageSquare className="w-6 h-6 text-slate-300 mx-auto" />
                      <p className="text-xs text-slate-400 font-medium">
                        Tiada perbualan aktif ditemui.
                      </p>
                    </div>
                  ) : (
                    filteredChats.map((chat) => {
                      const isSelected = selectedChat?.id === chat.id;
                      return (
                        <div
                          key={chat.id}
                          onClick={() => setSelectedChat(chat)}
                          className={`p-3.5 flex items-start gap-3 cursor-pointer transition-colors ${
                            isSelected 
                              ? 'bg-sky-50/80 border-l-4 border-[#00BDFF]' 
                              : 'hover:bg-slate-100/80 bg-white'
                          }`}
                        >
                          {/* Avatar Monogram */}
                          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-slate-700 to-slate-900 text-white font-bold text-sm flex items-center justify-center shrink-0 shadow-2xs">
                            {chat.name.charAt(0).toUpperCase()}
                          </div>

                          {/* Contact Info & Last Message */}
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

                            <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                              +{chat.phone}
                            </p>

                            {chat.lastMessage && (
                              <p className="text-[11px] text-slate-500 truncate mt-1">
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

              {/* Right Column: Active Chat Thread & Reply Input */}
              {selectedChat ? (
                <div className="flex-1 flex flex-col bg-[#EFEAE2]/30 dark:bg-zinc-900/40">
                  {/* Chat Header */}
                  <div className="p-3.5 px-5 bg-white border-b border-slate-200 flex items-center justify-between shrink-0 shadow-2xs">
                    <div className="flex items-center space-x-3">
                      <div className="w-9 h-9 rounded-xl bg-slate-900 text-white font-bold text-xs flex items-center justify-center">
                        {selectedChat.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="text-xs font-bold text-slate-900">
                          {selectedChat.name}
                        </h3>
                        <p className="text-[11px] text-slate-500 font-mono">
                          +{selectedChat.phone}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <a
                        href={`https://wa.me/${selectedChat.phone}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Buka di WA Web</span>
                      </a>
                    </div>
                  </div>

                  {/* Messages Scroll Area */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {loadingMessages ? (
                      <div className="py-12 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                        <RefreshCw className="w-4 h-4 animate-spin text-[#00BDFF]" />
                        <span>Memuatkan rekod perbualan...</span>
                      </div>
                    ) : messages.length === 0 ? (
                      <div className="py-12 text-center text-xs text-slate-400">
                        Tiada mesej teks untuk dipaparkan.
                      </div>
                    ) : (
                      messages.map((msg) => (
                        <div
                          key={msg.id}
                          className={`flex ${msg.fromMe ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-md rounded-2xl px-4 py-2.5 text-xs shadow-xs space-y-1 ${
                              msg.fromMe
                                ? 'bg-[#00BDFF] text-white rounded-tr-xs'
                                : 'bg-white text-slate-900 border border-slate-200/80 rounded-tl-xs'
                            }`}
                          >
                            <p className="leading-relaxed whitespace-pre-wrap">{msg.body}</p>
                            <div className={`flex items-center justify-end gap-1 text-[9.5px] ${
                              msg.fromMe ? 'text-sky-100' : 'text-slate-400'
                            }`}>
                              <span>
                                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                              {msg.fromMe && (
                                <CheckCheck className="w-3 h-3" />
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Quick Templates Shelf */}
                  <div className="px-4 py-2 bg-white/80 border-t border-slate-200/80 overflow-x-auto flex items-center gap-2 scrollbar-none">
                    <span className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider shrink-0 flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-[#00BDFF]" />
                      Templat Pantas:
                    </span>
                    {QUICK_TEMPLATES.map((tmpl, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setReplyText(tmpl)}
                        className="px-2.5 py-1 rounded-full bg-slate-100 hover:bg-sky-50 hover:text-[#00BDFF] hover:border-sky-200 border border-slate-200/60 text-[11px] text-slate-600 truncate max-w-xs shrink-0 transition-colors cursor-pointer"
                      >
                        {tmpl}
                      </button>
                    ))}
                  </div>

                  {/* Reply Input Bar */}
                  <form onSubmit={handleSendReply} className="p-3 bg-white border-t border-slate-200 flex items-center gap-2">
                    <input
                      type="text"
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder="Taip mesej balasan terus ke WhatsApp pelanggan..."
                      className="flex-1 px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#00BDFF]/30 focus:border-[#00BDFF] transition-all"
                    />
                    <button
                      type="submit"
                      disabled={sendingReply || !replyText.trim()}
                      className="px-4 py-2.5 rounded-xl bg-[#00BDFF] hover:bg-sky-500 active:scale-95 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-sky-400/20 transition-all cursor-pointer disabled:opacity-50"
                    >
                      <Send className={`w-3.5 h-3.5 ${sendingReply ? 'animate-spin' : ''}`} />
                      <span>Hantar</span>
                    </button>
                  </form>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400 space-y-2">
                  <MessageSquare className="w-8 h-8 text-slate-300" />
                  <p className="text-xs">Pilih salah satu perbualan di sebelah kiri untuk membaca dan membalas mesej.</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: DEVICE & QR SCANNER */}
      {activeTab === 'device' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h2 className="text-sm font-bold text-slate-900">
                Pengurusan Peranti WhatsApp
              </h2>
              {isConnected ? (
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

            {isConnected ? (
              <div className="space-y-5">
                <div className="p-5 rounded-2xl bg-emerald-50/60 border border-emerald-100 flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-14 h-14 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-md shadow-emerald-500/20">
                      <Smartphone className="w-7 h-7" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">
                        {statusData.me?.pushName || 'SFV Apparel Official'}
                      </h3>
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
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>Hostinger VPS Engine (IP: 187.127.223.53)</span>
                  </div>

                  <button
                    type="button"
                    onClick={handleLogout}
                    disabled={actionLoading}
                    className="px-4 py-2 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200 text-xs font-semibold flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Putuskan Sambungan Akaun</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row items-center gap-6 p-6 rounded-2xl bg-slate-50 border border-slate-200/80">
                <div className="w-56 h-56 bg-white rounded-2xl p-2.5 shadow-md border border-slate-200/80 flex items-center justify-center shrink-0">
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
                      <span>Tekan <strong>Tetapan (Settings)</strong> ➔ <strong>Perangkat Tertaut (Linked Devices)</strong>.</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="w-5 h-5 rounded-full bg-[#00BDFF] text-white font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">3</span>
                      <span>Tekan <strong>Tautkan Perangkat</strong> dan halakan kamera ke kod QR di sebelah.</span>
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={handleRestartSession}
                      disabled={actionLoading}
                      className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer shadow-xs disabled:opacity-50"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${actionLoading ? 'animate-spin' : ''}`} />
                      <span>Jana Semula Kod QR</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="lg:col-span-4 space-y-4">
            <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                Informasi Multi-Device
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Akaun WhatsApp ini berfungsi serentak di telefon bimbit anda dan di web SFV Apparel. Anda boleh membalas mesej dari mana-mana peranti tanpa sebarang gangguan.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: AUTOMATION & TESTER */}
      {activeTab === 'automation' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <Bell className="w-4 h-4 text-[#00BDFF]" />
              <span>Notifikasi Automatik Yang Dikonfigurasi</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">1. Pesanan Baru</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">Aktif</span>
                </div>
                <p className="text-slate-500 leading-relaxed">
                  Menghantar ringkasan tempahan jersi/baju & invois ke WhatsApp pelanggan.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">2. Notifikasi Kilang</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">Aktif</span>
                </div>
                <p className="text-slate-500 leading-relaxed">
                  Menghantar amaran tempahan baru kepada admin kilang berserta saiz & kuantiti.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">3. Status Siap Cetak</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">Aktif</span>
                </div>
                <p className="text-slate-500 leading-relaxed">
                  Pelanggan menerima WhatsApp automatik apabila tempahan mereka telah siap dicetak.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">4. Tracking Pos Laju</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">Aktif</span>
                </div>
                <p className="text-slate-500 leading-relaxed">
                  Menghantar nombor tracking pos automatik ke WhatsApp pelanggan setelah dipos.
                </p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <Send className="w-4 h-4 text-slate-700" />
              <span>Uji Penghantaran Mesej WhatsApp</span>
            </h3>

            <form onSubmit={handleSendTest} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Nombor Penerima</label>
                <input
                  type="text"
                  required
                  value={testPhone}
                  onChange={(e) => setTestPhone(e.target.value)}
                  placeholder="Contoh: 60148599138"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Kandungan Mesej</label>
                <textarea
                  rows={3}
                  required
                  value={testMessage}
                  onChange={(e) => setTestMessage(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 resize-none"
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
                className="w-full py-2.5 rounded-xl bg-[#00BDFF] hover:bg-sky-500 text-white font-bold text-xs shadow-md shadow-sky-400/20 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
              >
                {sending ? 'Sedang Menghantar...' : 'Hantar Ujian WhatsApp'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

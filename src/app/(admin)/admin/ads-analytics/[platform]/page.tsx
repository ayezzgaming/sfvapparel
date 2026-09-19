'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  fetchLivePlatformCampaigns,
  toggleMetaLiveCampaignStatus,
  getSavedPlatformConnectionsDb,
  LiveCampaignData
} from '@/app/actions/adsPlatformActions';
import { AdPlatform, AdPlatformConnection } from '@/types/ads';
import { INITIAL_PLATFORMS } from '@/lib/ads/ad-templates';
import {
  FacebookLogo,
  InstagramLogo,
  GoogleAdsLogo,
  TikTokLogo,
  WhatsAppLogo,
  MetaLogo
} from '@/components/admin/ads/PlatformLogos';
import {
  ArrowLeft,
  RefreshCw,
  ExternalLink,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  Pause,
  Play,
  TrendingUp,
  DollarSign,
  Users,
  Eye,
  MousePointer,
  ChevronRight,
  Layers,
  Sparkles
} from 'lucide-react';

const DATE_PRESET_OPTIONS = [
  { id: 'today', label: 'Hari Ini' },
  { id: 'yesterday', label: 'Semalam' },
  { id: 'last_7d', label: '7 Hari Terakhir' },
  { id: 'last_30d', label: '30 Hari Terakhir' },
  { id: 'this_month', label: 'Bulan Ini' },
  { id: 'maximum', label: 'Sepanjang Masa' },
];

export default function PlatformAdsAnalyticsPage() {
  const params = useParams();
  const router = useRouter();
  const platformId = (params?.platform as AdPlatform) || 'facebook';

  const [platform, setPlatform] = useState<AdPlatformConnection>(
    INITIAL_PLATFORMS.find((p) => p.id === platformId) || INITIAL_PLATFORMS[0]
  );
  const [allPlatforms, setAllPlatforms] = useState<AdPlatformConnection[]>(INITIAL_PLATFORMS);
  const [selectedDatePreset, setSelectedDatePreset] = useState<string>('last_30d');
  const [liveCampaigns, setLiveCampaigns] = useState<LiveCampaignData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatusMsg, setSyncStatusMsg] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'paused'>('all');
  const [togglingCampaignId, setTogglingCampaignId] = useState<string | null>(null);

  // Totals from API
  const [totalSpent, setTotalSpent] = useState(0);
  const [totalLeads, setTotalLeads] = useState(0);
  const [totalClicks, setTotalClicks] = useState(0);
  const [totalLinkClicks, setTotalLinkClicks] = useState(0);
  const [totalImpressions, setTotalImpressions] = useState(0);
  const [totalReach, setTotalReach] = useState(0);
  const [costPerLead, setCostPerLead] = useState(0);
  const [primaryResultLabel, setPrimaryResultLabel] = useState('Hasil / Prospek');
  const [rawActionsSummary, setRawActionsSummary] = useState<{ type: string; value: number }[]>([]);

  // 1. Initial Load & Database Lookup
  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const dbRes = await getSavedPlatformConnectionsDb();
        if (dbRes.success && Array.isArray(dbRes.connections)) {
          setAllPlatforms(dbRes.connections);
          const found = dbRes.connections.find((p) => p.id === platformId);
          if (found) {
            setPlatform(found);
          }
        }
      } catch {
        // Ignore lookup error
      }
      await loadLiveMetrics('last_30d');
      setIsLoading(false);
    }
    loadData();
  }, [platformId]);

  // 2. Fetch Live Campaigns & Insights from Meta Graph API
  const loadLiveMetrics = async (preset: string = selectedDatePreset) => {
    setIsSyncing(true);
    setSyncStatusMsg(null);
    try {
      const storedToken = typeof window !== 'undefined' ? localStorage.getItem(`svf_platform_token_${platformId}`) || '' : '';
      const effectiveAccountId = platform.accountId || '';

      const res = await fetchLivePlatformCampaigns(
        platformId,
        effectiveAccountId,
        storedToken,
        preset
      );

      setIsSyncing(false);
      if (res.success) {
        setLiveCampaigns(res.campaigns);
        setTotalSpent(res.totalSpent);
        setTotalLeads(res.totalLeads);
        setTotalClicks(res.totalClicks);
        setTotalLinkClicks(res.totalLinkClicks);
        setTotalImpressions(res.totalImpressions);
        setTotalReach(res.totalReach);
        setCostPerLead(res.costPerLead);
        setPrimaryResultLabel(res.primaryResultLabel || 'Hasil');
        setRawActionsSummary(res.rawActionsSummary || []);
        setSyncStatusMsg(res.message);
      } else {
        setSyncStatusMsg(res.message);
      }
    } catch (err: unknown) {
      setIsSyncing(false);
      const msg = err instanceof Error ? err.message : 'Gagal berhubung ke API.';
      setSyncStatusMsg(`Ralat sambungan: ${msg}`);
    }
  };

  // 3. Handle Status Toggle
  const handleToggleStatus = async (campaignId: string, currentStatus: string) => {
    setTogglingCampaignId(campaignId);
    const newStatus = currentStatus === 'active' ? 'PAUSED' : 'ACTIVE';
    const storedToken = typeof window !== 'undefined' ? localStorage.getItem(`svf_platform_token_${platformId}`) || '' : '';
    const res = await toggleMetaLiveCampaignStatus(campaignId, newStatus, storedToken);
    setTogglingCampaignId(null);
    if (res.success) {
      setLiveCampaigns((prev) =>
        prev.map((c) =>
          c.id === campaignId
            ? { ...c, status: newStatus.toLowerCase() as 'active' | 'paused' }
            : c
        )
      );
    }
  };

  // 4. Filter Campaigns
  const filteredCampaigns = useMemo(() => {
    return liveCampaigns.filter((c) => {
      const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) || c.id.includes(searchQuery);
      const matchesStatus =
        statusFilter === 'all'
          ? true
          : statusFilter === 'active'
          ? c.status === 'active'
          : c.status === 'paused';
      return matchesSearch && matchesStatus;
    });
  }, [liveCampaigns, searchQuery, statusFilter]);

  const renderPlatformIcon = (id: AdPlatform) => {
    switch (id) {
      case 'facebook':
        return <FacebookLogo className="w-6 h-6" />;
      case 'instagram':
        return <InstagramLogo className="w-6 h-6" />;
      case 'google':
        return <GoogleAdsLogo className="w-6 h-6" />;
      case 'tiktok':
        return <TikTokLogo className="w-6 h-6" />;
      case 'whatsapp':
        return <WhatsAppLogo className="w-6 h-6" />;
      default:
        return <MetaLogo className="w-6 h-6" />;
    }
  };

  const getAdsManagerUrl = () => {
    const rawAct = (platform.accountId || '').replace(/^act_/i, '');
    return `https://business.facebook.com/adsmanager/manage/campaigns?act=${rawAct}`;
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-16 font-sans antialiased select-none">
      {/* ================= HEADER & BREADCRUMB ================= */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div className="space-y-1.5">
          <div className="flex items-center space-x-2 text-xs text-slate-400">
            <Link href="/admin/ads-generator" className="hover:text-slate-700 transition-colors flex items-center gap-1">
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Gerbang Pemasaran</span>
            </Link>
            <span>/</span>
            <span className="text-slate-700 font-medium capitalize">{platform.name}</span>
          </div>

          <div className="flex items-center space-x-3">
            <div className="w-11 h-11 rounded-2xl bg-white border border-slate-100 shadow-xs flex items-center justify-center p-2.5">
              {renderPlatformIcon(platform.id)}
            </div>
            <div>
              <div className="flex items-center space-x-2.5">
                <h1 className="text-xl font-semibold text-slate-900 tracking-tight">
                  {platform.accountName || platform.name}
                </h1>
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-100/60">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Meta API Disahkan
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                ID Akaun: {platform.accountId || 'Tersambung'} • {platform.currency || 'MYR'}
              </p>
            </div>
          </div>
        </div>

        {/* Right Header Actions */}
        <div className="flex items-center space-x-2.5">
          <button
            type="button"
            onClick={() => loadLiveMetrics(selectedDatePreset)}
            disabled={isSyncing}
            className="px-4 py-2 rounded-full text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 transition-all flex items-center space-x-2 disabled:opacity-50 cursor-pointer shadow-2xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-blue-600' : 'text-slate-500'}`} />
            <span>{isSyncing ? 'Menyegerak API...' : 'Segerak Data Terkini'}</span>
          </button>

          <a
            href={getAdsManagerUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 rounded-full text-xs font-medium text-white bg-slate-900 hover:bg-black transition-all flex items-center space-x-1.5 shadow-xs"
          >
            <span>Buka Ads Manager</span>
            <ExternalLink className="w-3.5 h-3.5 text-slate-300" />
          </a>
        </div>
      </div>

      {/* ================= DATE FILTER PILLS BAR ================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/80 p-2 rounded-2xl border border-slate-200/60">
        <div className="flex items-center space-x-1 overflow-x-auto p-1">
          {DATE_PRESET_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => {
                setSelectedDatePreset(opt.id);
                loadLiveMetrics(opt.id);
              }}
              disabled={isSyncing}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${
                selectedDatePreset === opt.id
                  ? 'bg-white text-slate-900 shadow-xs font-semibold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <div className="text-[11px] text-slate-400 font-mono pr-2 text-right">
          {liveCampaigns.length} Kempen Dikesan • Sumber: Meta Graph API v20.0
        </div>
      </div>

      {/* ================= EXECUTIVE SUMMARY KPI CARDS ================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Card 1: Jumlah Belanja */}
        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Jumlah Belanja</span>
            <DollarSign className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-semibold text-slate-900 font-mono tracking-tight pt-1">
            RM {totalSpent.toFixed(2)}
          </div>
          <p className="text-[11px] text-slate-400">
            Perbelanjaan sebenar dalam tempoh dipilih
          </p>
        </div>

        {/* Card 2: Hasil Utama (Link Clicks / Mesej) */}
        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">{primaryResultLabel}</span>
            <MousePointer className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-semibold text-emerald-600 font-mono tracking-tight pt-1">
            {totalLeads.toLocaleString()} {totalLeads > 0 ? (primaryResultLabel.toLowerCase().includes('klik') ? 'Klik' : 'Orang') : ''}
          </div>
          <p className="text-[11px] text-slate-400">
            Hasil penukaran rasmi Meta Ads Manager
          </p>
        </div>

        {/* Card 3: Kos Setiap Hasil (Cost Per Result) */}
        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Kos Purata / Hasil</span>
            <TrendingUp className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-semibold text-slate-900 font-mono tracking-tight pt-1">
            {totalLeads > 0 ? `RM ${costPerLead.toFixed(2)}` : 'Tiada Data'}
          </div>
          <p className="text-[11px] text-slate-400">
            {totalLeads > 0 ? `Purata kos setiap ${primaryResultLabel.toLowerCase()}` : 'Belum ada hasil dicatatkan'}
          </p>
        </div>

        {/* Card 4: Jangkauan & Paparan */}
        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Jangkauan &amp; Paparan</span>
            <Eye className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-2xl font-semibold text-slate-900 font-mono tracking-tight pt-1">
            {totalReach > 0 ? totalReach.toLocaleString() : totalImpressions.toLocaleString()}
          </div>
          <p className="text-[11px] text-slate-400">
            {totalReach > 0 ? `${totalReach.toLocaleString()} jangkauan • ${totalImpressions.toLocaleString()} paparan` : `${totalImpressions.toLocaleString()} paparan iklan`}
          </p>
        </div>
      </div>

      {/* ================= CAMPAIGN EXPLORER & MANAGEMENT TABLE ================= */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-xs overflow-hidden space-y-4 p-5 sm:p-6">
        {/* Table Controls */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center space-x-2">
            <div className="relative flex-1 sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari nama kempen atau ID..."
                className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-slate-400 transition-all font-sans"
              />
            </div>

            {/* Filter status tabs */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-xl text-xs font-medium">
              <button
                type="button"
                onClick={() => setStatusFilter('all')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  statusFilter === 'all' ? 'bg-white text-slate-900 shadow-2xs font-semibold' : 'text-slate-500'
                }`}
              >
                Semua ({liveCampaigns.length})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('active')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  statusFilter === 'active' ? 'bg-white text-emerald-700 shadow-2xs font-semibold' : 'text-slate-500'
                }`}
              >
                Aktif ({liveCampaigns.filter((c) => c.status === 'active').length})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('paused')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  statusFilter === 'paused' ? 'bg-white text-slate-700 shadow-2xs font-semibold' : 'text-slate-500'
                }`}
              >
                Dijeda ({liveCampaigns.filter((c) => c.status === 'paused').length})
              </button>
            </div>
          </div>

          <span className="text-xs text-slate-400 font-mono">
            Memaparkan {filteredCampaigns.length} daripada {liveCampaigns.length} kempen
          </span>
        </div>

        {/* Responsive Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 uppercase tracking-wider font-semibold text-[10px]">
                <th className="py-3 px-3">Nama Kempen</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3">Hasil (*Results*)</th>
                <th className="py-3 px-3 text-right">Kos / Hasil</th>
                <th className="py-3 px-3 text-right">Belanja</th>
                <th className="py-3 px-3">Bajet</th>
                <th className="py-3 px-3">Prestasi</th>
                <th className="py-3 px-3 text-center">Kawalan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100/80 font-sans">
              {filteredCampaigns.length > 0 ? (
                filteredCampaigns.map((c) => {
                  const cpr = c.leadsOrConversions > 0 ? c.spent / c.leadsOrConversions : 0;
                  return (
                    <tr key={c.id} className="hover:bg-slate-50/70 transition-colors group">
                      {/* Campaign Name */}
                      <td className="py-3.5 px-3">
                        <div className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
                          {c.name}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                          ID: {c.id}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-3">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${
                            c.status === 'active'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              c.status === 'active' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
                            }`}
                          />
                          {c.status === 'active' ? 'Aktif' : 'Dijeda'}
                        </span>
                      </td>

                      {/* Results */}
                      <td className="py-3.5 px-3">
                        {c.leadsOrConversions > 0 ? (
                          <div>
                            <span className="font-semibold text-emerald-600 font-mono text-xs">
                              {c.leadsOrConversions.toLocaleString()}
                            </span>
                            <span className="text-[10px] text-slate-400 block">
                              {c.resultLabel || 'Hasil'}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-300 font-mono">—</span>
                        )}
                      </td>

                      {/* Cost per Result */}
                      <td className="py-3.5 px-3 text-right font-mono">
                        {c.leadsOrConversions > 0 ? (
                          <span className="font-medium text-slate-800">
                            RM {cpr.toFixed(2)}
                          </span>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>

                      {/* Spend */}
                      <td className="py-3.5 px-3 text-right font-mono font-semibold text-slate-900">
                        RM {c.spent.toFixed(2)}
                      </td>

                      {/* Budget */}
                      <td className="py-3.5 px-3 text-slate-600">
                        {c.dailyBudget > 0 ? (
                          <span className="font-mono text-[11px] bg-slate-100 px-2 py-0.5 rounded text-slate-700">
                            RM {c.dailyBudget.toFixed(2)}/hari
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[11px]">
                            Using ad set budget
                          </span>
                        )}
                      </td>

                      {/* Impressions & Reach */}
                      <td className="py-3.5 px-3 text-[11px] text-slate-500 font-mono">
                        <div>{c.impressions.toLocaleString()} paparan</div>
                        {c.reach > 0 && (
                          <div className="text-[10px] text-slate-400">
                            {c.reach.toLocaleString()} jangkauan
                          </div>
                        )}
                      </td>

                      {/* Realtime API Controls */}
                      <td className="py-3.5 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(c.id, c.status)}
                          disabled={togglingCampaignId === c.id}
                          className={`px-3 py-1 rounded-full text-[10px] font-medium transition-all inline-flex items-center space-x-1 cursor-pointer ${
                            c.status === 'active'
                              ? 'bg-slate-100 text-slate-700 hover:bg-rose-50 hover:text-rose-700'
                              : 'bg-emerald-600 text-white hover:bg-emerald-700'
                          } disabled:opacity-40`}
                          title={c.status === 'active' ? 'Jeda kempen ini di Meta' : 'Aktifkan kempen ini di Meta'}
                        >
                          {togglingCampaignId === c.id ? (
                            <RefreshCw className="w-3 h-3 animate-spin" />
                          ) : c.status === 'active' ? (
                            <>
                              <Pause className="w-2.5 h-2.5" />
                              <span>Jeda</span>
                            </>
                          ) : (
                            <>
                              <Play className="w-2.5 h-2.5" />
                              <span>Aktifkan</span>
                            </>
                          )}
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="text-center py-10 text-slate-400">
                    <Layers className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-xs font-semibold text-slate-700">Tiada Kempen Dijumpai</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Tiada kempen sepadan dengan kriteria carian atau penapis status.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

'use client';

import React, { useState, useMemo, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { useAppStore } from '@/lib/store/app-store';
import { 
  calculateSublimationPrice, 
  calculateDtfPrice, 
  formatCurrency 
} from '@/lib/pricing-calculator';
import { SizingMatrix } from '@/types/database';
import SizeChartModal from '@/components/public/SizeChartModal';
import { 
  ChevronLeft, 
  Ruler, 
  Upload, 
  FileText, 
  CheckCircle2, 
  Trash2, 
  Send,
  Paperclip,
  Plus,
  X,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Info
} from 'lucide-react';
import { FaWhatsapp } from 'react-icons/fa6';
import { 
  buildWhatsAppInquiryUrl, 
  buildCustomOrderWhatsAppUrl 
} from '@/lib/whatsapp/dynamic-link';

const DEFAULT_STANDARD_SIZES = ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL'];

const POPULAR_EXTRA_SIZES = [
  '5XL', '6XL', '7XL', '8XL',
  'Kid 24', 'Kid 26', 'Kid 28', 'Kid 30', 'Kid 32',
  'Muslimah S', 'Muslimah M', 'Muslimah L', 'Muslimah XL', 'Muslimah 2XL',
  'Baby 1-2y', 'Baby 3-4y'
];

export default function CustomizePage() {
  const router = useRouter();
  const params = useParams();
  const designId = params.id as string;

  const { 
    designs, 
    fabrics, 
    cuts, 
    dtfDimensions, 
    tiers, 
    addOrder,
    companySettings
  } = useAppStore();

  const design = useMemo(() => {
    return designs.find((d) => d.id === designId) || designs[0];
  }, [designs, designId]);

  const [activeView, setActiveView] = useState<'front' | 'back'>('front');
  const [isSizeChartOpen, setIsSizeChartOpen] = useState(false);

  const isDtf = design?.print_type === 'dtf';
  const isBoth = design?.print_type === 'both';
  const [techniqueMode, setTechniqueMode] = useState<'sublimation' | 'dtf'>(
    isDtf ? 'dtf' : 'sublimation'
  );

  // Sublimasi: Fabrik & Potongan
  const [selectedFabricId, setSelectedFabricId] = useState<string>(
    fabrics[0]?.id || 'mat-1'
  );
  const [selectedCutId, setSelectedCutId] = useState<string>(
    cuts[0]?.id || 'cut-1'
  );

  // DTF: Dimensi & Pakej
  const [selectedDtfDimId, setSelectedDtfDimId] = useState<string>(
    dtfDimensions[1]?.id || 'dtf-2'
  );
  const [dtfOptionType, setDtfOptionType] = useState<'film_only' | 'with_garment'>('with_garment');

  // Dynamic Sizing Management
  const [activeSizeKeys, setActiveSizeKeys] = useState<string[]>(DEFAULT_STANDARD_SIZES);
  const [sizing, setSizing] = useState<SizingMatrix>({
    XS: 0,
    S: 2,
    M: 6,
    L: 8,
    XL: 4,
    '2XL': 0,
    '3XL': 0,
    '4XL': 0,
  });

  // Modal / Popover Tambah Saiz Kustom
  const [isAddSizeModalOpen, setIsAddSizeModalOpen] = useState(false);
  const [customSizeInput, setCustomSizeInput] = useState('');

  // Logo / Sponsor Files
  const logoInputRef = useRef<HTMLInputElement>(null);
  const [logoFileName, setLogoFileName] = useState<string>('');
  const [logoFilePreview, setLogoFilePreview] = useState<string | null>(null);

  // Senarai Nama & Nombor (Pilihan: Upload Fail ATAU Tulis Manual)
  const rosterInputRef = useRef<HTMLInputElement>(null);
  const [rosterMode, setRosterMode] = useState<'upload' | 'manual'>('upload');
  const [rosterFileName, setRosterFileName] = useState<string>('');
  const [rosterManualText, setRosterManualText] = useState<string>('');

  // Maklumat Pelanggan & Tempahan
  const [teamName, setTeamName] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [shippingAddress, setShippingAddress] = useState('');
  const [additionalNotes, setAdditionalNotes] = useState('');

  // Modal Ringkasan Tempahan (Order Summary) & Status
  const [isSummaryModalOpen, setIsSummaryModalOpen] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderSuccessModal, setOrderSuccessModal] = useState<{
    orderNumber: string;
    totalAmount: number;
  } | null>(null);

  const totalQuantity = useMemo(() => {
    return Object.entries(sizing).reduce((sum, [key, qty]) => {
      if (activeSizeKeys.includes(key)) {
        return sum + (Number(qty) || 0);
      }
      return sum;
    }, 0);
  }, [sizing, activeSizeKeys]);

  const handleSizeChange = (size: string, val: number) => {
    setSizing((prev) => ({
      ...prev,
      [size]: Math.max(0, val),
    }));
  };

  const handleRemoveSizeKey = (sizeKeyToRemove: string) => {
    setActiveSizeKeys((prev) => prev.filter((k) => k !== sizeKeyToRemove));
    setSizing((prev) => {
      const next = { ...prev };
      delete next[sizeKeyToRemove];
      return next;
    });
  };

  const handleAddSizeKey = (newKey: string) => {
    const trimmed = newKey.trim();
    if (!trimmed) return;
    if (!activeSizeKeys.includes(trimmed)) {
      setActiveSizeKeys((prev) => [...prev, trimmed]);
      setSizing((prev) => ({
        ...prev,
        [trimmed]: prev[trimmed] || 1,
      }));
    }
    setCustomSizeInput('');
    setIsAddSizeModalOpen(false);
  };

  const selectedFabric = useMemo(
    () => fabrics.find((f) => f.id === selectedFabricId) || fabrics[0],
    [fabrics, selectedFabricId]
  );

  const selectedCut = useMemo(
    () => cuts.find((c) => c.id === selectedCutId) || cuts[0],
    [cuts, selectedCutId]
  );

  const selectedDimension = useMemo(
    () => dtfDimensions.find((d) => d.id === selectedDtfDimId) || dtfDimensions[0],
    [dtfDimensions, selectedDtfDimId]
  );

  // Kiraan Harga Sebut Harga Dinamik (Fabric + Pola Potongan + Quantity Tiering)
  const quote = useMemo(() => {
    if (techniqueMode === 'sublimation') {
      return calculateSublimationPrice({
        fabric: selectedFabric,
        cut: selectedCut,
        quantity: totalQuantity,
        tiers,
      });
    } else {
      return calculateDtfPrice({
        dimension: selectedDimension,
        optionType: dtfOptionType,
        quantity: totalQuantity,
        tiers,
      });
    }
  }, [
    techniqueMode,
    selectedFabric,
    selectedCut,
    selectedDimension,
    dtfOptionType,
    totalQuantity,
    tiers,
  ]);

  // Handle Logo File
  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFileName(file.name);
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = () => setLogoFilePreview(reader.result as string);
        reader.readAsDataURL(file);
      } else {
        setLogoFilePreview(null);
      }
    }
  };

  const handleRemoveLogo = () => {
    setLogoFileName('');
    setLogoFilePreview(null);
    if (logoInputRef.current) logoInputRef.current.value = '';
  };

  // Handle Roster File
  const handleRosterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setRosterFileName(file.name);
    }
  };

  const handleRemoveRosterFile = () => {
    setRosterFileName('');
    if (rosterInputRef.current) rosterInputRef.current.value = '';
  };

  // Buka Ringkasan Pesanan (Order Summary)
  const handleOpenProcessSummary = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (totalQuantity <= 0) {
      setValidationError('Sila masukkan kuantiti sekurang-kurangnya 1 helai.');
      return;
    }

    if (!customerName.trim()) {
      setValidationError('Sila masukkan Nama Wakil Pelanggan.');
      return;
    }

    if (!customerPhone.trim()) {
      setValidationError('Sila masukkan Nombor Telefon / WhatsApp.');
      return;
    }

    setIsSummaryModalOpen(true);
  };

  // Sahkan & Hantar Tempahan (Simpan ke Sistem + Buka WhatsApp)
  const handleConfirmAndSendOrder = () => {
    setIsSubmitting(true);

    const activeSizingBreakdown = Object.fromEntries(
      Object.entries(sizing).filter(([key, qty]) => activeSizeKeys.includes(key) && Number(qty) > 0)
    );

    const rosterInfo = rosterMode === 'upload' && rosterFileName
      ? `Fail Senarai Nama: ${rosterFileName}`
      : rosterManualText.trim()
      ? `Senarai Nama:\n${rosterManualText.trim()}`
      : 'Tiada senarai nama';

    const logoInfo = logoFileName ? `Fail Logo: ${logoFileName}` : 'Tiada fail logo (Bincang di WA)';

    const fullNotes = [
      teamName ? `Pasukan: ${teamName}` : '',
      `[Logo]: ${logoInfo}`,
      `[Senarai Nama]: ${rosterInfo}`,
      additionalNotes ? `Nota: ${additionalNotes}` : '',
    ].filter(Boolean).join('\n\n');

    // 1. Catat ke Sistem Database
    const newOrder = addOrder({
      customer_name: customerName.trim(),
      customer_email: `${customerName.toLowerCase().replace(/\s+/g, '')}@gmail.com`,
      customer_phone: customerPhone.trim(),
      print_type: techniqueMode,
      design_id: design?.id,
      design_title: `${design?.title || 'Jersi Kustom'}${teamName ? ` (${teamName})` : ''}`,
      mockup_url: activeView === 'front' ? design?.mockup_front_url : (design?.mockup_back_url || design?.mockup_front_url),
      fabric_material_id: techniqueMode === 'sublimation' ? selectedFabric?.id : undefined,
      fabric_name: techniqueMode === 'sublimation' ? selectedFabric?.name : undefined,
      apparel_cut_id: techniqueMode === 'sublimation' ? selectedCut?.id : undefined,
      cut_name: techniqueMode === 'sublimation' ? selectedCut?.name : undefined,
      dtf_dimension_id: techniqueMode === 'dtf' ? selectedDimension?.id : undefined,
      dtf_dimension_name: techniqueMode === 'dtf' ? selectedDimension?.name : undefined,
      dtf_option_type: techniqueMode === 'dtf' ? dtfOptionType : undefined,
      sizing_breakdown: activeSizingBreakdown,
      total_quantity: totalQuantity,
      raw_unit_price: quote.rawUnitPrice,
      discount_percentage: quote.discountPercentage,
      final_unit_price: quote.finalUnitPrice,
      total_amount: quote.finalTotal,
      status: 'pending_proof',
      production_notes: fullNotes,
      shipping_address: shippingAddress.trim() || 'Pusat Edaran SFV Apparel / Penghantaran Terus',
      shipping_courier: 'Kurier Rasmi Kilang SFV',
    });

    // 2. Bina Link WhatsApp Lengkap & Auto Redirect
    const waUrl = buildCustomOrderWhatsAppUrl({
      phone: companySettings?.whatsapp_number,
      orderNumber: newOrder.order_number,
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      teamName: teamName.trim() || undefined,
      designTitle: design?.title || 'Jersi Kustom',
      designId: design?.id,
      technique: techniqueMode === 'sublimation' ? 'Sublimasi Penuh (Full Sublimation)' : 'Cetakan DTF',
      fabricName: techniqueMode === 'sublimation' ? selectedFabric?.name : undefined,
      fabricPrice: techniqueMode === 'sublimation' ? selectedFabric?.sublimation_base_price : undefined,
      cutName: techniqueMode === 'sublimation' ? selectedCut?.name : undefined,
      cutAddOn: techniqueMode === 'sublimation' ? selectedCut?.cut_add_on_price : undefined,
      sizingBreakdown: activeSizingBreakdown,
      totalQty: totalQuantity,
      rawUnitPrice: quote.rawUnitPrice,
      discountPercentage: quote.discountPercentage,
      finalUnitPrice: quote.finalUnitPrice,
      totalAmount: quote.finalTotal,
      logoStatus: logoFileName ? `Fail ${logoFileName}` : 'Tiada fail logo (Akan dihantar di WhatsApp)',
      rosterStatus: rosterMode === 'upload' && rosterFileName ? `Fail ${rosterFileName}` : (rosterManualText.trim() ? rosterManualText.trim() : 'Tiada'),
      notes: additionalNotes.trim() || undefined,
      shippingAddress: shippingAddress.trim() || undefined,
    });

    setTimeout(() => {
      setIsSubmitting(false);
      setIsSummaryModalOpen(false);

      // Buka WhatsApp di tab baharu jika disokong
      if (typeof window !== 'undefined' && waUrl && waUrl !== '#') {
        window.open(waUrl, '_blank');
      }

      // Tunjukkan modal berjaya
      setOrderSuccessModal({
        orderNumber: newOrder.order_number,
        totalAmount: quote.finalTotal,
      });
    }, 400);
  };

  if (!design) {
    return (
      <div className="p-10 text-center font-ios">
        <p className="text-xs text-slate-500">Corak tidak dijumpai.</p>
        <Link href="/catalog" className="text-xs font-semibold text-[#00BDFF] mt-2 inline-block">
          &larr; Kembali ke Katalog
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-[#F8FAFC] font-ios select-none pb-36">
      {/* 1. Header Navigasi Bersih */}
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 py-3 flex items-center justify-between shadow-2xs">
        <Link
          href="/catalog"
          className="flex items-center text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ChevronLeft className="w-4 h-4 mr-0.5" />
          <span>Katalog</span>
        </Link>
        <h1 className="text-xs font-bold text-slate-900 truncate max-w-[180px]">
          Borang Tempahan Kustom
        </h1>
        <div className="w-6" />
      </div>

      <form onSubmit={handleOpenProcessSummary} className="space-y-4 px-4 pt-4">
        {/* Validation Alert */}
        {validationError && (
          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center justify-between animate-in fade-in duration-200">
            <span>{validationError}</span>
            <button
              type="button"
              onClick={() => setValidationError(null)}
              className="text-rose-500 font-bold p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* 2. Visual Pratonton Corak Jersi (Clean Minimalist Card) */}
        <div className="bg-white rounded-3xl p-4 border border-slate-200/80 shadow-xs space-y-3">
          <div className="relative aspect-[4/3] w-full rounded-2xl bg-slate-100 overflow-hidden">
            <Image
              src={activeView === 'front' ? (design.mockup_front_url || design.thumbnail_url) : (design.mockup_back_url || design.mockup_front_url)}
              alt={design.title}
              fill
              sizes="(max-width: 640px) 100vw, 420px"
              className="object-cover"
              priority
            />

            {/* Toggle Pandangan Depan / Belakang */}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-slate-900/80 backdrop-blur-md p-1 rounded-full flex items-center space-x-1 shadow-xs">
              <button
                type="button"
                onClick={() => setActiveView('front')}
                className={`px-3 py-1 rounded-full text-[10.5px] font-semibold transition-all cursor-pointer ${
                  activeView === 'front'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-white/80 hover:text-white'
                }`}
              >
                Depan
              </button>
              <button
                type="button"
                onClick={() => setActiveView('back')}
                className={`px-3 py-1 rounded-full text-[10.5px] font-semibold transition-all cursor-pointer ${
                  activeView === 'back'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-white/80 hover:text-white'
                }`}
              >
                Belakang
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <div>
              <h2 className="text-sm font-bold text-slate-900 leading-tight">
                {design.title}
              </h2>
              <p className="text-[11px] text-slate-500 capitalize mt-0.5">
                Kategori: {design.category} &bull; {techniqueMode === 'sublimation' ? 'Sublimasi Penuh' : 'Cetakan DTF'}
              </p>
            </div>

            {/* Switch Sublimasi / DTF jika kedua-duanya disokong */}
            {isBoth && (
              <div className="bg-slate-100 p-0.5 rounded-xl flex items-center">
                <button
                  type="button"
                  onClick={() => setTechniqueMode('sublimation')}
                  className={`px-2.5 py-1 rounded-lg text-[10.5px] font-semibold transition-all ${
                    techniqueMode === 'sublimation'
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-500'
                  }`}
                >
                  Sublimasi
                </button>
                <button
                  type="button"
                  onClick={() => setTechniqueMode('dtf')}
                  className={`px-2.5 py-1 rounded-lg text-[10.5px] font-semibold transition-all ${
                    techniqueMode === 'dtf'
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-500'
                  }`}
                >
                  DTF
                </button>
              </div>
            )}
          </div>
        </div>

        {/* 3. Konfigurasi Spesifikasi (Jenis Fabrik & Pola Potongan - Combobox) */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              1. Fabrik & Pola Potongan
            </h3>
            <span className="text-[10.5px] text-slate-400 font-medium">Asas Kiraan Harga</span>
          </div>

          {techniqueMode === 'sublimation' ? (
            <div className="space-y-3.5">
              {/* Combobox: Jenis Fabrik */}
              <div>
                <label className="text-[11px] font-semibold text-slate-700 block mb-1.5">
                  Jenis Fabrik (Material)
                </label>
                <div className="relative">
                  <select
                    value={selectedFabricId}
                    onChange={(e) => setSelectedFabricId(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium text-slate-900 appearance-none focus:outline-none focus:ring-2 focus:ring-[#00BDFF] pr-9"
                  >
                    {fabrics.filter((f) => f.is_active).map((fabric) => (
                      <option key={fabric.id} value={fabric.id}>
                        {fabric.name} ({fabric.weight_gsm} GSM - {fabric.breathability}) &bull; {formatCurrency(fabric.sublimation_base_price)}
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-xs">
                    ▼
                  </div>
                </div>
              </div>

              {/* Combobox: Pola Potongan Kolar & Lengan */}
              <div>
                <label className="text-[11px] font-semibold text-slate-700 block mb-1.5">
                  Pola Potongan Kolar & Lengan
                </label>
                <div className="relative">
                  <select
                    value={selectedCutId}
                    onChange={(e) => setSelectedCutId(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium text-slate-900 appearance-none focus:outline-none focus:ring-2 focus:ring-[#00BDFF] pr-9"
                  >
                    {cuts.filter((c) => c.is_active).map((cut) => (
                      <option key={cut.id} value={cut.id}>
                        {cut.name} {cut.cut_add_on_price > 0 ? `(+${formatCurrency(cut.cut_add_on_price)})` : '(Termasuk)'}
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-xs">
                    ▼
                  </div>
                </div>
              </div>

              {/* Ringkasan Formula Harga Asas Seunit */}
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 text-[11px] text-slate-600 flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="font-semibold text-slate-800">
                    Kiraan Seunit: {formatCurrency(selectedFabric?.sublimation_base_price || 0)} (Fabrik) + {formatCurrency(selectedCut?.cut_add_on_price || 0)} (Pola)
                  </div>
                  <div className="text-[10px] text-slate-500">
                    Diskaun kuantiti dikira automatik mengikut jumlah helai.
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-bold text-slate-900 font-mono">
                    {formatCurrency((selectedFabric?.sublimation_base_price || 0) + (selectedCut?.cut_add_on_price || 0))}
                  </div>
                  <div className="text-[9.5px] text-slate-400">Harga Asas / helai</div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3.5">
              {/* Combobox: Saiz Cetakan DTF */}
              <div>
                <label className="text-[11px] font-semibold text-slate-700 block mb-1.5">
                  Dimensi / Saiz Cetakan DTF
                </label>
                <div className="relative">
                  <select
                    value={selectedDtfDimId}
                    onChange={(e) => setSelectedDtfDimId(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium text-slate-900 appearance-none focus:outline-none focus:ring-2 focus:ring-[#00BDFF] pr-9"
                  >
                    {dtfDimensions.filter((d) => d.is_active).map((dim) => (
                      <option key={dim.id} value={dim.id}>
                        {dim.name} ({dim.dimensions_desc}) &bull; {formatCurrency(dtfOptionType === 'with_garment' ? dim.garment_included_base_price : dim.base_price)}
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-xs">
                    ▼
                  </div>
                </div>
              </div>

              {/* Combobox: Pakej Baju DTF */}
              <div>
                <label className="text-[11px] font-semibold text-slate-700 block mb-1.5">
                  Pakej Pesanan DTF
                </label>
                <div className="relative">
                  <select
                    value={dtfOptionType}
                    onChange={(e) => setDtfOptionType(e.target.value as 'with_garment' | 'film_only')}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium text-slate-900 appearance-none focus:outline-none focus:ring-2 focus:ring-[#00BDFF] pr-9"
                  >
                    <option value="with_garment">Baju Cotton 24s + Cetakan DTF Siap</option>
                    <option value="film_only">Filem Stiker DTF Sahaja (Tanpa Baju)</option>
                  </select>
                  <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-xs">
                    ▼
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 4. Pemilihan Saiz & Kuantiti Dinamik + Butang Tambah Saiz */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs space-y-3.5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                2. Kuantiti Mengikut Saiz
              </h3>
              <p className="text-[10px] text-slate-400">Tambah atau kurangkan kuantiti saiz yang diperlukan</p>
            </div>
            
            {/* Butang Toggle Carta Saiz (Size Chart) */}
            <button
              type="button"
              onClick={() => setIsSizeChartOpen(true)}
              className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#00BDFF] hover:text-sky-700 active:scale-95 transition-all bg-sky-50 px-2.5 py-1 rounded-xl border border-sky-100 cursor-pointer"
            >
              <Ruler className="w-3.5 h-3.5" />
              <span>Carta Saiz</span>
            </button>
          </div>

          {/* Grid Matriks Saiz Dinamik */}
          <div className="grid grid-cols-4 gap-2">
            {activeSizeKeys.map((sizeKey) => {
              const qty = sizing[sizeKey] || 0;
              return (
                <div
                  key={sizeKey}
                  className="bg-slate-50 p-2 rounded-2xl border border-slate-200/70 text-center flex flex-col justify-between relative group"
                >
                  <div className="flex items-center justify-between px-0.5">
                    <span className="text-[11px] font-bold text-slate-800 truncate" title={sizeKey}>
                      {sizeKey}
                    </span>
                    {/* Buang saiz jika lebih daripada 1 saiz dalam senarai */}
                    {activeSizeKeys.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveSizeKey(sizeKey)}
                        className="text-slate-300 hover:text-rose-500 p-0.5 rounded transition-colors"
                        title="Buang saiz ini"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>

                  <div className="flex items-center justify-between mt-1.5 bg-white rounded-xl border border-slate-200 px-1 py-0.5 shadow-2xs">
                    <button
                      type="button"
                      onClick={() => handleSizeChange(sizeKey, qty - 1)}
                      className="w-5 h-5 rounded text-slate-400 hover:text-slate-800 flex items-center justify-center font-bold text-xs active:scale-90"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      min="0"
                      value={qty === 0 ? '' : qty}
                      onChange={(e) => handleSizeChange(sizeKey, parseInt(e.target.value) || 0)}
                      placeholder="0"
                      className="w-6 text-center text-xs font-mono font-bold text-slate-900 bg-transparent focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => handleSizeChange(sizeKey, qty + 1)}
                      className="w-5 h-5 rounded text-[#00BDFF] flex items-center justify-center font-bold text-xs active:scale-90"
                    >
                      +
                    </button>
                  </div>
                </div>
              );
            })}

            {/* Butang Tambah Saiz */}
            <button
              type="button"
              onClick={() => setIsAddSizeModalOpen(true)}
              className="p-2 rounded-2xl border-2 border-dashed border-slate-200 hover:border-[#00BDFF] bg-slate-50/50 flex flex-col items-center justify-center space-y-1 text-slate-500 hover:text-[#00BDFF] transition-all cursor-pointer min-h-[64px]"
            >
              <Plus className="w-4 h-4" />
              <span className="text-[10px] font-bold">+ Saiz</span>
            </button>
          </div>

          <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100">
            <span className="text-slate-500 font-medium">Jumlah Keseluruhan:</span>
            <span className="font-bold text-slate-900 font-mono text-sm">{totalQuantity} helai</span>
          </div>
        </div>

        {/* 5. Muat Naik Logo / Sponsor */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              3. Logo Pasukan & Penaja (Opsional)
            </h3>
            <span className="text-[10.5px] text-slate-400">PNG / JPG / PDF / AI</span>
          </div>

          <input
            ref={logoInputRef}
            type="file"
            accept="image/*,.pdf,.ai,.eps,.zip"
            onChange={handleLogoChange}
            className="hidden"
            id="logo-upload-input"
          />

          {logoFileName ? (
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2.5 min-w-0">
                {logoFilePreview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={logoFilePreview}
                    alt="Logo Preview"
                    className="w-10 h-10 rounded-xl object-contain bg-white border border-slate-200 shrink-0 p-1"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-xl bg-slate-200 text-slate-600 flex items-center justify-center shrink-0">
                    <Paperclip className="w-5 h-5" />
                  </div>
                )}
                <div className="min-w-0">
                  <span className="text-xs font-semibold text-slate-900 block truncate">
                    {logoFileName}
                  </span>
                  <span className="text-[10px] text-emerald-600 font-medium">
                    &bull; Fail logo dipilih
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleRemoveLogo}
                className="p-2 rounded-xl text-rose-500 hover:bg-rose-50 active:scale-90 transition-all shrink-0"
                title="Buang logo"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => logoInputRef.current?.click()}
              className="w-full p-4 rounded-2xl border-2 border-dashed border-slate-200 hover:border-[#00BDFF] bg-slate-50/50 flex flex-col items-center justify-center space-y-1 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
            >
              <Upload className="w-5 h-5 text-slate-400" />
              <span className="text-xs font-semibold">Pilih fail logo atau penaja</span>
              <span className="text-[10px] text-slate-400">Atau anda boleh hantar di WhatsApp kemudian</span>
            </button>
          )}
        </div>

        {/* 6. Senarai Nama & Nombor Pemain (Pilihan: Upload Fail ATAU Tulis Manual) */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs space-y-3.5">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              4. Senarai Nama & Nombor Pemain
            </h3>
          </div>

          {/* Tab Pilihan: Upload Fail / Tulis Manual */}
          <div className="bg-slate-100 p-1 rounded-xl flex items-center">
            <button
              type="button"
              onClick={() => setRosterMode('upload')}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                rosterMode === 'upload'
                  ? 'bg-white text-slate-900 shadow-2xs font-bold'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Muat Naik Fail (Excel/Doc)
            </button>
            <button
              type="button"
              onClick={() => setRosterMode('manual')}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                rosterMode === 'manual'
                  ? 'bg-white text-slate-900 shadow-2xs font-bold'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Tulis Manual
            </button>
          </div>

          {rosterMode === 'upload' ? (
            <div className="space-y-2">
              <input
                ref={rosterInputRef}
                type="file"
                accept=".xlsx,.xls,.csv,.doc,.docx,.pdf,.txt"
                onChange={handleRosterChange}
                className="hidden"
                id="roster-upload-input"
              />

              {rosterFileName ? (
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#00BDFF] flex items-center justify-center shrink-0">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-xs font-semibold text-slate-900 block truncate">
                        {rosterFileName}
                      </span>
                      <span className="text-[10px] text-emerald-600 font-medium">
                        &bull; Fail senarai nama dipilih
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleRemoveRosterFile}
                    className="p-2 rounded-xl text-rose-500 hover:bg-rose-50 active:scale-90 transition-all shrink-0"
                    title="Buang fail"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => rosterInputRef.current?.click()}
                  className="w-full p-4 rounded-2xl border-2 border-dashed border-slate-200 hover:border-[#00BDFF] bg-slate-50/50 flex flex-col items-center justify-center space-y-1 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                >
                  <Upload className="w-5 h-5 text-slate-400" />
                  <span className="text-xs font-semibold">Muat naik fail senarai nama pasukan</span>
                  <span className="text-[10px] text-slate-400">Format Excel, Word, CSV, atau PDF</span>
                </button>
              )}
            </div>
          ) : (
            <div>
              <textarea
                value={rosterManualText}
                onChange={(e) => setRosterManualText(e.target.value)}
                placeholder="Contoh format:&#10;1. 07 - AMIR (L)&#10;2. 10 - ZAKI (M)&#10;3. 09 - HAKIM (XL)"
                rows={4}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#00BDFF] font-mono leading-relaxed"
              />
            </div>
          )}
        </div>

        {/* 7. Maklumat Pelanggan & Penghantaran */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs space-y-3.5">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            5. Maklumat Pelanggan & Penghantaran
          </h3>

          <div className="space-y-3">
            <div>
              <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                Nama Pasukan / Kelab (Opsional)
              </label>
              <input
                type="text"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                placeholder="cth: Harimau Selatan FC"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#00BDFF]"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                Nama Wakil Pelanggan *
              </label>
              <input
                type="text"
                required
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="cth: Ahmad Hafiz"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#00BDFF]"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                Nombor Telefon / WhatsApp *
              </label>
              <input
                type="tel"
                required
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="cth: 014-8599138"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#00BDFF]"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                Alamat Penghantaran (Opsional)
              </label>
              <textarea
                value={shippingAddress}
                onChange={(e) => setShippingAddress(e.target.value)}
                placeholder="Alamat lengkap poskod & negeri..."
                rows={2}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#00BDFF]"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                Nota Tambahan
              </label>
              <input
                type="text"
                value={additionalNotes}
                onChange={(e) => setAdditionalNotes(e.target.value)}
                placeholder="cth: Rujukan warna Pantone, kolar warna hitam"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#00BDFF]"
              />
            </div>
          </div>
        </div>

        {/* 8. Fixed Bottom Sticky Bar Ringkasan Sebut Harga & Butang Proses */}
        <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto z-40 bg-white/95 backdrop-blur-xl border-t border-slate-200/90 p-3.5 px-4 pb-[calc(env(safe-area-inset-bottom,0px)+0.85rem)] shadow-[0_-4px_24px_rgba(0,0,0,0.08)]">
          <div className="flex items-center justify-between gap-3">
            {/* Price Column */}
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 text-[10.5px] text-slate-500 font-medium">
                <span>{totalQuantity} helai</span>
                <span>&bull;</span>
                <span>{formatCurrency(quote.finalUnitPrice)}/helai</span>
                {quote.discountPercentage > 0 && (
                  <span className="font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.2 rounded-full text-[9.5px]">
                    -{quote.discountPercentage}%
                  </span>
                )}
              </div>
              <div className="text-base font-black text-slate-900 font-mono leading-tight">
                {formatCurrency(quote.finalTotal)}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              {/* WhatsApp direct talk */}
              <a
                href={buildWhatsAppInquiryUrl({
                  phone: companySettings?.whatsapp_number,
                  type: 'customize',
                  designTitle: design.title,
                  designId: design.id,
                  totalQty: totalQuantity > 0 ? totalQuantity : undefined,
                })}
                target="_blank"
                rel="noopener noreferrer"
                title="Tanya di WhatsApp"
                className="w-11 h-11 rounded-2xl bg-emerald-50 border border-emerald-200/80 text-[#25D366] hover:bg-emerald-100 flex items-center justify-center shrink-0 active:scale-90 transition-all shadow-2xs"
              >
                <FaWhatsapp className="w-5 h-5" />
              </a>

              {/* Submit / Process Order Button */}
              <button
                type="submit"
                disabled={totalQuantity <= 0}
                className="h-11 px-5 rounded-2xl bg-[#00BDFF] hover:bg-sky-600 disabled:bg-slate-300 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-sky-400/25 active:scale-95 transition-all cursor-pointer"
              >
                <span>Proses Tempahan</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </form>

      {/* Modal Tambah Saiz Dinamik */}
      {isAddSizeModalOpen && (
        <div className="fixed inset-0 z-[2000] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200 font-ios">
          <div className="w-full max-w-sm bg-white rounded-3xl p-5 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">
                Tambah Level Saiz
              </h3>
              <button
                type="button"
                onClick={() => setIsAddSizeModalOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Pilihan Pantas Saiz Popular */}
            <div>
              <label className="text-[11px] font-semibold text-slate-600 block mb-2">
                Pilihan Saiz Tambahan Popular:
              </label>
              <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto pr-1">
                {POPULAR_EXTRA_SIZES.filter((s) => !activeSizeKeys.includes(s)).map((extraSize) => (
                  <button
                    key={extraSize}
                    type="button"
                    onClick={() => handleAddSizeKey(extraSize)}
                    className="px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-[#00BDFF] hover:text-white text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
                  >
                    + {extraSize}
                  </button>
                ))}
              </div>
            </div>

            {/* Input Saiz Kustom Manual */}
            <div className="pt-2 border-t border-slate-100">
              <label className="text-[11px] font-semibold text-slate-600 block mb-1.5">
                Atau Taip Nama Saiz Sendiri:
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customSizeInput}
                  onChange={(e) => setCustomSizeInput(e.target.value)}
                  placeholder="cth: 5XL / Kid 34 / Muslimah"
                  className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#00BDFF]"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddSizeKey(customSizeInput);
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={() => handleAddSizeKey(customSizeInput)}
                  disabled={!customSizeInput.trim()}
                  className="px-4 py-2 rounded-xl bg-[#00BDFF] hover:bg-sky-600 disabled:bg-slate-200 text-white text-xs font-bold transition-all cursor-pointer"
                >
                  Tambah
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Ringkasan Tempahan (Order Summary) */}
      {isSummaryModalOpen && (
        <div className="fixed inset-0 z-[2000] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200 font-ios">
          <div className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 space-y-4 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Ringkasan Tempahan
                </h3>
                <p className="text-[10.5px] text-slate-500">
                  Sila semak butiran sebelum pesanan diproses ke sistem & WhatsApp.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsSummaryModalOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Ringkasan Produk & Spesifikasi */}
            <div className="space-y-3">
              {/* Product mini header */}
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-200/80">
                <div className="relative w-14 h-14 rounded-xl bg-slate-200 overflow-hidden shrink-0">
                  <Image
                    src={design.thumbnail_url || design.mockup_front_url}
                    alt={design.title}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-slate-900 truncate">{design.title}</div>
                  <div className="text-[10.5px] text-slate-500">
                    {techniqueMode === 'sublimation' ? selectedFabric?.name : 'Cetakan DTF'}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    {techniqueMode === 'sublimation' ? selectedCut?.name : selectedDimension?.name}
                  </div>
                </div>
              </div>

              {/* Pecahan Saiz */}
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-1.5 text-xs">
                <div className="font-semibold text-slate-700 text-[11px] mb-1">
                  Pecahan Saiz ({totalQuantity} helai):
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                  {Object.entries(sizing)
                    .filter(([key, qty]) => activeSizeKeys.includes(key) && Number(qty) > 0)
                    .map(([key, qty]) => (
                      <div key={key} className="bg-white px-2 py-1 rounded-lg border border-slate-200 text-center">
                        <span className="font-bold text-slate-800">{key}: </span>
                        <span className="font-mono text-slate-600">{qty} helai</span>
                      </div>
                    ))}
                </div>
              </div>

              {/* Status Fail & Maklumat Pelanggan */}
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 text-xs space-y-1 text-slate-600">
                <div className="flex justify-between">
                  <span className="text-slate-400">Pelanggan:</span>
                  <span className="font-semibold text-slate-900">{customerName} ({customerPhone})</span>
                </div>
                {teamName && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">Pasukan:</span>
                    <span className="font-semibold text-slate-900">{teamName}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-slate-400">Fail Logo:</span>
                  <span className="font-medium text-slate-900 truncate max-w-[180px]">
                    {logoFileName || 'Tiada (Hantar di WhatsApp)'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Senarai Nama:</span>
                  <span className="font-medium text-slate-900 truncate max-w-[180px]">
                    {rosterMode === 'upload' && rosterFileName ? rosterFileName : (rosterManualText ? 'Tulis Manual' : 'Tiada')}
                  </span>
                </div>
              </div>

              {/* Perincian Sebut Harga */}
              <div className="p-3.5 rounded-2xl bg-sky-50/70 border border-sky-100 text-xs space-y-1.5">
                <div className="flex justify-between text-slate-600">
                  <span>Harga Asas Fabrik:</span>
                  <span className="font-mono">{formatCurrency(selectedFabric?.sublimation_base_price || 0)}</span>
                </div>
                {selectedCut?.cut_add_on_price > 0 && (
                  <div className="flex justify-between text-slate-600">
                    <span>Add-on Pola Potongan:</span>
                    <span className="font-mono">+{formatCurrency(selectedCut?.cut_add_on_price)}</span>
                  </div>
                )}
                {quote.discountPercentage > 0 && (
                  <div className="flex justify-between text-emerald-600 font-semibold">
                    <span>Diskaun Pukal ({quote.discountPercentage}%):</span>
                    <span className="font-mono">-{formatCurrency(quote.unitDiscountAmount)}/helai</span>
                  </div>
                )}
                <div className="border-t border-sky-200/60 pt-1.5 flex justify-between items-baseline font-bold">
                  <span className="text-slate-900">Jumlah Anggaran ({totalQuantity} helai):</span>
                  <span className="text-base text-[#00BDFF] font-mono">{formatCurrency(quote.finalTotal)}</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 space-y-2">
              <button
                type="button"
                onClick={handleConfirmAndSendOrder}
                disabled={isSubmitting}
                className="w-full py-3 rounded-2xl bg-[#25D366] hover:bg-emerald-600 disabled:bg-slate-300 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-md shadow-emerald-500/20 active:scale-95 transition-all cursor-pointer"
              >
                {isSubmitting ? (
                  <span>Memproses Pesanan...</span>
                ) : (
                  <>
                    <FaWhatsapp className="w-4 h-4" />
                    <span>Sahkan & Hantar ke WhatsApp</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setIsSummaryModalOpen(false)}
                className="w-full py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-semibold active:scale-95 transition-all cursor-pointer"
              >
                Ubah Semula Butiran
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Carta Saiz (Size Chart) */}
      <SizeChartModal
        isOpen={isSizeChartOpen}
        onClose={() => setIsSizeChartOpen(false)}
      />

      {/* Modal Pesanan Berjaya Dihantar */}
      {orderSuccessModal && (
        <div className="fixed inset-0 z-[2000] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200 font-ios">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 text-center space-y-4 shadow-2xl border border-slate-200">
            <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8 stroke-[2.2]" />
            </div>

            <div>
              <h3 className="text-base font-bold text-slate-900">
                Tempahan Berjaya Direkodkan!
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Pesanan anda telah masuk ke jadual pengurusan kilang SFV Apparel dan salinan telah disediakan ke WhatsApp.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs font-mono space-y-1.5 text-left">
              <div className="flex justify-between">
                <span className="text-slate-400">No. Pesanan:</span>
                <span className="font-bold text-slate-900">{orderSuccessModal.orderNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Jumlah Kuantiti:</span>
                <span className="font-bold text-slate-900">{totalQuantity} helai</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Jumlah Sebut Harga:</span>
                <span className="font-bold text-[#00BDFF]">{formatCurrency(orderSuccessModal.totalAmount)}</span>
              </div>
            </div>

            <div className="pt-2 space-y-2">
              <button
                type="button"
                onClick={() => {
                  setOrderSuccessModal(null);
                  router.push(`/history?order=${orderSuccessModal.orderNumber}`);
                }}
                className="w-full py-3 rounded-2xl bg-[#00BDFF] hover:bg-sky-600 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-md shadow-sky-400/20 active:scale-95 transition-all"
              >
                <span>Lihat Status di Bahagian Pesanan</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

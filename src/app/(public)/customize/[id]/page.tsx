'use client';

import React, { useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAppStore } from '@/lib/store/app-store';
import { 
  calculateSublimationPrice, 
  calculateDtfPrice, 
  formatCurrency 
} from '@/lib/pricing-calculator';
import { SizingMatrix } from '@/types/database';
import { 
  ChevronLeft, 
  Check, 
  ShoppingBag, 
  CheckCircle2, 
  Layers, 
  Scissors, 
  Printer, 
  Shirt
} from 'lucide-react';
import { FaWhatsapp } from 'react-icons/fa6';
import { buildWhatsAppInquiryUrl } from '@/lib/whatsapp/dynamic-link';

const AVAILABLE_SIZES = ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL'];

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
    refreshDesigns,
    companySettings
  } = useAppStore();

  React.useEffect(() => {
    refreshDesigns();
  }, [refreshDesigns]);

  const design = useMemo(() => {
    return designs.find((d) => d.id === designId) || designs[0];
  }, [designs, designId]);

  const [activeView, setActiveView] = useState<'front' | 'back'>('front');

  const isDtf = design?.print_type === 'dtf';
  const isBoth = design?.print_type === 'both';
  const [techniqueMode, setTechniqueMode] = useState<'sublimation' | 'dtf'>(
    isDtf ? 'dtf' : 'sublimation'
  );

  // Sublimasi
  const [selectedFabricId, setSelectedFabricId] = useState<string>(
    fabrics[0]?.id || 'mat-1'
  );
  const [selectedCutId, setSelectedCutId] = useState<string>(
    cuts[0]?.id || 'cut-1'
  );

  // DTF
  const [selectedDtfDimId, setSelectedDtfDimId] = useState<string>(
    dtfDimensions[1]?.id || 'dtf-2'
  );
  const [dtfOptionType, setDtfOptionType] = useState<'film_only' | 'with_garment'>('with_garment');

  // Saiz
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

  const [teamName, setTeamName] = useState('');
  const [productionNotes, setProductionNotes] = useState('');

  // Modal Tempahan
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [shippingAddress, setShippingAddress] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdOrderNumber, setCreatedOrderNumber] = useState<string | null>(null);

  const totalQuantity = useMemo(() => {
    return Object.values(sizing).reduce((sum, qty) => sum + (Number(qty) || 0), 0);
  }, [sizing]);

  const handleSizeChange = (size: string, val: number) => {
    setSizing((prev) => ({
      ...prev,
      [size]: Math.max(0, val),
    }));
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

  // Kiraan Harga Dinamik
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

  const handleOrderSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName || !customerPhone || totalQuantity <= 0) return;

    setIsSubmitting(true);

    setTimeout(() => {
      const newOrder = addOrder({
        customer_name: customerName,
        customer_email: customerEmail || `${customerName.toLowerCase().replace(/\s+/g, '')}@gmail.com`,
        customer_phone: customerPhone,
        print_type: techniqueMode,
        design_id: design?.id,
        design_title: `${design?.title || 'Jersi Pasukan'}${teamName ? ` (${teamName})` : ''}`,
        mockup_url: activeView === 'front' ? design?.mockup_front_url : (design?.mockup_back_url || design?.mockup_front_url),
        fabric_material_id: techniqueMode === 'sublimation' ? selectedFabric?.id : undefined,
        fabric_name: techniqueMode === 'sublimation' ? selectedFabric?.name : undefined,
        apparel_cut_id: techniqueMode === 'sublimation' ? selectedCut?.id : undefined,
        cut_name: techniqueMode === 'sublimation' ? selectedCut?.name : undefined,
        dtf_dimension_id: techniqueMode === 'dtf' ? selectedDimension?.id : undefined,
        dtf_dimension_name: techniqueMode === 'dtf' ? selectedDimension?.name : undefined,
        dtf_option_type: techniqueMode === 'dtf' ? dtfOptionType : undefined,
        sizing_breakdown: sizing,
        total_quantity: totalQuantity,
        raw_unit_price: quote.rawUnitPrice,
        discount_percentage: quote.discountPercentage,
        final_unit_price: quote.finalUnitPrice,
        total_amount: quote.finalTotal,
        status: 'pending_proof',
        production_notes: `${teamName ? `[Pasukan: ${teamName}] ` : ''}${productionNotes || ''}`,
        shipping_address: shippingAddress || 'Pusat Edaran SFV Apparel / Penghantaran Terus',
        shipping_courier: 'JNE Express Cargo / Kurier Rasmi',
      });

      import('canvas-confetti').then((confettiModule) => {
        const confetti = confettiModule.default;
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      }).catch((err) => console.error(err));

      setCreatedOrderNumber(newOrder.order_number);
      setIsSubmitting(false);
    }, 800);
  };

  if (!design) {
    return (
      <div className="p-8 text-center">
        <p className="text-xs text-slate-500">Corak tidak dijumpai.</p>
        <Link href="/catalog" className="text-xs font-semibold text-blue-600 mt-2 block">
          Kembali ke Katalog
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-28">
      {/* Bar Navigasi Atas */}
      <div className="sticky top-0 z-30 bg-white/85 backdrop-blur-md border-b border-slate-100 px-4 py-3 flex items-center justify-between">
        <Link
          href="/catalog"
          className="flex items-center text-xs font-semibold text-blue-600 hover:underline"
        >
          <ChevronLeft className="w-4 h-4 mr-0.5" />
          <span>Katalog</span>
        </Link>
        <span className="text-xs font-bold text-slate-900 truncate max-w-[180px]">
          {design.title}
        </span>
        <div className="w-6" />
      </div>

      {/* Kanvas Paparan Mockup Jersi */}
      <div className="px-5">
        <div className="relative aspect-[4/3] w-full rounded-3xl bg-white border border-slate-100 overflow-hidden shadow-sm">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={activeView === 'front' ? design.mockup_front_url : (design.mockup_back_url || design.mockup_front_url)}
            alt={design.title}
            className="w-full h-full object-cover"
          />

          {/* Butang Tukar Pandangan Depan / Belakang */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-slate-900/80 backdrop-blur-md p-0.5 rounded-full flex items-center space-x-1 shadow-sm">
            <button
              onClick={() => setActiveView('front')}
              className={`px-3.5 py-1 rounded-full text-[10px] font-semibold transition-all ${
                activeView === 'front'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-white/80 hover:text-white'
              }`}
            >
              Depan
            </button>
            <button
              onClick={() => setActiveView('back')}
              className={`px-3.5 py-1 rounded-full text-[10px] font-semibold transition-all ${
                activeView === 'back'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-white/80 hover:text-white'
              }`}
            >
              Belakang
            </button>
          </div>

          <div className="absolute top-3 left-3">
            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-slate-900/80 text-white uppercase tracking-wider">
              {techniqueMode === 'sublimation' ? 'Sublimasi' : 'DTF'}
            </span>
          </div>
        </div>
      </div>

      {/* Suis Pilihan Jenis Cetakan */}
      {isBoth && (
        <div className="px-5">
          <div className="bg-slate-100 p-1 rounded-2xl flex items-center">
            <button
              onClick={() => setTechniqueMode('sublimation')}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
                techniqueMode === 'sublimation'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Jersi Sublimasi Penuh
            </button>
            <button
              onClick={() => setTechniqueMode('dtf')}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
                techniqueMode === 'dtf'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Cetakan DTF Terus
            </button>
          </div>
        </div>
      )}

      {/* ----------------- KONFIGURASI SUBLIMASI ----------------- */}
      {techniqueMode === 'sublimation' && (
        <div className="px-5 space-y-4">
          {/* 1. Pilihan Jenis Kain */}
          <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                1. Pilihan Jenis Kain
              </h2>
              <span className="text-[10px] font-semibold text-blue-600">
                {selectedFabric?.breathability}
              </span>
            </div>

            <div className="space-y-2">
              {fabrics.filter((f) => f.is_active).map((fabric) => {
                const isSelected = fabric.id === selectedFabricId;
                return (
                  <div
                    key={fabric.id}
                    onClick={() => setSelectedFabricId(fabric.id)}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50/40 ring-1 ring-blue-600'
                        : 'border-slate-200/80 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2.5">
                        <div
                          className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                            isSelected
                              ? 'border-blue-600 bg-blue-600 text-white'
                              : 'border-slate-300'
                          }`}
                        >
                          {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                        </div>
                        <div>
                          <span className="text-xs font-bold text-slate-900 block leading-tight">
                            {fabric.name}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {fabric.weight_gsm} GSM • {fabric.breathability}
                          </span>
                        </div>
                      </div>
                      <span className="text-xs font-mono font-bold text-slate-800">
                        {formatCurrency(fabric.sublimation_base_price)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 2. Pilihan Bentuk Kolar & Lengan */}
          <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm space-y-3">
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              2. Bentuk Kolar & Lengan
            </h2>
            <div className="space-y-2">
              {cuts.filter((c) => c.is_active).map((cut) => {
                const isSelected = cut.id === selectedCutId;
                return (
                  <div
                    key={cut.id}
                    onClick={() => setSelectedCutId(cut.id)}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50/40 ring-1 ring-blue-600'
                        : 'border-slate-200/80 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5">
                      <div
                        className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                          isSelected
                            ? 'border-blue-600 bg-blue-600 text-white'
                            : 'border-slate-300'
                        }`}
                      >
                        {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                      </div>
                      <span className="text-xs font-bold text-slate-900 block leading-tight">
                        {cut.name}
                      </span>
                    </div>
                    <span className="text-xs font-mono font-medium text-slate-500">
                      {cut.cut_add_on_price > 0 ? `+${formatCurrency(cut.cut_add_on_price)}` : 'Termasuk'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ----------------- KONFIGURASI DTF ----------------- */}
      {techniqueMode === 'dtf' && (
        <div className="px-5 space-y-4">
          <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm space-y-3">
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              1. Saiz Cetakan DTF
            </h2>
            <div className="space-y-2">
              {dtfDimensions.filter((d) => d.is_active).map((dim) => {
                const isSelected = dim.id === selectedDtfDimId;
                const price = dtfOptionType === 'with_garment' 
                  ? dim.garment_included_base_price 
                  : dim.base_price;

                return (
                  <div
                    key={dim.id}
                    onClick={() => setSelectedDtfDimId(dim.id)}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50/40 ring-1 ring-blue-600'
                        : 'border-slate-200/80 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2.5">
                        <div
                          className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                            isSelected
                              ? 'border-blue-600 bg-blue-600 text-white'
                              : 'border-slate-300'
                          }`}
                        >
                          {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                        </div>
                        <div>
                          <span className="text-xs font-bold text-slate-900 block">
                            {dim.name}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {dim.dimensions_desc}
                          </span>
                        </div>
                      </div>
                      <span className="text-xs font-mono font-bold text-slate-800">
                        {formatCurrency(price)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm space-y-2.5">
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              2. Pilihan Pakej Baju
            </h2>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setDtfOptionType('with_garment')}
                className={`p-3.5 rounded-2xl border text-left transition-all ${
                  dtfOptionType === 'with_garment'
                    ? 'border-blue-600 bg-blue-600 text-white font-bold shadow-xs'
                    : 'border-slate-200/80 bg-white text-slate-600'
                }`}
              >
                <span className="text-xs block">Baju + Cetak DTF</span>
                <span className={`text-[10px] block font-normal ${dtfOptionType === 'with_garment' ? 'text-blue-100' : 'text-slate-400'}`}>
                  Baju Cotton 24s Siap Cetak
                </span>
              </button>

              <button
                type="button"
                onClick={() => setDtfOptionType('film_only')}
                className={`p-3.5 rounded-2xl border text-left transition-all ${
                  dtfOptionType === 'film_only'
                    ? 'border-blue-600 bg-blue-600 text-white font-bold shadow-xs'
                    : 'border-slate-200/80 bg-white text-slate-600'
                }`}
              >
                <span className="text-xs block">Filem DTF Sahaja</span>
                <span className={`text-[10px] block font-normal ${dtfOptionType === 'film_only' ? 'text-blue-100' : 'text-slate-400'}`}>
                  Stiker Sedia Ditekan
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Pilihan Saiz & Kuantiti */}
      <div className="px-5">
        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              3. Pilihan Saiz & Kuantiti
            </h2>
            <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full font-mono">
              Jumlah: {totalQuantity} helai
            </span>
          </div>

          <div className="grid grid-cols-4 gap-2">
            {AVAILABLE_SIZES.map((size) => {
              const qty = sizing[size] || 0;
              return (
                <div
                  key={size}
                  className="bg-slate-50 p-2.5 rounded-2xl border border-slate-100 text-center flex flex-col justify-between"
                >
                  <span className="text-[11px] font-bold text-slate-700">{size}</span>
                  <div className="flex items-center justify-between mt-1 bg-white rounded-xl border border-slate-200 px-1 py-0.5 shadow-2xs">
                    <button
                      type="button"
                      onClick={() => handleSizeChange(size, qty - 1)}
                      className="w-5 h-5 rounded text-slate-400 hover:text-slate-700 flex items-center justify-center font-bold text-xs"
                    >
                      -
                    </button>
                    <span className="text-xs font-mono font-bold text-slate-900">{qty}</span>
                    <button
                      type="button"
                      onClick={() => handleSizeChange(size, qty + 1)}
                      className="w-5 h-5 rounded text-blue-600 flex items-center justify-center font-bold text-xs"
                    >
                      +
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Cadangan Cepat */}
          <div className="flex items-center space-x-1.5 pt-1 overflow-x-auto scrollbar-none no-scrollbar">
            <span className="text-[10px] font-medium text-slate-400 whitespace-nowrap">Cadangan:</span>
            {[
              { label: 'Sampel (2 helai)', map: { XS: 0, S: 0, M: 1, L: 1, XL: 0, '2XL': 0, '3XL': 0, '4XL': 0 } },
              { label: 'Pasukan (12 helai)', map: { XS: 0, S: 2, M: 5, L: 4, XL: 1, '2XL': 0, '3XL': 0, '4XL': 0 } },
              { label: 'Kelab (25 helai)', map: { XS: 0, S: 5, M: 10, L: 8, XL: 2, '2XL': 0, '3XL': 0, '4XL': 0 } },
              { label: 'Pukal (50 helai)', map: { XS: 0, S: 10, M: 20, L: 15, XL: 5, '2XL': 0, '3XL': 0, '4XL': 0 } },
            ].map((preset, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setSizing(preset.map)}
                className="px-2.5 py-1 rounded-full bg-slate-100 hover:bg-slate-200 text-[10px] font-medium text-slate-700 whitespace-nowrap transition-colors"
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 4. Nama Pasukan & Nota Tambahan */}
      <div className="px-5">
        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm space-y-2.5">
          <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            4. Nama Pasukan & Nota Tambahan
          </h2>

          <div className="space-y-2">
            <input
              type="text"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              placeholder="Nama Pasukan / Kelab (cth: Harimau FC)"
              className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
            />

            <textarea
              value={productionNotes}
              onChange={(e) => setProductionNotes(e.target.value)}
              placeholder="Senarai nombor & nama pemain, kedudukan logo, rujukan warna..."
              rows={2}
              className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>
        </div>
      </div>

      {/* Bar Harga Dinamik Bawah */}
      <div className="fixed bottom-20 left-0 right-0 max-w-[420px] mx-auto px-5 z-40">
        <div className="bg-white/95 backdrop-blur-md border border-slate-200/80 p-4 rounded-3xl shadow-xl flex items-center justify-between space-x-3">
          <div className="pl-1">
            <div className="flex items-center space-x-1.5">
              <span className="text-[10px] text-slate-400 font-medium">
                {totalQuantity} helai • {formatCurrency(quote.finalUnitPrice)}/sehelai
              </span>
              {quote.discountPercentage > 0 && (
                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-blue-100 text-blue-700 font-mono">
                  -{quote.discountPercentage}%
                </span>
              )}
            </div>
            <span className="text-base font-bold text-slate-900 font-mono leading-tight block">
              {formatCurrency(quote.finalTotal)}
            </span>
          </div>

          <a
            href={buildWhatsAppInquiryUrl({
              phone: companySettings?.whatsapp_number,
              type: 'customize',
              designTitle: design?.title,
              designId: design?.id,
              cutName: selectedCut?.name,
              fabricName: selectedFabric?.name,
              totalQty: totalQuantity > 0 ? totalQuantity : undefined,
            })}
            target="_blank"
            rel="noopener noreferrer"
            title="Tanya di WhatsApp"
            className="w-11 h-11 rounded-full bg-emerald-50 border border-emerald-200/80 text-[#25D366] hover:bg-emerald-100 flex items-center justify-center shrink-0 active:scale-90 transition-all shadow-xs cursor-pointer"
          >
            <FaWhatsapp className="w-5 h-5" />
          </a>

          <button
            type="button"
            disabled={totalQuantity <= 0}
            onClick={() => setIsCheckoutOpen(true)}
            className="flex-1 py-3 px-4 rounded-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 active:scale-[0.98] text-white font-bold text-xs flex items-center justify-center space-x-1.5 transition-all shadow-sm cursor-pointer"
          >
            <span>Teruskan Tempahan</span>
            <ShoppingBag className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Modal Maklumat Penghantaran & Sahkan Tempahan */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end justify-center">
          <div className="w-full max-w-[420px] bg-white rounded-t-[36px] p-6 space-y-4 max-h-[85vh] overflow-y-auto shadow-2xl">
            {createdOrderNumber ? (
              <div className="text-center py-6 space-y-4">
                <div className="w-14 h-14 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Pesanan Berjaya Dihantar</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Pesanan telah masuk ke jadual cetakan kilang SFV.</p>
                </div>
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 text-xs font-mono space-y-1 text-left">
                  <div className="flex justify-between">
                    <span className="text-slate-400">No. Pesanan:</span>
                    <span className="font-bold text-slate-900">{createdOrderNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Jumlah Kuantiti:</span>
                    <span className="font-bold text-slate-900">{totalQuantity} helai</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Jumlah Sebut Harga:</span>
                    <span className="font-bold text-blue-600">{formatCurrency(quote.finalTotal)}</span>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setIsCheckoutOpen(false);
                    router.push(`/history?order=${createdOrderNumber}`);
                  }}
                  className="w-full py-3 rounded-full bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 shadow-sm"
                >
                  Semak Status Pesanan
                </button>
              </div>
            ) : (
              <form onSubmit={handleOrderSubmit} className="space-y-3.5">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <h3 className="text-sm font-bold text-slate-900">Maklumat Penghantaran</h3>
                  <button
                    type="button"
                    onClick={() => setIsCheckoutOpen(false)}
                    className="text-xs text-slate-400 hover:text-slate-600 font-bold"
                  >
                    Batal
                  </button>
                </div>

                <div className="space-y-2.5">
                  <div>
                    <label className="text-[11px] font-medium text-slate-700 block mb-1">
                      Nama Wakil Pasukan / Pelanggan *
                    </label>
                    <input
                      type="text"
                      required
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="cth: Ahmad Zaki"
                      className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-medium text-slate-700 block mb-1">
                      Nombor Telefon / WhatsApp *
                    </label>
                    <input
                      type="tel"
                      required
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="+60 12-xxxx-xxxx"
                      className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-medium text-slate-700 block mb-1">
                      Alamat Penghantaran
                    </label>
                    <textarea
                      rows={2}
                      value={shippingAddress}
                      onChange={(e) => setShippingAddress(e.target.value)}
                      placeholder="Nama jalan, poskod, bandar & negeri..."
                      className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-sm flex items-center justify-center space-x-1.5"
                  >
                    {isSubmitting ? (
                      <span>Menghantar Pesanan...</span>
                    ) : (
                      <>
                        <span>Sahkan Tempahan ({formatCurrency(quote.finalTotal)})</span>
                        <CheckCircle2 className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

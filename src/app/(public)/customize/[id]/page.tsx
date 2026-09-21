'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
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
import CourierLogo from '@/components/ui/CourierLogo';
import { lookupMalaysiaPostcode } from '@/lib/malaysia-postcode';
import { 
  calculateMalaysiaShippingRates, 
  CourierOption 
} from '@/lib/shipping-calculator';
import { 
  ChevronLeft, 
  ChevronDown,
  Ruler, 
  Upload, 
  FileText, 
  CheckCircle2, 
  Trash2, 
  Paperclip, 
  Plus, 
  X, 
  ArrowRight, 
  Info, 
  CreditCard, 
  Loader2,
  Check,
  Tag,
  Truck,
  MapPin
} from 'lucide-react';
import { FaWhatsapp } from 'react-icons/fa6';
import { 
  buildWhatsAppInquiryUrl, 
  buildCustomOrderWhatsAppUrl 
} from '@/lib/whatsapp/dynamic-link';
import { useAuth } from '@/hooks/useAuth';

const SIZE_GROUPS = {
  dewasa: {
    id: 'dewasa',
    title: 'Dewasa (Unisex)',
    sizes: ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL', '5XL', '6XL', '7XL', '8XL']
  },
  kids: {
    id: 'kids',
    title: 'Kanak-Kanak (Kids)',
    sizes: ['Kid 24 (1-2y)', 'Kid 26 (3-4y)', 'Kid 28 (5-6y)', 'Kid 30 (7-8y)', 'Kid 32 (9-10y)', 'Kid 34 (11-12y)']
  },
  muslimah: {
    id: 'muslimah',
    title: 'Muslimah (Labuh)',
    sizes: ['Muslimah S', 'Muslimah M', 'Muslimah L', 'Muslimah XL', 'Muslimah 2XL', 'Muslimah 3XL', 'Muslimah 4XL', 'Muslimah 5XL']
  }
};

const LOGO_PLACEMENT_OPTIONS = [
  'Dada Kiri (Logo Pasukan)',
  'Dada Kanan',
  'Dada Tengah (Sponsor Utama)',
  'Lengan Kiri',
  'Lengan Kanan',
  'Belakang Atas',
  'Belakang Bawah',
  'Lain-lain (Khas)'
];

interface CustomLogoItem {
  id: string;
  fileName: string;
  previewUrl: string | null;
  placement: string;
  customPlacement?: string;
}

interface PlayerEntry {
  name: string;
  number: string;
}

export default function CustomizePage() {
  const router = useRouter();
  const params = useParams();
  const designId = params.id as string;
  const { customer, isAuthenticated, isLoading: isAuthLoading, updateAddress } = useAuth();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) {
      router.replace(`/auth/login?redirect=/customize/${designId}`);
    }
  }, [isAuthenticated, isAuthLoading, router, designId]);

  const { 
    designs, 
    fabrics, 
    cuts, 
    dtfDimensions, 
    tiers, 
    addOrder,
    companySettings,
    isInitialized
  } = useAppStore();

  const design = useMemo(() => {
    if (!designs || designs.length === 0) return null;
    return designs.find((d) => d && d.id === designId) || designs[0] || null;
  }, [designs, designId]);

  const [isSizeChartOpen, setIsSizeChartOpen] = useState(false);

  const isDtf = design?.print_type === 'dtf';
  const isBoth = design?.print_type === 'both';
  const [techniqueMode, setTechniqueMode] = useState<'sublimation' | 'dtf'>(
    isDtf ? 'dtf' : 'sublimation'
  );

  // Sync techniqueMode if design print_type changes
  useEffect(() => {
    if (design?.print_type === 'dtf') {
      setTechniqueMode('dtf');
    } else if (design?.print_type === 'sublimation') {
      setTechniqueMode('sublimation');
    }
  }, [design?.print_type]);

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

  // Dynamic Sizing Management: Mula kosong / tanpa saiz pra-pilihan agar kemas
  const [activeSizeKeys, setActiveSizeKeys] = useState<string[]>([]);
  const [sizing, setSizing] = useState<SizingMatrix>({});

  // Modal Pilihan Saiz Berkelompok (Dewasa, Kids, Muslimah)
  const [isAddSizeModalOpen, setIsAddSizeModalOpen] = useState(false);
  const [sizeModalTab, setSizeModalTab] = useState<'dewasa' | 'kids' | 'muslimah'>('dewasa');
  const [customSizeInput, setCustomSizeInput] = useState('');

  // Logo / Sponsor Files (Multi-logo support)
  const logoInputRef = useRef<HTMLInputElement>(null);
  const [logoList, setLogoList] = useState<CustomLogoItem[]>([]);

  // Senarai Nama & Nombor (Pilihan: Upload Fail ATAU Tulis Manual Berkolom)
  const [hasNamesAndNumbers, setHasNamesAndNumbers] = useState(false);
  const rosterInputRef = useRef<HTMLInputElement>(null);
  const [rosterMode, setRosterMode] = useState<'upload' | 'manual'>('manual');
  const [rosterFileName, setRosterFileName] = useState<string>('');
  const [manualRoster, setManualRoster] = useState<Record<string, PlayerEntry[]>>({});

  // Maklumat Pelanggan & Alamat (Persis seperti profil dengan API Poskod Malaysia)
  const [teamName, setTeamName] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [addrLine, setAddrLine] = useState('');
  const [addrPostcode, setAddrPostcode] = useState('');
  const [addrCity, setAddrCity] = useState('');
  const [saveAddressToProfile, setSaveAddressToProfile] = useState<boolean>(true);
  const [additionalNotes, setAdditionalNotes] = useState('');

  // Pilihan Kurier & Kos Penghantaran
  const [selectedCourierId, setSelectedCourierId] = useState<string>('jnt');
  const [isCourierPickerOpen, setIsCourierPickerOpen] = useState(false);

  // Autofill customer details if authenticated
  useEffect(() => {
    if (customer) {
      if (customer.full_name) setCustomerName(customer.full_name);
      if (customer.whatsapp) setCustomerPhone(customer.whatsapp);
      if (customer.company_or_team) setTeamName(customer.company_or_team);
      if (customer.address) setAddrLine(customer.address);
      if (customer.postal_code) setAddrPostcode(customer.postal_code);
      if (customer.city) setAddrCity(customer.city);
    }
  }, [customer]);

  // Malaysia Postcode auto-lookup (0ms Instant Realtime Synchronous Lookup)
  const handlePostcodeChange = (val: string) => {
    const cleaned = val.replace(/\D/g, '').slice(0, 5);
    setAddrPostcode(cleaned);

    if (cleaned.length >= 2) {
      const match = lookupMalaysiaPostcode(cleaned);
      if (match) {
        setAddrCity(`${match.city}, ${match.state}`);
      }
    }
  };

  // Modal Ringkasan Tempahan (Order Summary) & Status
  const [isSummaryModalOpen, setIsSummaryModalOpen] = useState(false);
  const [paymentMode, setPaymentMode] = useState<'chip_online' | 'whatsapp_manual'>('chip_online');
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderSuccessModal, setOrderSuccessModal] = useState<{
    orderNumber: string;
    totalAmount: number;
  } | null>(null);

  // Kiraan Jumlah Kuantiti
  const totalQuantity = useMemo(() => {
    return Object.entries(sizing).reduce((sum, [key, qty]) => {
      if (activeSizeKeys.includes(key)) {
        return sum + (Number(qty) || 0);
      }
      return sum;
    }, 0);
  }, [sizing, activeSizeKeys]);

  const handleSizeChange = (size: string, val: number) => {
    const cleanVal = Math.max(0, val);
    setSizing((prev) => ({
      ...prev,
      [size]: cleanVal,
    }));
  };

  const handleRemoveSizeKey = (sizeKeyToRemove: string) => {
    setActiveSizeKeys((prev) => prev.filter((k) => k !== sizeKeyToRemove));
    setSizing((prev) => {
      const next = { ...prev };
      delete next[sizeKeyToRemove];
      return next;
    });
    setManualRoster((prev) => {
      const next = { ...prev };
      delete next[sizeKeyToRemove];
      return next;
    });
  };

  const handleToggleSizeKey = (keyToAdd: string) => {
    const trimmed = keyToAdd.trim();
    if (!trimmed) return;
    if (activeSizeKeys.includes(trimmed)) {
      handleRemoveSizeKey(trimmed);
    } else {
      setActiveSizeKeys((prev) => [...prev, trimmed]);
      setSizing((prev) => ({
        ...prev,
        [trimmed]: prev[trimmed] || 0,
      }));
    }
  };

  const handleAddCustomSize = (newKey: string) => {
    const trimmed = newKey.trim();
    if (!trimmed) return;
    if (!activeSizeKeys.includes(trimmed)) {
      setActiveSizeKeys((prev) => [...prev, trimmed]);
      setSizing((prev) => ({
        ...prev,
        [trimmed]: 0,
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

  // Handle Multi Logo Files
  const handleLogoFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file, idx) => {
      const id = `logo-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      const defaultPlacement = logoList.length === 0 && idx === 0 
        ? 'Dada Kiri (Logo Pasukan)' 
        : logoList.length === 1 || idx === 1 
        ? 'Dada Tengah (Sponsor Utama)' 
        : 'Dada Kanan';

      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = () => {
          setLogoList((prev) => [
            ...prev,
            {
              id,
              fileName: file.name,
              previewUrl: reader.result as string,
              placement: defaultPlacement,
              customPlacement: '',
            },
          ]);
        };
        reader.readAsDataURL(file);
      } else {
        setLogoList((prev) => [
          ...prev,
          {
            id,
            fileName: file.name,
            previewUrl: null,
            placement: defaultPlacement,
            customPlacement: '',
          },
        ]);
      }
    });

    if (logoInputRef.current) logoInputRef.current.value = '';
  };

  const handleRemoveLogoItem = (id: string) => {
    setLogoList((prev) => prev.filter((l) => l.id !== id));
  };

  const handleUpdateLogoPlacement = (id: string, placement: string, customPlacement?: string) => {
    setLogoList((prev) =>
      prev.map((l) =>
        l.id === id
          ? {
              ...l,
              placement,
              customPlacement: customPlacement !== undefined ? customPlacement : l.customPlacement,
            }
          : l
      )
    );
  };

  // Handle Roster File Upload
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

  // Handle Manual Roster Entry Update
  const handlePlayerEntryChange = (sizeKey: string, index: number, field: 'name' | 'number', value: string) => {
    setManualRoster((prev) => {
      const list = [...(prev[sizeKey] || [])];
      while (list.length <= index) {
        list.push({ name: '', number: '' });
      }
      list[index] = { ...list[index], [field]: value };
      return { ...prev, [sizeKey]: list };
    });
  };

  // Kategorikan saiz aktif yang mempunyai kuantiti > 0 untuk paparan borang nama
  const categorizedActiveSizes = useMemo(() => {
    const result = {
      dewasa: [] as { sizeKey: string; qty: number }[],
      kids: [] as { sizeKey: string; qty: number }[],
      muslimah: [] as { sizeKey: string; qty: number }[],
    };

    activeSizeKeys.forEach((key) => {
      const qty = sizing[key] || 0;
      if (qty > 0) {
        const lower = key.toLowerCase();
        if (lower.startsWith('kid') || lower.startsWith('baby') || lower.startsWith('kanak')) {
          result.kids.push({ sizeKey: key, qty });
        } else if (lower.startsWith('muslimah')) {
          result.muslimah.push({ sizeKey: key, qty });
        } else {
          result.dewasa.push({ sizeKey: key, qty });
        }
      }
    });

    return result;
  }, [activeSizeKeys, sizing]);

  // Format manual roster string untuk nota pesanan dan WhatsApp
  const formattedManualRosterString = useMemo(() => {
    const rows: string[] = [];
    let counter = 1;

    activeSizeKeys.forEach((sizeKey) => {
      const qty = sizing[sizeKey] || 0;
      const entries = manualRoster[sizeKey] || [];
      for (let i = 0; i < qty; i++) {
        const item = entries[i];
        const nameText = item?.name?.trim() || '';
        const numText = item?.number?.trim() || '';
        if (nameText || numText) {
          rows.push(`${counter}. [${sizeKey}] ${numText ? `#${numText} ` : ''}${nameText}`);
        } else {
          rows.push(`${counter}. [${sizeKey}] (Kosong / Tanpa Nama)`);
        }
        counter++;
      }
    });

    return rows.length > 0 ? rows.join('\n') : 'Tiada senarai nama';
  }, [activeSizeKeys, sizing, manualRoster]);

  // Kiraan Pilihan Kurier & Kos Penghantaran
  const shippingCalculation = useMemo(() => {
    if (totalQuantity <= 0) {
      return {
        zone: 'peninsular' as const,
        zoneLabel: 'Pilih kuantiti dahulu',
        estimatedWeightKg: 0,
        couriers: [],
      };
    }
    return calculateMalaysiaShippingRates({
      postcode: addrPostcode || customer?.postal_code || '40000',
      state: addrCity || customer?.city || 'Selangor',
      totalQuantity: totalQuantity,
    });
  }, [addrPostcode, addrCity, customer, totalQuantity]);

  const selectedCourier = useMemo(() => {
    const list = shippingCalculation?.couriers || [];
    return (
      list.find((c) => c.id === selectedCourierId) ||
      list[0] || {
        id: 'jnt',
        name: 'J&T Express Malaysia',
        shortName: 'J&T Express',
        serviceType: 'standard' as const,
        estimatedDays: '1 - 2 Hari Bekerja',
        rate: 0,
        logoType: 'jnt' as const,
        description: 'Penghantaran standard',
        isAvailable: true,
      }
    );
  }, [shippingCalculation, selectedCourierId]);

  const isAddressFilled = Boolean(totalQuantity > 0 && addrLine.trim() && addrPostcode.trim() && addrPostcode.trim().length >= 4);
  const shippingFee = (totalQuantity > 0 && isAddressFilled) ? (selectedCourier?.rate || 0) : 0;
  const grandTotalAmount = totalQuantity > 0 ? (quote.finalTotal + shippingFee) : 0;
  const formattedFullAddress = [addrLine, addrPostcode, addrCity].filter(Boolean).join(', ');

  // Buka Ringkasan Pesanan (Order Summary)
  const handleOpenProcessSummary = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (totalQuantity <= 0) {
      setValidationError('Sila masukkan kuantiti sekurang-kurangnya 1 helai di bahagian Kuantiti Saiz.');
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

  // Sahkan & Hantar Tempahan (Simpan ke Sistem + Buka CHIP Gateway / WhatsApp)
  const handleConfirmAndSendOrder = async () => {
    setIsSubmitting(true);
    setPaymentError(null);

    // Kemaskini alamat ke profil jika ditanda
    if (saveAddressToProfile && (addrLine.trim() || addrPostcode.trim() || addrCity.trim())) {
      updateAddress({
        address: addrLine.trim(),
        postal_code: addrPostcode.trim() || undefined,
        city: addrCity.trim() || undefined,
      }).catch(() => {});
    }

    const activeSizingBreakdown = Object.fromEntries(
      Object.entries(sizing).filter(([key, qty]) => activeSizeKeys.includes(key) && Number(qty) > 0)
    );

    const rosterInfo = !hasNamesAndNumbers
      ? 'Tanpa Cetakan Nama & Nombor (Kosong)'
      : (rosterMode === 'upload' && rosterFileName
        ? `Fail Senarai Nama: ${rosterFileName}`
        : formattedManualRosterString);

    const logoInfo = logoList.length > 0
      ? logoList.map((l, i) => `${i + 1}. ${l.fileName} [${l.placement === 'Lain-lain (Khas)' ? (l.customPlacement || 'Khas') : l.placement}]`).join('\n')
      : 'Tiada fail logo (Bincang di WA)';

    const fullNotes = [
      teamName ? `Pasukan: ${teamName}` : '',
      `[Kaedah Bayaran]: ${paymentMode === 'chip_online' ? 'CHIP Gateway (FPX/Kad/e-Wallet)' : 'Manual / WhatsApp'}`,
      `[Pilihan Kurier]: ${selectedCourier.name} (${shippingFee === 0 ? 'Percuma' : formatCurrency(shippingFee)})`,
      `[Logo & Penaja]:\n${logoInfo}`,
      `[Senarai Nama & Nombor]:\n${rosterInfo}`,
      additionalNotes ? `Nota Khas: ${additionalNotes}` : '',
    ].filter(Boolean).join('\n\n');

    // 1. Catat ke Sistem Database
    const newOrder = await addOrder({
      customer_id: customer?.id,
      customer_name: customerName.trim(),
      customer_email: customer?.email || `${customerName.toLowerCase().replace(/\s+/g, '')}@gmail.com`,
      customer_phone: customerPhone.trim(),
      print_type: techniqueMode,
      design_id: design?.id,
      design_title: `${design?.title || 'Jersi Kustom'}${teamName ? ` (${teamName})` : ''}`,
      mockup_url: design?.mockup_front_url || design?.mockup_back_url || '',
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
      total_amount: grandTotalAmount,
      payment_status: paymentMode === 'chip_online' ? 'pending' : 'unpaid',
      payment_method: paymentMode === 'chip_online' ? 'chip_gateway' : 'whatsapp_manual',
      status: 'pending_proof',
      production_notes: fullNotes,
      shipping_address: formattedFullAddress || 'Ambil Sendiri di Kilang SFV Apparel',
      shipping_courier: `${selectedCourier.name} (${shippingFee === 0 ? 'Percuma' : formatCurrency(shippingFee)})`,
    });

    // 2A. Jika memilih bayaran terus secara online melalui CHIP Gateway
    if (paymentMode === 'chip_online') {
      try {
        const res = await fetch('/api/payment/chip/create-purchase', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderNumber: newOrder.order_number,
            customerName: customerName.trim(),
            customerEmail: customer?.email || `${customerName.toLowerCase().replace(/\s+/g, '')}@gmail.com`,
            customerPhone: customerPhone.trim(),
            totalAmount: grandTotalAmount,
            itemsDescription: `${design?.title || 'Jersi Kustom'} (${totalQuantity} helai) + Kurier ${selectedCourier.shortName}`,
          }),
        });

        const data = await res.json();

        if (data.success && data.checkoutUrl) {
          window.location.href = data.checkoutUrl;
          return;
        } else {
          setPaymentError(data.message || 'Gagal memulakan sesi pembayaran CHIP. Anda boleh beralih ke WhatsApp.');
          setIsSubmitting(false);
          return;
        }
      } catch (err: unknown) {
        console.error('CHIP checkout error:', err);
        setPaymentError('Ralat sambungan gerbang pembayaran. Sila gunakan pilihan WhatsApp.');
        setIsSubmitting(false);
        return;
      }
    }

    // 2B. Bina Link WhatsApp Lengkap & Auto Redirect (Manual flow)
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
      totalAmount: grandTotalAmount,
      logoStatus: logoList.length > 0 ? `${logoList.length} Fail Logo/Penaja Dimuat Naik` : 'Tiada fail logo (Akan dihantar di WhatsApp)',
      rosterStatus: rosterMode === 'upload' && rosterFileName ? `Fail ${rosterFileName}` : formattedManualRosterString,
      notes: additionalNotes.trim() || undefined,
      shippingAddress: formattedFullAddress || undefined,
      shippingCourier: selectedCourier.name,
      shippingFee: shippingFee,
    });

    setTimeout(() => {
      setIsSubmitting(false);
      setIsSummaryModalOpen(false);

      if (typeof window !== 'undefined' && waUrl && waUrl !== '#') {
        window.open(waUrl, '_blank');
      }

      setOrderSuccessModal({
        orderNumber: newOrder.order_number,
        totalAmount: grandTotalAmount,
      });
    }, 400);
  };

  // 1. Loading state while checking auth or loading designs
  if (isAuthLoading || (!isInitialized && (!designs || designs.length === 0))) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center font-ios">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-[#00BDFF] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs font-medium text-slate-500">Memuatkan butiran tempahan...</p>
        </div>
      </div>
    );
  }

  // 2. Auth guard: if not authenticated, show brief verifying spinner while redirecting
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center font-ios">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-slate-400 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-xs text-slate-500">Mengesahkan akaun anda...</p>
        </div>
      </div>
    );
  }

  // 3. Design guard: if design not found
  if (!design) {
    return (
      <div className="min-h-screen bg-[#F2F2F7] flex items-center justify-center p-6 text-center font-ios">
        <div className="max-w-sm bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-3">
          <p className="text-sm font-bold text-slate-800">Corak Tidak Dijumpai</p>
          <p className="text-xs text-slate-500">Corak yang anda pilih tidak wujud atau tidak aktif.</p>
          <Link href="/catalog" className="inline-block px-4 py-2 rounded-xl bg-[#00BDFF] text-white text-xs font-semibold mt-2">
            &larr; Kembali ke Katalog
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F2F2F7] pb-44 font-ios select-none text-slate-900">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-white/85 backdrop-blur-xl border-b border-slate-200/80 px-4 py-3 flex items-center justify-between">
        <button
          type="button"
          onClick={() => router.back()}
          className="p-1.5 -ml-1.5 rounded-full hover:bg-slate-100 transition-colors text-slate-700"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="text-center min-w-0 px-2">
          <h1 className="text-xs font-semibold text-slate-900 truncate">Tempahan Kustom</h1>
          <p className="text-[10px] text-slate-500 truncate">{design.title}</p>
        </div>
        <div className="w-7" />
      </div>

      {/* Validation Error */}
      {validationError && (
        <div className="max-w-md mx-auto px-4 pt-3">
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
            <Info className="w-4 h-4 shrink-0 text-red-500" />
            <span>{validationError}</span>
          </div>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleOpenProcessSummary} className="max-w-md mx-auto px-4 pt-3 space-y-4">
        
        {/* Visual Mockup */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 space-y-3">
          <div className="relative aspect-square w-full rounded-xl bg-slate-50 overflow-hidden border border-slate-100">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={design.mockup_front_url || design.mockup_back_url || ''}
              alt={design.title}
              className="w-full h-full object-contain p-2"
            />
          </div>

          <div className="flex items-center justify-between pt-1">
            <div>
              <h2 className="text-xs font-semibold text-slate-900">{design.title}</h2>
              <p className="text-[10px] text-slate-500 capitalize mt-0.5">
                {design.category} &bull; {techniqueMode === 'sublimation' ? 'Sublimasi Penuh' : 'Cetakan DTF'}
              </p>
            </div>

            {isBoth && (
              <div className="bg-slate-100 p-0.5 rounded-lg flex items-center">
                <button
                  type="button"
                  onClick={() => setTechniqueMode('sublimation')}
                  className={`px-2.5 py-1 rounded-md text-[10px] font-medium transition-all ${
                    techniqueMode === 'sublimation' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'
                  }`}
                >
                  Sublimasi
                </button>
                <button
                  type="button"
                  onClick={() => setTechniqueMode('dtf')}
                  className={`px-2.5 py-1 rounded-md text-[10px] font-medium transition-all ${
                    techniqueMode === 'dtf' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'
                  }`}
                >
                  DTF
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Spesifikasi Fabrik & Potongan */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 space-y-3">
          <h3 className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Spesifikasi Pakaian
          </h3>

          {techniqueMode === 'sublimation' ? (
            <div className="space-y-3">
              <div>
                <label className="text-xs text-slate-600 block mb-1">Jenis Fabrik</label>
                <div className="relative">
                  <select
                    value={selectedFabricId}
                    onChange={(e) => setSelectedFabricId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 appearance-none focus:outline-none focus:border-sky-500 pr-8"
                  >
                    {fabrics.filter((f) => f.is_active).map((fabric) => (
                      <option key={fabric.id} value={fabric.id}>
                        {fabric.name} ({fabric.weight_gsm} GSM)
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-600 block mb-1">Pola Potongan</label>
                <div className="relative">
                  <select
                    value={selectedCutId}
                    onChange={(e) => setSelectedCutId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 appearance-none focus:outline-none focus:border-sky-500 pr-8"
                  >
                    {cuts.filter((c) => c.is_active).map((cut) => (
                      <option key={cut.id} value={cut.id}>
                        {cut.name} {cut.cut_add_on_price > 0 ? `(+${formatCurrency(cut.cut_add_on_price)})` : ''}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              <div className="flex items-center justify-between pt-1 text-xs text-slate-500">
                <span>Harga Asas Seunit:</span>
                <span className="font-semibold text-slate-900 font-mono">
                  {formatCurrency((selectedFabric?.sublimation_base_price || 0) + (selectedCut?.cut_add_on_price || 0))}
                </span>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <label className="text-xs text-slate-600 block mb-1">Saiz Cetakan DTF</label>
                <div className="relative">
                  <select
                    value={selectedDtfDimId}
                    onChange={(e) => setSelectedDtfDimId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 appearance-none focus:outline-none focus:border-sky-500 pr-8"
                  >
                    {dtfDimensions.filter((d) => d.is_active).map((dim) => (
                      <option key={dim.id} value={dim.id}>
                        {dim.name} ({dim.dimensions_desc})
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-600 block mb-1">Pakej Pesanan</label>
                <div className="relative">
                  <select
                    value={dtfOptionType}
                    onChange={(e) => setDtfOptionType(e.target.value as 'with_garment' | 'film_only')}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 appearance-none focus:outline-none focus:border-sky-500 pr-8"
                  >
                    <option value="with_garment">Baju Cotton 24s + Cetakan DTF Siap</option>
                    <option value="film_only">Filem Stiker DTF Sahaja (Tanpa Baju)</option>
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Kuantiti Mengikut Saiz */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Kuantiti Saiz
            </h3>
            <button
              type="button"
              onClick={() => setIsSizeChartOpen(true)}
              className="text-xs text-sky-600 hover:text-sky-700 font-medium flex items-center gap-1"
            >
              <Ruler className="w-3.5 h-3.5" />
              <span>Carta Saiz</span>
            </button>
          </div>

          {activeSizeKeys.length === 0 ? (
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
              <span className="text-xs text-slate-500">Pilih saiz baju untuk mula</span>
              <button
                type="button"
                onClick={() => setIsAddSizeModalOpen(true)}
                className="w-8 h-8 rounded-lg bg-sky-500 text-white flex items-center justify-center text-sm font-bold"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-2">
              {activeSizeKeys.map((sizeKey) => {
                const qty = sizing[sizeKey] || 0;
                return (
                  <div key={sizeKey} className="bg-slate-50 p-2 rounded-xl border border-slate-200 text-center space-y-1">
                    <div className="flex items-center justify-between text-[11px] font-semibold text-slate-800 px-0.5">
                      <span>{sizeKey}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveSizeKey(sizeKey)}
                        className="text-slate-400 hover:text-red-500"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                    <div className="flex items-center justify-between bg-white rounded-lg border border-slate-200 px-1 py-0.5">
                      <button
                        type="button"
                        onClick={() => handleSizeChange(sizeKey, qty - 1)}
                        className="w-5 h-5 text-slate-500 font-bold text-xs"
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
                        className="w-5 h-5 text-sky-500 font-bold text-xs"
                      >
                        +
                      </button>
                    </div>
                  </div>
                );
              })}
              <button
                type="button"
                onClick={() => setIsAddSizeModalOpen(true)}
                className="p-2 rounded-xl border border-dashed border-slate-300 bg-slate-50 flex items-center justify-center text-slate-400 hover:text-slate-600 min-h-[60px]"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
          )}

          <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100">
            <span className="text-slate-500">Jumlah Kuantiti:</span>
            <span className="font-semibold text-slate-900 font-mono">{totalQuantity} helai</span>
          </div>

          {/* Toggle: Senarai Nama & Nombor Pemain */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-slate-800">Senarai Nama & Nombor</div>
              <div className="text-[10px] text-slate-400">Aktifkan jika perlukan nama/nombor khas pada jersi</div>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={hasNamesAndNumbers}
              onClick={() => setHasNamesAndNumbers((prev) => !prev)}
              className={`w-10 h-6 rounded-full transition-colors relative focus:outline-none p-0.5 ${
                hasNamesAndNumbers ? 'bg-sky-500' : 'bg-slate-200'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white shadow-xs transition-transform ${
                  hasNamesAndNumbers ? 'translate-x-4' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Logo Pasukan & Penaja */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Logo & Penaja <span className="text-slate-400 font-normal lowercase">(pilihan)</span>
            </h3>
            <span className="text-[10px] text-slate-400 font-mono">PNG / JPG / PDF</span>
          </div>

          <input
            ref={logoInputRef}
            type="file"
            multiple
            accept="image/*,.pdf,.ai,.eps,.zip"
            onChange={handleLogoFilesChange}
            className="hidden"
          />

          {logoList.length > 0 && (
            <div className="space-y-2">
              {logoList.map((logoItem, idx) => (
                <div key={logoItem.id} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      {logoItem.previewUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={logoItem.previewUrl} alt="" className="w-7 h-7 rounded object-contain bg-white border border-slate-200" />
                      ) : (
                        <div className="w-7 h-7 rounded bg-slate-200 text-slate-600 flex items-center justify-center">
                          <Paperclip className="w-3.5 h-3.5" />
                        </div>
                      )}
                      <span className="text-xs text-slate-900 truncate">{idx + 1}. {logoItem.fileName}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveLogoItem(logoItem.id)}
                      className="text-slate-400 hover:text-red-500"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex items-center gap-2 pt-1 border-t border-slate-200">
                    <span className="text-[10px] text-slate-500">Kedudukan:</span>
                    <select
                      value={logoItem.placement}
                      onChange={(e) => handleUpdateLogoPlacement(logoItem.id, e.target.value)}
                      className="flex-1 px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none"
                    >
                      {LOGO_PLACEMENT_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </div>

                  {logoItem.placement === 'Lain-lain (Khas)' && (
                    <input
                      type="text"
                      value={logoItem.customPlacement || ''}
                      onChange={(e) => handleUpdateLogoPlacement(logoItem.id, logoItem.placement, e.target.value)}
                      placeholder="Nyatakan kedudukan"
                      className="w-full px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none"
                    />
                  )}
                </div>
              ))}
            </div>
          )}

          <button
            type="button"
            onClick={() => logoInputRef.current?.click()}
            className="w-full py-2.5 rounded-xl border border-dashed border-slate-300 bg-slate-50 text-xs text-slate-600 hover:text-slate-900 flex items-center justify-center gap-2"
          >
            <Upload className="w-3.5 h-3.5 text-slate-400" />
            <span>{logoList.length > 0 ? 'Tambah Fail Lain' : 'Muat Naik Logo'}</span>
          </button>
        </div>

        {/* Senarai Nama & Nombor (Hanya jika diaktifkan pada toggle) */}
        {hasNamesAndNumbers && (
          <div className="bg-white rounded-2xl p-4 border border-slate-200/80 space-y-3 animate-in fade-in duration-200">
            <div className="flex items-center justify-between">
              <h3 className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Senarai Nama & Nombor
              </h3>
              <span className="text-[10px] text-slate-400 font-mono">{totalQuantity} helai</span>
            </div>

            <div className="bg-slate-100 p-0.5 rounded-xl flex items-center">
              <button
                type="button"
                onClick={() => setRosterMode('manual')}
                className={`flex-1 py-1 text-xs rounded-lg font-medium transition-all ${
                  rosterMode === 'manual' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'
                }`}
              >
                Isi Manual
              </button>
              <button
                type="button"
                onClick={() => setRosterMode('upload')}
                className={`flex-1 py-1 text-xs rounded-lg font-medium transition-all ${
                  rosterMode === 'upload' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'
                }`}
              >
                Muat Naik Fail
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
                />
                {rosterFileName ? (
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <FileText className="w-4 h-4 text-sky-500 shrink-0" />
                      <span className="text-xs text-slate-900 truncate">{rosterFileName}</span>
                    </div>
                    <button type="button" onClick={handleRemoveRosterFile} className="text-slate-400 hover:text-red-500">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => rosterInputRef.current?.click()}
                    className="w-full py-3 rounded-xl border border-dashed border-slate-300 bg-slate-50 text-xs text-slate-600 flex items-center justify-center gap-2"
                  >
                    <Upload className="w-3.5 h-3.5 text-slate-400" />
                    <span>Pilih Fail (Excel/PDF)</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                {totalQuantity === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-2">Masukkan kuantiti saiz di atas terlebih dahulu.</p>
                ) : (
                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                    {(['dewasa', 'kids', 'muslimah'] as const).map((catKey) => {
                      const catSizes = categorizedActiveSizes[catKey];
                      if (catSizes.length === 0) return null;
                      return (
                        <div key={catKey} className="space-y-1">
                          <div className="text-[10px] font-semibold text-slate-400 uppercase">
                            {SIZE_GROUPS[catKey].title}
                          </div>
                          {catSizes.map(({ sizeKey, qty }) => {
                            const entries = manualRoster[sizeKey] || [];
                            return Array.from({ length: qty }).map((_, idx) => {
                              const rowEntry = entries[idx] || { name: '', number: '' };
                              return (
                                <div key={`${sizeKey}-${idx}`} className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-xl border border-slate-200">
                                  <span className="w-10 text-[10px] font-bold text-slate-600 text-center">{sizeKey}</span>
                                  <input
                                    type="text"
                                    value={rowEntry.name}
                                    onChange={(e) => handlePlayerEntryChange(sizeKey, idx, 'name', e.target.value)}
                                    placeholder={`Nama #${idx + 1}`}
                                    className="flex-1 px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none"
                                  />
                                  <input
                                    type="text"
                                    value={rowEntry.number}
                                    onChange={(e) => handlePlayerEntryChange(sizeKey, idx, 'number', e.target.value)}
                                    placeholder="No"
                                    className="w-12 px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs text-center font-mono focus:outline-none"
                                  />
                                </div>
                              );
                            });
                          })}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Maklumat Pelanggan & Penghantaran */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 space-y-3">
          <h3 className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Maklumat & Penghantaran
          </h3>

          {totalQuantity === 0 && (
            <div className="p-3 bg-amber-50/90 border border-amber-200/80 rounded-xl text-amber-800 text-xs flex items-center gap-2">
              <Info className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Sila pilih saiz & kuantiti di bahagian <strong>Kuantiti Saiz</strong> untuk mengaktifkan pengisian alamat dan kurier.</span>
            </div>
          )}

          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-slate-600 block mb-1">Nama Penuh *</label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Nama wakil"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-sky-500"
                />
              </div>
              <div>
                <label className="text-xs text-slate-600 block mb-1">No. WhatsApp *</label>
                <input
                  type="tel"
                  required
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="0123456789"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-sky-500"
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-slate-600 block mb-1">Nama Pasukan / Syarikat (pilihan)</label>
              <input
                type="text"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                placeholder="cth: Harimau FC"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-sky-500"
              />
            </div>

            <div className="space-y-2 pt-1">
              <label className="text-xs text-slate-600 block">Alamat Penghantaran</label>
              
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <input
                    type="text"
                    disabled={totalQuantity === 0}
                    value={addrPostcode}
                    onChange={(e) => handlePostcodeChange(e.target.value)}
                    placeholder="Poskod"
                    maxLength={5}
                    className={`w-full px-3 py-2 border rounded-xl text-xs font-mono transition-colors ${
                      totalQuantity === 0
                        ? 'bg-slate-100/70 border-slate-200/60 opacity-60 cursor-not-allowed text-slate-400'
                        : 'bg-slate-50 border-slate-200 text-slate-900 focus:outline-none focus:border-sky-500'
                    }`}
                  />
                </div>
                <div className="col-span-2">
                  <input
                    type="text"
                    disabled={totalQuantity === 0}
                    value={addrCity}
                    onChange={(e) => setAddrCity(e.target.value)}
                    placeholder="Bandar & Negeri"
                    className={`w-full px-3 py-2 border rounded-xl text-xs transition-colors ${
                      totalQuantity === 0
                        ? 'bg-slate-100/70 border-slate-200/60 opacity-60 cursor-not-allowed text-slate-400'
                        : 'bg-slate-50 border-slate-200 text-slate-900 focus:outline-none focus:border-sky-500'
                    }`}
                  />
                </div>
              </div>

              <textarea
                rows={2}
                disabled={totalQuantity === 0}
                value={addrLine}
                onChange={(e) => setAddrLine(e.target.value)}
                placeholder="No rumah, nama jalan, taman perumahan"
                className={`w-full px-3 py-2 border rounded-xl text-xs resize-none transition-colors ${
                  totalQuantity === 0
                    ? 'bg-slate-100/70 border-slate-200/60 opacity-60 cursor-not-allowed text-slate-400'
                    : 'bg-slate-50 border-slate-200 text-slate-900 focus:outline-none focus:border-sky-500'
                }`}
              />

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={saveAddressToProfile}
                  onChange={(e) => setSaveAddressToProfile(e.target.checked)}
                  className="rounded text-sky-500 w-3.5 h-3.5"
                />
                <span className="text-[11px] text-slate-500">Simpan alamat ke profil</span>
              </label>
            </div>

            {/* Pilihan Kurier: Disabled sehingga kuantiti dan alamat diisi */}
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between">
                <label className="text-xs text-slate-600 block">Pilihan Kurier</label>
                {totalQuantity === 0 ? (
                  <span className="text-[10px] text-slate-400">Pilih kuantiti jersi dahulu</span>
                ) : !isAddressFilled ? (
                  <span className="text-[10px] text-slate-400">Isi alamat dahulu untuk pilih kurier</span>
                ) : (
                  <span className="text-[10px] text-emerald-600 font-medium">{shippingCalculation.zoneLabel}</span>
                )}
              </div>

              <button
                type="button"
                disabled={totalQuantity === 0 || !isAddressFilled}
                onClick={() => totalQuantity > 0 && isAddressFilled && setIsCourierPickerOpen(true)}
                className={`w-full px-3 py-2.5 border rounded-xl text-left flex items-center justify-between gap-3 transition-colors ${
                  totalQuantity === 0 || !isAddressFilled
                    ? 'bg-slate-100/70 border-slate-200/60 opacity-60 cursor-not-allowed'
                    : 'bg-slate-50 hover:bg-slate-100/80 border-slate-200 cursor-pointer'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <CourierLogo type={selectedCourier.logoType} className="w-[72px] h-6 shrink-0" />
                  <span className={`text-xs font-semibold truncate ${totalQuantity === 0 || !isAddressFilled ? 'text-slate-400' : 'text-slate-800'}`}>
                    {totalQuantity === 0 ? 'Pilih Kuantiti Dahulu' : !isAddressFilled ? 'Pilih Kurier (Perlu Alamat)' : selectedCourier.name}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-xs font-semibold font-mono text-slate-900">
                    {totalQuantity === 0 || !isAddressFilled ? '-' : (shippingFee === 0 ? 'Percuma' : formatCurrency(shippingFee))}
                  </span>
                  <ChevronDown className={`w-4 h-4 ${totalQuantity === 0 || !isAddressFilled ? 'text-slate-300' : 'text-slate-400'}`} />
                </div>
              </button>
            </div>

            <div>
              <label className="text-xs text-slate-600 block mb-1">Nota Tambahan (pilihan)</label>
              <textarea
                rows={2}
                value={additionalNotes}
                onChange={(e) => setAdditionalNotes(e.target.value)}
                placeholder="Catatan khas..."
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none resize-none"
              />
            </div>
          </div>
        </div>

        {/* 6. Ringkasan Telus (Transparent Pricing Breakdown) */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 space-y-2 text-xs">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">
            Perincian Harga
          </div>
          <div className="flex justify-between text-slate-600">
            <span>Harga Jersi ({totalQuantity} helai)</span>
            <span className="font-mono font-medium text-slate-900">
              {totalQuantity > 0 ? formatCurrency(quote.finalTotal) : 'RM 0.00'}
            </span>
          </div>
          <div className="flex justify-between text-slate-600">
            <span>Kos Pos {totalQuantity > 0 && isAddressFilled ? `(${selectedCourier.shortName})` : ''}</span>
            <span className="font-mono font-medium text-slate-900">
              {totalQuantity === 0 ? (
                <span className="text-slate-400 font-sans text-[11px]">Pilih kuantiti dahulu</span>
              ) : !isAddressFilled ? (
                <span className="text-slate-400 font-sans text-[11px]">Isi alamat dahulu</span>
              ) : shippingFee === 0 ? (
                'Percuma'
              ) : (
                formatCurrency(shippingFee)
              )}
            </span>
          </div>
          <div className="pt-2 border-t border-slate-100 flex justify-between font-bold text-slate-900 text-sm">
            <span>Jumlah Keseluruhan</span>
            <span className="font-mono text-sky-600">
              {totalQuantity > 0 ? formatCurrency(grandTotalAmount) : 'RM 0.00'}
            </span>
          </div>
        </div>

        {/* Cleaner Bottom Bar */}
        <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto z-40 bg-white/95 backdrop-blur-xl border-t border-slate-200 p-3 px-4 shadow-sm pb-safe">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-[10px] text-slate-400">
                {totalQuantity === 0
                  ? '0 helai dipilih'
                  : `${totalQuantity} helai ${isAddressFilled && shippingFee > 0 ? `+ pos RM${shippingFee.toFixed(2)}` : ''}`}
              </div>
              <div className="text-sm font-bold text-slate-900 font-mono">
                {totalQuantity > 0 ? formatCurrency(grandTotalAmount) : 'RM 0.00'}
              </div>
            </div>
            <div className="flex items-center gap-2">
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
                className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center"
              >
                <FaWhatsapp className="w-4 h-4" />
              </a>
              <button
                type="submit"
                disabled={totalQuantity === 0}
                className={`h-9 px-4 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all ${
                  totalQuantity === 0
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    : 'bg-sky-500 hover:bg-sky-600 text-white cursor-pointer'
                }`}
              >
                <span>Semak & Tempah</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </form>

      {/* Add Size Modal */}
      {isAddSizeModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-white rounded-2xl p-4 space-y-3 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-900">Pilihan Saiz</h3>
              <button type="button" onClick={() => setIsAddSizeModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-slate-100 p-0.5 rounded-lg flex items-center">
              {(['dewasa', 'kids', 'muslimah'] as const).map((tabKey) => (
                <button
                  key={tabKey}
                  type="button"
                  onClick={() => setSizeModalTab(tabKey)}
                  className={`flex-1 py-1 text-xs rounded-md font-medium transition-all ${
                    sizeModalTab === tabKey ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'
                  }`}
                >
                  {tabKey === 'dewasa' ? 'Dewasa' : tabKey === 'kids' ? 'Kanak-Kanak' : 'Muslimah'}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto">
              {SIZE_GROUPS[sizeModalTab].sizes.map((sz) => {
                const isSelected = activeSizeKeys.includes(sz);
                return (
                  <button
                    key={sz}
                    type="button"
                    onClick={() => handleToggleSizeKey(sz)}
                    className={`px-3 py-1 rounded-lg text-xs font-medium ${
                      isSelected ? 'bg-sky-500 text-white' : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {sz}
                  </button>
                );
              })}
            </div>

            <div className="flex gap-2 pt-2 border-t border-slate-100">
              <input
                type="text"
                value={customSizeInput}
                onChange={(e) => setCustomSizeInput(e.target.value)}
                placeholder="Saiz khas..."
                className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
              />
              <button
                type="button"
                onClick={() => handleAddCustomSize(customSizeInput)}
                disabled={!customSizeInput.trim()}
                className="px-3 py-1.5 bg-sky-500 text-white rounded-xl text-xs font-semibold disabled:bg-slate-200"
              >
                Tambah
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Streamlined Order Summary Modal */}
      {isSummaryModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="w-full max-w-md bg-white rounded-t-2xl sm:rounded-2xl p-4 space-y-3 shadow-xl max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-xs font-bold text-slate-900">Ringkasan Pesanan</h3>
              <button type="button" onClick={() => setIsSummaryModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="p-2.5 bg-slate-50 rounded-xl space-y-1.5">
                <div className="font-semibold text-slate-900">{design.title}</div>
                <div className="flex items-center gap-2 text-slate-500 text-xs">
                  <span>{totalQuantity} helai</span>
                  <span>&bull;</span>
                  <div className="inline-flex items-center gap-1.5">
                    <CourierLogo type={selectedCourier.logoType} className="h-5 w-14 shrink-0" />
                    <span className="font-medium text-slate-700">{selectedCourier.shortName || selectedCourier.name}</span>
                  </div>
                </div>
              </div>

              <div className="p-2.5 bg-slate-50 rounded-xl space-y-1">
                <div className="text-slate-500">Pelanggan: <span className="font-semibold text-slate-900">{customerName} ({customerPhone})</span></div>
                {formattedFullAddress && <div className="text-slate-500 truncate">Alamat: {formattedFullAddress}</div>}
              </div>

              <div className="p-2.5 bg-sky-50 rounded-xl space-y-1">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal:</span>
                  <span className="font-mono">{formatCurrency(quote.finalTotal)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Poskod / Penghantaran:</span>
                  <span className="font-mono">{shippingFee === 0 ? 'Percuma' : formatCurrency(shippingFee)}</span>
                </div>
                <div className="border-t border-sky-200 pt-1 flex justify-between font-bold">
                  <span>Jumlah:</span>
                  <span className="font-mono text-sky-600">{formatCurrency(grandTotalAmount)}</span>
                </div>
              </div>

              <div className="space-y-1.5 pt-1">
                <span className="text-[11px] font-semibold text-slate-800 block">Kaedah Bayaran:</span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMode('chip_online')}
                    className={`p-2.5 rounded-xl border text-left text-xs ${
                      paymentMode === 'chip_online' ? 'bg-sky-50 border-sky-500 font-semibold' : 'bg-white border-slate-200'
                    }`}
                  >
                    Online Banking (CHIP)
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMode('whatsapp_manual')}
                    className={`p-2.5 rounded-xl border text-left text-xs ${
                      paymentMode === 'whatsapp_manual' ? 'bg-emerald-50 border-emerald-500 font-semibold' : 'bg-white border-slate-200'
                    }`}
                  >
                    WhatsApp Manual
                  </button>
                </div>
              </div>

              {paymentError && (
                <div className="p-2 bg-red-50 text-red-600 text-xs rounded-xl">{paymentError}</div>
              )}
            </div>

            <div className="pt-2 space-y-2">
              <button
                type="button"
                onClick={handleConfirmAndSendOrder}
                disabled={isSubmitting}
                className="w-full py-2.5 rounded-xl bg-sky-500 hover:bg-sky-600 disabled:bg-slate-300 text-white text-xs font-bold"
              >
                {isSubmitting ? 'Memproses...' : (paymentMode === 'chip_online' ? 'Bayar Sekarang' : 'Hantar ke WhatsApp')}
              </button>
              <button
                type="button"
                onClick={() => setIsSummaryModalOpen(false)}
                className="w-full py-2 rounded-xl bg-slate-100 text-slate-600 text-xs font-medium"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Courier Selection Bottom Sheet Modal */}
      {isCourierPickerOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="w-full max-w-md bg-white rounded-t-2xl sm:rounded-2xl p-4 pb-6 space-y-3 shadow-xl max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div>
                <h3 className="text-xs font-bold text-slate-900">Pilih Kurier</h3>
                <p className="text-[10px] text-slate-400">
                  {(!addrLine.trim() || !addrPostcode.trim()) ? 'Kos pos dikira selepas alamat dimasukkan' : shippingCalculation.zoneLabel}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsCourierPickerOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="divide-y divide-slate-100 overflow-y-auto pr-1">
              {shippingCalculation.couriers.map((courier) => {
                const isSelected = selectedCourierId === courier.id;
                const hasAddress = Boolean(addrLine.trim() && addrPostcode.trim());
                return (
                  <button
                    key={courier.id}
                    type="button"
                    onClick={() => {
                      setSelectedCourierId(courier.id);
                      setIsCourierPickerOpen(false);
                    }}
                    className={`w-full py-3 px-2 flex items-center justify-between gap-3.5 text-left transition-colors rounded-xl ${
                      isSelected ? 'bg-sky-50/80 text-sky-950 font-medium' : 'hover:bg-slate-50 text-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-3.5 min-w-0 flex-1">
                      {/* Fixed Width Logo Column - Guaranteed Vertical Text Alignment */}
                      <CourierLogo type={courier.logoType} className="w-[72px] h-6 shrink-0" />

                      {/* Text Column - Perfectly Aligned */}
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-semibold text-slate-900 truncate">{courier.name}</div>
                        <div className="text-[10px] text-slate-400">{courier.estimatedDays}</div>
                      </div>
                    </div>

                    {/* Price & Selection Checkmark */}
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs font-semibold font-mono text-slate-900">
                        {!hasAddress ? '-' : courier.rate === 0 ? 'Percuma' : formatCurrency(courier.rate)}
                      </span>
                      <div className="w-5 h-5 flex items-center justify-center">
                        {isSelected && <Check className="w-4 h-4 text-sky-500 stroke-[2.5]" />}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <SizeChartModal isOpen={isSizeChartOpen} onClose={() => setIsSizeChartOpen(false)} />

      {orderSuccessModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-white rounded-2xl p-5 text-center space-y-3 shadow-xl">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
            <h3 className="text-sm font-bold text-slate-900">Tempahan Berjaya!</h3>
            <p className="text-xs text-slate-500">No. Pesanan: {orderSuccessModal.orderNumber}</p>
            <button
              type="button"
              onClick={() => {
                setOrderSuccessModal(null);
                router.push(`/history?order=${orderSuccessModal.orderNumber}`);
              }}
              className="w-full py-2.5 rounded-xl bg-sky-500 text-white text-xs font-bold"
            >
              Lihat Sejarah Pesanan
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

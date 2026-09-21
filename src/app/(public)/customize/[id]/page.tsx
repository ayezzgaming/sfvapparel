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

  const [activeView, setActiveView] = useState<'front' | 'back'>('front');
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
  const [isLookingUpPostcode, setIsLookingUpPostcode] = useState(false);
  const [saveAddressToProfile, setSaveAddressToProfile] = useState<boolean>(true);
  const [additionalNotes, setAdditionalNotes] = useState('');

  // Pilihan Kurier & Kos Penghantaran
  const [selectedCourierId, setSelectedCourierId] = useState<string>('jnt');
  const [isCourierDropdownOpen, setIsCourierDropdownOpen] = useState(false);

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

  // Malaysia Postcode auto-lookup (Sama persis seperti di halaman profil)
  const handlePostcodeChange = async (val: string) => {
    const cleaned = val.replace(/\D/g, '').slice(0, 5);
    setAddrPostcode(cleaned);

    if (cleaned.length === 5) {
      setIsLookingUpPostcode(true);
      try {
        const res = await fetch(`/api/malaysia/postcode?code=${cleaned}`);
        const data = await res.json();
        if (data.success && data.city && data.state) {
          setAddrCity(`${data.city}, ${data.state}`);
        }
      } catch {
        // Kekalkan nilai sedia ada jika ralat
      } finally {
        setIsLookingUpPostcode(false);
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
    return calculateMalaysiaShippingRates({
      postcode: addrPostcode || customer?.postal_code || '40000',
      state: addrCity || customer?.city || 'Selangor',
      totalQuantity: totalQuantity || 1,
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
        rate: 8.5,
        logoType: 'jnt' as const,
        description: 'Penghantaran standard',
        isAvailable: true,
      }
    );
  }, [shippingCalculation, selectedCourierId]);

  const shippingFee = selectedCourier?.rate || 0;
  const grandTotalAmount = quote.finalTotal + shippingFee;
  const formattedFullAddress = [addrLine, addrPostcode, addrCity].filter(Boolean).join(', ');

  // Buka Ringkasan Pesanan (Order Summary)
  const handleOpenProcessSummary = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (totalQuantity <= 0) {
      setValidationError('Sila masukkan kuantiti sekurang-kurangnya 1 helai di bahagian 2. Kuantiti.');
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

    const rosterInfo = rosterMode === 'upload' && rosterFileName
      ? `Fail Senarai Nama: ${rosterFileName}`
      : formattedManualRosterString;

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
    <div className="min-h-screen bg-[#F2F2F7] pb-32 font-ios select-none">
      {/* 1. Header Navigasi */}
      <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-slate-200/80 px-4 py-3 flex items-center justify-between">
        <button
          type="button"
          onClick={() => router.back()}
          className="p-1.5 -ml-1.5 rounded-full hover:bg-slate-100 active:scale-95 transition-all text-slate-700"
          aria-label="Kembali"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <div className="text-center min-w-0 px-2">
          <h1 className="text-xs font-bold text-slate-900 truncate">
            Borang Tempahan Kustom
          </h1>
          <p className="text-[10.5px] text-slate-500 truncate">
            {design.title}
          </p>
        </div>

        <div className="w-7" />
      </div>

      {/* Validation Error Banner */}
      {validationError && (
        <div className="max-w-md mx-auto px-4 pt-3">
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-2xl flex items-center gap-2 animate-in fade-in">
            <Info className="w-4 h-4 text-rose-500 shrink-0" />
            <span>{validationError}</span>
          </div>
        </div>
      )}

      {/* Main Form Body */}
      <form onSubmit={handleOpenProcessSummary} className="max-w-md mx-auto px-4 pt-3 space-y-4">
        
        {/* 2. Visual Mockup Corak Pilihan */}
        <div className="bg-white rounded-3xl p-4 border border-slate-200/80 shadow-xs space-y-3">
          <div className="relative aspect-square w-full rounded-2xl bg-slate-100 overflow-hidden border border-slate-100">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={
                activeView === 'front'
                  ? design.mockup_front_url
                  : (design.mockup_back_url || design.mockup_front_url)
              }
              alt={design.title}
              className="w-full h-full object-contain p-2"
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

        {/* 3. Konfigurasi Spesifikasi (Jenis Fabrik & Pola Potongan) */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs space-y-3.5">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            1. Fabrik & Pola Potongan
          </h3>

          {techniqueMode === 'sublimation' ? (
            <div className="space-y-3">
              {/* Combobox: Jenis Fabrik */}
              <div>
                <label className="text-xs font-medium text-slate-700 block mb-1">
                  Jenis Fabrik
                </label>
                <div className="relative">
                  <select
                    value={selectedFabricId}
                    onChange={(e) => setSelectedFabricId(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 appearance-none focus:outline-none focus:border-sky-500 focus:bg-white transition-all pr-9"
                  >
                    {fabrics.filter((f) => f.is_active).map((fabric) => (
                      <option key={fabric.id} value={fabric.id}>
                        {fabric.name} ({fabric.weight_gsm} GSM)
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </div>
              </div>

              {/* Combobox: Pola Potongan Kolar & Lengan */}
              <div>
                <label className="text-xs font-medium text-slate-700 block mb-1">
                  Pola Potongan
                </label>
                <div className="relative">
                  <select
                    value={selectedCutId}
                    onChange={(e) => setSelectedCutId(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 appearance-none focus:outline-none focus:border-sky-500 focus:bg-white transition-all pr-9"
                  >
                    {cuts.filter((c) => c.is_active).map((cut) => (
                      <option key={cut.id} value={cut.id}>
                        {cut.name} {cut.cut_add_on_price > 0 ? `(+${formatCurrency(cut.cut_add_on_price)})` : ''}
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </div>
              </div>

              {/* Ringkasan Asas Seunit */}
              <div className="flex items-center justify-between pt-1 px-0.5 text-xs text-slate-500">
                <span>Harga Asas Tempahan:</span>
                <span className="font-semibold text-slate-900 font-mono">
                  {formatCurrency((selectedFabric?.sublimation_base_price || 0) + (selectedCut?.cut_add_on_price || 0))} / helai
                </span>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Combobox: Saiz Cetakan DTF */}
              <div>
                <label className="text-xs font-medium text-slate-700 block mb-1">
                  Saiz Cetakan DTF
                </label>
                <div className="relative">
                  <select
                    value={selectedDtfDimId}
                    onChange={(e) => setSelectedDtfDimId(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 appearance-none focus:outline-none focus:border-sky-500 focus:bg-white transition-all pr-9"
                  >
                    {dtfDimensions.filter((d) => d.is_active).map((dim) => (
                      <option key={dim.id} value={dim.id}>
                        {dim.name} ({dim.dimensions_desc})
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </div>
              </div>

              {/* Combobox: Pakej Baju DTF */}
              <div>
                <label className="text-xs font-medium text-slate-700 block mb-1">
                  Pakej Pesanan
                </label>
                <div className="relative">
                  <select
                    value={dtfOptionType}
                    onChange={(e) => setDtfOptionType(e.target.value as 'with_garment' | 'film_only')}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 appearance-none focus:outline-none focus:border-sky-500 focus:bg-white transition-all pr-9"
                  >
                    <option value="with_garment">Baju Cotton 24s + Cetakan DTF Siap</option>
                    <option value="film_only">Filem Stiker DTF Sahaja (Tanpa Baju)</option>
                  </select>
                  <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 4. Pemilihan Saiz & Kuantiti */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs space-y-3.5">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              2. Kuantiti Mengikut Saiz
            </h3>
            
            <button
              type="button"
              onClick={() => setIsSizeChartOpen(true)}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-sky-600 hover:text-sky-700 transition-colors cursor-pointer"
            >
              <Ruler className="w-3.5 h-3.5" />
              <span>Carta Saiz</span>
            </button>
          </div>

          {activeSizeKeys.length === 0 ? (
            /* Keadaan Kosong: Butang + bersih */
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
              <span className="text-xs text-slate-500">Tekan butang + untuk tambah pilihan saiz</span>

              <button
                type="button"
                onClick={() => setIsAddSizeModalOpen(true)}
                className="w-9 h-9 rounded-xl bg-[#00BDFF] hover:bg-sky-600 text-white flex items-center justify-center shadow-sm active:scale-95 transition-all cursor-pointer shrink-0"
                title="Tambah Saiz"
                aria-label="Tambah Saiz"
              >
                <Plus className="w-5 h-5 stroke-[2.5]" />
              </button>
            </div>
          ) : (
            /* Grid Saiz Dinamik */
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
                      <button
                        type="button"
                        onClick={() => handleRemoveSizeKey(sizeKey)}
                        className="text-slate-300 hover:text-rose-500 p-0.5 rounded transition-colors"
                        title="Buang saiz ini"
                      >
                        <X className="w-3 h-3" />
                      </button>
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

              {/* Butang Tambah Saiz Icon Sahaja */}
              <button
                type="button"
                onClick={() => setIsAddSizeModalOpen(true)}
                className="p-2 rounded-2xl border-2 border-dashed border-slate-200 hover:border-[#00BDFF] bg-slate-50/50 flex items-center justify-center text-slate-400 hover:text-[#0052FF] active:scale-90 transition-all cursor-pointer min-h-[64px]"
                title="Tambah Saiz Lain"
                aria-label="Tambah Saiz Lain"
              >
                <Plus className="w-6 h-6 stroke-[2.5]" />
              </button>
            </div>
          )}

          <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100">
            <span className="text-slate-500 font-medium">Jumlah Kuantiti:</span>
            <span className="font-bold text-slate-900 font-mono text-sm">{totalQuantity} helai</span>
          </div>
        </div>

        {/* 5. Muat Naik Logo / Sponsor */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs space-y-3.5">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              3. Logo Pasukan & Penaja <span className="text-[10px] text-slate-400 font-normal lowercase">(pilihan)</span>
            </h3>
            <span className="text-[10px] text-slate-400 font-mono">PNG / JPG / PDF / AI</span>
          </div>

          <input
            ref={logoInputRef}
            type="file"
            multiple
            accept="image/*,.pdf,.ai,.eps,.zip"
            onChange={handleLogoFilesChange}
            className="hidden"
            id="logo-upload-input"
          />

          {/* Senarai Logo yang Telah Dimuat Naik */}
          {logoList.length > 0 && (
            <div className="space-y-2">
              {logoList.map((logoItem, idx) => (
                <div 
                  key={logoItem.id} 
                  className="p-2.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      {logoItem.previewUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={logoItem.previewUrl}
                          alt="Logo Preview"
                          className="w-8 h-8 rounded-lg object-contain bg-white border border-slate-200 shrink-0 p-0.5"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-lg bg-slate-200 text-slate-600 flex items-center justify-center shrink-0">
                          <Paperclip className="w-3.5 h-3.5" />
                        </div>
                      )}
                      <span className="text-xs font-medium text-slate-900 truncate">
                        {idx + 1}. {logoItem.fileName}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveLogoItem(logoItem.id)}
                      className="p-1 rounded-lg text-slate-400 hover:text-rose-500 transition-colors shrink-0"
                      title="Buang logo"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Pilihan Kedudukan Logo */}
                  <div className="flex items-center gap-2 pt-1 border-t border-slate-200/60">
                    <span className="text-[10.5px] font-medium text-slate-500 shrink-0">
                      Kedudukan:
                    </span>
                    <select
                      value={logoItem.placement}
                      onChange={(e) => handleUpdateLogoPlacement(logoItem.id, e.target.value)}
                      className="flex-1 px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-sky-500"
                    >
                      {LOGO_PLACEMENT_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </div>

                  {/* Input Khas jika pilih Lain-lain */}
                  {logoItem.placement === 'Lain-lain (Khas)' && (
                    <input
                      type="text"
                      value={logoItem.customPlacement || ''}
                      onChange={(e) => handleUpdateLogoPlacement(logoItem.id, logoItem.placement, e.target.value)}
                      placeholder="Nyatakan kedudukan logo khas"
                      className="w-full px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-sky-500"
                    />
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Butang Tambah Logo */}
          <button
            type="button"
            onClick={() => logoInputRef.current?.click()}
            className="w-full p-3 rounded-2xl border-2 border-dashed border-slate-200 hover:border-sky-400 bg-slate-50/50 flex items-center justify-center gap-2 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer text-xs font-medium"
          >
            <Upload className="w-4 h-4 text-slate-400" />
            <span>{logoList.length > 0 ? '+ Tambah Fail Logo Lain' : 'Muat naik fail logo / penaja'}</span>
          </button>
        </div>

        {/* 6. Senarai Nama & Nombor Pemain */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs space-y-3.5">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            4. Senarai Nama & Nombor <span className="text-[10px] text-slate-400 font-normal lowercase">(pilihan)</span>
          </h3>

          {/* Tab Pilihan: Tulis Manual / Upload Fail */}
          <div className="bg-slate-100 p-1 rounded-xl flex items-center">
            <button
              type="button"
              onClick={() => setRosterMode('manual')}
              className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-all ${
                rosterMode === 'manual'
                  ? 'bg-white text-slate-900 shadow-2xs font-bold'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Isian Kolom
            </button>
            <button
              type="button"
              onClick={() => setRosterMode('upload')}
              className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-all ${
                rosterMode === 'upload'
                  ? 'bg-white text-slate-900 shadow-2xs font-bold'
                  : 'text-slate-500 hover:text-slate-900'
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
                id="roster-upload-input"
              />

              {rosterFileName ? (
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <FileText className="w-5 h-5 text-sky-500 shrink-0" />
                    <span className="text-xs font-medium text-slate-900 truncate">
                      {rosterFileName}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={handleRemoveRosterFile}
                    className="p-1 rounded-lg text-slate-400 hover:text-rose-500 transition-colors shrink-0"
                    title="Buang fail"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => rosterInputRef.current?.click()}
                  className="w-full p-4 rounded-2xl border-2 border-dashed border-slate-200 hover:border-sky-400 bg-slate-50/50 flex flex-col items-center justify-center space-y-1 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                >
                  <Upload className="w-4 h-4 text-slate-400" />
                  <span className="text-xs font-medium">Pilih fail Excel, Word, atau PDF</span>
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {totalQuantity === 0 ? (
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-500 text-xs text-center">
                  Masukkan kuantiti saiz baju di atas untuk mengisi senarai nama.
                </div>
              ) : (
                <div className="space-y-3">
                  {(['dewasa', 'kids', 'muslimah'] as const).map((catKey) => {
                    const catSizes = categorizedActiveSizes[catKey];
                    if (catSizes.length === 0) return null;

                    const catTitle = SIZE_GROUPS[catKey].title;

                    return (
                      <div key={catKey} className="space-y-1.5">
                        <div className="text-[11px] font-bold text-slate-600 px-1">
                          {catTitle} ({catSizes.reduce((s, c) => s + c.qty, 0)} helai)
                        </div>

                        <div className="space-y-1.5">
                          {catSizes.map(({ sizeKey, qty }) => {
                            const entries = manualRoster[sizeKey] || [];
                            return Array.from({ length: qty }).map((_, idx) => {
                              const rowEntry = entries[idx] || { name: '', number: '' };
                              return (
                                <div
                                  key={`${sizeKey}-${idx}`}
                                  className="flex items-center gap-2 p-1.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs"
                                >
                                  {/* Badge Saiz */}
                                  <div className="w-14 px-1.5 py-1 rounded-lg bg-white border border-slate-200 text-center shrink-0">
                                    <span className="text-[10.5px] font-bold text-slate-700 truncate block">
                                      {sizeKey}
                                    </span>
                                  </div>

                                  {/* Input Nama Pemain */}
                                  <input
                                    type="text"
                                    value={rowEntry.name}
                                    onChange={(e) => handlePlayerEntryChange(sizeKey, idx, 'name', e.target.value)}
                                    placeholder={`Nama baju #${idx + 1}`}
                                    className="flex-1 min-w-0 px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-900 placeholder:text-slate-300 text-xs focus:outline-none focus:border-sky-500"
                                  />

                                  {/* Input Nombor Jersi */}
                                  <input
                                    type="text"
                                    value={rowEntry.number}
                                    onChange={(e) => handlePlayerEntryChange(sizeKey, idx, 'number', e.target.value)}
                                    placeholder="No."
                                    className="w-12 px-2 py-1 rounded-lg bg-white border border-slate-200 text-center font-mono font-bold text-slate-900 placeholder:text-slate-300 text-xs focus:outline-none focus:border-sky-500 shrink-0"
                                  />
                                </div>
                              );
                            });
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* 7. Maklumat Pelanggan, Alamat & Pilihan Kurier */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs space-y-4">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            5. Maklumat Pelanggan & Penghantaran
          </h3>

          <div className="space-y-3">
            {/* Nama & WhatsApp */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Nama Penuh <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Nama wakil pelanggan"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-sky-500 focus:bg-white transition-all"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  No. WhatsApp <span className="text-rose-500">*</span>
                </label>
                <input
                  type="tel"
                  required
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="012-3456789"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-sky-500 focus:bg-white transition-all"
                />
              </div>
            </div>

            {/* Nama Pasukan (Pilihan) */}
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Nama Pasukan / Syarikat <span className="text-[10px] text-slate-400 font-normal">(pilihan)</span>
              </label>
              <input
                type="text"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                placeholder="cth: Harimau FC"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-sky-500 focus:bg-white transition-all"
              />
            </div>

            {/* Inset Alamat Penghantaran Malaysia dengan Input Group */}
            <div className="space-y-1.5 pt-1">
              <label className="text-xs font-semibold text-slate-700 block">
                Alamat Penghantaran
              </label>

              <div className="border border-slate-200 rounded-2xl bg-slate-50/50 overflow-hidden divide-y divide-slate-200/80">
                {/* Poskod & Bandar / Negeri */}
                <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-slate-200/80 bg-white">
                  <div className="p-2.5 sm:col-span-1">
                    <label className="block text-[10px] font-semibold text-slate-400 mb-0.5">
                      Poskod {isLookingUpPostcode && <span className="text-sky-500 font-normal">(Mengesahkan...)</span>}
                    </label>
                    <input
                      type="text"
                      value={addrPostcode}
                      onChange={(e) => handlePostcodeChange(e.target.value)}
                      placeholder="50450"
                      maxLength={5}
                      className="w-full text-xs font-semibold text-slate-900 bg-transparent focus:outline-none placeholder:text-slate-300 font-mono"
                    />
                  </div>
                  <div className="p-2.5 sm:col-span-2 bg-slate-50/70">
                    <label className="block text-[10px] font-semibold text-slate-400 mb-0.5">
                      Bandar & Negeri (Automatik)
                    </label>
                    <input
                      type="text"
                      value={addrCity}
                      onChange={(e) => setAddrCity(e.target.value)}
                      placeholder="Kuala Lumpur, WP Kuala Lumpur"
                      className="w-full text-xs text-slate-800 bg-transparent focus:outline-none placeholder:text-slate-300 font-medium"
                    />
                  </div>
                </div>

                {/* Alamat Jalan / Rumah */}
                <div className="p-2.5 bg-white">
                  <label className="block text-[10px] font-semibold text-slate-400 mb-0.5">
                    Alamat Jalan / No. Rumah
                  </label>
                  <textarea
                    rows={2}
                    value={addrLine}
                    onChange={(e) => setAddrLine(e.target.value)}
                    placeholder="No. rumah, nama jalan, taman perumahan"
                    className="w-full text-xs text-slate-900 bg-transparent focus:outline-none placeholder:text-slate-300 resize-none leading-relaxed"
                  />
                </div>
              </div>

              {/* Checkbox Simpan Alamat ke Profil */}
              <label className="inline-flex items-center gap-2 cursor-pointer pt-0.5 select-none">
                <input
                  type="checkbox"
                  checked={saveAddressToProfile}
                  onChange={(e) => setSaveAddressToProfile(e.target.checked)}
                  className="rounded text-sky-500 focus:ring-sky-400 w-3.5 h-3.5 cursor-pointer"
                />
                <span className="text-[11px] text-slate-500">
                  Simpan alamat ini ke profil akaun saya
                </span>
              </label>
            </div>

            {/* Pilihan Kurier (Dropdown Rapi) */}
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-700 block">
                  Pilihan Kurier
                </label>
                <span className="text-[10.5px] text-slate-400">
                  ~{shippingCalculation.estimatedWeightKg}kg &bull; {shippingCalculation.zoneLabel}
                </span>
              </div>

              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsCourierDropdownOpen((prev) => !prev)}
                  className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-left flex items-center justify-between gap-3 hover:border-slate-300 focus:outline-none transition-all shadow-2xs cursor-pointer"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <CourierLogo type={selectedCourier.logoType} className="w-8 h-8 shrink-0" />
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-slate-900 truncate">
                        {selectedCourier.name}
                      </div>
                      <div className="text-[10.5px] text-slate-400 truncate">
                        {selectedCourier.estimatedDays} &bull; {selectedCourier.description}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs font-bold text-slate-900 font-mono">
                      {shippingFee === 0 ? 'Percuma' : formatCurrency(shippingFee)}
                    </span>
                    <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isCourierDropdownOpen ? 'rotate-180' : ''}`} />
                  </div>
                </button>

                {isCourierDropdownOpen && (
                  <div className="absolute top-full left-0 right-0 mt-1 z-20 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden divide-y divide-slate-100 animate-in fade-in zoom-in-95 duration-150">
                    {shippingCalculation.couriers.map((courier) => {
                      const isSelected = selectedCourierId === courier.id;
                      return (
                        <div
                          key={courier.id}
                          onClick={() => {
                            setSelectedCourierId(courier.id);
                            setIsCourierDropdownOpen(false);
                          }}
                          className={`p-2.5 flex items-center justify-between gap-3 cursor-pointer transition-colors ${
                            isSelected ? 'bg-sky-50 text-sky-900' : 'hover:bg-slate-50 text-slate-800'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <CourierLogo type={courier.logoType} className="w-7 h-7 shrink-0" />
                            <div className="min-w-0">
                              <div className="text-xs font-medium truncate flex items-center gap-1.5">
                                <span>{courier.name}</span>
                                {courier.serviceType === 'same_day' && (
                                  <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-orange-100 text-orange-700">
                                    Same Day
                                  </span>
                                )}
                              </div>
                              <div className="text-[10px] text-slate-400 truncate">
                                {courier.estimatedDays} &bull; {courier.description}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-xs font-bold font-mono">
                              {courier.rate === 0 ? 'Percuma' : formatCurrency(courier.rate)}
                            </span>
                            {isSelected && <Check className="w-4 h-4 text-sky-600" />}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Nota Tambahan */}
            <div className="pt-1">
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Nota Tambahan <span className="text-[10px] text-slate-400 font-normal">(pilihan)</span>
              </label>
              <textarea
                rows={2}
                value={additionalNotes}
                onChange={(e) => setAdditionalNotes(e.target.value)}
                placeholder="Sebarang arahan khas atau catatan untuk pesanan anda..."
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-sky-500 focus:bg-white transition-all leading-relaxed resize-none"
              />
            </div>
          </div>
        </div>

        {/* 8. Fixed Bottom Sticky Bar Ringkasan Sebut Harga & Butang Proses */}
        <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto z-40 bg-white/95 backdrop-blur-xl border-t border-slate-200/90 p-3 px-4 pb-[calc(env(safe-area-inset-bottom,0px)+0.75rem)] shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
          <div className="flex items-center justify-between gap-3">
            {/* Price Column */}
            <div className="min-w-0">
              <div className="text-[10.5px] text-slate-400 font-medium truncate">
                {totalQuantity} helai {shippingFee > 0 ? `+ Pos ${formatCurrency(shippingFee)}` : ''}
              </div>
              <div className="text-base font-black text-slate-900 font-mono leading-tight">
                {formatCurrency(grandTotalAmount)}
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
                className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 text-[#25D366] hover:bg-emerald-100 flex items-center justify-center shrink-0 active:scale-95 transition-all"
              >
                <FaWhatsapp className="w-5 h-5" />
              </a>

              {/* Submit / Process Order Button */}
              <button
                type="submit"
                disabled={totalQuantity <= 0}
                className="h-10 px-5 rounded-xl bg-[#00BDFF] hover:bg-sky-600 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold text-xs flex items-center justify-center gap-1.5 active:scale-95 transition-all cursor-pointer shadow-sm"
              >
                <span>Teruskan</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </form>

      {/* Modal Tambah Pilihan Saiz Berkelompok (Dewasa, Kids, Muslimah) */}
      {isAddSizeModalOpen && (
        <div className="fixed inset-0 z-[2000] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200 font-ios">
          <div className="w-full max-w-sm bg-white rounded-3xl p-5 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">
                Pilihan Saiz Baju
              </h3>
              <button
                type="button"
                onClick={() => setIsAddSizeModalOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Tabs Kelompok: Dewasa / Kids / Muslimah */}
            <div className="bg-slate-100 p-1 rounded-xl flex items-center gap-1">
              {(['dewasa', 'kids', 'muslimah'] as const).map((tabKey) => (
                <button
                  key={tabKey}
                  type="button"
                  onClick={() => setSizeModalTab(tabKey)}
                  className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                    sizeModalTab === tabKey
                      ? 'bg-white text-blue-600 shadow-2xs font-bold'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  {tabKey === 'dewasa' ? 'Dewasa' : tabKey === 'kids' ? 'Kanak-Kanak' : 'Muslimah'}
                </button>
              ))}
            </div>

            {/* Senarai Saiz Mengikut Tab Kelompok */}
            <div>
              <label className="text-[11px] font-semibold text-slate-600 block mb-2">
                Tekan untuk aktifkan / padam saiz:
              </label>
              <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto pr-1">
                {SIZE_GROUPS[sizeModalTab].sizes.map((sz) => {
                  const isSelected = activeSizeKeys.includes(sz);
                  return (
                    <button
                      key={sz}
                      type="button"
                      onClick={() => handleToggleSizeKey(sz)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1 cursor-pointer ${
                        isSelected
                          ? 'bg-[#00BDFF] text-white shadow-2xs'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3" />}
                      <span>{sz}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Input Saiz Kustom Manual */}
            <div className="pt-2 border-t border-slate-100 space-y-1.5">
              <label className="text-[11px] font-semibold text-slate-600 block">
                Atau Tambah Saiz Tersuai Sendiri:
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customSizeInput}
                  onChange={(e) => setCustomSizeInput(e.target.value)}
                  placeholder="cth: 9XL / Bayi 6-12m"
                  className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#00BDFF]"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddCustomSize(customSizeInput);
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={() => handleAddCustomSize(customSizeInput)}
                  disabled={!customSizeInput.trim()}
                  className="px-4 py-2 rounded-xl bg-[#00BDFF] hover:bg-sky-600 disabled:bg-slate-200 text-white text-xs font-bold transition-all cursor-pointer"
                >
                  Tambah
                </button>
              </div>
            </div>

            <div className="pt-1">
              <button
                type="button"
                onClick={() => setIsAddSizeModalOpen(false)}
                className="w-full py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-all cursor-pointer text-center"
              >
                Selesai
              </button>
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
                  <span className="text-slate-400">Logo Dimuat Naik:</span>
                  <span className="font-medium text-slate-900 truncate max-w-[180px]">
                    {logoList.length > 0 ? `${logoList.length} fail logo/penaja` : 'Tiada'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Senarai Nama:</span>
                  <span className="font-medium text-slate-900 truncate max-w-[180px]">
                    {rosterMode === 'upload' && rosterFileName ? rosterFileName : 'Borang Kolom Isian'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Pilihan Kurier:</span>
                  <span className="font-semibold text-slate-900">
                    {selectedCourier.name}
                  </span>
                </div>
                {formattedFullAddress && (
                  <div className="flex justify-between">
                    <span className="text-slate-400 shrink-0">Alamat:</span>
                    <span className="font-medium text-slate-800 text-right truncate max-w-[200px]" title={formattedFullAddress}>
                      {formattedFullAddress}
                    </span>
                  </div>
                )}
              </div>

              {/* Perincian Sebut Harga & Kos Kurier */}
              <div className="p-3.5 rounded-2xl bg-sky-50/70 border border-sky-100 text-xs space-y-1.5">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal Pakaian ({totalQuantity} helai):</span>
                  <span className="font-mono">{formatCurrency(quote.finalTotal)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Kos Penghantaran ({selectedCourier.shortName}):</span>
                  <span className="font-mono font-semibold text-slate-900">
                    {shippingFee === 0 ? 'Percuma' : formatCurrency(shippingFee)}
                  </span>
                </div>
                {quote.discountPercentage > 0 && (
                  <div className="flex justify-between text-emerald-600 font-semibold">
                    <span>Diskaun Pukal ({quote.discountPercentage}%):</span>
                    <span className="font-mono">-{formatCurrency(quote.unitDiscountAmount)}/helai</span>
                  </div>
                )}
                <div className="border-t border-sky-200/60 pt-1.5 flex justify-between items-baseline font-bold">
                  <span className="text-slate-900">Jumlah Keseluruhan:</span>
                  <span className="text-base text-[#0052FF] font-mono font-black">{formatCurrency(grandTotalAmount)}</span>
                </div>
              </div>

              {/* Pilihan Kaedah Pembayaran */}
              <div className="space-y-2 pt-1">
                <span className="text-[11px] font-bold text-slate-800 block">
                  Pilih Kaedah Pembayaran:
                </span>
                
                <div className="grid grid-cols-1 gap-2">
                  {/* Option 1: CHIP Gateway */}
                  <div
                    onClick={() => {
                      setPaymentMode('chip_online');
                      setPaymentError(null);
                    }}
                    className={`p-3 rounded-2xl border cursor-pointer transition-all flex items-start justify-between gap-3 ${
                      paymentMode === 'chip_online'
                        ? 'bg-blue-50/60 border-[#00BDFF] ring-1.5 ring-[#00BDFF]'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-start gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#00BDFF] to-[#0052FF] text-white flex items-center justify-center shrink-0 shadow-2xs mt-0.5">
                        <CreditCard className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-slate-900">Bayar Dalam Talian (CHIP Gateway)</span>
                          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800">
                            Pantas
                          </span>
                        </div>
                        <p className="text-[10.5px] text-slate-500 mt-0.5">
                          FPX Online Banking, Kad Debit/Kredit, DuitNow QR & e-Wallet
                        </p>
                      </div>
                    </div>
                    <input
                      type="radio"
                      checked={paymentMode === 'chip_online'}
                      onChange={() => setPaymentMode('chip_online')}
                      className="mt-1 text-[#00BDFF] focus:ring-[#00BDFF]"
                    />
                  </div>

                  {/* Option 2: WhatsApp Manual */}
                  <div
                    onClick={() => {
                      setPaymentMode('whatsapp_manual');
                      setPaymentError(null);
                    }}
                    className={`p-3 rounded-2xl border cursor-pointer transition-all flex items-start justify-between gap-3 ${
                      paymentMode === 'whatsapp_manual'
                        ? 'bg-emerald-50/60 border-emerald-500 ring-1.5 ring-emerald-500'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-start gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-xl bg-[#25D366] text-white flex items-center justify-center shrink-0 shadow-2xs mt-0.5">
                        <FaWhatsapp className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-slate-900 block">Bincang & Bayar di WhatsApp</span>
                        <p className="text-[10.5px] text-slate-500 mt-0.5">
                          Invois manual, semakan artwork tambahan & pemindahan bank terus
                        </p>
                      </div>
                    </div>
                    <input
                      type="radio"
                      checked={paymentMode === 'whatsapp_manual'}
                      onChange={() => setPaymentMode('whatsapp_manual')}
                      className="mt-1 text-emerald-600 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              </div>

              {/* Payment Error Notification */}
              {paymentError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                  <Info className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{paymentError}</span>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="pt-2 space-y-2">
              {paymentMode === 'chip_online' ? (
                <button
                  type="button"
                  onClick={handleConfirmAndSendOrder}
                  disabled={isSubmitting}
                  className="w-full py-3.5 rounded-xl bg-[#0052FF] hover:bg-[#0041CC] disabled:bg-slate-300 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-sm active:scale-95 transition-all cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span>Menyambung Pembayaran...</span>
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-4 h-4" />
                      <span>Bayar Sekarang ({formatCurrency(grandTotalAmount)})</span>
                    </>
                  )}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleConfirmAndSendOrder}
                  disabled={isSubmitting}
                  className="w-full py-3.5 rounded-xl bg-[#25D366] hover:bg-emerald-600 disabled:bg-slate-300 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-sm active:scale-95 transition-all cursor-pointer"
                >
                  {isSubmitting ? (
                    <span>Memproses Pesanan...</span>
                  ) : (
                    <>
                      <FaWhatsapp className="w-4 h-4" />
                      <span>Hantar ke WhatsApp</span>
                    </>
                  )}
                </button>
              )}

              <button
                type="button"
                onClick={() => setIsSummaryModalOpen(false)}
                disabled={isSubmitting}
                className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-semibold active:scale-95 transition-all cursor-pointer"
              >
                Kembali
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

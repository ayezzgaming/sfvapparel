export interface CourierOption {
  id: string;
  name: string;
  shortName: string;
  serviceType: 'standard' | 'express' | 'same_day' | 'pickup';
  estimatedDays: string;
  rate: number;
  logoType: 'jnt' | 'poslaju' | 'ninjavan' | 'flash' | 'lalamove' | 'dhl' | 'citylink' | 'pickup';
  description: string;
  isAvailable: boolean;
}

export interface ShippingCalculationParams {
  postcode: string;
  state?: string;
  city?: string;
  totalQuantity: number; // in pieces
  itemWeightKg?: number; // per piece, default 0.20kg
}

/**
 * Identify destination zone from Malaysia 5-digit postcode
 */
export function getMalaysiaZone(postcode: string, state?: string): 'klang_valley' | 'peninsular' | 'east_malaysia' {
  const cleanPostcode = postcode.replace(/\D/g, '').slice(0, 5);
  const prefix2 = cleanPostcode.slice(0, 2);
  const prefix3 = cleanPostcode.slice(0, 3);
  const numPrefix = parseInt(prefix2, 10);

  // Sabah, Sarawak, Labuan (87000 - 98999)
  if ((numPrefix >= 87 && numPrefix <= 98) || (state && /sabah|sarawak|labuan/i.test(state))) {
    return 'east_malaysia';
  }

  // Klang Valley / Selangor / KL / Putrajaya (40xxx-48xxx, 50xxx-60xxx, 62xxx)
  if (
    (numPrefix >= 40 && numPrefix <= 48) ||
    (numPrefix >= 50 && numPrefix <= 60) ||
    prefix3 === '620' ||
    prefix3 === '621' ||
    prefix3 === '622' ||
    (state && /kuala lumpur|putrajaya|selangor/i.test(state))
  ) {
    return 'klang_valley';
  }

  // Rest of Peninsular Malaysia
  return 'peninsular';
}

/**
 * Calculate multi-courier shipping rates for Malaysia
 */
export function calculateMalaysiaShippingRates(params: ShippingCalculationParams): {
  zone: 'klang_valley' | 'peninsular' | 'east_malaysia';
  zoneLabel: string;
  estimatedWeightKg: number;
  couriers: CourierOption[];
} {
  const { postcode, state, totalQuantity, itemWeightKg = 0.20 } = params;
  const qty = Math.max(0, totalQuantity || 0);
  const zone = getMalaysiaZone(postcode, state);

  const zoneLabel =
    zone === 'klang_valley'
      ? 'Lembah Klang & Selangor (Zon 1)'
      : zone === 'peninsular'
      ? 'Semenanjung Malaysia (Zon 2)'
      : 'Sabah & Sarawak (Zon 3 - Pos Udara)';

  if (qty <= 0) {
    return {
      zone,
      zoneLabel,
      estimatedWeightKg: 0,
      couriers: [],
    };
  }

  const weightKg = Math.max(0.5, Math.ceil(qty * itemWeightKg * 10) / 10);

  // Rate formulas based on market aggregator standard pricing in Malaysia (EasyParcel / Delyva standard)
  let jntRate = 0;
  let poslajuRate = 0;
  let ninjaRate = 0;
  let flashRate = 0;
  let dhlRate = 0;
  let lalamoveRate = 0;

  if (zone === 'klang_valley') {
    // Base 1kg = RM7, every add 1kg = RM1.50
    const extraKg = Math.max(0, Math.ceil(weightKg) - 1);
    jntRate = 7.0 + extraKg * 1.5;
    poslajuRate = 7.5 + extraKg * 2.0;
    ninjaRate = 7.0 + extraKg * 1.5;
    flashRate = 6.5 + extraKg * 1.5;
    dhlRate = 8.5 + extraKg * 2.0;
    // Lalamove instant same-day express (car/van/bike based on quantity)
    lalamoveRate = qty > 30 ? 35.0 : qty > 10 ? 22.0 : 15.0;
  } else if (zone === 'peninsular') {
    const extraKg = Math.max(0, Math.ceil(weightKg) - 1);
    jntRate = 8.5 + extraKg * 1.8;
    poslajuRate = 9.0 + extraKg * 2.2;
    ninjaRate = 8.5 + extraKg * 1.8;
    flashRate = 8.0 + extraKg * 1.8;
    dhlRate = 10.0 + extraKg * 2.5;
    lalamoveRate = 0; // Not available outside Klang Valley
  } else {
    // East Malaysia (Sabah/Sarawak Air Freight)
    const extraKg = Math.max(0, Math.ceil(weightKg) - 1);
    poslajuRate = 15.0 + extraKg * 6.5;
    jntRate = 16.0 + extraKg * 7.5;
    ninjaRate = 15.5 + extraKg * 7.0;
    flashRate = 15.0 + extraKg * 6.8;
    dhlRate = 18.0 + extraKg * 8.0;
    lalamoveRate = 0;
  }

  const couriers: CourierOption[] = [
    {
      id: 'jnt',
      name: 'J&T Express Malaysia',
      shortName: 'J&T Express',
      serviceType: 'standard',
      estimatedDays: zone === 'east_malaysia' ? '3 - 5 Hari' : '1 - 2 Hari Bekerja',
      rate: Math.round(jntRate * 100) / 100,
      logoType: 'jnt',
      description: 'Penghantaran pantas ke seluruh Malaysia dengan tracking SMS automatik.',
      isAvailable: true,
    },
    {
      id: 'poslaju',
      name: 'Pos Laju (Pos Malaysia)',
      shortName: 'Pos Laju',
      serviceType: 'standard',
      estimatedDays: zone === 'east_malaysia' ? '3 - 5 Hari' : '1 - 3 Hari Bekerja',
      rate: Math.round(poslajuRate * 100) / 100,
      logoType: 'poslaju',
      description: 'Kurier rasmi nasional dengan liputan zon pedalaman & pulau terluas.',
      isAvailable: true,
    },
    {
      id: 'ninjavan',
      name: 'Ninja Van Malaysia',
      shortName: 'Ninja Van',
      serviceType: 'standard',
      estimatedDays: zone === 'east_malaysia' ? '4 - 6 Hari' : '2 - 3 Hari Bekerja',
      rate: Math.round(ninjaRate * 100) / 100,
      logoType: 'ninjavan',
      description: 'Penghantaran terus ke pintu rumah (*door-to-door doorstep delivery*).',
      isAvailable: true,
    },
    {
      id: 'flash',
      name: 'Flash Express Malaysia',
      shortName: 'Flash Express',
      serviceType: 'standard',
      estimatedDays: zone === 'east_malaysia' ? '4 - 6 Hari' : '2 - 3 Hari Bekerja',
      rate: Math.round(flashRate * 100) / 100,
      logoType: 'flash',
      description: 'Pilihan jimat & efisien untuk penghantaran bungkusan jersi.',
      isAvailable: true,
    },
  ];

  // Add Lalamove if in Klang Valley
  if (zone === 'klang_valley') {
    couriers.push({
      id: 'lalamove',
      name: 'Lalamove Express (Same Day)',
      shortName: 'Lalamove',
      serviceType: 'same_day',
      estimatedDays: 'Hari Yang Sama (Same-day)',
      rate: Math.round(lalamoveRate * 100) / 100,
      logoType: 'lalamove',
      description: 'Penghantaran segera terus dari kilang ke lokasi anda sejurus tempahan siap.',
      isAvailable: true,
    });
  }

  // Add Factory Self Pickup option
  couriers.push({
    id: 'self_pickup',
    name: 'Ambil Sendiri di Kilang (Self-Pickup)',
    shortName: 'Self-Pickup',
    serviceType: 'pickup',
    estimatedDays: 'Sedia diambil bila siap',
    rate: 0.0,
    logoType: 'pickup',
    description: 'Ambil terus di kilang SVF Apparel tanpa sebarang caj kurier.',
    isAvailable: true,
  });

  return {
    zone,
    zoneLabel,
    estimatedWeightKg: weightKg,
    couriers,
  };
}

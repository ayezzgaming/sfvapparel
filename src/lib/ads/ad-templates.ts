import { AdCreative, AdPlatformConnection, AdCampaign } from '@/types/ads';

export const INITIAL_PLATFORMS: AdPlatformConnection[] = [
  {
    id: 'facebook',
    name: 'Facebook Ads',
    description: 'Pengiklanan di Facebook Feed, Reels, dan Video Berita.',
    isConnected: false,
    insight: {
      totalSpent: 0,
      totalLeads: 0,
      costPerLead: 0,
      healthScore: 'perlu_perhatian',
      humanAdvice: 'Akaun Meta Ads belum disambungkan. Sambungkan kunci API rasmi untuk kawalan kempen secara langsung.',
      nextStepRecommendation: 'Klik butang Sambung untuk menyambungkan Meta Ads Manager.'
    }
  },
  {
    id: 'instagram',
    name: 'Instagram Ads',
    description: 'Pengiklanan visual estetik di Instagram Feed, Stories, dan Reels.',
    isConnected: false,
    insight: {
      totalSpent: 0,
      totalLeads: 0,
      costPerLead: 0,
      healthScore: 'perlu_perhatian',
      humanAdvice: 'Akaun Instagram Ads belum disambungkan.',
      nextStepRecommendation: 'Klik butang Sambung untuk menyambungkan profil Instagram Business anda.'
    }
  },
  {
    id: 'google',
    name: 'Google Ads',
    description: 'Kempen Carian Niat Tinggi (Search Intent) & Pameran.',
    isConnected: false,
    insight: {
      totalSpent: 0,
      totalLeads: 0,
      costPerLead: 0,
      healthScore: 'perlu_perhatian',
      humanAdvice: 'Akaun Google Ads belum disambungkan.',
      nextStepRecommendation: 'Klik butang Sambung untuk menghubungkan Google Customer ID & Developer Token.'
    }
  },
  {
    id: 'tiktok',
    name: 'TikTok Ads',
    description: 'Kempen video pendek In-Feed Ads dengan sasaran audiens sukan belia.',
    isConnected: false,
    insight: {
      totalSpent: 0,
      totalLeads: 0,
      costPerLead: 0,
      healthScore: 'perlu_perhatian',
      humanAdvice: 'Akaun belum disambungkan. Sambungkan akaun TikTok for Business anda untuk membuka potensi audiens sukan belia.',
      nextStepRecommendation: 'Tekan butang Sambung Akaun untuk mengaktifkan pelancaran kempen video automatik.'
    }
  },
  {
    id: 'whatsapp',
    name: 'WhatsApp Cloud API',
    description: 'Pengiklanan terus ke perbualan WhatsApp perniagaan Click-to-Chat.',
    isConnected: false,
    insight: {
      totalSpent: 0,
      totalLeads: 0,
      costPerLead: 0,
      healthScore: 'perlu_perhatian',
      humanAdvice: 'WhatsApp Business API belum disambungkan.',
      nextStepRecommendation: 'Klik butang Sambung untuk menghubungkan nombor rasmi WhatsApp Cloud API.'
    }
  },
];

export const HEADLINE_PRESETS = [
  'Kilang Cetak Jersi Sublimasi & DTF No. 1 Malaysia',
  'Tempah Jersi Pasukan Anda | Siap Pantas 7-10 Hari',
  'Kain Drifit Premium Anti-Peluh | Rekaan Percuma',
  'Pakar Cetakan Baju DTF Pukal & Sublimasi Penuh',
  'Tawaran Khas Jersi Korporat & Sukan | Diskaun Kuantiti',
];

export const PRIMARY_TEXT_PRESETS = [
  'Mencari kilang jersi sublimasi yang pantas dan berkualiti? SFV APPAREL menyediakan cetakan berkualiti tinggi, warna tajam tak luntur, dan kain Drifit Milano yang sejuk dipakai. Dapatkan sebut harga segera!',
  'Jersi kustom berkualiti eksport untuk pasukan bola sepak, esports, futsal & syarikat anda. Minimum order serendah 10 helai dengan rekaan eksklusif. Tekan pautan untuk berhubung dengan team kami!',
  'Cetak baju DTF & jersi sublimasi terus dari kilang dengan harga borong. Kualiti warna ultra-vibrant, kemasan jahitan kemas, dan penghantaran selamat ke seluruh Malaysia.',
];

export const INITIAL_CAMPAIGNS: AdCampaign[] = [
  {
    id: 'camp-1',
    name: 'Google Search - Jersi Sublimasi 2026',
    platform: 'google',
    objective: 'whatsapp_leads',
    status: 'active',
    dailyBudget: 50.00,
    spent: 420.00,
    clicks: 312,
    impressions: 4820,
    leadsOrConversions: 48,
    cpc: 1.34,
    createdAt: '2026-09-10',
    evaluationNote: 'Prestasi cemerlang dari carian Google Search. Kos seunit prospek RM8.75 dengan potensi pesanan pukal.',
    creative: {
      id: 'cr-1',
      productName: 'Jersi Sukan Sublimasi E-Sports & Kelab',
      imageUrl: '/images/prod_sportswear.jpg',
      headline: 'Kilang Cetak Jersi Sublimasi & Baju DTF',
      secondaryHeadline: 'Tempah Terus Dari Kilang | Harga Borong',
      primaryText: 'Pakar cetak jersi sukan & korporat di Malaysia. Kain sejuk berkualiti, jahitan kemas, siap 7 hari.',
      callToAction: 'Dapatkan Sebut Harga',
      targetUrl: 'https://sfvapparel.my/catalog',
      whatsappMessage: 'Salam SFV APPAREL, saya berminat untuk buat tempahan jersi melalui iklan Google.',
      tags: ['jersi', 'sublimasi', 'kilang'],
    },
  },
  {
    id: 'camp-2',
    name: 'Meta Ads - Promo Jersi Pasukan Bola',
    platform: 'facebook',
    objective: 'whatsapp_leads',
    status: 'active',
    dailyBudget: 40.00,
    spent: 310.00,
    clicks: 580,
    impressions: 12400,
    leadsOrConversions: 62,
    cpc: 0.53,
    createdAt: '2026-09-12',
    evaluationNote: 'Kadar respon WhatsApp sangat tinggi (62 prospek masuk). Disarankan terus kekalkan visual pemain sukan.',
    creative: {
      id: 'cr-2',
      productName: 'Jersi Sukan Sublimasi E-Sports & Kelab',
      imageUrl: '/images/prod_merchandise.jpg',
      headline: 'Jersi Sukan Kustom Eksklusif | Kain Milano Sejuk',
      primaryText: 'Upgrade jersi team anda sekarang! Cetakan sublimasi penuh warna tahan luntur & rekaan mantap.',
      callToAction: 'Kirim Mesej WhatsApp',
      targetUrl: 'https://sfvapparel.my',
      whatsappMessage: 'Hai SFV APPAREL, saya nak tanya pasal promo jersi sukan.',
      tags: ['esports', 'jersey', 'bola'],
    },
  },
];

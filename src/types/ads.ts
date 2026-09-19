export type AdPlatform = 'facebook' | 'instagram' | 'google' | 'tiktok' | 'whatsapp' | 'meta';

export type AdObjective =
  | 'whatsapp_leads'
  | 'catalog_sales'
  | 'brand_awareness'
  | 'traffic';

export interface PlatformInsight {
  totalSpent: number;
  totalLeads: number;
  costPerLead: number;
  healthScore: 'cemerlang' | 'baik' | 'perlu_perhatian';
  humanAdvice: string;
  nextStepRecommendation: string;
}

export interface AdPlatformConnection {
  id: AdPlatform;
  name: string;
  description: string;
  isConnected: boolean;
  accountId?: string;
  accountName?: string;
  profilePictureUrl?: string;
  lastSynced?: string;
  currency?: string;
  balance?: number;
  pixelId?: string;
  insight?: PlatformInsight;
}

export interface AdCreative {
  id: string;
  designId?: string;
  productName: string;
  imageUrl: string;
  headline: string;
  secondaryHeadline?: string;
  primaryText: string;
  callToAction: string;
  targetUrl: string;
  whatsappMessage?: string;
  tags: string[];
}

export interface AdCampaign {
  id: string;
  name: string;
  platform: AdPlatform;
  objective: AdObjective;
  status: 'active' | 'paused' | 'draft';
  dailyBudget: number;
  spent: number;
  clicks: number;
  linkClicks?: number;
  impressions: number;
  reach?: number;
  leadsOrConversions: number;
  resultLabel?: string;
  cpc: number;
  createdAt: string;
  creative: AdCreative;
  evaluationNote?: string;
  rawActions?: { type: string; value: number }[];
  targetingSpec?: any;
}

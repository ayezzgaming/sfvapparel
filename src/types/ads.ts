export type AdPlatform = 'google' | 'meta' | 'tiktok' | 'whatsapp';

export type AdObjective =
  | 'whatsapp_leads'
  | 'catalog_sales'
  | 'brand_awareness'
  | 'traffic';

export interface AdPlatformConnection {
  id: AdPlatform;
  name: string;
  description: string;
  isConnected: boolean;
  accountId?: string;
  accountName?: string;
  lastSynced?: string;
  currency?: string;
  balance?: number;
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
  impressions: number;
  leadsOrConversions: number;
  cpc: number;
  createdAt: string;
  creative: AdCreative;
}

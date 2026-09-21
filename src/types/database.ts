export type PrintType = 'sublimation' | 'dtf' | 'both';

export type OrderStatus =
  | 'pending_proof'
  | 'proof_approved'
  | 'in_printing'
  | 'heat_press'
  | 'sewing'
  | 'qc_check'
  | 'ready_to_ship'
  | 'delivered'
  | 'cancelled';

export type PaymentStatus =
  | 'unpaid'
  | 'deposit_pending'
  | 'deposit_paid'
  | 'balance_pending'
  | 'paid'
  | 'failed'
  | 'refunded';

export interface PaymentGatewayConfig {
  id: string;
  provider: 'chip' | 'toyyibpay' | 'manual';
  brand_id: string;
  api_key: string;
  public_key?: string;
  is_active: boolean;
  is_sandbox: boolean;
  webhook_url?: string;
  payment_methods?: string[];
  created_at?: string;
  updated_at?: string;
}

export interface Design {
  id: string;
  code?: string; // e.g. "SFV0001"
  title: string;
  category: string;
  print_type: PrintType;
  thumbnail_url: string;
  mockup_front_url: string;
  mockup_back_url?: string;
  description?: string;
  tags: string[];
  is_featured?: boolean;
  is_active?: boolean;
  created_at?: string;
}

export interface FabricMaterial {
  id: string;
  name: string;
  code: string;
  weight_gsm: number;
  breathability: 'Standard' | 'High' | 'Ultra Breathable';
  sublimation_base_price: number;
  description?: string;
  is_popular?: boolean;
  is_active: boolean;
  sort_order: number;
}

export interface ApparelCut {
  id: string;
  name: string;
  code: string;
  cut_add_on_price: number;
  description?: string;
  is_active: boolean;
  sort_order: number;
}

export interface DtfDimension {
  id: string;
  name: string;
  code: string;
  dimensions_desc: string;
  base_price: number;
  is_meter_rate: boolean;
  garment_included_base_price: number;
  description?: string;
  is_active: boolean;
  sort_order: number;
}

export interface QuantityTierDiscount {
  id: string;
  tier_label: string;
  min_qty: number;
  max_qty: number | null;
  discount_percentage: number;
}

export interface Customer {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  company_or_team?: string;
  address?: string;
  city?: string;
  postal_code?: string;
  notes?: string;
  total_orders: number;
  total_spent: number;
  created_at?: string;
}

export type SizingMatrix = Record<string, number>; // e.g. { XS: 0, S: 2, M: 5, L: 8, XL: 3, "2XL": 1 }

export interface Order {
  id: string;
  order_number: string;
  customer_id?: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  print_type: 'sublimation' | 'dtf';
  
  // Design
  design_id?: string;
  design_title: string;
  mockup_url?: string;
  custom_artwork_url?: string;
  
  // Sublimation specs
  fabric_material_id?: string;
  fabric_name?: string;
  apparel_cut_id?: string;
  cut_name?: string;
  
  // DTF specs
  dtf_dimension_id?: string;
  dtf_dimension_name?: string;
  dtf_option_type?: 'film_only' | 'with_garment';
  garment_blank_color?: string;
  
  // Quantity & Sizing
  sizing_breakdown: SizingMatrix;
  total_quantity: number;
  
  // Pricing & Downpayment Breakdown
  raw_unit_price: number;
  discount_percentage: number;
  final_unit_price: number;
  total_amount: number;
  deposit_amount?: number;
  balance_amount?: number;
  paid_amount?: number;
  payment_type_selected?: 'deposit_50' | 'full_100';
  
  // Payment Gateway & Settlement
  payment_status?: PaymentStatus;
  payment_method?: string;
  payment_id?: string;
  payment_checkout_url?: string;
  paid_at?: string;
  deposit_paid_at?: string;
  deposit_payment_id?: string;
  deposit_payment_method?: string;
  balance_paid_at?: string;
  balance_payment_id?: string;
  balance_payment_method?: string;

  // Status & Shipping
  status: OrderStatus;
  production_notes?: string;
  shipping_address?: string;
  shipping_courier?: string;
  tracking_number?: string;
  
  created_at: string;
  updated_at: string;
}

export interface OrderStatusStep {
  status: OrderStatus;
  label: string;
  description: string;
  iconName: string;
}

// ==========================================
// DYNAMIC CMS & PUBLIC MANAGEMENT TYPES
// ==========================================

export interface CmsHeroBanner {
  id: string;
  image_url: string;
  status_pill: string; // e.g. 'Kilang Beroperasi'
  tag_text: string; // e.g. 'Koleksi Rasmi 2026'
  title: string; // e.g. 'Studio Jersi & DTF'
  button_text: string; // e.g. 'Katalog'
  button_link: string; // e.g. '/catalog'
  sort_order: number;
  is_active: boolean;
}

export interface CmsServiceDetail {
  title: string;
  description: string;
}

export interface CmsService {
  id: string;
  category: string;
  title: string;
  headline: string;
  highlight: string;
  price_prefix: string; // e.g. 'Bermula'
  price_amount: string; // e.g. 'RM28'
  price_unit: string; // e.g. '/ helai'
  image_url: string;
  href: string;
  details: CmsServiceDetail[];
  sort_order: number;
  is_active: boolean;
}

export interface CmsProductionVideo {
  id: string;
  category: string;
  title: string;
  thumbnail_url: string;
  youtube_id: string;
  sort_order: number;
  is_active: boolean;
}

export interface CmsProductionGalleryItem {
  id: string;
  title: string;
  category: string;
  fabric: string;
  image_url: string;
  client: string;
  tag: string;
  sort_order: number;
  is_active: boolean;
}

export interface CmsTestimonial {
  id: string;
  name: string;
  location: string;
  initial: string;
  avatar_bg: string;
  avatar_text: string;
  platform: 'google' | 'tiktok' | 'facebook' | 'instagram';
  rating: number;
  review: string;
  is_active: boolean;
}

export interface CmsSloganQuote {
  headline: string;
  highlight_text: string;
  question_text: string;
  description_text: string;
  button_text: string;
  whatsapp_message: string;
}

export interface CmsCompanySettings {
  company_name: string;
  brand_name: string;
  registration_number: string;
  tagline: string;
  phone: string;
  whatsapp_number: string;
  whatsapp_default_message: string;
  email: string;
  address: string;
  working_hours: string;
  website_url?: string;
  telegram_catalog_url?: string;
  facebook_url?: string;
  instagram_url?: string;
  tiktok_url?: string;
  developer_name?: string;
  developer_url?: string;
}

export interface CmsPolicySection {
  heading: string;
  text: string;
}

export interface CmsPolicy {
  id: 'privacy' | 'terms' | 'warranty' | 'shipping';
  badge: string;
  title: string;
  description: string;
  sections: CmsPolicySection[];
}

export type CmsThemePresetKey = 'hybrid' | 'clean_white' | 'full_blue';

export interface CmsThemeSettings {
  preset?: CmsThemePresetKey;
  header_bg: string;
  header_style: 'frosted_white' | 'solid_blue';
  header_logo_mode: 'original_blue' | 'inverted_white';
  bottom_nav_bg: string;
  bottom_nav_style: 'frosted_white' | 'solid_blue' | 'glass_light';
  bottom_nav_active_color: string;
  bottom_nav_inactive_color: string;
  primary_accent_color?: string;
  whatsapp_fab_bg: string;
}

export interface CmsTrustBadge {
  id: string;
  icon_name: string;
  title: string;
  pill: string;
  desc: string;
  color_theme: string;
  sort_order: number;
  is_active: boolean;
}

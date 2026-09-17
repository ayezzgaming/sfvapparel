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

export interface Design {
  id: string;
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
  
  // Pricing
  raw_unit_price: number;
  discount_percentage: number;
  final_unit_price: number;
  total_amount: number;
  
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

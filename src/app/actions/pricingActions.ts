'use server';

import { FabricMaterial, ApparelCut, DtfDimension, QuantityTierDiscount } from '@/types/database';
import { getServiceSupabase } from '@/lib/supabase/serverClient';

export interface MasterPricingData {
  fabrics: FabricMaterial[];
  cuts: ApparelCut[];
  dtfDimensions: DtfDimension[];
  tiers: QuantityTierDiscount[];
}

/**
 * Fetch all master pricing configurations from Supabase database.
 * No fallback to seed data — all data comes exclusively from the DB.
 */
export async function getMasterPricingDb(): Promise<{
  success: boolean;
  data: MasterPricingData;
  message?: string;
}> {
  const supabase = getServiceSupabase();
  if (!supabase) {
    return {
      success: false,
      data: { fabrics: [], cuts: [], dtfDimensions: [], tiers: [] },
      message: 'Supabase client tidak dikonfigurasi.',
    };
  }

  try {
    const [fabricsRes, cutsRes, dtfRes, tiersRes] = await Promise.all([
      supabase.from('fabric_materials').select('*').order('sort_order', { ascending: true }),
      supabase.from('apparel_cuts').select('*').order('sort_order', { ascending: true }),
      supabase.from('dtf_dimensions').select('*').order('sort_order', { ascending: true }),
      supabase.from('quantity_tier_discounts').select('*').order('min_qty', { ascending: true }),
    ]);

    if (fabricsRes.error) console.error('[pricingActions] fabrics error:', fabricsRes.error.message);
    if (cutsRes.error) console.error('[pricingActions] cuts error:', cutsRes.error.message);
    if (dtfRes.error) console.error('[pricingActions] dtf error:', dtfRes.error.message);
    if (tiersRes.error) console.error('[pricingActions] tiers error:', tiersRes.error.message);

    const fabrics: FabricMaterial[] = (fabricsRes.data || []).map((f: any) => ({
      id: String(f.id),
      name: f.name,
      code: f.code,
      weight_gsm: Number(f.weight_gsm),
      breathability: f.breathability || 'High',
      sublimation_base_price: Number(f.sublimation_base_price),
      description: f.description || undefined,
      is_popular: Boolean(f.is_popular),
      is_active: Boolean(f.is_active ?? true),
      sort_order: Number(f.sort_order || 0),
    }));

    const cuts: ApparelCut[] = (cutsRes.data || []).map((c: any) => ({
      id: String(c.id),
      name: c.name,
      code: c.code,
      cut_add_on_price: Number(c.cut_add_on_price),
      description: c.description || undefined,
      is_active: Boolean(c.is_active ?? true),
      sort_order: Number(c.sort_order || 0),
    }));

    const dtfDimensions: DtfDimension[] = (dtfRes.data || []).map((d: any) => ({
      id: String(d.id),
      name: d.name,
      code: d.code,
      dimensions_desc: d.dimensions_desc,
      base_price: Number(d.base_price),
      is_meter_rate: Boolean(d.is_meter_rate),
      garment_included_base_price: Number(d.garment_included_base_price),
      description: d.description || undefined,
      is_active: Boolean(d.is_active ?? true),
      sort_order: Number(d.sort_order || 0),
    }));

    const tiers: QuantityTierDiscount[] = (tiersRes.data || []).map((t: any) => ({
      id: String(t.id),
      tier_label: t.tier_label,
      min_qty: Number(t.min_qty),
      max_qty: t.max_qty !== null && t.max_qty !== undefined ? Number(t.max_qty) : null,
      discount_percentage: Number(t.discount_percentage),
    }));

    return { success: true, data: { fabrics, cuts, dtfDimensions, tiers } };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Ralat memuatkan formula harga daripada pangkalan data.';
    console.error('[pricingActions] getMasterPricingDb error:', msg);
    return {
      success: false,
      data: { fabrics: [], cuts: [], dtfDimensions: [], tiers: [] },
      message: msg,
    };
  }
}

/**
 * Save / Upsert Fabric Material
 * If id starts with 'temp-', it's a new record — insert without id so Supabase generates UUID.
 */
export async function saveFabricDb(fabric: FabricMaterial): Promise<{ success: boolean; message?: string }> {
  const supabase = getServiceSupabase();
  if (!supabase) return { success: false, message: 'Supabase client tidak dikonfigurasi.' };
  const isNew = fabric.id.startsWith('temp-');
  const payload: Record<string, unknown> = {
    name: fabric.name,
    code: fabric.code,
    weight_gsm: fabric.weight_gsm,
    breathability: fabric.breathability,
    sublimation_base_price: fabric.sublimation_base_price,
    description: fabric.description || null,
    is_popular: fabric.is_popular,
    is_active: fabric.is_active,
    sort_order: fabric.sort_order,
  };
  if (!isNew) payload.id = fabric.id;
  try {
    const { error } = isNew
      ? await supabase.from('fabric_materials').insert(payload)
      : await supabase.from('fabric_materials').upsert({ ...payload, id: fabric.id });
    if (error) return { success: false, message: error.message };
    return { success: true };
  } catch (err: unknown) {
    return { success: false, message: err instanceof Error ? err.message : 'Gagal menyimpan jenis kain.' };
  }
}

/**
 * Delete Fabric Material
 */
export async function deleteFabricDb(id: string): Promise<{ success: boolean; message?: string }> {
  const supabase = getServiceSupabase();
  if (!supabase) return { success: false, message: 'Supabase client tidak dikonfigurasi.' };
  try {
    const { error } = await supabase.from('fabric_materials').delete().eq('id', id);
    if (error) return { success: false, message: error.message };
    return { success: true };
  } catch (err: unknown) {
    return { success: false, message: err instanceof Error ? err.message : 'Gagal memadam jenis kain.' };
  }
}

/**
 * Save / Upsert Apparel Cut
 * If id starts with 'temp-', it's a new record — insert without id.
 */
export async function saveCutDb(cut: ApparelCut): Promise<{ success: boolean; message?: string }> {
  const supabase = getServiceSupabase();
  if (!supabase) return { success: false, message: 'Supabase client tidak dikonfigurasi.' };
  const isNew = cut.id.startsWith('temp-');
  const payload: Record<string, unknown> = {
    name: cut.name,
    code: cut.code,
    cut_add_on_price: cut.cut_add_on_price,
    description: cut.description || null,
    is_active: cut.is_active,
    sort_order: cut.sort_order,
  };
  try {
    const { error } = isNew
      ? await supabase.from('apparel_cuts').insert(payload)
      : await supabase.from('apparel_cuts').upsert({ ...payload, id: cut.id });
    if (error) return { success: false, message: error.message };
    return { success: true };
  } catch (err: unknown) {
    return { success: false, message: err instanceof Error ? err.message : 'Gagal menyimpan potongan jersi.' };
  }
}

/**
 * Delete Apparel Cut
 */
export async function deleteCutDb(id: string): Promise<{ success: boolean; message?: string }> {
  const supabase = getServiceSupabase();
  if (!supabase) return { success: false, message: 'Supabase client tidak dikonfigurasi.' };
  try {
    const { error } = await supabase.from('apparel_cuts').delete().eq('id', id);
    if (error) return { success: false, message: error.message };
    return { success: true };
  } catch (err: unknown) {
    return { success: false, message: err instanceof Error ? err.message : 'Gagal memadam potongan jersi.' };
  }
}

/**
 * Save / Upsert DTF Dimension
 * If id starts with 'temp-', it's a new record — insert without id.
 */
export async function saveDtfDimensionDb(dim: DtfDimension): Promise<{ success: boolean; message?: string }> {
  const supabase = getServiceSupabase();
  if (!supabase) return { success: false, message: 'Supabase client tidak dikonfigurasi.' };
  const isNew = dim.id.startsWith('temp-');
  const payload: Record<string, unknown> = {
    name: dim.name,
    code: dim.code,
    dimensions_desc: dim.dimensions_desc,
    base_price: dim.base_price,
    is_meter_rate: dim.is_meter_rate,
    garment_included_base_price: dim.garment_included_base_price,
    description: dim.description || null,
    is_active: dim.is_active,
    sort_order: dim.sort_order,
  };
  try {
    const { error } = isNew
      ? await supabase.from('dtf_dimensions').insert(payload)
      : await supabase.from('dtf_dimensions').upsert({ ...payload, id: dim.id });
    if (error) return { success: false, message: error.message };
    return { success: true };
  } catch (err: unknown) {
    return { success: false, message: err instanceof Error ? err.message : 'Gagal menyimpan saiz DTF.' };
  }
}

/**
 * Delete DTF Dimension
 */
export async function deleteDtfDimensionDb(id: string): Promise<{ success: boolean; message?: string }> {
  const supabase = getServiceSupabase();
  if (!supabase) return { success: false, message: 'Supabase client tidak dikonfigurasi.' };
  try {
    const { error } = await supabase.from('dtf_dimensions').delete().eq('id', id);
    if (error) return { success: false, message: error.message };
    return { success: true };
  } catch (err: unknown) {
    return { success: false, message: err instanceof Error ? err.message : 'Gagal memadam saiz DTF.' };
  }
}

/**
 * Save / Upsert Quantity Tier Discount
 * If id starts with 'temp-', it's a new record — insert without id.
 */
export async function saveQuantityTierDb(tier: QuantityTierDiscount): Promise<{ success: boolean; message?: string }> {
  const supabase = getServiceSupabase();
  if (!supabase) return { success: false, message: 'Supabase client tidak dikonfigurasi.' };
  const isNew = tier.id.startsWith('temp-');
  const payload: Record<string, unknown> = {
    tier_label: tier.tier_label,
    min_qty: tier.min_qty,
    max_qty: tier.max_qty ?? null,
    discount_percentage: tier.discount_percentage,
  };
  try {
    const { error } = isNew
      ? await supabase.from('quantity_tier_discounts').insert(payload)
      : await supabase.from('quantity_tier_discounts').upsert({ ...payload, id: tier.id });
    if (error) return { success: false, message: error.message };
    return { success: true };
  } catch (err: unknown) {
    return { success: false, message: err instanceof Error ? err.message : 'Gagal menyimpan tier diskaun.' };
  }
}

/**
 * Delete Quantity Tier Discount
 */
export async function deleteQuantityTierDb(id: string): Promise<{ success: boolean; message?: string }> {
  const supabase = getServiceSupabase();
  if (!supabase) return { success: false, message: 'Supabase client tidak dikonfigurasi.' };
  try {
    const { error } = await supabase.from('quantity_tier_discounts').delete().eq('id', id);
    if (error) return { success: false, message: error.message };
    return { success: true };
  } catch (err: unknown) {
    return { success: false, message: err instanceof Error ? err.message : 'Gagal memadam tier diskaun.' };
  }
}

'use server';

import { FabricMaterial, ApparelCut, DtfDimension, QuantityTierDiscount } from '@/types/database';
import { getServiceSupabase } from '@/lib/supabase/serverClient';
import {
  INITIAL_FABRIC_MATERIALS,
  INITIAL_APPAREL_CUTS,
  INITIAL_DTF_DIMENSIONS,
  INITIAL_QUANTITY_TIERS,
} from '@/lib/store/seed-data';

export interface MasterPricingData {
  fabrics: FabricMaterial[];
  cuts: ApparelCut[];
  dtfDimensions: DtfDimension[];
  tiers: QuantityTierDiscount[];
}

/**
 * Fetch all master pricing configurations from Supabase database
 */
export async function getMasterPricingDb(): Promise<{
  success: boolean;
  data: MasterPricingData;
  message?: string;
}> {
  try {
    const supabase = getServiceSupabase();
    if (!supabase) {
      return {
        success: false,
        data: {
          fabrics: INITIAL_FABRIC_MATERIALS,
          cuts: INITIAL_APPAREL_CUTS,
          dtfDimensions: INITIAL_DTF_DIMENSIONS,
          tiers: INITIAL_QUANTITY_TIERS,
        },
        message: 'Supabase client tidak dikonfigurasi.',
      };
    }

    // 1. Fabrics
    let { data: fabrics } = await supabase
      .from('fabric_materials')
      .select('*')
      .order('sort_order', { ascending: true });

    if (!fabrics || fabrics.length === 0) {
      await supabase.from('fabric_materials').upsert(INITIAL_FABRIC_MATERIALS);
      fabrics = INITIAL_FABRIC_MATERIALS;
    }

    // 2. Apparel Cuts
    let { data: cuts } = await supabase
      .from('apparel_cuts')
      .select('*')
      .order('sort_order', { ascending: true });

    if (!cuts || cuts.length === 0) {
      await supabase.from('apparel_cuts').upsert(INITIAL_APPAREL_CUTS);
      cuts = INITIAL_APPAREL_CUTS;
    }

    // 3. DTF Dimensions
    let { data: dtfDims } = await supabase
      .from('dtf_dimensions')
      .select('*')
      .order('sort_order', { ascending: true });

    if (!dtfDims || dtfDims.length === 0) {
      await supabase.from('dtf_dimensions').upsert(INITIAL_DTF_DIMENSIONS);
      dtfDims = INITIAL_DTF_DIMENSIONS;
    }

    return {
      success: true,
      data: {
        fabrics: (fabrics || []).map((f: any) => ({
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
        })),
        cuts: (cuts || []).map((c: any) => ({
          id: String(c.id),
          name: c.name,
          code: c.code,
          cut_add_on_price: Number(c.cut_add_on_price),
          description: c.description || undefined,
          is_active: Boolean(c.is_active ?? true),
          sort_order: Number(c.sort_order || 0),
        })),
        dtfDimensions: (dtfDims || []).map((d: any) => ({
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
        })),
        tiers: INITIAL_QUANTITY_TIERS,
      },
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Ralat memuatkan formula harga daripada pangkalan data.';
    return {
      success: false,
      data: {
        fabrics: INITIAL_FABRIC_MATERIALS,
        cuts: INITIAL_APPAREL_CUTS,
        dtfDimensions: INITIAL_DTF_DIMENSIONS,
        tiers: INITIAL_QUANTITY_TIERS,
      },
      message: msg,
    };
  }
}

/**
 * Save / Update Fabric Material
 */
export async function saveFabricDb(fabric: FabricMaterial): Promise<{ success: boolean; message?: string }> {
  try {
    const supabase = getServiceSupabase();
    if (!supabase) return { success: false, message: 'Supabase client tidak dikonfigurasi.' };

    const { error } = await supabase.from('fabric_materials').upsert({
      id: fabric.id,
      name: fabric.name,
      code: fabric.code,
      weight_gsm: fabric.weight_gsm,
      breathability: fabric.breathability,
      sublimation_base_price: fabric.sublimation_base_price,
      description: fabric.description || null,
      is_popular: fabric.is_popular,
      is_active: fabric.is_active,
      sort_order: fabric.sort_order,
    });

    if (error) return { success: false, message: error.message };
    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Gagal menyimpan jenis kain.';
    return { success: false, message: msg };
  }
}

/**
 * Save / Update Apparel Cut
 */
export async function saveCutDb(cut: ApparelCut): Promise<{ success: boolean; message?: string }> {
  try {
    const supabase = getServiceSupabase();
    if (!supabase) return { success: false, message: 'Supabase client tidak dikonfigurasi.' };

    const { error } = await supabase.from('apparel_cuts').upsert({
      id: cut.id,
      name: cut.name,
      code: cut.code,
      cut_add_on_price: cut.cut_add_on_price,
      description: cut.description || null,
      is_active: cut.is_active,
      sort_order: cut.sort_order,
    });

    if (error) return { success: false, message: error.message };
    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Gagal menyimpan potongan jersi.';
    return { success: false, message: msg };
  }
}

/**
 * Save / Update DTF Dimension
 */
export async function saveDtfDimensionDb(dim: DtfDimension): Promise<{ success: boolean; message?: string }> {
  try {
    const supabase = getServiceSupabase();
    if (!supabase) return { success: false, message: 'Supabase client tidak dikonfigurasi.' };

    const { error } = await supabase.from('dtf_dimensions').upsert({
      id: dim.id,
      name: dim.name,
      code: dim.code,
      dimensions_desc: dim.dimensions_desc,
      base_price: dim.base_price,
      is_meter_rate: dim.is_meter_rate,
      garment_included_base_price: dim.garment_included_base_price,
      description: dim.description || null,
      is_active: dim.is_active,
      sort_order: dim.sort_order,
    });

    if (error) return { success: false, message: error.message };
    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Gagal menyimpan saiz DTF.';
    return { success: false, message: msg };
  }
}

/**
 * Delete Fabric Material
 */
export async function deleteFabricDb(id: string): Promise<{ success: boolean; message?: string }> {
  try {
    const supabase = getServiceSupabase();
    if (!supabase) return { success: false, message: 'Supabase client tidak dikonfigurasi.' };

    const { error } = await supabase.from('fabric_materials').delete().eq('id', id);
    if (error) return { success: false, message: error.message };
    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Gagal memadam jenis kain.';
    return { success: false, message: msg };
  }
}

/**
 * Delete Apparel Cut
 */
export async function deleteCutDb(id: string): Promise<{ success: boolean; message?: string }> {
  try {
    const supabase = getServiceSupabase();
    if (!supabase) return { success: false, message: 'Supabase client tidak dikonfigurasi.' };

    const { error } = await supabase.from('apparel_cuts').delete().eq('id', id);
    if (error) return { success: false, message: error.message };
    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Gagal memadam potongan jersi.';
    return { success: false, message: msg };
  }
}

/**
 * Delete DTF Dimension
 */
export async function deleteDtfDimensionDb(id: string): Promise<{ success: boolean; message?: string }> {
  try {
    const supabase = getServiceSupabase();
    if (!supabase) return { success: false, message: 'Supabase client tidak dikonfigurasi.' };

    const { error } = await supabase.from('dtf_dimensions').delete().eq('id', id);
    if (error) return { success: false, message: error.message };
    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Gagal memadam saiz DTF.';
    return { success: false, message: msg };
  }
}


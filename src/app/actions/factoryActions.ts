'use server';

import crypto from 'crypto';
import { getServiceSupabase } from '@/lib/supabase/serverClient';
import { PartnerFactory, FactoryJob, FactoryJobStatus } from '@/types/database';

function getDb() {
  const db = getServiceSupabase();
  if (!db) throw new Error('Pangkalan data Supabase tidak dapat disambung.');
  return db;
}


/**
 * Safely parse a partner factory row from database, extracting pricing_matrix and notes
 */
function parseFactoryRow(row: any): PartnerFactory {
  if (!row) return row;
  let notes = row.notes || '';
  let pricing_matrix = row.pricing_matrix;

  // Handle case where pricing_matrix might be stored as string
  if (typeof pricing_matrix === 'string') {
    try {
      pricing_matrix = JSON.parse(pricing_matrix);
    } catch {
      pricing_matrix = null;
    }
  }

  // Backwards compatibility: If legacy record stored pricing_matrix inside notes column
  if (!pricing_matrix && typeof row.notes === 'string' && row.notes.startsWith('{')) {
    try {
      const parsed = JSON.parse(row.notes);
      if (parsed && typeof parsed === 'object' && parsed.pricing_matrix) {
        notes = parsed.notes || '';
        pricing_matrix = parsed.pricing_matrix;
      }
    } catch {
      // not JSON, keep regular notes
    }
  }

  return {
    ...row,
    notes,
    pricing_matrix: pricing_matrix || {
      base_unit_cost: Number(row.default_unit_cost) || 22.0,
      tier_discounts: [],
      fabric_surcharges: {},
      cut_surcharges: {},
      collar_surcharges: {},
    },
  };
}

/**
 * ============================================================================
 * PARTNER FACTORY DIRECTORY SERVER ACTIONS
 * ============================================================================
 */

export async function getPartnerFactories(): Promise<{ success: boolean; data: PartnerFactory[]; message?: string }> {
  try {
    const { data, error } = await getDb()
      .from('partner_factories')
      .select('*')
      .order('factory_name', { ascending: true });

    if (error) throw error;
    const parsed = (data || []).map(parseFactoryRow);
    return { success: true, data: parsed };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Gagal memuat senarai kilang rakan kongsi.';
    return { success: false, data: [], message: msg };
  }
}

export async function getPartnerFactoryById(id: string): Promise<{ success: boolean; data?: PartnerFactory; message?: string }> {
  try {
    const { data, error } = await getDb()
      .from('partner_factories')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return { success: true, data: data ? parseFactoryRow(data) : undefined };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Gagal memuat maklumat kilang.';
    return { success: false, message: msg };
  }
}

export async function savePartnerFactory(factory: Partial<PartnerFactory>): Promise<{ success: boolean; data?: PartnerFactory; message?: string }> {
  try {
    const matrix = factory.pricing_matrix || {
      base_unit_cost: Number(factory.default_unit_cost) || 22.0,
      tier_discounts: [],
      fabric_surcharges: {},
      cut_surcharges: {},
      collar_surcharges: {},
    };

    const payload: Record<string, any> = {
      factory_name: factory.factory_name,
      pic_name: factory.pic_name || null,
      phone: factory.phone ? factory.phone.replace(/[^0-9]/g, '') : '',
      email: factory.email || null,
      address: factory.address || null,
      specialty: factory.specialty || 'Full Sublimation All-in-One',
      default_unit_cost: Number(factory.default_unit_cost) || 22.0,
      lead_time_days: Number(factory.lead_time_days) || 7,
      pricing_matrix: matrix,
      notes: factory.notes ? String(factory.notes).trim() : null,
      is_active: factory.is_active ?? true,
      updated_at: new Date().toISOString(),
    };

    if (factory.id) {
      const { data, error } = await getDb()
        .from('partner_factories')
        .update(payload)
        .eq('id', factory.id)
        .select('*')
        .single();
      if (error) throw error;
      return { success: true, data: parseFactoryRow(data) };
    } else {
      const { data, error } = await getDb()
        .from('partner_factories')
        .insert(payload)
        .select('*')
        .single();
      if (error) throw error;
      return { success: true, data: parseFactoryRow(data) };
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Gagal menyimpan maklumat kilang.';
    return { success: false, message: msg };
  }
}


export async function deletePartnerFactory(id: string): Promise<{ success: boolean; message?: string }> {
  try {
    const { error } = await getDb()
      .from('partner_factories')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Gagal memadam kilang rakan kongsi.';
    return { success: false, message: msg };
  }
}

/**
 * ============================================================================
 * FACTORY JOBS & TECH PACK SERVER ACTIONS
 * ============================================================================
 */

export async function getFactoryJobs(): Promise<{ success: boolean; data: FactoryJob[]; message?: string }> {
  try {
    const { data, error } = await getDb()
      .from('factory_jobs')
      .select(`
        *,
        factory:partner_factories(*),
        order:orders(*)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    const parsed = (data || []).map((job: any) => ({
      ...job,
      factory: job.factory ? parseFactoryRow(job.factory) : undefined,
    }));
    return { success: true, data: parsed };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Gagal memuat senarai Job Sheet kilang.';
    return { success: false, data: [], message: msg };
  }
}

export async function getFactoryJobById(id: string): Promise<{ success: boolean; data?: FactoryJob; message?: string }> {
  try {
    const { data, error } = await getDb()
      .from('factory_jobs')
      .select(`
        *,
        factory:partner_factories(*),
        order:orders(*)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    if (data && data.factory) {
      data.factory = parseFactoryRow(data.factory);
    }
    return { success: true, data };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Job Sheet tidak dijumpai.';
    return { success: false, message: msg };
  }
}

export async function createOrUpdateFactoryJob(payload: {
  id?: string;
  order_id: string;
  factory_id: string;
  status?: FactoryJobStatus;
  target_ready_date?: string;
  total_quantity: number;
  cost_per_unit: number;
  customer_price_total: number;
  fabric_spec?: string;
  collar_spec?: string;
  cutting_spec?: string;
  sizing_breakdown: Record<string, number>;
  player_roster?: Array<{ size: string; name: string; number: string; sleeve_type?: string }>;
  artwork_hd_url?: string;
  mockup_preview_url?: string;
  factory_notes?: string;
}): Promise<{ success: boolean; data?: FactoryJob; message?: string }> {
  try {
    const total_quantity = Number(payload.total_quantity) || 0;
    const cost_per_unit = Number(payload.cost_per_unit) || 0;
    const total_factory_cost = total_quantity * cost_per_unit;
    const customer_price_total = Number(payload.customer_price_total) || 0;
    const gross_profit = customer_price_total - total_factory_cost;
    const gross_margin_percent = customer_price_total > 0 ? (gross_profit / customer_price_total) * 100 : 0;

    const rowData = {
      order_id: payload.order_id,
      factory_id: payload.factory_id || null,
      status: payload.status || 'sent_to_factory',
      target_ready_date: payload.target_ready_date || null,
      total_quantity,
      cost_per_unit,
      total_factory_cost,
      customer_price_total,
      gross_profit,
      gross_margin_percent: Math.round(gross_margin_percent * 10) / 10,
      fabric_spec: payload.fabric_spec || null,
      collar_spec: payload.collar_spec || null,
      cutting_spec: payload.cutting_spec || null,
      sizing_breakdown: payload.sizing_breakdown || {},
      player_roster: payload.player_roster || [],
      artwork_hd_url: payload.artwork_hd_url || null,
      mockup_preview_url: payload.mockup_preview_url || null,
      factory_notes: payload.factory_notes || null,
      updated_at: new Date().toISOString(),
    };

    if (payload.id) {
      const { data, error } = await getDb()
        .from('factory_jobs')
        .update(rowData)
        .eq('id', payload.id)
        .select(`*, factory:partner_factories(*), order:orders(*)`)
        .single();
      if (error) throw error;
      if (data && data.factory) data.factory = parseFactoryRow(data.factory);
      return { success: true, data };
    } else {
      // Generate Collision-free Job Number: JOB-YYYY-[TIMEBASE36][HEX]
      const year = new Date().getFullYear();
      const timeCode = Date.now().toString(36).slice(-4).toUpperCase();
      const entropy = crypto.randomBytes(2).toString('hex').toUpperCase();
      const job_number = `JOB-${year}-${timeCode}${entropy}`;

      const { data, error } = await getDb()
        .from('factory_jobs')
        .insert({
          ...rowData,
          job_number,
          sent_at: new Date().toISOString(),
        })
        .select(`*, factory:partner_factories(*), order:orders(*)`)
        .single();
      if (error) throw error;
      if (data && data.factory) data.factory = parseFactoryRow(data.factory);


      // Update the order status to 'in_production' if order exists
      if (payload.order_id) {
        await getDb()
          .from('orders')
          .update({ status: 'in_production', updated_at: new Date().toISOString() })
          .eq('id', payload.order_id);
      }

      return { success: true, data };
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Gagal menyimpan Job Sheet.';
    return { success: false, message: msg };
  }
}

export async function updateFactoryJobStatus(id: string, status: FactoryJobStatus): Promise<{ success: boolean; message?: string }> {
  try {
    const updates: Record<string, unknown> = {
      status,
      updated_at: new Date().toISOString(),
    };

    if (status === 'factory_completed' || status === 'received_at_svf') {
      updates.completed_at = new Date().toISOString();
    }

    const { error } = await getDb()
      .from('factory_jobs')
      .update(updates)
      .eq('id', id);

    if (error) throw error;
    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Gagal mengemaskini status kerja kilang.';
    return { success: false, message: msg };
  }
}

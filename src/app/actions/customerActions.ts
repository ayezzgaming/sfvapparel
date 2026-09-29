'use server';

import { getServiceSupabase } from '@/lib/supabase/serverClient';
import { Customer } from '@/types/database';

/**
 * Fetch all customers from Supabase database
 */
export async function getCustomersDb(): Promise<{ success: boolean; customers?: Customer[]; message?: string }> {
  try {
    const supabase = getServiceSupabase();
    if (!supabase) return { success: false, message: 'Sambungan pangkalan data gagal.' };

    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[customerActions] getCustomersDb error:', error.message);
      return { success: false, message: error.message };
    }

    return { success: true, customers: (data as Customer[]) || [] };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Gagal memuatkan data pelanggan.';
    return { success: false, message };
  }
}

/**
 * Create or Update customer in database
 */
export async function saveCustomerDb(
  customer: Partial<Customer>
): Promise<{ success: boolean; customer?: Customer; message?: string }> {
  try {
    const supabase = getServiceSupabase();
    if (!supabase) return { success: false, message: 'Sambungan pangkalan data gagal.' };

    const rawPhone = (customer.phone || customer.email || '').replace(/[\s\-\+\(\)]/g, '');
    let normalizedPhone = rawPhone;
    if (normalizedPhone.startsWith('0')) normalizedPhone = '60' + normalizedPhone.slice(1);
    if (!normalizedPhone.startsWith('60') && normalizedPhone.length >= 8 && /^\d+$/.test(normalizedPhone)) {
      normalizedPhone = '60' + normalizedPhone;
    }

    const payload: Record<string, unknown> = {
      full_name: customer.full_name?.trim() || 'Pelanggan Tanpa Nama',
      email: customer.email?.trim() || (normalizedPhone ? `${normalizedPhone}@whatsapp.noreply` : 'pelanggan@sfvapparel.my'),
      phone: normalizedPhone || customer.phone || '0000000000',
      whatsapp: normalizedPhone || customer.phone || '0000000000',
      company_or_team: customer.company_or_team?.trim() || null,
      address: customer.address?.trim() || null,
      city: customer.city?.trim() || null,
      postal_code: customer.postal_code?.trim() || null,
      notes: customer.notes?.trim() || null,
      total_orders: Number(customer.total_orders) || 0,
      total_spent: Number(customer.total_spent) || 0,
    };

    if (customer.id && !customer.id.startsWith('temp-')) {
      // Update existing record
      const { data, error } = await supabase
        .from('customers')
        .update(payload)
        .eq('id', customer.id)
        .select()
        .single();

      if (error) {
        console.error('[customerActions] update error:', error.message);
        return { success: false, message: error.message };
      }
      return { success: true, customer: data as Customer, message: 'Maklumat pelanggan berjaya dikemaskini.' };
    } else {
      // Insert new record
      const { data, error } = await supabase
        .from('customers')
        .insert([payload])
        .select()
        .single();

      if (error) {
        console.error('[customerActions] insert error:', error.message);
        return { success: false, message: error.message };
      }
      return { success: true, customer: data as Customer, message: 'Pelanggan baru berjaya didaftarkan.' };
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Gagal menyimpan pelanggan.';
    return { success: false, message };
  }
}

/**
 * Delete customer from database
 */
export async function deleteCustomerDb(
  id: string
): Promise<{ success: boolean; message?: string }> {
  try {
    const supabase = getServiceSupabase();
    if (!supabase) return { success: false, message: 'Sambungan pangkalan data gagal.' };

    const { error } = await supabase
      .from('customers')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('[customerActions] delete error:', error.message);
      return { success: false, message: error.message };
    }

    return { success: true, message: 'Rekod pelanggan telah berjaya dipadam.' };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Gagal memadam pelanggan.';
    return { success: false, message };
  }
}

'use server';

import { getServiceSupabase } from '@/lib/supabase/serverClient';
import { Customer } from '@/types/database';

export async function getCustomersDb(): Promise<{ success: boolean; customers?: Customer[]; message?: string }> {
  try {
    const supabase = getServiceSupabase();
    if (!supabase) return { success: false, message: 'Database connection failed.' };

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
    const message = err instanceof Error ? err.message : 'Failed to fetch customers';
    return { success: false, message };
  }
}

'use server';

import { Design } from '@/types/database';
import { getServiceSupabase } from '@/lib/supabase/serverClient';

/**
 * Server Action: Fetches all catalog designs from Supabase database
 */
export async function getDesignsDb(): Promise<{
  success: boolean;
  designs: Design[];
  message?: string;
}> {
  try {
    const supabase = getServiceSupabase();
    if (!supabase) {
      return { success: false, designs: [], message: 'Supabase client not configured.' };
    }

    const { data, error } = await supabase
      .from('designs')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return { success: false, designs: [], message: error.message };
    }

    if (!data || data.length === 0) {
      return { success: true, designs: [] };
    }

    const designs: Design[] = data.map((row: any) => ({
      id: String(row.id),
      title: row.title,
      category: row.category,
      print_type: row.print_type,
      thumbnail_url: row.thumbnail_url,
      mockup_front_url: row.mockup_front_url,
      mockup_back_url: row.mockup_back_url || undefined,
      description: row.description || undefined,
      tags: Array.isArray(row.tags) ? row.tags : [],
      is_featured: Boolean(row.is_featured),
      is_active: Boolean(row.is_active ?? true),
      created_at: row.created_at
    }));

    return { success: true, designs };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Ralat memuatkan rekaan dari pangkalan data.';
    return { success: false, designs: [], message: msg };
  }
}

/**
 * Server Action: Saves or updates a catalog design in Supabase database
 */
export async function saveDesignDb(
  design: Design
): Promise<{ success: boolean; message: string }> {
  try {
    const supabase = getServiceSupabase();
    if (!supabase) {
      return { success: false, message: 'Supabase client not configured.' };
    }

    const payload = {
      id: design.id,
      title: design.title,
      category: design.category,
      print_type: design.print_type,
      thumbnail_url: design.thumbnail_url,
      mockup_front_url: design.mockup_front_url,
      mockup_back_url: design.mockup_back_url || null,
      description: design.description || null,
      tags: design.tags || [],
      is_featured: Boolean(design.is_featured),
      is_active: Boolean(design.is_active ?? true),
      created_at: design.created_at || new Date().toISOString()
    };

    const { error } = await supabase
      .from('designs')
      .upsert(payload, { onConflict: 'id' });

    if (error) {
      return { success: false, message: `Ralat simpan ke Supabase: ${error.message}` };
    }

    return { success: true, message: `Rekaan "${design.title}" berjaya disimpan ke pangkalan data.` };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Ralat pelayan.';
    return { success: false, message: msg };
  }
}

/**
 * Server Action: Deletes a catalog design from Supabase database
 */
export async function deleteDesignDb(
  id: string
): Promise<{ success: boolean; message: string }> {
  try {
    const supabase = getServiceSupabase();
    if (!supabase) {
      return { success: false, message: 'Supabase client not configured.' };
    }

    const { error } = await supabase
      .from('designs')
      .delete()
      .eq('id', id);

    if (error) {
      return { success: false, message: error.message };
    }

    return { success: true, message: 'Rekaan berjaya dipadam dari pangkalan data.' };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Ralat pelayan.';
    return { success: false, message: msg };
  }
}

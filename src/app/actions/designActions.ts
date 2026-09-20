'use server';

import { Design } from '@/types/database';
import { getServiceSupabase } from '@/lib/supabase/serverClient';

function isValidUuid(id: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
}

function generateUuid(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

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
      return { success: false, designs: [], message: 'Supabase client tidak dikonfigurasi.' };
    }

    const { data, error } = await supabase
      .from('designs')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('getDesignsDb error:', error.message);
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
 * Helper to upload base64 image to Supabase Storage if bucket exists
 */
async function uploadDesignImageToStorage(
  base64Data: string,
  fileNamePrefix: string = 'design'
): Promise<string> {
  if (!base64Data || !base64Data.startsWith('data:image/')) {
    return base64Data;
  }

  try {
    const supabase = getServiceSupabase();
    if (!supabase) return base64Data;

    const mimeMatch = base64Data.match(/^data:(image\/[a-zA-Z+]+);base64,/);
    const mimeType = mimeMatch ? mimeMatch[1] : 'image/webp';
    const ext = mimeType.split('/')[1]?.replace('+xml', '') || 'webp';
    const base64Content = base64Data.replace(/^data:image\/[a-zA-Z+]+;base64,/, '');
    const buffer = Buffer.from(base64Content, 'base64');
    const fileName = `${fileNamePrefix}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}.${ext}`;

    const bucketNames = ['catalog', 'designs', 'public-assets'];
    for (const bucket of bucketNames) {
      try {
        const { error: uploadErr } = await supabase.storage
          .from(bucket)
          .upload(fileName, buffer, {
            contentType: mimeType,
            upsert: true
          });

        if (!uploadErr) {
          const { data: publicUrlData } = supabase.storage.from(bucket).getPublicUrl(fileName);
          if (publicUrlData?.publicUrl) {
            return publicUrlData.publicUrl;
          }
        }
      } catch {
        // Try next bucket
      }
    }

    return base64Data;
  } catch {
    return base64Data;
  }
}

/**
 * Server Action: Saves or updates a catalog design in Supabase database
 */
export async function saveDesignDb(
  design: Partial<Design> & {
    title: string;
    category: string;
    print_type: any;
    thumbnail_url: string;
    mockup_front_url: string;
  }
): Promise<{ success: boolean; data?: Design; message: string }> {
  try {
    const supabase = getServiceSupabase();
    if (!supabase) {
      return { success: false, message: 'Supabase client tidak dikonfigurasi pada server (.env.local).' };
    }

    // Process image uploads if base64
    const processedThumbnail = await uploadDesignImageToStorage(design.thumbnail_url, 'thumb');
    const processedMockup = design.mockup_front_url === design.thumbnail_url
      ? processedThumbnail
      : await uploadDesignImageToStorage(design.mockup_front_url, 'front');

    // Ensure ID is a valid UUID so PostgreSQL UUID primary key doesn't fail
    const validId = design.id && isValidUuid(design.id) ? design.id : generateUuid();

    const payload: Record<string, any> = {
      id: validId,
      title: design.title.trim(),
      category: design.category,
      print_type: design.print_type,
      thumbnail_url: processedThumbnail,
      mockup_front_url: processedMockup,
      mockup_back_url: design.mockup_back_url || null,
      description: design.description || null,
      tags: design.tags || [],
      is_featured: Boolean(design.is_featured),
      is_active: Boolean(design.is_active ?? true),
      created_at: design.created_at || new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('designs')
      .upsert(payload, { onConflict: 'id' })
      .select()
      .single();

    if (error) {
      console.error('Error saving design to Supabase:', error);
      return { success: false, message: `Ralat simpan ke Supabase: ${error.message}` };
    }

    const savedDesign: Design = {
      id: String(data.id),
      title: data.title,
      category: data.category,
      print_type: data.print_type,
      thumbnail_url: data.thumbnail_url,
      mockup_front_url: data.mockup_front_url,
      mockup_back_url: data.mockup_back_url || undefined,
      description: data.description || undefined,
      tags: Array.isArray(data.tags) ? data.tags : [],
      is_featured: Boolean(data.is_featured),
      is_active: Boolean(data.is_active ?? true),
      created_at: data.created_at
    };

    return {
      success: true,
      data: savedDesign,
      message: `Rekaan "${savedDesign.title}" berjaya disimpan ke pangkalan data Supabase.`
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Ralat pelayan semasa menyimpan rekaan.';
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
      return { success: false, message: 'Supabase client tidak dikonfigurasi.' };
    }

    const { error } = await supabase
      .from('designs')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting design from Supabase:', error);
      return { success: false, message: `Ralat memadam dari Supabase: ${error.message}` };
    }

    return { success: true, message: 'Rekaan berjaya dipadam daripada pangkalan data Supabase.' };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Ralat pelayan semasa memadam rekaan.';
    return { success: false, message: msg };
  }
}

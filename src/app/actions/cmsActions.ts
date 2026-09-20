'use server';

import { 
  CmsHeroBanner, 
  CmsService, 
  CmsProductionVideo, 
  CmsProductionGalleryItem, 
  CmsTestimonial, 
  CmsSloganQuote, 
  CmsCompanySettings, 
  CmsPolicy 
} from '@/types/database';
import { getServiceSupabase } from '@/lib/supabase/serverClient';
import {
  INITIAL_CMS_HERO_BANNERS,
  INITIAL_CMS_SERVICES,
  INITIAL_CMS_PRODUCTION_VIDEOS,
  INITIAL_CMS_PRODUCTION_GALLERY,
  INITIAL_CMS_TESTIMONIALS,
  INITIAL_CMS_SLOGAN_QUOTE,
  INITIAL_CMS_COMPANY_SETTINGS,
  INITIAL_CMS_POLICIES,
} from '@/lib/store/seed-data';

// Helper to validate UUID
function isValidUuid(id?: string): boolean {
  if (!id) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
}

// Generate consistent or random UUID
function toUuid(id?: string): string {
  if (id && isValidUuid(id)) return id;
  return crypto.randomUUID();
}

/**
 * Upload base64 image to Supabase Storage
 */
export async function uploadCmsImageToStorage(
  base64Data: string,
  fileNamePrefix: string = 'cms'
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

    const bucketNames = ['cms-assets', 'public-assets', 'catalog', 'designs'];
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

export interface CmsFullData {
  heroBanners: CmsHeroBanner[];
  services: CmsService[];
  productionVideos: CmsProductionVideo[];
  productionGallery: CmsProductionGalleryItem[];
  testimonials: CmsTestimonial[];
  sloganQuote: CmsSloganQuote;
  companySettings: CmsCompanySettings;
  policies: Record<'privacy' | 'terms' | 'warranty' | 'shipping', CmsPolicy>;
}

/**
 * Fetch all CMS data from Supabase database with auto-seeding if empty
 */
export async function getCmsDataDb(): Promise<{
  success: boolean;
  data: CmsFullData;
  message?: string;
}> {
  try {
    const supabase = getServiceSupabase();
    if (!supabase) {
      return {
        success: false,
        data: {
          heroBanners: INITIAL_CMS_HERO_BANNERS,
          services: INITIAL_CMS_SERVICES,
          productionVideos: INITIAL_CMS_PRODUCTION_VIDEOS,
          productionGallery: INITIAL_CMS_PRODUCTION_GALLERY,
          testimonials: INITIAL_CMS_TESTIMONIALS,
          sloganQuote: INITIAL_CMS_SLOGAN_QUOTE,
          companySettings: INITIAL_CMS_COMPANY_SETTINGS,
          policies: INITIAL_CMS_POLICIES,
        },
        message: 'Supabase client tidak dikonfigurasi.',
      };
    }

    // 1. Fetch Hero Banners
    let { data: banners, error: bannersErr } = await supabase
      .from('cms_hero_banners')
      .select('*')
      .order('sort_order', { ascending: true });

    if (!banners || banners.length === 0) {
      const seedBanners = INITIAL_CMS_HERO_BANNERS.map((b) => ({
        id: toUuid(b.id),
        image_url: b.image_url,
        status_pill: b.status_pill || 'Kilang Beroperasi',
        tag_text: b.tag_text || 'Koleksi Rasmi 2026',
        title: b.title,
        button_text: b.button_text || 'Katalog',
        button_link: b.button_link || '/catalog',
        sort_order: b.sort_order,
        is_active: b.is_active,
      }));
      await supabase.from('cms_hero_banners').upsert(seedBanners);
      banners = seedBanners;
    }

    // 2. Fetch Services
    let { data: services } = await supabase
      .from('cms_services')
      .select('*')
      .order('sort_order', { ascending: true });

    if (!services || services.length === 0) {
      const seedServices = INITIAL_CMS_SERVICES.map((s) => ({
        id: toUuid(s.id),
        category: s.category,
        title: s.title,
        headline: s.headline,
        highlight: s.highlight,
        price_prefix: s.price_prefix || 'Bermula',
        price_amount: s.price_amount,
        price_unit: s.price_unit || '/ helai',
        image_url: s.image_url,
        href: s.href || '/catalog',
        details: s.details || [],
        sort_order: s.sort_order,
        is_active: s.is_active,
      }));
      await supabase.from('cms_services').upsert(seedServices);
      services = seedServices;
    }

    // 3. Fetch Production Videos
    let { data: videos } = await supabase
      .from('cms_production_videos')
      .select('*')
      .order('sort_order', { ascending: true });

    if (!videos || videos.length === 0) {
      const seedVideos = INITIAL_CMS_PRODUCTION_VIDEOS.map((v) => ({
        id: toUuid(v.id),
        category: v.category,
        title: v.title,
        thumbnail_url: v.thumbnail_url,
        youtube_id: v.youtube_id,
        sort_order: v.sort_order,
        is_active: v.is_active,
      }));
      await supabase.from('cms_production_videos').upsert(seedVideos);
      videos = seedVideos;
    }

    // 4. Fetch Production Gallery
    let { data: gallery } = await supabase
      .from('cms_production_gallery')
      .select('*')
      .order('sort_order', { ascending: true });

    if (!gallery || gallery.length === 0) {
      const seedGallery = INITIAL_CMS_PRODUCTION_GALLERY.map((g) => ({
        id: toUuid(g.id),
        title: g.title,
        category: g.category,
        fabric: g.fabric,
        image_url: g.image_url,
        client: g.client,
        tag: g.tag,
        sort_order: g.sort_order,
        is_active: g.is_active,
      }));
      await supabase.from('cms_production_gallery').upsert(seedGallery);
      gallery = seedGallery;
    }

    // 5. Fetch Testimonials
    let { data: testimonials } = await supabase
      .from('cms_testimonials')
      .select('*')
      .order('created_at', { ascending: false });

    if (!testimonials || testimonials.length === 0) {
      const seedTestimonials = INITIAL_CMS_TESTIMONIALS.map((t) => ({
        id: toUuid(t.id),
        name: t.name,
        location: t.location,
        initial: t.initial,
        avatar_bg: t.avatar_bg || 'bg-blue-100',
        avatar_text: t.avatar_text || 'text-blue-600',
        platform: t.platform,
        rating: t.rating,
        review: t.review,
        is_active: t.is_active,
      }));
      await supabase.from('cms_testimonials').upsert(seedTestimonials);
      testimonials = seedTestimonials;
    }

    // 6. Fetch Slogan Quote
    let { data: sloganList } = await supabase
      .from('cms_slogan_quote')
      .select('*')
      .limit(1);

    let sloganQuote: CmsSloganQuote = INITIAL_CMS_SLOGAN_QUOTE;
    if (sloganList && sloganList.length > 0) {
      const row = sloganList[0];
      sloganQuote = {
        headline: row.headline,
        highlight_text: row.highlight_text,
        question_text: row.question_text,
        description_text: row.description_text,
        button_text: row.button_text,
        whatsapp_message: row.whatsapp_message,
      };
    } else {
      const sloganPayload = {
        id: crypto.randomUUID(),
        ...INITIAL_CMS_SLOGAN_QUOTE,
      };
      await supabase.from('cms_slogan_quote').upsert(sloganPayload);
    }

    // 7. Fetch Company Settings
    let { data: companyList } = await supabase
      .from('cms_company_settings')
      .select('*')
      .limit(1);

    let companySettings: CmsCompanySettings = INITIAL_CMS_COMPANY_SETTINGS;
    if (companyList && companyList.length > 0) {
      const row = companyList[0];
      companySettings = {
        company_name: row.company_name,
        brand_name: row.brand_name,
        registration_number: row.registration_number,
        tagline: row.tagline || '',
        phone: row.phone,
        whatsapp_number: row.whatsapp_number,
        whatsapp_default_message: row.whatsapp_default_message || '',
        email: row.email,
        address: row.address,
        working_hours: row.working_hours || '',
        website_url: row.website_url || undefined,
        telegram_catalog_url: row.telegram_catalog_url || '',
        facebook_url: row.facebook_url || '',
        instagram_url: row.instagram_url || '',
        tiktok_url: row.tiktok_url || '',
        developer_name: 'AYEZZ Global',
        developer_url: 'https://ayezz.com',
      };
    } else {
      const companyPayload = {
        id: crypto.randomUUID(),
        company_name: INITIAL_CMS_COMPANY_SETTINGS.company_name,
        brand_name: INITIAL_CMS_COMPANY_SETTINGS.brand_name,
        registration_number: INITIAL_CMS_COMPANY_SETTINGS.registration_number,
        tagline: INITIAL_CMS_COMPANY_SETTINGS.tagline,
        phone: INITIAL_CMS_COMPANY_SETTINGS.phone,
        whatsapp_number: INITIAL_CMS_COMPANY_SETTINGS.whatsapp_number,
        whatsapp_default_message: INITIAL_CMS_COMPANY_SETTINGS.whatsapp_default_message,
        email: INITIAL_CMS_COMPANY_SETTINGS.email,
        address: INITIAL_CMS_COMPANY_SETTINGS.address,
        working_hours: INITIAL_CMS_COMPANY_SETTINGS.working_hours,
        telegram_catalog_url: INITIAL_CMS_COMPANY_SETTINGS.telegram_catalog_url,
        facebook_url: INITIAL_CMS_COMPANY_SETTINGS.facebook_url,
        instagram_url: INITIAL_CMS_COMPANY_SETTINGS.instagram_url,
        tiktok_url: INITIAL_CMS_COMPANY_SETTINGS.tiktok_url,
      };
      await supabase.from('cms_company_settings').upsert(companyPayload);
    }

    // 8. Fetch Policies
    let { data: policiesList } = await supabase
      .from('cms_policies')
      .select('*');

    const policies: Record<'privacy' | 'terms' | 'warranty' | 'shipping', CmsPolicy> = { ...INITIAL_CMS_POLICIES };
    if (policiesList && policiesList.length > 0) {
      policiesList.forEach((row: any) => {
        if (row.id && policies[row.id as keyof typeof policies]) {
          policies[row.id as keyof typeof policies] = {
            id: row.id,
            badge: row.badge,
            title: row.title,
            description: row.description,
            sections: Array.isArray(row.sections) ? row.sections : [],
          };
        }
      });
    } else {
      const seedPol = Object.values(INITIAL_CMS_POLICIES).map((p) => ({
        id: p.id,
        badge: p.badge,
        title: p.title,
        description: p.description,
        sections: p.sections,
      }));
      await supabase.from('cms_policies').upsert(seedPol);
    }

    // Format Hero Banners
    const formattedBanners: CmsHeroBanner[] = (banners || []).map((b: any) => ({
      id: String(b.id),
      image_url: b.image_url,
      status_pill: b.status_pill || 'Kilang Beroperasi',
      tag_text: b.tag_text || 'Koleksi Rasmi 2026',
      title: b.title,
      button_text: b.button_text || 'Katalog',
      button_link: b.button_link || '/catalog',
      sort_order: Number(b.sort_order || 0),
      is_active: Boolean(b.is_active ?? true),
    }));

    // Format Services
    const formattedServices: CmsService[] = (services || []).map((s: any) => ({
      id: String(s.id),
      category: s.category,
      title: s.title,
      headline: s.headline,
      highlight: s.highlight,
      price_prefix: s.price_prefix || 'Bermula',
      price_amount: s.price_amount,
      price_unit: s.price_unit || '/ helai',
      image_url: s.image_url,
      href: s.href || '/catalog',
      details: Array.isArray(s.details) ? s.details : [],
      sort_order: Number(s.sort_order || 0),
      is_active: Boolean(s.is_active ?? true),
    }));

    // Format Videos
    const formattedVideos: CmsProductionVideo[] = (videos || []).map((v: any) => ({
      id: String(v.id),
      category: v.category,
      title: v.title,
      thumbnail_url: v.thumbnail_url,
      youtube_id: v.youtube_id,
      sort_order: Number(v.sort_order || 0),
      is_active: Boolean(v.is_active ?? true),
    }));

    // Format Gallery
    const formattedGallery: CmsProductionGalleryItem[] = (gallery || []).map((g: any) => ({
      id: String(g.id),
      title: g.title,
      category: g.category,
      fabric: g.fabric,
      image_url: g.image_url,
      client: g.client,
      tag: g.tag,
      sort_order: Number(g.sort_order || 0),
      is_active: Boolean(g.is_active ?? true),
    }));

    // Format Testimonials
    const formattedTestimonials: CmsTestimonial[] = (testimonials || []).map((t: any) => ({
      id: String(t.id),
      name: t.name,
      location: t.location,
      initial: t.initial,
      avatar_bg: t.avatar_bg || 'bg-blue-100',
      avatar_text: t.avatar_text || 'text-blue-600',
      platform: t.platform || 'google',
      rating: Number(t.rating || 5),
      review: t.review,
      is_active: Boolean(t.is_active ?? true),
    }));

    return {
      success: true,
      data: {
        heroBanners: formattedBanners,
        services: formattedServices,
        productionVideos: formattedVideos,
        productionGallery: formattedGallery,
        testimonials: formattedTestimonials,
        sloganQuote,
        companySettings,
        policies,
      },
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Ralat memuatkan data CMS daripada pangkalan data.';
    console.error('getCmsDataDb exception:', msg);
    return {
      success: false,
      data: {
        heroBanners: INITIAL_CMS_HERO_BANNERS,
        services: INITIAL_CMS_SERVICES,
        productionVideos: INITIAL_CMS_PRODUCTION_VIDEOS,
        productionGallery: INITIAL_CMS_PRODUCTION_GALLERY,
        testimonials: INITIAL_CMS_TESTIMONIALS,
        sloganQuote: INITIAL_CMS_SLOGAN_QUOTE,
        companySettings: INITIAL_CMS_COMPANY_SETTINGS,
        policies: INITIAL_CMS_POLICIES,
      },
      message: msg,
    };
  }
}

// -------------------------------------------------------------
// INDIVIDUAL MUTATIONS
// -------------------------------------------------------------

/**
 * Save / Update Hero Banner
 */
export async function saveHeroBannerDb(banner: Partial<CmsHeroBanner> & { id?: string }): Promise<{
  success: boolean;
  banner?: CmsHeroBanner;
  message?: string;
}> {
  try {
    const supabase = getServiceSupabase();
    if (!supabase) return { success: false, message: 'Supabase client tidak dikonfigurasi.' };

    const targetId = banner.id && isValidUuid(banner.id) ? banner.id : crypto.randomUUID();
    let imageUrl = banner.image_url || '';
    if (imageUrl.startsWith('data:image/')) {
      imageUrl = await uploadCmsImageToStorage(imageUrl, 'hero-banner');
    }

    const payload = {
      id: targetId,
      image_url: imageUrl,
      status_pill: banner.status_pill || 'Kilang Beroperasi',
      tag_text: banner.tag_text || 'Koleksi Rasmi 2026',
      title: banner.title || 'Studio Jersi & DTF',
      button_text: banner.button_text || 'Katalog',
      button_link: banner.button_link || '/catalog',
      sort_order: banner.sort_order ?? 0,
      is_active: banner.is_active ?? true,
    };

    const { data, error } = await supabase
      .from('cms_hero_banners')
      .upsert(payload)
      .select()
      .single();

    if (error) {
      console.error('saveHeroBannerDb error:', error.message);
      return { success: false, message: error.message };
    }

    return {
      success: true,
      banner: {
        id: String(data.id),
        image_url: data.image_url,
        status_pill: data.status_pill,
        tag_text: data.tag_text,
        title: data.title,
        button_text: data.button_text,
        button_link: data.button_link,
        sort_order: Number(data.sort_order),
        is_active: Boolean(data.is_active),
      },
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Gagal menyimpan Banner Utama.';
    return { success: false, message: msg };
  }
}

/**
 * Delete Hero Banner
 */
export async function deleteHeroBannerDb(id: string): Promise<{ success: boolean; message?: string }> {
  try {
    const supabase = getServiceSupabase();
    if (!supabase) return { success: false, message: 'Supabase client tidak dikonfigurasi.' };

    const { error } = await supabase.from('cms_hero_banners').delete().eq('id', id);
    if (error) return { success: false, message: error.message };
    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Gagal memadam Banner Utama.';
    return { success: false, message: msg };
  }
}

/**
 * Save / Update Service
 */
export async function saveServiceDb(service: Partial<CmsService> & { id?: string }): Promise<{
  success: boolean;
  service?: CmsService;
  message?: string;
}> {
  try {
    const supabase = getServiceSupabase();
    if (!supabase) return { success: false, message: 'Supabase client tidak dikonfigurasi.' };

    const targetId = service.id && isValidUuid(service.id) ? service.id : crypto.randomUUID();
    let imageUrl = service.image_url || '';
    if (imageUrl.startsWith('data:image/')) {
      imageUrl = await uploadCmsImageToStorage(imageUrl, 'service');
    }

    const payload = {
      id: targetId,
      category: service.category || 'Servis',
      title: service.title || 'Servis Cetakan',
      headline: service.headline || '',
      highlight: service.highlight || '',
      price_prefix: service.price_prefix || 'Bermula',
      price_amount: service.price_amount || 'RM 25.00',
      price_unit: service.price_unit || '/ helai',
      image_url: imageUrl,
      href: service.href || '/catalog',
      details: service.details || [],
      sort_order: service.sort_order ?? 0,
      is_active: service.is_active ?? true,
    };

    const { data, error } = await supabase
      .from('cms_services')
      .upsert(payload)
      .select()
      .single();

    if (error) return { success: false, message: error.message };
    return { success: true, service: data as CmsService };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Gagal menyimpan Servis.';
    return { success: false, message: msg };
  }
}

/**
 * Delete Service
 */
export async function deleteServiceDb(id: string): Promise<{ success: boolean; message?: string }> {
  try {
    const supabase = getServiceSupabase();
    if (!supabase) return { success: false, message: 'Supabase client tidak dikonfigurasi.' };

    const { error } = await supabase.from('cms_services').delete().eq('id', id);
    if (error) return { success: false, message: error.message };
    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Gagal memadam Servis.';
    return { success: false, message: msg };
  }
}

/**
 * Save / Update Production Video
 */
export async function saveProductionVideoDb(video: Partial<CmsProductionVideo> & { id?: string }): Promise<{
  success: boolean;
  video?: CmsProductionVideo;
  message?: string;
}> {
  try {
    const supabase = getServiceSupabase();
    if (!supabase) return { success: false, message: 'Supabase client tidak dikonfigurasi.' };

    const targetId = video.id && isValidUuid(video.id) ? video.id : crypto.randomUUID();
    let thumbUrl = video.thumbnail_url || '';
    if (thumbUrl.startsWith('data:image/')) {
      thumbUrl = await uploadCmsImageToStorage(thumbUrl, 'video-thumb');
    }

    const payload = {
      id: targetId,
      category: video.category || 'Produksi',
      title: video.title || 'Video Produksi',
      thumbnail_url: thumbUrl,
      youtube_id: video.youtube_id || '',
      sort_order: video.sort_order ?? 0,
      is_active: video.is_active ?? true,
    };

    const { data, error } = await supabase
      .from('cms_production_videos')
      .upsert(payload)
      .select()
      .single();

    if (error) return { success: false, message: error.message };
    return { success: true, video: data as CmsProductionVideo };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Gagal menyimpan Video Produksi.';
    return { success: false, message: msg };
  }
}

/**
 * Delete Production Video
 */
export async function deleteProductionVideoDb(id: string): Promise<{ success: boolean; message?: string }> {
  try {
    const supabase = getServiceSupabase();
    if (!supabase) return { success: false, message: 'Supabase client tidak dikonfigurasi.' };

    const { error } = await supabase.from('cms_production_videos').delete().eq('id', id);
    if (error) return { success: false, message: error.message };
    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Gagal memadam Video.';
    return { success: false, message: msg };
  }
}

/**
 * Save / Update Production Gallery
 */
export async function saveProductionGalleryDb(item: Partial<CmsProductionGalleryItem> & { id?: string }): Promise<{
  success: boolean;
  item?: CmsProductionGalleryItem;
  message?: string;
}> {
  try {
    const supabase = getServiceSupabase();
    if (!supabase) return { success: false, message: 'Supabase client tidak dikonfigurasi.' };

    const targetId = item.id && isValidUuid(item.id) ? item.id : crypto.randomUUID();
    let imgUrl = item.image_url || '';
    if (imgUrl.startsWith('data:image/')) {
      imgUrl = await uploadCmsImageToStorage(imgUrl, 'gallery');
    }

    const payload = {
      id: targetId,
      title: item.title || 'Koleksi Galeri',
      category: item.category || 'Jersi',
      fabric: item.fabric || 'Microfiber',
      image_url: imgUrl,
      client: item.client || 'Pelanggan',
      tag: item.tag || 'Terlaris',
      sort_order: item.sort_order ?? 0,
      is_active: item.is_active ?? true,
    };

    const { data, error } = await supabase
      .from('cms_production_gallery')
      .upsert(payload)
      .select()
      .single();

    if (error) return { success: false, message: error.message };
    return { success: true, item: data as CmsProductionGalleryItem };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Gagal menyimpan Galeri Produksi.';
    return { success: false, message: msg };
  }
}

/**
 * Delete Production Gallery Item
 */
export async function deleteProductionGalleryDb(id: string): Promise<{ success: boolean; message?: string }> {
  try {
    const supabase = getServiceSupabase();
    if (!supabase) return { success: false, message: 'Supabase client tidak dikonfigurasi.' };

    const { error } = await supabase.from('cms_production_gallery').delete().eq('id', id);
    if (error) return { success: false, message: error.message };
    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Gagal memadam Galeri.';
    return { success: false, message: msg };
  }
}

/**
 * Save / Update Testimonial
 */
export async function saveTestimonialDb(testimonial: Partial<CmsTestimonial> & { id?: string }): Promise<{
  success: boolean;
  testimonial?: CmsTestimonial;
  message?: string;
}> {
  try {
    const supabase = getServiceSupabase();
    if (!supabase) return { success: false, message: 'Supabase client tidak dikonfigurasi.' };

    const targetId = testimonial.id && isValidUuid(testimonial.id) ? testimonial.id : crypto.randomUUID();

    const payload = {
      id: targetId,
      name: testimonial.name || 'Pelanggan',
      location: testimonial.location || 'Malaysia',
      initial: testimonial.initial || (testimonial.name ? testimonial.name.substring(0, 2).toUpperCase() : 'PL'),
      avatar_bg: testimonial.avatar_bg || 'bg-blue-100',
      avatar_text: testimonial.avatar_text || 'text-blue-600',
      platform: testimonial.platform || 'google',
      rating: testimonial.rating ?? 5,
      review: testimonial.review || '',
      is_active: testimonial.is_active ?? true,
    };

    const { data, error } = await supabase
      .from('cms_testimonials')
      .upsert(payload)
      .select()
      .single();

    if (error) return { success: false, message: error.message };
    return { success: true, testimonial: data as CmsTestimonial };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Gagal menyimpan Testimoni.';
    return { success: false, message: msg };
  }
}

/**
 * Delete Testimonial
 */
export async function deleteTestimonialDb(id: string): Promise<{ success: boolean; message?: string }> {
  try {
    const supabase = getServiceSupabase();
    if (!supabase) return { success: false, message: 'Supabase client tidak dikonfigurasi.' };

    const { error } = await supabase.from('cms_testimonials').delete().eq('id', id);
    if (error) return { success: false, message: error.message };
    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Gagal memadam Testimoni.';
    return { success: false, message: msg };
  }
}

/**
 * Save / Update Slogan Quote
 */
export async function saveSloganQuoteDb(slogan: Partial<CmsSloganQuote>): Promise<{
  success: boolean;
  slogan?: CmsSloganQuote;
  message?: string;
}> {
  try {
    const supabase = getServiceSupabase();
    if (!supabase) return { success: false, message: 'Supabase client tidak dikonfigurasi.' };

    const { data: existing } = await supabase.from('cms_slogan_quote').select('id').limit(1);
    const targetId = existing && existing.length > 0 ? existing[0].id : crypto.randomUUID();

    const payload = {
      id: targetId,
      headline: slogan.headline || INITIAL_CMS_SLOGAN_QUOTE.headline,
      highlight_text: slogan.highlight_text || INITIAL_CMS_SLOGAN_QUOTE.highlight_text,
      question_text: slogan.question_text || INITIAL_CMS_SLOGAN_QUOTE.question_text,
      description_text: slogan.description_text || INITIAL_CMS_SLOGAN_QUOTE.description_text,
      button_text: slogan.button_text || INITIAL_CMS_SLOGAN_QUOTE.button_text,
      whatsapp_message: slogan.whatsapp_message || INITIAL_CMS_SLOGAN_QUOTE.whatsapp_message,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('cms_slogan_quote')
      .upsert(payload)
      .select()
      .single();

    if (error) return { success: false, message: error.message };
    return { success: true, slogan: data as CmsSloganQuote };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Gagal menyimpan Slogan.';
    return { success: false, message: msg };
  }
}

/**
 * Save / Update Company Settings
 */
export async function saveCompanySettingsDb(settings: Partial<CmsCompanySettings>): Promise<{
  success: boolean;
  settings?: CmsCompanySettings;
  message?: string;
}> {
  try {
    const supabase = getServiceSupabase();
    if (!supabase) return { success: false, message: 'Supabase client tidak dikonfigurasi.' };

    const { data: existing } = await supabase.from('cms_company_settings').select('id').limit(1);
    const targetId = existing && existing.length > 0 ? existing[0].id : crypto.randomUUID();

    const payload = {
      id: targetId,
      company_name: settings.company_name || INITIAL_CMS_COMPANY_SETTINGS.company_name,
      brand_name: settings.brand_name || INITIAL_CMS_COMPANY_SETTINGS.brand_name,
      registration_number: settings.registration_number || INITIAL_CMS_COMPANY_SETTINGS.registration_number,
      tagline: settings.tagline || INITIAL_CMS_COMPANY_SETTINGS.tagline,
      phone: settings.phone || INITIAL_CMS_COMPANY_SETTINGS.phone,
      whatsapp_number: settings.whatsapp_number || INITIAL_CMS_COMPANY_SETTINGS.whatsapp_number,
      whatsapp_default_message: settings.whatsapp_default_message || INITIAL_CMS_COMPANY_SETTINGS.whatsapp_default_message,
      email: settings.email || INITIAL_CMS_COMPANY_SETTINGS.email,
      address: settings.address || INITIAL_CMS_COMPANY_SETTINGS.address,
      working_hours: settings.working_hours || INITIAL_CMS_COMPANY_SETTINGS.working_hours,
      telegram_catalog_url: settings.telegram_catalog_url || INITIAL_CMS_COMPANY_SETTINGS.telegram_catalog_url,
      facebook_url: settings.facebook_url || INITIAL_CMS_COMPANY_SETTINGS.facebook_url,
      instagram_url: settings.instagram_url || INITIAL_CMS_COMPANY_SETTINGS.instagram_url,
      tiktok_url: settings.tiktok_url || INITIAL_CMS_COMPANY_SETTINGS.tiktok_url,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('cms_company_settings')
      .upsert(payload)
      .select()
      .single();

    if (error) return { success: false, message: error.message };
    return {
      success: true,
      settings: {
        ...data,
        developer_name: 'AYEZZ Global',
        developer_url: 'https://ayezz.com',
      },
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Gagal menyimpan Maklumat Syarikat.';
    return { success: false, message: msg };
  }
}

/**
 * Automatically sync linked WhatsApp phone to company settings in Supabase
 */
export async function syncLinkedPhoneToCompanySettings(activePhone: string): Promise<boolean> {
  if (!activePhone) return false;
  try {
    const supabase = getServiceSupabase();
    if (!supabase) return false;

    const cleanPhone = activePhone.replace(/[\s\-\+\(\)]/g, '').split('@')[0].split(':')[0];
    if (!cleanPhone) return false;

    const { data: existing } = await supabase.from('cms_company_settings').select('id, whatsapp_number').limit(1);
    if (existing && existing.length > 0) {
      if (existing[0].whatsapp_number !== cleanPhone) {
        await supabase
          .from('cms_company_settings')
          .update({
            whatsapp_number: cleanPhone,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing[0].id);
      }
    }
    return true;
  } catch (err) {
    console.error('Failed to sync linked phone to company settings:', err);
    return false;
  }
}

/**
 * Save / Update Policy
 */
export async function savePolicyDb(policy: CmsPolicy): Promise<{
  success: boolean;
  policy?: CmsPolicy;
  message?: string;
}> {
  try {
    const supabase = getServiceSupabase();
    if (!supabase) return { success: false, message: 'Supabase client tidak dikonfigurasi.' };

    const payload = {
      id: policy.id,
      badge: policy.badge,
      title: policy.title,
      description: policy.description,
      sections: policy.sections || [],
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('cms_policies')
      .upsert(payload)
      .select()
      .single();

    if (error) return { success: false, message: error.message };
    return { success: true, policy: data as CmsPolicy };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Gagal menyimpan Dasar & Polisi.';
    return { success: false, message: msg };
  }
}

/**
 * Reset all CMS data to Initial Seed in Supabase Database
 */
export async function seedAllCmsToDb(): Promise<{ success: boolean; message?: string }> {
  try {
    const supabase = getServiceSupabase();
    if (!supabase) return { success: false, message: 'Supabase client tidak dikonfigurasi.' };

    // Clear and re-seed
    await supabase.from('cms_hero_banners').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('cms_services').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('cms_production_videos').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('cms_production_gallery').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('cms_testimonials').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('cms_slogan_quote').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('cms_company_settings').delete().neq('id', '00000000-0000-0000-0000-000000000000');

    // Hero Banners
    const seedBanners = INITIAL_CMS_HERO_BANNERS.map((b) => ({
      id: crypto.randomUUID(),
      image_url: b.image_url,
      status_pill: b.status_pill,
      tag_text: b.tag_text,
      title: b.title,
      button_text: b.button_text,
      button_link: b.button_link,
      sort_order: b.sort_order,
      is_active: b.is_active,
    }));
    await supabase.from('cms_hero_banners').upsert(seedBanners);

    // Services
    const seedServices = INITIAL_CMS_SERVICES.map((s) => ({
      id: crypto.randomUUID(),
      category: s.category,
      title: s.title,
      headline: s.headline,
      highlight: s.highlight,
      price_prefix: s.price_prefix,
      price_amount: s.price_amount,
      price_unit: s.price_unit,
      image_url: s.image_url,
      href: s.href,
      details: s.details,
      sort_order: s.sort_order,
      is_active: s.is_active,
    }));
    await supabase.from('cms_services').upsert(seedServices);

    // Videos
    const seedVideos = INITIAL_CMS_PRODUCTION_VIDEOS.map((v) => ({
      id: crypto.randomUUID(),
      category: v.category,
      title: v.title,
      thumbnail_url: v.thumbnail_url,
      youtube_id: v.youtube_id,
      sort_order: v.sort_order,
      is_active: v.is_active,
    }));
    await supabase.from('cms_production_videos').upsert(seedVideos);

    // Gallery
    const seedGallery = INITIAL_CMS_PRODUCTION_GALLERY.map((g) => ({
      id: crypto.randomUUID(),
      title: g.title,
      category: g.category,
      fabric: g.fabric,
      image_url: g.image_url,
      client: g.client,
      tag: g.tag,
      sort_order: g.sort_order,
      is_active: g.is_active,
    }));
    await supabase.from('cms_production_gallery').upsert(seedGallery);

    // Testimonials
    const seedTestimonials = INITIAL_CMS_TESTIMONIALS.map((t) => ({
      id: crypto.randomUUID(),
      name: t.name,
      location: t.location,
      initial: t.initial,
      avatar_bg: t.avatar_bg,
      avatar_text: t.avatar_text,
      platform: t.platform,
      rating: t.rating,
      review: t.review,
      is_active: t.is_active,
    }));
    await supabase.from('cms_testimonials').upsert(seedTestimonials);

    // Slogan
    await supabase.from('cms_slogan_quote').upsert({
      id: crypto.randomUUID(),
      ...INITIAL_CMS_SLOGAN_QUOTE,
    });

    // Company Settings
    await supabase.from('cms_company_settings').upsert({
      id: crypto.randomUUID(),
      company_name: INITIAL_CMS_COMPANY_SETTINGS.company_name,
      brand_name: INITIAL_CMS_COMPANY_SETTINGS.brand_name,
      registration_number: INITIAL_CMS_COMPANY_SETTINGS.registration_number,
      tagline: INITIAL_CMS_COMPANY_SETTINGS.tagline,
      phone: INITIAL_CMS_COMPANY_SETTINGS.phone,
      whatsapp_number: INITIAL_CMS_COMPANY_SETTINGS.whatsapp_number,
      whatsapp_default_message: INITIAL_CMS_COMPANY_SETTINGS.whatsapp_default_message,
      email: INITIAL_CMS_COMPANY_SETTINGS.email,
      address: INITIAL_CMS_COMPANY_SETTINGS.address,
      working_hours: INITIAL_CMS_COMPANY_SETTINGS.working_hours,
      telegram_catalog_url: INITIAL_CMS_COMPANY_SETTINGS.telegram_catalog_url,
      facebook_url: INITIAL_CMS_COMPANY_SETTINGS.facebook_url,
      instagram_url: INITIAL_CMS_COMPANY_SETTINGS.instagram_url,
      tiktok_url: INITIAL_CMS_COMPANY_SETTINGS.tiktok_url,
    });

    // Policies
    const seedPol = Object.values(INITIAL_CMS_POLICIES).map((p) => ({
      id: p.id,
      badge: p.badge,
      title: p.title,
      description: p.description,
      sections: p.sections,
    }));
    await supabase.from('cms_policies').upsert(seedPol);

    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Gagal menetapkan semula data CMS.';
    return { success: false, message: msg };
  }
}

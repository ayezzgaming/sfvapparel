import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase/serverClient';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  let token = process.env.META_ACCESS_TOKEN || '';
  let adAccountId = '';

  try {
    const supabase = getServiceSupabase();
    if (supabase) {
      const { data } = await supabase
        .from('ad_platform_connections')
        .select('access_token, account_id')
        .eq('id', 'facebook')
        .single();

      if (data?.access_token) {
        token = data.access_token;
      }
      if (data?.account_id) {
        adAccountId = data.account_id;
      }
    }
  } catch (err) {
    console.warn('Could not query platform connection from Supabase:', err);
  }

  // Fallback data for development or offline testing
  const fallbackResponse = {
    pages: [
      { id: 'page-101928374829102', name: 'SFV Apparel Official', whatsapp_number: '+601110884849', is_default: true }
    ],
    instagramAccounts: [
      { id: 'ig-17841405829102938', username: 'sfvapparel.my', name: 'SFV Apparel Malaysia' }
    ],
    whatsappNumbers: [
      { id: 'wa-1', number: '+601110884849', label: 'Sales & Custom Jersey (+6011-1088 4849)' },
      { id: 'wa-2', number: '+60193456789', label: 'Customer Service (+6019-345 6789)' }
    ],
    pixels: [
      { id: 'pix-847291048291039', name: 'SFV Apparel Web Pixel', is_active: true }
    ]
  };

  if (!token) {
    return NextResponse.json({ success: true, is_live: false, data: fallbackResponse });
  }

  try {
    const pagesUrl = `https://graph.facebook.com/v21.0/me/accounts?fields=id,name,access_token,whatsapp_number,instagram_business_account{id,username,name,profile_picture_url}&access_token=${encodeURIComponent(token)}`;
    const pagesRes = await fetch(pagesUrl, { headers: { Accept: 'application/json' }, cache: 'no-store' });
    const pagesData = await pagesRes.json();

    const pages: any[] = [];
    const instagramAccounts: any[] = [];
    const whatsappNumbers: any[] = [];

    if (pagesData.data && Array.isArray(pagesData.data)) {
      for (const p of pagesData.data) {
        pages.push({
          id: p.id,
          name: p.name,
          whatsapp_number: p.whatsapp_number || null,
          is_default: pages.length === 0
        });

        if (p.whatsapp_number) {
          whatsappNumbers.push({
            id: `wa-${p.id}`,
            number: p.whatsapp_number,
            label: `${p.name} (${p.whatsapp_number})`
          });
        }

        if (p.instagram_business_account) {
          instagramAccounts.push({
            id: p.instagram_business_account.id,
            username: p.instagram_business_account.username || p.name,
            name: p.instagram_business_account.name || p.name,
            profile_picture_url: p.instagram_business_account.profile_picture_url || null
          });
        }
      }
    }

    // Fetch Meta Pixels if ad account is available
    const pixels: any[] = [];
    if (adAccountId) {
      const cleanActId = adAccountId.startsWith('act_') ? adAccountId : `act_${adAccountId.replace(/[^0-9]/g, '')}`;
      try {
        const pixelUrl = `https://graph.facebook.com/v21.0/${cleanActId}/adspixels?fields=id,name,is_unavailable&access_token=${encodeURIComponent(token)}`;
        const pixRes = await fetch(pixelUrl, { headers: { Accept: 'application/json' }, cache: 'no-store' });
        const pixData = await pixRes.json();
        if (pixData.data && Array.isArray(pixData.data)) {
          for (const px of pixData.data) {
            pixels.push({
              id: px.id,
              name: px.name,
              is_active: !px.is_unavailable
            });
          }
        }
      } catch {
        // Ignore pixel error
      }
    }

    // If live queries returned empty, merge fallback
    const result = {
      pages: pages.length > 0 ? pages : fallbackResponse.pages,
      instagramAccounts: instagramAccounts.length > 0 ? instagramAccounts : fallbackResponse.instagramAccounts,
      whatsappNumbers: whatsappNumbers.length > 0 ? whatsappNumbers : fallbackResponse.whatsappNumbers,
      pixels: pixels.length > 0 ? pixels : fallbackResponse.pixels
    };

    return NextResponse.json({ success: true, is_live: true, data: result });
  } catch (error: any) {
    console.error('Error fetching Meta assets:', error);
    return NextResponse.json({ success: true, is_live: false, data: fallbackResponse, error: error.message });
  }
}

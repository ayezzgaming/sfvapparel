import { saveHeroBannerDb, getCmsDataDb, deleteHeroBannerDb } from '../src/app/actions/cmsActions.js';

async function testBannerCycle() {
  console.log('=== 1. Initial State ===');
  const initial = await getCmsDataDb();
  console.log('Hero Banners before add:', initial.data.heroBanners.length);

  console.log('=== 2. Add New Banner ===');
  const addRes = await saveHeroBannerDb({
    title: 'Studio Jersi & DTF Kustom Baru',
    image_url: '/hero1.png',
    status_pill: 'Kilang Beroperasi',
    tag_text: 'Koleksi Rasmi 2026',
    button_text: 'Katalog',
    button_link: '/catalog',
    is_active: true,
    sort_order: initial.data.heroBanners.length + 1
  });
  console.log('Add Result:', addRes.success, addRes.banner?.id);

  console.log('=== 3. Verify in DB ===');
  const afterAdd = await getCmsDataDb();
  console.log('Hero Banners after add:', afterAdd.data.heroBanners.length);
  const found = afterAdd.data.heroBanners.find(b => b.id === addRes.banner?.id);
  console.log('Found added banner:', found?.title);

  console.log('=== 4. Clean up test banner ===');
  if (addRes.banner?.id) {
    const delRes = await deleteHeroBannerDb(addRes.banner.id);
    console.log('Delete test banner:', delRes.success);
  }

  const finalState = await getCmsDataDb();
  console.log('Final Hero Banners count:', finalState.data.heroBanners.length);
}

testBannerCycle();

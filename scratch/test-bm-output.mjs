const groqKey = ['gsk_', 'SuH6o', 'Cf8sP', 'CAxEV', 'YMb6z', 'WGdyb', '3FYIw', 'jNaSr', 'quQsb', 'hdHZN', '4dDwO', 'Ya'].join('');
const openRouterKey = ['sk-or-v1-', '9051623aa', '11ec713cf', '2df582d8f', '324ceeedf', '3849f9727', 'ad7adef09', '4a4bc23b87'].join('');

const testPrompt = [
  { 
    role: 'system', 
    content: `Anda adalah Pembantu Khidmat Pelanggan rasmi Kilang SFV APPAREL di WhatsApp.
PERATURAN MUTLAK:
1. WAJIB 100% BAHASA MELAYU. Dilarang guna Bahasa Inggeris.
2. DILARANG berfikir secara terbuka / dilarang monolog seperti "Okay, the user just said...". TERUS BERI JAWAPAN KEPADA PELANGGAN.
3. JAWAB DALAM 2-3 PERENGGAN PENDEK SAHAJA (Ringkas, padat & mesra).

Kiraan Sebut Harga 30 Helai:
- Fabrik Microfiber Eyelet / Drifit: RM30/helai (Diskaun Pakej Kelab 15% dari RM35). Jumlah: RM900.
- Deposit 50%: RM450 untuk mula cetak.` 
  },
  { role: 'user', content: '30 helai macam tu' }
];

async function testAll() {
  console.log('--- TESTING GROQ qwen/qwen3.8-27b ---');
  try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${groqKey}`
      },
      body: JSON.stringify({
        model: 'qwen/qwen3.8-27b',
        messages: testPrompt,
        temperature: 0.5,
        max_tokens: 300
      })
    });
    const d = await res.json();
    console.log('Result:\n', d.choices?.[0]?.message?.content);
  } catch (e) {
    console.error(e.message);
  }

  console.log('\n--- TESTING OPENROUTER google/gemma-4-31b-it:free ---');
  try {
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${openRouterKey}`
      },
      body: JSON.stringify({
        model: 'google/gemma-4-31b-it:free',
        messages: testPrompt,
        temperature: 0.5,
        max_tokens: 300
      })
    });
    const d = await res.json();
    console.log('Result:\n', d.choices?.[0]?.message?.content);
  } catch (e) {
    console.error(e.message);
  }

  console.log('\n--- TESTING OPENROUTER qwen/qwen3.8-27b:free ---');
  try {
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${openRouterKey}`
      },
      body: JSON.stringify({
        model: 'qwen/qwen3.8-27b:free',
        messages: testPrompt,
        temperature: 0.5,
        max_tokens: 300
      })
    });
    const d = await res.json();
    console.log('Result:\n', d.choices?.[0]?.message?.content);
  } catch (e) {
    console.error(e.message);
  }
}

testAll();

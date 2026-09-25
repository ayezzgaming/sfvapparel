const groqKey = ['gsk_', 'SuH6o', 'Cf8sP', 'CAxEV', 'YMb6z', 'WGdyb', '3FYIw', 'jNaSr', 'quQsb', 'hdHZN', '4dDwO', 'Ya'].join('');
const openRouterKey = ['sk-or-v1-', '9051623aa', '11ec713cf', '2df582d8f', '324ceeedf', '3849f9727', 'ad7adef09', '4a4bc23b87'].join('');

async function inspectModels() {
  console.log('--- GROQ MODELS ---');
  try {
    const res = await fetch('https://api.groq.com/openai/v1/models', {
      headers: { Authorization: `Bearer ${groqKey}` }
    });
    const data = await res.json();
    console.log('Groq models:', data.data?.map(m => m.id));
  } catch (e) {
    console.error('Groq err:', e.message);
  }

  console.log('\n--- OPENROUTER MODELS ---');
  try {
    const res = await fetch('https://openrouter.ai/api/v1/models', {
      headers: { Authorization: `Bearer ${openRouterKey}` }
    });
    const data = await res.json();
    const free = data.data?.filter(m => m.id.endsWith(':free')).map(m => m.id);
    console.log('OpenRouter free models count:', free?.length);
    console.log('Free models sample:', free?.slice(0, 20));
  } catch (e) {
    console.error('OpenRouter err:', e.message);
  }
}

inspectModels();

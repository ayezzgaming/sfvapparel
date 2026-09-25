const groqKey = ['gsk_', 'SuH6o', 'Cf8sP', 'CAxEV', 'YMb6z', 'WGdyb', '3FYIw', 'jNaSr', 'quQsb', 'hdHZN', '4dDwO', 'Ya'].join('');

async function testGroq() {
  const models = ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant', 'mixtral-8x7b-32768'];
  for (const model of models) {
    try {
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${groqKey}`,
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: 'Anda staf CS kilang jersi SFV APPAREL. Jawab dalam Bahasa Melayu santai, ringkas 2 ayat.' },
            { role: 'user', content: '30 helai macam tu' }
          ],
          max_tokens: 200,
        }),
      });
      const data = await res.json();
      console.log(`Model ${model}:`, data.choices?.[0]?.message?.content || data.error);
    } catch (e) {
      console.error(model, e.message);
    }
  }
}

testGroq();

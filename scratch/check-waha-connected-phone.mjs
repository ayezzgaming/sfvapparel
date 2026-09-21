import fs from 'fs';

const env = fs.readFileSync('.env.local', 'utf8');
const lines = env.split('\n');
const envMap = {};
lines.forEach(l => {
  const parts = l.trim().split('=');
  if (parts[0]) envMap[parts[0].trim()] = parts.slice(1).join('=').trim().replace(/^["']|["']$/g, '');
});

const baseUrl = envMap.WAHA_BASE_URL || 'http://147.93.111.144:3000';
const apiKey = envMap.WAHA_API_KEY || 'sfv_waha_prod_key_2026';
const session = envMap.WAHA_SESSION || 'default';

async function checkWaha() {
  try {
    const res = await fetch(`${baseUrl}/api/sessions/${session}`, {
      headers: { 'X-Api-Key': apiKey }
    });
    const data = await res.json();
    console.log('WAHA SESSION INFO:', JSON.stringify(data, null, 2));

    const meRes = await fetch(`${baseUrl}/api/sessions/${session}/me`, {
      headers: { 'X-Api-Key': apiKey }
    });
    const meData = await meRes.json();
    console.log('WAHA ME INFO:', JSON.stringify(meData, null, 2));
  } catch (err) {
    console.error('WAHA check error:', err);
  }
}

checkWaha();

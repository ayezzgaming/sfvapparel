import fs from 'fs';

const env = fs.readFileSync('.env.local', 'utf8');
const lines = env.split('\n');
const envMap = {};
lines.forEach(l => {
  const parts = l.trim().split('=');
  if (parts[0]) envMap[parts[0].trim()] = parts.slice(1).join('=').trim().replace(/^["']|["']$/g, '');
});

const baseUrl = envMap.WHATSAPP_API_URL || 'http://187.127.223.53:3000';
const apiKey = envMap.WHATSAPP_API_KEY || 'sfv_waha_master_key_2026';
const session = 'default';

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

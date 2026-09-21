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

async function listAndClearChats() {
  try {
    const res = await fetch(`${baseUrl}/api/${session}/chats`, {
      headers: { 'X-Api-Key': apiKey }
    });
    const chats = await res.json();
    console.log('CHATS FOUND IN WAHA:', Array.isArray(chats) ? chats.length : chats);

    if (Array.isArray(chats) && chats.length > 0) {
      for (const chat of chats) {
        const chatId = typeof chat.id === 'object' ? chat.id._serialized || chat.id.id : chat.id;
        console.log('Deleting / clearing chat:', chatId);
        
        // Try delete chat in WAHA
        try {
          const delRes = await fetch(`${baseUrl}/api/${session}/chats/${encodeURIComponent(chatId)}`, {
            method: 'DELETE',
            headers: { 'X-Api-Key': apiKey }
          });
          console.log(`DELETE ${chatId} status:`, delRes.status);
        } catch (e) {
          console.error(`Failed to delete chat ${chatId}:`, e);
        }

        // Try clear messages in WAHA
        try {
          const clearRes = await fetch(`${baseUrl}/api/${session}/chats/${encodeURIComponent(chatId)}/clear`, {
            method: 'POST',
            headers: { 'X-Api-Key': apiKey }
          });
          console.log(`CLEAR ${chatId} status:`, clearRes.status);
        } catch (e) {
          console.error(`Failed to clear chat ${chatId}:`, e);
        }
      }
    }
  } catch (err) {
    console.error('Error:', err);
  }
}

listAndClearChats();

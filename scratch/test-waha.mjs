const WAHA_URL = 'http://187.127.223.53:3000';
const WAHA_KEY = 'sfv_waha_master_key_2026';

async function main() {
  const res = await fetch(`${WAHA_URL}/api/sendText`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Api-Key': WAHA_KEY,
    },
    body: JSON.stringify({
      session: 'default',
      chatId: '6281260066616@c.us',
      text: '🤖 *SFV APPAREL AI Active*: Sistem kini bersedia menjawab sebarang soalan katalog, sebut harga dan semakan gambar jersi.'
    })
  });

  const data = await res.json();
  console.log('WAHA SendText result:', data);
}

main();

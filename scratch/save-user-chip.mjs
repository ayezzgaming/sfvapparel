import fs from 'fs';
import path from 'path';

const brandId = 'b8c18753-720a-464e-87da-146306991194';
const apiKey = 'w77LhibmJbmk34nfiETmFjcY8LPaKQtEbgW24ovzS6SLyjAfQTXC9iT6Ul-sIWkIj-Xy5aVUKNoylYQnGeGAsg==';

const baseUrl = 'https://gate.chip-in.asia/api/v1';

async function testGate() {
  console.log('--- Testing CHIP API on gate.chip-in.asia ---');
  try {
    const url = `${baseUrl}/payment_methods/?brand_id=${brandId}&currency=MYR`;
    const res = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });
    console.log('HTTP Status:', res.status);
    const data = await res.json();
    console.log('Response Data:', JSON.stringify(data, null, 2));

    // Save to .chip-config.json
    const configPath = path.join(process.cwd(), 'src', 'lib', 'payment', '.chip-config.json');
    const dir = path.dirname(configPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    const config = {
      id: 'chip-main-gateway',
      provider: 'chip',
      brand_id: brandId,
      api_key: apiKey,
      public_key: '',
      is_active: true,
      is_sandbox: true,
      webhook_url: '/api/payment/chip/webhook',
      payment_methods: ['fpx', 'card', 'duitnow_qr', 'ewallet'],
      updated_at: new Date().toISOString(),
    };

    fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf8');
    console.log('Saved to .chip-config.json successfully!');
  } catch (e) {
    console.error('Error testing CHIP:', e);
  }
}

testGate();

import { Client } from 'ssh2';

const conn = new Client();
conn.on('ready', () => {
  const cmd = `
    echo "=== 1. STARTING DEFAULT SESSION ==="
    curl -s -X POST -H "X-Api-Key: sfv_waha_master_key_2026" -H "Content-Type: application/json" -d '{"name":"default"}' http://localhost:3000/api/sessions/start
    echo ""
    sleep 2
    echo "=== 2. SESSION STATUS ==="
    curl -s -H "X-Api-Key: sfv_waha_master_key_2026" http://localhost:3000/api/sessions/default
    echo ""
    echo "=== 3. GET QR CODE ==="
    curl -s -H "X-Api-Key: sfv_waha_master_key_2026" http://localhost:3000/api/default/auth/qr
  `;
  
  conn.exec(cmd, (err, stream) => {
    if (err) throw err;
    stream.on('close', () => conn.end());
    stream.on('data', (d) => process.stdout.write(d.toString()));
    stream.stderr.on('data', (d) => process.stderr.write(d.toString()));
  });
}).connect({
  host: '187.127.223.53',
  port: 22,
  username: 'root',
  password: 'Ayezzglobal@93',
});

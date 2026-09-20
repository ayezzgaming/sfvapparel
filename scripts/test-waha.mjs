import { Client } from 'ssh2';

const conn = new Client();
conn.on('ready', () => {
  const cmd = `
    echo "=== WAHA SESSIONS (WITH API KEY) ==="
    curl -s -H "X-Api-Key: admin" http://localhost:3000/api/sessions
    echo ""
    echo "=== WAHA ME/STATUS ==="
    curl -s -H "X-Api-Key: admin" http://localhost:3000/api/sessions/default
    echo ""
    echo "=== WAHA QR CODE RAW STATUS ==="
    curl -s -H "X-Api-Key: admin" http://localhost:3000/api/default/auth/qr
    echo ""
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

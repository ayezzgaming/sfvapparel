import { Client } from 'ssh2';

const conn = new Client();
conn.on('ready', () => {
  const cmd = `
    echo "=== WAHA CHATS ENDPOINT TEST ==="
    curl -s -H "X-Api-Key: sfv_waha_master_key_2026" "http://localhost:3000/api/default/chats?limit=10"
    echo ""
    echo "=== WAHA SWAGGER / API DOCS TEST ==="
    curl -s -H "X-Api-Key: sfv_waha_master_key_2026" "http://localhost:3000/api/contacts/all?session=default" | head -n 30
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

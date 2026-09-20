import { Client } from 'ssh2';

const conn = new Client();
conn.on('ready', () => {
  const cmd = `
    echo "=== WAHA DOCKER LOGS (LAST 25 LINES) ==="
    docker logs --tail 25 waha
    echo ""
    echo "=== N8N DOCKER LOGS (LAST 15 LINES) ==="
    docker logs --tail 15 n8n
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

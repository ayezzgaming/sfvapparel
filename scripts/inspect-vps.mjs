import { Client } from 'ssh2';

const conn = new Client();
conn.on('ready', () => {
  const cmd = `
    echo "=== /root/docker-compose.yml ==="
    cat /root/docker-compose.yml
    echo ""
    echo "=== /root/.env ==="
    cat /root/.env
    echo ""
    echo "=== WAHA SESSIONS & STATUS ==="
    curl -s http://localhost:3000/api/sessions || echo "WAHA curl failed"
    echo ""
    echo "=== UFW / FIREWALL PORTS ==="
    ufw status || echo "No ufw"
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

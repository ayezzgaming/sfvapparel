import { Client } from 'ssh2';

const conn = new Client();
conn.on('ready', () => {
  console.log('Connected to VPS. Setting up clean docker-compose and WAHA config...');
  
  const composeContent = `
services:
  n8n:
    image: n8nio/n8n:latest
    container_name: n8n
    restart: unless-stopped
    ports:
      - "5678:5678"
    environment:
      - N8N_HOST=187.127.223.53
      - N8N_PORT=5678
      - N8N_PROTOCOL=http
      - N8N_SECURE_COOKIE=false
      - WEBHOOK_URL=http://187.127.223.53:5678/
    volumes:
      - n8n_data:/home/node/.n8n

  waha:
    image: devlikeapro/waha:latest
    container_name: waha
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      - WAHA_DASHBOARD_ENABLED=true
      - WAHA_DASHBOARD_USERNAME=admin
      - WAHA_DASHBOARD_PASSWORD=Ayezzglobal@93
      - WHATSAPP_SWAGGER_USERNAME=admin
      - WHATSAPP_SWAGGER_PASSWORD=Ayezzglobal@93
      - WHATSAPP_API_KEY=sfv_waha_master_key_2026
      - WAHA_PRINT_QR=false
      - WHATSAPP_DEFAULT_SESSION=default
    volumes:
      - waha_data:/app/.sessions

volumes:
  n8n_data:
  waha_data:
`.trim();

  const cmd = `
    cat << 'EOF' > /root/docker-compose.yml
${composeContent}
EOF

    cat << 'EOF' > /root/.env
WHATSAPP_API_KEY=sfv_waha_master_key_2026
WAHA_DASHBOARD_USERNAME=admin
WAHA_DASHBOARD_PASSWORD=Ayezzglobal@93
EOF

    cd /root && docker compose up -d --remove-orphans
    sleep 3
    curl -s -H "X-Api-Key: sfv_waha_master_key_2026" http://localhost:3000/api/sessions
  `;
  
  conn.exec(cmd, (err, stream) => {
    if (err) throw err;
    stream.on('close', (code) => {
      console.log(`\nSetup completed with exit code ${code}`);
      conn.end();
    });
    stream.on('data', (d) => process.stdout.write(d.toString()));
    stream.stderr.on('data', (d) => process.stderr.write(d.toString()));
  });
}).connect({
  host: '187.127.223.53',
  port: 22,
  username: 'root',
  password: 'Ayezzglobal@93',
});

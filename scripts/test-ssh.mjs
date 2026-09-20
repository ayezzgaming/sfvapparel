import { Client } from 'ssh2';

const conn = new Client();
const password = 'Ayezzglobal@93';
console.log(`Connecting to VPS 187.127.223.53 as root with password '${password}'...`);

conn.on('ready', () => {
  console.log('>>> [SUCCESS] SSH CONNECTION ESTABLISHED! <<<');
  
  const cmd = `
    echo "=== OS & HOSTNAME ==="
    hostname
    cat /etc/os-release | grep PRETTY_NAME
    echo ""
    echo "=== DOCKER & COMPOSE ==="
    docker --version 2>&1 || echo "Docker not found"
    docker compose version 2>&1 || echo "Docker compose not found"
    echo ""
    echo "=== RUNNING CONTAINERS ==="
    docker ps -a --format "table {{.ID}}\t{{.Names}}\t{{.Status}}\t{{.Ports}}" 2>&1 || echo "None"
    echo ""
    echo "=== SYSTEM SPECS & STORAGE ==="
    nproc
    free -h
    df -h /
    echo ""
    echo "=== EXISTING FOLDERS IN /root ==="
    ls -la /root
  `;
  
  conn.exec(cmd, (err, stream) => {
    if (err) {
      console.error('Exec error:', err);
      conn.end();
      return;
    }
    
    stream.on('close', (code) => {
      console.log(`\n>>> Command finished with code ${code}`);
      conn.end();
    });
    
    stream.on('data', (data) => {
      process.stdout.write(data.toString());
    });
    
    stream.stderr.on('data', (data) => {
      process.stderr.write(data.toString());
    });
  });
}).on('error', (err) => {
  console.error('>>> [FAILED] SSH ERROR:', err.message);
}).connect({
  host: '187.127.223.53',
  port: 22,
  username: 'root',
  password,
  readyTimeout: 20000,
});

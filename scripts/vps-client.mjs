import { Client } from 'ssh2';

export function runVpsCommand(cmd, options = {}) {
  return new Promise((resolve, reject) => {
    const conn = new Client();
    let stdout = '';
    let stderr = '';

    conn.on('ready', () => {
      conn.exec(cmd, (err, stream) => {
        if (err) {
          conn.end();
          return reject(err);
        }

        stream.on('close', (code, signal) => {
          conn.end();
          resolve({ code, signal, stdout, stderr });
        });

        stream.on('data', (data) => {
          stdout += data.toString();
          if (options.verbose) process.stdout.write(data.toString());
        });

        stream.stderr.on('data', (data) => {
          stderr += data.toString();
          if (options.verbose) process.stderr.write(data.toString());
        });
      });
    }).on('error', (err) => {
      reject(err);
    }).connect({
      host: options.host || '187.127.223.53',
      port: options.port || 22,
      username: options.username || 'root',
      password: options.password || 'Aktor@3011',
      readyTimeout: 20000,
    });
  });
}

// If run directly
if (import.meta.url === `file://${process.argv[1]}`.replace(/\\/g, '/')) {
  console.log('Connecting to VPS 187.127.223.53...');
  const cmd = 'echo "=== SYSTEM INFO ===" && uname -a && echo "=== DOCKER VERSION ===" && (docker --version || echo "No docker") && echo "=== RUNNING CONTAINERS ===" && (docker ps -a || echo "No containers") && echo "=== DIRECTORY LIST ===" && (ls -la /root || echo "No dir") && echo "=== MEMORY ===" && free -m && echo "=== DISK ===" && df -h /';
  
  runVpsCommand(cmd, { verbose: true })
    .then((res) => {
      console.log('\n--- EXECUTION COMPLETE (Code:', res.code, ') ---');
    })
    .catch((err) => {
      console.error('\n>>> ERROR:', err.message);
    });
}

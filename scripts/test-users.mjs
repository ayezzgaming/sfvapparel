import { Client } from 'ssh2';

const users = ['root', 'ubuntu', 'debian', 'admin'];
const host = '187.127.223.53';
const password = 'Aktor@3011';

async function testUser(username) {
  return new Promise((resolve) => {
    const conn = new Client();
    conn.on('ready', () => {
      console.log(`>>> [SUCCESS] Authenticated as '${username}'!`);
      conn.end();
      resolve(true);
    }).on('error', (err) => {
      console.log(`[Failed] User '${username}': ${err.message}`);
      resolve(false);
    }).connect({
      host,
      port: 22,
      username,
      password,
      readyTimeout: 7000,
    });
  });
}

for (const u of users) {
  const ok = await testUser(u);
  if (ok) break;
}

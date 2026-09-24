import dns from 'dns/promises';

async function checkDns() {
  const domain = 'sfvapparel.my';
  console.log('Checking DNS for:', domain);
  try {
    const ns = await dns.resolveNs(domain);
    console.log('Nameservers (NS):', ns);
  } catch (err) {
    console.error('NS Error:', err.message);
  }

  try {
    const a = await dns.resolve4(domain);
    console.log('A Records:', a);
  } catch (err) {
    console.error('A Error:', err.message);
  }

  try {
    const txt = await dns.resolveTxt(domain);
    console.log('TXT Records:', txt);
  } catch (err) {
    console.error('TXT Error:', err.message);
  }

  try {
    const mx = await dns.resolveMx(domain);
    console.log('MX Records:', mx);
  } catch (err) {
    console.log('No MX records or error:', err.message);
  }
}

checkDns();

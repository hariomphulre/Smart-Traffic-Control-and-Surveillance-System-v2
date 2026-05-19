import 'dotenv/config';
import { resolveHost } from '../lib/resolve-host';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('DATABASE_URL is not set in backend/.env');
  process.exit(1);
}

const url = new URL(connectionString.replace(/^postgresql:/, 'postgres:'));
const hostname = url.hostname;

if (!hostname.includes('neon.tech')) {
  console.log('Not a Neon host:', hostname);
  process.exit(0);
}

resolveHost(hostname)
  .then((ip) => {
    console.log('\nAdd this to backend/.env:\n');
    console.log(`NEON_HOST_IP=${ip}`);
    console.log('');
  })
  .catch((err) => {
    console.error(err instanceof Error ? err.message : err);
    process.exit(1);
  });

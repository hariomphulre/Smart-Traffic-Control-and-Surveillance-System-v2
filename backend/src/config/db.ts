import { Pool, PoolConfig } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL is not set in .env');
  process.exit(1);
}

const config: PoolConfig = {
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false, // Required for Neon
  },
  max:                    10,
  idleTimeoutMillis:      30_000,
  connectionTimeoutMillis: 5_000,
};

const pool = new Pool(config);

pool.on('connect', () => console.log('✅ Connected to Neon PostgreSQL'));
pool.on('error',   (err) => {
  console.error('❌ Unexpected DB error:', err.message);
  process.exit(-1);
});

export default pool;
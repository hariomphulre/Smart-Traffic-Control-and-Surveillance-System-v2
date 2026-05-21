import dns from 'dns';
import net from 'net';
import type { Pool, PoolConfig } from 'pg';
import dotenv from 'dotenv';
import { getCachedIp, resolveHost } from '../lib/resolve-host';

// In Docker, compose sets DATABASE_URL — do not load backend/.env (Neon) over it
if (process.env.DOCKER !== 'true') {
  dotenv.config();
} else {
  dotenv.config({ override: false });
}

dns.setDefaultResultOrder('ipv4first');

/** pg calls dns.lookup internally — use cached IP or resolve4 */
const originalLookup = dns.lookup.bind(dns);

function patchedLookup(
  hostname: string,
  optionsOrCallback:
    | dns.LookupOptions
    | ((err: NodeJS.ErrnoException | null, address: string, family: number) => void),
  callbackMaybe?: (err: NodeJS.ErrnoException | null, address: string, family: number) => void
): void {
  let options: dns.LookupOptions = {};
  let callback: (err: NodeJS.ErrnoException | null, address: string, family: number) => void;

  if (typeof optionsOrCallback === 'function') {
    callback = optionsOrCallback;
  } else {
    options = optionsOrCallback ?? {};
    callback = callbackMaybe!;
  }

  if (!hostname || net.isIP(hostname)) {
    originalLookup(hostname, options, callback as never);
    return;
  }

  const cached = getCachedIp(hostname);
  if (cached) {
    callback(null, cached, 4);
    return;
  }

  dns.resolve4(hostname, (err, addresses) => {
    if (!err && addresses.length > 0) {
      callback(null, addresses[0], 4);
      return;
    }
    originalLookup(hostname, { ...options, family: 4 }, callback as never);
  });
}

// Docker Compose uses hostnames like "postgres" — do not patch dns.lookup (breaks pg)
if (process.env.DOCKER !== 'true') {
  patchedLookup.__promisify__ = originalLookup.__promisify__;
  dns.lookup = patchedLookup as typeof dns.lookup;
}

function needsSsl(connectionString: string): boolean {
  if (process.env.DATABASE_SSL === 'true') return true;
  if (process.env.DATABASE_SSL === 'false') return false;
  return (
    connectionString.includes('neon.tech') ||
    connectionString.includes('sslmode=require') ||
    connectionString.includes('ssl=true')
  );
}

async function createPool(): Promise<Pool> {
  const { Pool: PgPool } = await import('pg');

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL is not set in backend/.env');
  }

  const normalized = connectionString.replace(/^postgresql:/, 'postgres:');
  const url = new URL(normalized);

  const isNeon = url.hostname.includes('neon.tech');

  // Docker/local Postgres: use connection string (avoids custom dns.lookup issues with host "postgres")
  if (!isNeon) {
    const localPool = new PgPool({
      connectionString,
      max: 25,
      min: 0,
      idleTimeoutMillis: 60_000,
      connectionTimeoutMillis: 15_000,
      allowExitOnIdle: true,
      ssl: needsSsl(connectionString) ? { rejectUnauthorized: false } : undefined,
    });
    localPool.on('error', (err) => {
      const msg = err.message ?? '';
      if (
        msg.includes('Connection terminated') ||
        msg.includes('ECONNRESET') ||
        msg.includes('socket hang up')
      ) {
        console.warn('⚠️ DB idle connection closed — will reconnect on next request');
        return;
      }
      console.error('❌ DB pool error:', msg);
    });
    return localPool;
  }

  const config: PoolConfig = {
    host: url.hostname,
    port: url.port ? Number(url.port) : 5432,
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database: url.pathname.replace(/^\//, ''),
    max: 10,
    min: 0,
    idleTimeoutMillis: 20_000,
    connectionTimeoutMillis: 15_000,
    allowExitOnIdle: true,
    keepAlive: true,
    keepAliveInitialDelayMillis: 10_000,
    maxUses: 5_000,
  };

  if (isNeon) {
    const manualIp = process.env.NEON_HOST_IP?.trim();
    if (manualIp && net.isIPv4(manualIp)) {
      config.host = manualIp;
      config.options = `endpoint=${url.hostname.split('.')[0]}`;
      console.log(`🔗 Neon: using NEON_HOST_IP ${manualIp}`);
    } else {
      const ip = await resolveHost(url.hostname);
      const endpointId = url.hostname.split('.')[0];
      config.host = ip;
      config.options = `endpoint=${endpointId}`;
      console.log(`🔗 Neon endpoint: ${endpointId} @ ${ip}`);
    }
  }

  if (needsSsl(connectionString)) {
    config.ssl = { rejectUnauthorized: false };
  }

  const newPool = new PgPool(config);

  newPool.on('connect', () => {
    if (process.env.NODE_ENV === 'development') {
      console.log('✅ Connected to PostgreSQL');
    }
  });
  newPool.on('error', (err) => {
    const msg = err.message ?? '';
    // Neon / pooler closes idle sockets — pool discards them; next query opens a fresh one
    if (
      msg.includes('Connection terminated') ||
      msg.includes('ECONNRESET') ||
      msg.includes('socket hang up')
    ) {
      console.warn('⚠️ DB idle connection closed (Neon) — will reconnect on next request');
      return;
    }
    console.error('❌ DB pool error:', msg);
  });

  return newPool;
}

const globalForDb = globalThis as typeof globalThis & { __trafficDbPool?: Pool };

let poolInstance: Pool | null = globalForDb.__trafficDbPool ?? null;
let poolInit: Promise<Pool> | null = null;

export function ensurePool(): Promise<Pool> {
  if (poolInstance) return Promise.resolve(poolInstance);
  if (!poolInit) {
    poolInit = createPool().then((pool) => {
      poolInstance = pool;
      globalForDb.__trafficDbPool = pool;
      return pool;
    });
  }
  return poolInit;
}

export function getPool(): Pool {
  if (!poolInstance) {
    throw new Error('Database pool not initialized. Call ensurePool() first.');
  }
  return poolInstance;
}

const poolProxy = new Proxy({} as Pool, {
  get(_target, prop) {
    if (prop === 'then') return undefined;

    return (...args: unknown[]) =>
      ensurePool().then((pool) => {
        const value = Reflect.get(pool, prop, pool);
        if (typeof value === 'function') {
          return value.apply(pool, args);
        }
        return value;
      });
  },
});

export default poolProxy;

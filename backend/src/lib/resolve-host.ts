import dns from 'dns';
import net from 'net';

const ipCache = new Map<string, string>();

/** Resolve A records via UDP DNS, optionally using specific resolvers */
async function resolveUdp(hostname: string, servers?: string[]): Promise<string> {
  const previous = dns.getServers();

  if (servers?.length) {
    dns.setServers(servers);
  }

  try {
    const addresses = await dns.promises.resolve4(hostname);
    if (!addresses.length) throw new Error('no A records');
    return addresses[0];
  } finally {
    if (servers?.length) {
      dns.setServers(previous);
    }
  }
}

/** DNS-over-HTTPS (port 443) — works when campus blocks UDP/TCP port 53 */
async function resolveDoh(hostname: string): Promise<string> {
  const endpoints = [
    `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(hostname)}&type=A`,
    `https://dns.google/resolve?name=${encodeURIComponent(hostname)}&type=A`,
  ];

  let lastError: Error | undefined;

  for (const url of endpoints) {
    try {
      const response = await fetch(url, {
        headers: { Accept: 'application/dns-json' },
        signal: AbortSignal.timeout(10_000),
      });

      if (!response.ok) continue;

      const data = (await response.json()) as {
        Answer?: Array<{ type: number; data: string }>;
      };

      const record = data.Answer?.find((entry) => entry.type === 1);
      if (record?.data && net.isIPv4(record.data)) {
        return record.data;
      }
    } catch (err) {
      lastError = err as Error;
    }
  }

  throw new Error(lastError?.message ?? 'DNS-over-HTTPS failed');
}

/**
 * Resolve Neon hostname on restrictive networks (EAI_AGAIN / EREFUSED).
 * Tries: manual IP → system DNS → optional DNS_SERVERS → HTTPS DNS.
 */
export async function resolveHost(hostname: string): Promise<string> {
  const cached = ipCache.get(hostname);
  if (cached) return cached;

  const manualIp = process.env.NEON_HOST_IP?.trim();
  if (manualIp && net.isIPv4(manualIp)) {
    ipCache.set(hostname, manualIp);
    return manualIp;
  }

  const customDns = process.env.DNS_SERVERS?.split(',').map((s) => s.trim()).filter(Boolean);
  const attempts: Array<{ name: string; run: () => Promise<string> }> = [
    { name: 'system DNS', run: () => resolveUdp(hostname) },
  ];

  if (customDns?.length) {
    attempts.push({
      name: `DNS ${customDns.join(',')}`,
      run: () => resolveUdp(hostname, customDns),
    });
  }

  attempts.push({ name: 'DNS-over-HTTPS', run: () => resolveDoh(hostname) });

  const errors: string[] = [];

  for (const attempt of attempts) {
    try {
      const ip = await attempt.run();
      ipCache.set(hostname, ip);
      console.log(`🔗 Resolved ${hostname} → ${ip} (${attempt.name})`);
      return ip;
    } catch (err) {
      errors.push(`${attempt.name}: ${(err as Error).message}`);
    }
  }

  throw new Error(
    `Cannot resolve "${hostname}".\n` +
      errors.map((e) => `  - ${e}`).join('\n') +
      '\n\nFix: use mobile hotspot, or set NEON_HOST_IP in backend/.env ' +
      '(Neon console → connection details → resolve host, or try DNS-over-HTTPS on another network).'
  );
}

export function getCachedIp(hostname: string): string | undefined {
  return ipCache.get(hostname);
}

import { isDbConnectionError } from './db-errors';

const DEFAULT_ATTEMPTS = 2;
const DEFAULT_DELAY_MS = 500;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Retry transient Postgres / Neon connection failures (cold start, idle socket drop). */
export async function withDbRetry<T>(
  fn: () => Promise<T>,
  opts?: { attempts?: number; delayMs?: number; label?: string }
): Promise<T> {
  const attempts = opts?.attempts ?? DEFAULT_ATTEMPTS;
  const delayMs = opts?.delayMs ?? DEFAULT_DELAY_MS;
  let lastError: unknown;

  for (let i = 1; i <= attempts; i += 1) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      const retryable = isDbConnectionError(err);
      if (!retryable || i === attempts) break;
      console.warn(
        `⚠️ DB retry ${i}/${attempts - 1}${opts?.label ? ` (${opts.label})` : ''}: ${
          err instanceof Error ? err.message : String(err)
        }`
      );
      await sleep(delayMs * i);
    }
  }

  throw lastError;
}

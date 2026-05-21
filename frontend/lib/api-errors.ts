import { isAxiosError } from 'axios';

function isLocalBackend(base: string): boolean {
  return /localhost|127\.0\.0\.1/.test(base);
}

export function getApiErrorMessage(error: unknown): string {
  if (isAxiosError(error)) {
    const data = error.response?.data;
    if (data && typeof data === 'object') {
      const body = data as { message?: string; error?: string };
      if (body.message) return body.message;
      if (body.error) return body.error;
    }

    if (error.code === 'ERR_NETWORK' || error.code === 'ENOTFOUND') {
      const base =
        error.config?.baseURL ||
        (typeof window !== 'undefined' ? window.location.origin : '') ||
        'backend'
      if (!base || base === '' || isLocalBackend(String(base))) {
        return (
          'Cannot reach the API. Use http://localhost (port 80 via nginx) or http://localhost:3000 ' +
          'with docker compose up, and ensure backend + postgres containers are running.'
        )
      }
      return (
        `Cannot reach API at ${base}. ` +
        `On Vercel: set NEXT_PUBLIC_BACKEND_URL to your backend URL (no trailing slash, no /api suffix). ` +
        `On the backend: set FRONTEND_URL and CORS_ALLOWED_ORIGINS to your frontend URL(s), ` +
        `or set CORS_ALLOW_VERCEL=true for *.vercel.app previews. ` +
        `If the API works in a new tab, the problem is usually CORS.`
      );
    }

    if (error.response?.status === 503) {
      return 'Database unavailable. Check DATABASE_URL in backend/.env or use demo mode.';
    }

    return error.message || 'Request failed';
  }
  if (error instanceof Error) return error.message;
  return 'Request failed';
}

export function logApiError(context: string, error: unknown): void {
  if (isAxiosError(error)) {
    const status = error.response?.status ?? 'network';
    console.error(`[${context}] API ${status}:`, getApiErrorMessage(error));
    return;
  }
  console.error(`[${context}]:`, error);
}

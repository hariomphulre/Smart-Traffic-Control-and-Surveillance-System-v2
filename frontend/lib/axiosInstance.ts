import axios from 'axios';
import { getApiErrorMessage, logApiError } from './api-errors';

/** Browser: same-origin + next.config rewrites. SSR/build: explicit backend URL. */
function getBackendBaseUrl(): string {
  if (typeof window !== 'undefined') {
    return ''
  }
  return (
    process.env.BACKEND_INTERNAL_URL ||
    process.env.NEXT_PUBLIC_BACKEND_URL ||
    'http://127.0.0.1:3001'
  )
}

export const axiosInstance = axios.create({
  baseURL: getBackendBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

axiosInstance.interceptors.request.use(
  (config) => config,
  (error) => Promise.reject(error)
);

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    const url = error.config?.url ?? 'unknown';
    logApiError(url, error);
    const enhanced = new Error(getApiErrorMessage(error));
    (enhanced as Error & { cause?: unknown }).cause = error;
    return Promise.reject(enhanced);
  }
);

export default axiosInstance;

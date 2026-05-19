import axios from 'axios';
import { getApiErrorMessage, logApiError } from './api-errors';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';

export const axiosInstance = axios.create({
  baseURL: BACKEND_URL,
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

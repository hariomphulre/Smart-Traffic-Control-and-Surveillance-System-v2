export function isDbConnectionError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const code = (error as NodeJS.ErrnoException).code;
  return (
    code === 'EAI_AGAIN' ||
    code === 'ENOTFOUND' ||
    code === 'ECONNREFUSED' ||
    code === 'ETIMEDOUT' ||
    code === 'ECONNRESET' ||
    error.message.includes('getaddrinfo') ||
    error.message.includes('Connection terminated') ||
    error.message.includes('DATABASE_URL')
  );
}

export function shouldUseMockOnDbError(): boolean {
  if (process.env.USE_MOCK_DATA === 'true') return true;
  if (process.env.USE_MOCK_DATA === 'false') return false;
  return process.env.NODE_ENV !== 'production';
}

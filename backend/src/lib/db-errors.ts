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

export function isDbSchemaError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const pgCode = (error as { code?: string }).code;
  return pgCode === '42P01' || error.message.includes('does not exist');
}

export function shouldUseMockOnDbError(): boolean {
  if (process.env.USE_MOCK_DATA === 'true') return true;
  if (process.env.USE_MOCK_DATA === 'false') return false;
  if (process.env.DOCKER === 'true') return false;
  return process.env.NODE_ENV !== 'production';
}

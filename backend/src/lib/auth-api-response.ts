import { NextResponse } from 'next/server';
import { isDbConnectionError } from './db-errors';

export function authErrorResponse(err: unknown, label: string) {
  console.error(`${label}:`, err);

  if (isDbConnectionError(err)) {
    return NextResponse.json(
      {
        error:
          'Database is unavailable. Check your network connection or try again in a moment.',
      },
      { status: 503 }
    );
  }

  return NextResponse.json(
    { error: err instanceof Error ? err.message : 'Request failed' },
    { status: 500 }
  );
}

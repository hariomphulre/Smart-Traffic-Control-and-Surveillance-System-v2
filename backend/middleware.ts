import { NextRequest, NextResponse } from 'next/server';

const ALLOWED_ORIGINS = [
  process.env.FRONTEND_URL ?? 'http://localhost:3000',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
].filter(Boolean);

function resolveOrigin(request: NextRequest): string {
  const requestOrigin = request.headers.get('origin');
  if (requestOrigin && ALLOWED_ORIGINS.includes(requestOrigin)) {
    return requestOrigin;
  }
  return ALLOWED_ORIGINS[0] ?? 'http://localhost:3000';
}

function corsHeaders(request: NextRequest): Headers {
  const headers = new Headers();
  headers.set('Access-Control-Allow-Origin', resolveOrigin(request));
  headers.set('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
  headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  headers.set('Access-Control-Max-Age', '86400');
  return headers;
}

export function middleware(request: NextRequest) {
  const headers = corsHeaders(request);

  if (request.method === 'OPTIONS') {
    return new NextResponse(null, { status: 204, headers });
  }

  const response = NextResponse.next();
  headers.forEach((value, key) => response.headers.set(key, value));

  console.log(`[${new Date().toISOString()}] ${request.method} ${request.nextUrl.pathname}`);

  return response;
}

export const config = {
  matcher: '/api/:path*',
};

import { NextRequest, NextResponse } from 'next/server';

function parseOrigins(raw: string | undefined): string[] {
  if (!raw?.trim()) return [];
  return raw
    .split(',')
    .map((s) => s.trim().replace(/\/$/, ''))
    .filter(Boolean);
}

const DEFAULT_LOCAL = ['http://localhost:3000', 'http://127.0.0.1:3000'];

const ALLOWED_ORIGINS = [
  ...parseOrigins(process.env.FRONTEND_URL),
  ...parseOrigins(process.env.CORS_ALLOWED_ORIGINS),
  ...(process.env.NODE_ENV === 'development' ? DEFAULT_LOCAL : []),
].filter(Boolean);

const allowVercelPreviews = process.env.CORS_ALLOW_VERCEL === 'true';

function isVercelPreviewOrigin(origin: string): boolean {
  try {
    const { hostname } = new URL(origin);
    return hostname.endsWith('.vercel.app') || hostname === 'vercel.app';
  } catch {
    return false;
  }
}

function resolveOrigin(request: NextRequest): string {
  const requestOrigin = request.headers.get('origin');

  if (requestOrigin) {
    if (ALLOWED_ORIGINS.includes(requestOrigin)) {
      return requestOrigin;
    }
    if (allowVercelPreviews && isVercelPreviewOrigin(requestOrigin)) {
      return requestOrigin;
    }
  }

  return ALLOWED_ORIGINS[0] ?? 'http://localhost:3000';
}

function corsHeaders(request: NextRequest): Headers {
  const headers = new Headers();
  headers.set('Access-Control-Allow-Origin', resolveOrigin(request));
  headers.set('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
  headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  headers.set('Access-Control-Max-Age', '86400');
  headers.set('Vary', 'Origin');
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

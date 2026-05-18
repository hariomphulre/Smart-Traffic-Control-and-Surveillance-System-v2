import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // CORS headers
  const origin = request.headers.get('origin') || process.env.FRONTEND_URL || 'http://localhost:3000';
  
  response.headers.set('Access-Control-Allow-Origin', origin);
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  response.headers.set('Access-Control-Max-Age', '86400');

  // Request logging
  console.log(`[${new Date().toISOString()}] ${request.method} ${request.nextUrl.pathname}`);

  return response;
}

// Apply middleware to all API routes
export const config = {
  matcher: '/api/:path*',
};

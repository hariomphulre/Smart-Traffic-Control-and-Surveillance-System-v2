import { NextRequest, NextResponse } from 'next/server';
import pool from '@/src/config/db';

const PORT = process.env.PORT ?? 3001;

export async function GET(_request: NextRequest) {
  try {
    // Health check - verify database connection
    await pool.query('SELECT 1');

    return NextResponse.json({
      name: 'Signal-X',
      version: '1.0.0',
      baseUrl: `http://localhost:${PORT}/api`,
      routes: {
        logs: 'GET /api/logs',
        challans: ['GET /api/challans', 'GET /api/challans/stats'],
        accidents: ['GET /api/accidents', 'GET /api/accidents/stats'],
        images: ['GET /api/images/vehicles', 'GET /api/images/accidents'],
        analytics: [
          'GET /api/analytics/violations',
          'GET /api/analytics/vehicle-types',
          'GET /api/analytics/hourly-traffic',
          'GET /api/analytics/speed-distribution',
          'GET /api/analytics/stats',
          'GET /api/analytics/hotspots',
        ],
        ambulance: [
          'GET /api/ambulance/hospitals',
          'GET /api/ambulance/signals',
          'POST /api/ambulance/trigger-signal',
        ],
        signals: 'GET /api/signals/state',
        iam: 'GET /api/iam/identities',
        sessions: 'GET /api/sessions',
        auth: [
          'POST /api/auth/register',
          'POST /api/auth/register-challenge',
          'POST /api/auth/register-verify',
          'POST /api/auth/login-challenge',
          'POST /api/auth/login-verify',
        ],
      },
      status: 'OK',
      db: 'Neon PostgreSQL ✅',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: 'API Error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

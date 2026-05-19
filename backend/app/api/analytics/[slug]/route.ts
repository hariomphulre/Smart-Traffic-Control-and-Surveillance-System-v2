import { NextRequest, NextResponse } from 'next/server';
import {
  getViolations,
  getVehicleTypes,
  getHourlyTraffic,
  getSpeedDistrib,
  getStats,
  getHotspots,
} from '@/src/controllers/Analytics.controller';
import { handleRequest } from '@/app/lib/handler-adapter';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const handlers: Record<string, any> = {
    violations: getViolations,
    'vehicle-types': getVehicleTypes,
    'hourly-traffic': getHourlyTraffic,
    'speed-distribution': getSpeedDistrib,
    stats: getStats,
    hotspots: getHotspots,
  };

  const handler = handlers[slug];
  if (!handler) {
    return NextResponse.json({ error: 'Not Found' }, { status: 404 });
  }

  return handleRequest(request, handler);
}

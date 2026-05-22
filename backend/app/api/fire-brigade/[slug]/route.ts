import { NextRequest, NextResponse } from 'next/server';
import {
  getFireStations,
  getSignals,
  triggerSignal,
  overrideSignalWithinRadius,
} from '@/src/controllers/FireBrigade.controller';
import { handleRequest } from '@/app/lib/handler-adapter';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const handlers: Record<string, any> = {
    'fire-stations': getFireStations,
    signals: getSignals,
  };

  const handler = handlers[slug];
  if (!handler) {
    return NextResponse.json({ error: 'Not Found' }, { status: 404 });
  }

  return handleRequest(request, handler);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const handlers: Record<string, any> = {
    'trigger-signal': triggerSignal,
    'override-signal': overrideSignalWithinRadius,
  };

  const handler = handlers[slug];
  if (!handler) {
    return NextResponse.json({ error: 'Not Found' }, { status: 404 });
  }

  return handleRequest(request, handler);
}

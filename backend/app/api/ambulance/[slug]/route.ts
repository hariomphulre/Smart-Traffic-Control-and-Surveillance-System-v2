import { NextRequest, NextResponse } from 'next/server';
import {
  getHospitals,
  getSignals,
  triggerSignal,
} from '@/src/controllers/Ambulance.controller';
import { handleRequest } from '@/app/lib/handler-adapter';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const handlers: Record<string, any> = {
    hospitals: getHospitals,
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
  };

  const handler = handlers[slug];
  if (!handler) {
    return NextResponse.json({ error: 'Not Found' }, { status: 404 });
  }

  return handleRequest(request, handler);
}

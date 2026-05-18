import { NextRequest } from 'next/server';
import { getTrafficState } from '@/src/controllers/Ambulance.controller';
import { handleRequest } from '@/app/lib/handler-adapter';

export async function GET(request: NextRequest) {
  return handleRequest(request, getTrafficState);
}

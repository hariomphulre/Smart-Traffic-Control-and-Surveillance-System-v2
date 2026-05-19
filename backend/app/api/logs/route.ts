import { NextRequest } from 'next/server';
import { getLogs } from '@/src/controllers/Log.controller';
import { handleRequest } from '@/app/lib/handler-adapter';

export async function GET(request: NextRequest) {
  return handleRequest(request, getLogs);
}

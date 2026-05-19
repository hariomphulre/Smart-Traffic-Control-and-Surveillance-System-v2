import { NextRequest } from 'next/server';
import { getAccidents } from '@/src/controllers/Accident.controller';
import { handleRequest } from '@/app/lib/handler-adapter';

export async function GET(request: NextRequest) {
  return handleRequest(request, getAccidents);
}

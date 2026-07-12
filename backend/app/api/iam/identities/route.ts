import { NextRequest } from 'next/server';
import { getIdentities } from '@/src/controllers/Iam.controller';
import { handleRequest } from '@/app/lib/handler-adapter';

export async function GET(request: NextRequest) {
  return handleRequest(request, getIdentities);
}

import { NextRequest } from 'next/server';
import { deleteSessions, getSessions } from '@/src/controllers/Session.controller';
import { handleRequest } from '@/app/lib/handler-adapter';

export async function GET(request: NextRequest) {
  return handleRequest(request, getSessions);
}

export async function DELETE(request: NextRequest) {
  return handleRequest(request, deleteSessions);
}

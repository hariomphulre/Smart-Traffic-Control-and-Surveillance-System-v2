import { NextRequest } from 'next/server';
import { createAuditLog, getAuditLogs } from '@/src/controllers/Audit.controller';
import { handleRequest } from '@/app/lib/handler-adapter';

export async function GET(request: NextRequest) {
  return handleRequest(request, getAuditLogs);
}

export async function POST(request: NextRequest) {
  return handleRequest(request, createAuditLog);
}

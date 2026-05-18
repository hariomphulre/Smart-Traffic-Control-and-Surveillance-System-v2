import { NextRequest, NextResponse } from 'next/server';
import { getVehicleImages } from '@/src/controllers/Images.controller';
import { handleRequest } from '@/app/lib/handler-adapter';

export async function GET(request: NextRequest) {
  return handleRequest(request, getVehicleImages);
}

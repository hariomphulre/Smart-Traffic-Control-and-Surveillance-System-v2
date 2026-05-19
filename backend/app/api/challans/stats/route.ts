import { NextRequest } from 'next/server';
import { getChallanStats } from '@/src/controllers/Challan.controller';
import { handleRequest } from '@/app/lib/handler-adapter';

export async function GET(request: NextRequest) {
  return handleRequest(request, getChallanStats);
}

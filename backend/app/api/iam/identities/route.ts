import { NextRequest, NextResponse } from 'next/server';
import {
  deleteIdentities,
  getIdentities,
  updateIdentity,
} from '@/src/controllers/Iam.controller';
import { handleRequest } from '@/app/lib/handler-adapter';

export async function GET(request: NextRequest) {
  return handleRequest(request, getIdentities);
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const mockReq = {
      method: 'DELETE',
      url: request.nextUrl.pathname,
      query: {},
      body,
      params: {},
      headers: request.headers,
    };

    let responseData: unknown = null;
    let statusCode = 200;
    let errorMessage: string | null = null;

    const mockRes = {
      status: (code: number) => {
        statusCode = code;
        return mockRes;
      },
      json: (data: unknown) => {
        responseData = data;
        return mockRes;
      },
      send: (data: unknown) => {
        responseData = data;
        return mockRes;
      },
      set: () => mockRes,
      setHeader: () => mockRes,
    };

    await deleteIdentities(mockReq as never, mockRes as never, (err?: unknown) => {
      if (err) {
        statusCode = 500;
        errorMessage = err instanceof Error ? err.message : 'Internal Server Error';
      }
    });

    if (errorMessage) {
      return NextResponse.json({ error: errorMessage }, { status: statusCode });
    }

    return NextResponse.json(responseData, { status: statusCode });
  } catch (err) {
    console.error('Delete identities error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to delete identities' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  return handleRequest(request, updateIdentity);
}

import { NextRequest, NextResponse } from 'next/server';

/**
 * Adapter to convert Express-style controllers to Next.js API route handlers
 * Maintains compatibility with existing controller functions
 */
export type ExpressHandler = (
  req: any,
  res: any,
  next?: any
) => Promise<void> | void;

export async function handleRequest(
  request: NextRequest,
  handler: ExpressHandler
) {
  try {
    // Convert NextRequest to Express-like request object
    const body = ['POST', 'PATCH', 'PUT'].includes(request.method)
      ? await request.json().catch(() => ({}))
      : {};

    const mockReq = {
      method: request.method,
      url: request.nextUrl.pathname + request.nextUrl.search,
      query: Object.fromEntries(request.nextUrl.searchParams),
      body,
      params: {},
      headers: request.headers,
    };

    // Create a mock response object
    let responseData: any = null;
    let statusCode = 200;
    const mockRes = {
      status: (code: number) => {
        statusCode = code;
        return mockRes;
      },
      json: (data: any) => {
        responseData = data;
        return mockRes;
      },
      send: (data: any) => {
        responseData = data;
        return mockRes;
      },
      set: () => mockRes,
      setHeader: () => mockRes,
    };

    // Call the handler
    await handler(mockReq, mockRes);

    return NextResponse.json(responseData, { status: statusCode });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      {
        error: 'Internal Server Error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

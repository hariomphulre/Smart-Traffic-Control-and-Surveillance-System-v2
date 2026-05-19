import { NextRequest, NextResponse } from 'next/server';
import { getMockResponse } from '@/src/data/mock-responses';
import { isDbConnectionError, shouldUseMockOnDbError } from '@/src/lib/db-errors';

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

    // Create a mock response object with proper error handling
    let responseData: any = null;
    let statusCode = 200;
    let errorOccurred = false;
    let errorData: any = null;

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

    // next() callback to handle errors from Express handlers
    const next = (error?: any) => {
      if (error) {
        errorOccurred = true;
        errorData = error;
        statusCode = 500;
      }
    };

    // Call the handler with error handling
    await handler(mockReq, mockRes, next);

    // If error occurred via next(), return error response (or dev mock data)
    if (errorOccurred) {
      if (shouldUseMockOnDbError() && isDbConnectionError(errorData)) {
        const mock = getMockResponse(
          request.nextUrl.pathname,
          request.nextUrl.searchParams
        );
        if (mock !== null) {
          console.warn(
            `⚠️ DB unavailable — serving mock data for ${request.nextUrl.pathname}`
          );
          return NextResponse.json(mock, {
            status: 200,
            headers: { 'X-Demo-Data': 'true' },
          });
        }
      }

      const errorMessage =
        errorData instanceof Error
          ? errorData.message
          : typeof errorData === 'string'
            ? errorData
            : 'Internal Server Error';

      console.error('Handler error:', errorData);
      const httpStatus = isDbConnectionError(errorData) ? 503 : statusCode;
      return NextResponse.json(
        {
          error: httpStatus === 503 ? 'Service Unavailable' : 'Internal Server Error',
          message: errorMessage,
        },
        { status: httpStatus }
      );
    }

    // Ensure responseData is not null
    if (responseData === null || responseData === undefined) {
      console.warn('Handler did not set response data');
      return NextResponse.json(
        {
          error: 'No response from handler',
          message: 'The handler did not return any data',
        },
        { status: 500 }
      );
    }

    return NextResponse.json(responseData, { status: statusCode });
  } catch (error) {
    if (shouldUseMockOnDbError() && isDbConnectionError(error)) {
      const mock = getMockResponse(
        request.nextUrl.pathname,
        request.nextUrl.searchParams
      );
      if (mock !== null) {
        console.warn(
          `⚠️ DB unavailable — serving mock data for ${request.nextUrl.pathname}`
        );
        return NextResponse.json(mock, {
          status: 200,
          headers: { 'X-Demo-Data': 'true' },
        });
      }
    }

    console.error('API Error:', error);
    const httpStatus = isDbConnectionError(error) ? 503 : 500;
    return NextResponse.json(
      {
        error: httpStatus === 503 ? 'Service Unavailable' : 'Internal Server Error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: httpStatus }
    );
  }
}

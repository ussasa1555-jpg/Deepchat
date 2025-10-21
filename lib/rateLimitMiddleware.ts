import { NextRequest, NextResponse } from 'next/server';
import { redis, checkRateLimit, createRateLimitKey, RATE_LIMITS } from './redis';

// API Style 1: Inline handler (used by 2FA routes)
export async function withRateLimit(
  request: NextRequest,
  type: keyof typeof RATE_LIMITS,
  identifier: string,
  handler: () => Promise<NextResponse>
): Promise<NextResponse>;

// API Style 2: HOF wrapper (used by admin routes)
export function withRateLimit(
  handler: (request: Request) => Promise<NextResponse>,
  type: keyof typeof RATE_LIMITS
): (request: Request) => Promise<NextResponse>;

// Implementation
export function withRateLimit(
  requestOrHandler: NextRequest | ((request: Request) => Promise<NextResponse>),
  typeOrType: keyof typeof RATE_LIMITS,
  identifierOrUndefined?: string,
  handlerOrUndefined?: () => Promise<NextResponse>
): any {
  // API Style 1: withRateLimit(request, type, identifier, handler)
  // Check if first argument is NOT a function (it's a Request object)
  if (typeof requestOrHandler !== 'function' && identifierOrUndefined !== undefined && handlerOrUndefined !== undefined) {
    const request = requestOrHandler as NextRequest;
    const type = typeOrType;
    const identifier = identifierOrUndefined;
    const handler = handlerOrUndefined;

    return (async () => {
      try {
        const key = createRateLimitKey(type, identifier);
        const { limit, window } = RATE_LIMITS[type];
        const result = await checkRateLimit(key, limit, window);

        if (!result.allowed) {
          return NextResponse.json(
            {
              error: '[ERROR_429] RATE_LIMIT_EXCEEDED',
              remaining: result.remaining,
              resetIn: result.reset,
            },
            {
              status: 429,
              headers: {
                'X-RateLimit-Limit': limit.toString(),
                'X-RateLimit-Remaining': result.remaining.toString(),
                'X-RateLimit-Reset': result.reset.toString(),
              },
            }
          );
        }

        const response = await handler();
        response.headers.set('X-RateLimit-Limit', limit.toString());
        response.headers.set('X-RateLimit-Remaining', result.remaining.toString());
        response.headers.set('X-RateLimit-Reset', result.reset.toString());

        return response;
      } catch (error) {
        console.error('Rate limit check failed:', error);
        return handler();
      }
    })();
  }

  // API Style 2: withRateLimit(handler, type)
  // First argument is a function (handler)
  const handler = requestOrHandler as (request: Request) => Promise<NextResponse>;
  const type = typeOrType;

  return async (request: Request) => {
    const nextRequest = request as NextRequest;
    const identifier = getClientIdentifier(nextRequest);

    try {
      const key = createRateLimitKey(type, identifier);
      const { limit, window } = RATE_LIMITS[type];
      const result = await checkRateLimit(key, limit, window);

      if (!result.allowed) {
        return NextResponse.json(
          {
            error: '[ERROR_429] RATE_LIMIT_EXCEEDED',
            remaining: result.remaining,
            resetIn: result.reset,
          },
          {
            status: 429,
            headers: {
              'X-RateLimit-Limit': limit.toString(),
              'X-RateLimit-Remaining': result.remaining.toString(),
              'X-RateLimit-Reset': result.reset.toString(),
            },
          }
        );
      }

      const response = await handler(request);
      response.headers.set('X-RateLimit-Limit', limit.toString());
      response.headers.set('X-RateLimit-Remaining', result.remaining.toString());
      response.headers.set('X-RateLimit-Reset', result.reset.toString());

      return response;
    } catch (error) {
      console.error('Rate limit check failed:', error);
      return handler(request);
    }
  };
}

// Helper to get client identifier (IP or user ID)
export function getClientIdentifier(request: NextRequest): string {
  // Try to get IP from headers (Vercel/Cloudflare)
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const ip = forwarded?.split(',')[0] || realIp || 'unknown';
  
  return ip;
}














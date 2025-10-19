import { NextRequest, NextResponse } from 'next/server';
import { redis, checkRateLimit, createRateLimitKey, RATE_LIMITS } from './redis';

export async function withRateLimit(
  request: NextRequest,
  type: keyof typeof RATE_LIMITS,
  identifier: string,
  handler: () => Promise<NextResponse>
): Promise<NextResponse> {
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

    // Add rate limit headers to response
    const response = await handler();
    response.headers.set('X-RateLimit-Limit', limit.toString());
    response.headers.set('X-RateLimit-Remaining', result.remaining.toString());
    response.headers.set('X-RateLimit-Reset', result.reset.toString());

    return response;
  } catch (error) {
    console.error('Rate limit check failed:', error);
    // On error, allow request but log
    return handler();
  }
}

// Helper to get client identifier (IP or user ID)
export function getClientIdentifier(request: NextRequest): string {
  // Try to get IP from headers (Vercel/Cloudflare)
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const ip = forwarded?.split(',')[0] || realIp || 'unknown';
  
  return ip;
}








import { NextRequest, NextResponse } from 'next/server'

const MAX_BODY_SIZE = 10 * 1024 // 10KB max for all endpoints

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

export async function parseJsonBody<T>(request: NextRequest): Promise<T> {
  const contentLength = request.headers.get('content-length')

  if (contentLength && parseInt(contentLength) > MAX_BODY_SIZE) {
    throw new ApiError('Request body too large', 413, 'body_too_large')
  }

  try {
    const body = await request.json()
    return body as T
  } catch {
    throw new ApiError('Invalid JSON body', 400, 'invalid_json')
  }
}

export function errorResponse(error: unknown): NextResponse {
  if (error instanceof ApiError) {
    return NextResponse.json(
      { success: false, error: error.code || error.message },
      { status: error.status }
    )
  }

  console.error('Unexpected error:', error)
  return NextResponse.json(
    { success: false, error: 'Internal server error' },
    { status: 500 }
  )
}

// Simple in-memory rate limiter
// Note: ephemeral in serverless - works within warm instances only.
// For distributed rate limiting at scale, swap for Redis/Upstash.
const rateLimitStore = new Map<string, { count: number; resetAt: number }>()
let lastCleanup = Date.now()

function cleanupExpired() {
  const now = Date.now()
  // Lazy cleanup: only run if 60s+ since last cleanup
  if (now - lastCleanup < 60000) return
  lastCleanup = now
  for (const [key, record] of rateLimitStore.entries()) {
    if (now > record.resetAt) {
      rateLimitStore.delete(key)
    }
  }
}

export function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): { allowed: boolean; remaining: number } {
  cleanupExpired()

  const now = Date.now()
  const record = rateLimitStore.get(key)

  if (!record || now > record.resetAt) {
    rateLimitStore.set(key, { count: 1, resetAt: now + windowMs })
    return { allowed: true, remaining: limit - 1 }
  }

  if (record.count >= limit) {
    return { allowed: false, remaining: 0 }
  }

  record.count++
  return { allowed: true, remaining: limit - record.count }
}

export function getClientIp(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown'
  )
}

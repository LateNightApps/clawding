import { NextRequest, NextResponse } from 'next/server'
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

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
  // Read body as text first to enforce size limit regardless of transfer encoding
  let rawBody: string
  try {
    rawBody = await request.text()
  } catch {
    throw new ApiError('Failed to read request body', 400, 'invalid_body')
  }

  if (rawBody.length > MAX_BODY_SIZE) {
    throw new ApiError('Request body too large', 413, 'body_too_large')
  }

  try {
    return JSON.parse(rawBody) as T
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

// --- Upstash Redis client (shared) ---

const hasUpstash = !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN)

let redis: Redis | null = null

export function getRedis(): Redis | null {
  if (!hasUpstash) return null
  if (!redis) {
    redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    })
  }
  return redis
}

// --- Rate Limiting (Upstash with in-memory fallback) ---

const upstashLimiters = new Map<string, Ratelimit>()

function getUpstashLimiter(prefix: string, limit: number, windowMs: number): Ratelimit | null {
  const r = getRedis()
  if (!r) return null

  const key = `${prefix}:${limit}:${windowMs}`
  let limiter = upstashLimiters.get(key)
  if (!limiter) {
    limiter = new Ratelimit({
      redis: r,
      limiter: Ratelimit.slidingWindow(limit, `${windowMs} ms`),
      prefix: `rl:${prefix}`,
    })
    upstashLimiters.set(key, limiter)
  }
  return limiter
}

// In-memory fallback for dev/missing Upstash env
const rateLimitStore = new Map<string, { count: number; resetAt: number }>()
let lastCleanup = Date.now()

function cleanupExpired() {
  const now = Date.now()
  if (now - lastCleanup < 60000) return
  lastCleanup = now
  for (const [key, record] of rateLimitStore.entries()) {
    if (now > record.resetAt) {
      rateLimitStore.delete(key)
    }
  }
}

function inMemoryRateLimit(key: string, limit: number, windowMs: number): { allowed: boolean; remaining: number } {
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

export async function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): Promise<{ allowed: boolean; remaining: number }> {
  // Extract prefix from key (e.g. "claim:1.2.3.4" → "claim")
  const prefix = key.split(':')[0]
  const upstash = getUpstashLimiter(prefix, limit, windowMs)

  if (upstash) {
    const result = await upstash.limit(key)
    return { allowed: result.success, remaining: result.remaining }
  }

  return inMemoryRateLimit(key, limit, windowMs)
}

export function getClientIp(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown'
  )
}

import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { sql } from 'drizzle-orm'

export async function GET() {
  const start = Date.now()

  try {
    // Check database connectivity
    await db.execute(sql`SELECT 1`)

    const latency = Date.now() - start

    return NextResponse.json({
      status: 'healthy',
      database: 'connected',
      latency_ms: latency,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        database: 'unreachable',
        error: 'Database unreachable',
        timestamp: new Date().toISOString()
      },
      { status: 503 }
    )
  }
}

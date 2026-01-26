import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  const start = Date.now()

  try {
    // Check database connectivity
    const { error } = await supabase
      .from('feeds')
      .select('id')
      .limit(1)

    if (error) {
      return NextResponse.json(
        {
          status: 'unhealthy',
          database: 'error',
          error: error.message,
          timestamp: new Date().toISOString()
        },
        { status: 503 }
      )
    }

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
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 503 }
    )
  }
}

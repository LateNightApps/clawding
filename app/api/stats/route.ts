import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { errorResponse } from '@/lib/api-utils'

interface StatsResponse {
  totalCoders: number
  totalPosts: number
  postsToday: number
}

export async function GET() {
  try {
    const todayStart = new Date()
    todayStart.setUTCHours(0, 0, 0, 0)

    const [codersResult, postsResult, postsTodayResult] = await Promise.all([
      supabase.from('feeds').select('*', { count: 'exact', head: true }),
      supabase.from('updates').select('*', { count: 'exact', head: true }),
      supabase
        .from('updates')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', todayStart.toISOString()),
    ])

    if (codersResult.error) throw codersResult.error
    if (postsResult.error) throw postsResult.error
    if (postsTodayResult.error) throw postsTodayResult.error

    const stats: StatsResponse = {
      totalCoders: codersResult.count ?? 0,
      totalPosts: postsResult.count ?? 0,
      postsToday: postsTodayResult.count ?? 0,
    }

    return NextResponse.json(stats, {
      headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120' },
    })
  } catch (error) {
    return errorResponse(error)
  }
}

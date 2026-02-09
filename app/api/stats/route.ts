import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { feeds, updates } from '@/lib/db/schema'
import { count, gte } from 'drizzle-orm'
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
      db.select({ value: count() }).from(feeds),
      db.select({ value: count() }).from(updates),
      db.select({ value: count() }).from(updates).where(gte(updates.createdAt, todayStart)),
    ])

    const stats: StatsResponse = {
      totalCoders: codersResult[0]?.value ?? 0,
      totalPosts: postsResult[0]?.value ?? 0,
      postsToday: postsTodayResult[0]?.value ?? 0,
    }

    return NextResponse.json(stats, {
      headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120' },
    })
  } catch (error) {
    return errorResponse(error)
  }
}

import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { feeds, updates } from '@/lib/db/schema'
import { desc, gte, eq, inArray } from 'drizzle-orm'
import { errorResponse } from '@/lib/api-utils'

export async function GET() {
  try {
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    // Get recent updates with feed slugs in a single join query
    const recentUpdates = await db
      .select({
        feedId: updates.feedId,
        slug: feeds.slug,
      })
      .from(updates)
      .innerJoin(feeds, eq(updates.feedId, feeds.id))
      .where(gte(updates.createdAt, sevenDaysAgo))
      .orderBy(desc(updates.createdAt))
      .limit(5000)

    // Aggregate post counts per slug
    const slugCounts = new Map<string, number>()
    for (const row of recentUpdates) {
      slugCounts.set(row.slug, (slugCounts.get(row.slug) ?? 0) + 1)
    }

    const active = Array.from(slugCounts.entries())
      .map(([slug, postCount]) => ({ slug, postCount }))
      .sort((a, b) => b.postCount - a.postCount)
      .slice(0, 5)

    return NextResponse.json({ active }, {
      headers: { 'Cache-Control': 'public, s-maxage=120, stale-while-revalidate=300' },
    })
  } catch (error) {
    return errorResponse(error)
  }
}

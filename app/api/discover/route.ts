import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { feeds, updates } from '@/lib/db/schema'
import { eq, desc, count, inArray, sql } from 'drizzle-orm'
import { errorResponse } from '@/lib/api-utils'

export async function GET() {
  try {
    // Get all feeds with post counts in a single query
    const allFeeds = await db
      .select({
        id: feeds.id,
        slug: feeds.slug,
        postCount: sql<number>`(SELECT COUNT(*)::int FROM ${updates} WHERE ${updates.feedId} = ${feeds.id})`,
      })
      .from(feeds)

    // Filter feeds with posts, shuffle, pick 3
    const candidates = allFeeds
      .filter(f => f.postCount > 0)
      .map(f => ({ ...f, sort: Math.random() }))
      .sort((a, b) => a.sort - b.sort)
      .slice(0, 3)

    if (candidates.length === 0) {
      return NextResponse.json({ profiles: [] })
    }

    // Get latest update for each candidate in a single query
    const candidateIds = candidates.map(c => c.id)
    const latestUpdates = await db
      .select({
        feedId: updates.feedId,
        projectName: updates.projectName,
        content: updates.content,
        createdAt: updates.createdAt,
      })
      .from(updates)
      .where(inArray(updates.feedId, candidateIds))
      .orderBy(desc(updates.createdAt))

    // Group by feedId and take first (latest) per feed
    const latestByFeed = new Map<string, { projectName: string; content: string }>()
    latestUpdates.forEach(u => {
      if (!latestByFeed.has(u.feedId)) {
        latestByFeed.set(u.feedId, { projectName: u.projectName, content: u.content })
      }
    })

    const profiles = candidates.map(c => ({
      slug: c.slug,
      latestProject: latestByFeed.get(c.id)?.projectName ?? '',
      latestContent: latestByFeed.get(c.id)?.content ?? '',
      postCount: c.postCount,
    }))

    return NextResponse.json({ profiles }, {
      headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120' },
    })
  } catch (error) {
    return errorResponse(error)
  }
}

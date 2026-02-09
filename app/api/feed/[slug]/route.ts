import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { feeds, updates } from '@/lib/db/schema'
import { eq, desc } from 'drizzle-orm'
import { errorResponse, ApiError } from '@/lib/api-utils'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params

    const [feed] = await db
      .select({
        id: feeds.id,
        xHandle: feeds.xHandle,
        websiteUrl: feeds.websiteUrl,
        description: feeds.description,
      })
      .from(feeds)
      .where(eq(feeds.slug, slug))
      .limit(1)

    if (!feed) {
      throw new ApiError('Feed not found', 404, 'not_found')
    }

    const feedUpdates = await db
      .select({
        id: updates.id,
        projectName: updates.projectName,
        content: updates.content,
        createdAt: updates.createdAt,
      })
      .from(updates)
      .where(eq(updates.feedId, feed.id))
      .orderBy(desc(updates.createdAt))
      .limit(100)

    return NextResponse.json({
      slug,
      x_handle: feed.xHandle ?? null,
      website_url: feed.websiteUrl ?? null,
      description: feed.description ?? null,
      updates: feedUpdates.map(u => ({
        id: u.id,
        project: u.projectName,
        content: u.content,
        created_at: u.createdAt,
      })),
    })
  } catch (error) {
    return errorResponse(error)
  }
}

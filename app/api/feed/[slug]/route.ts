import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { feeds, updates } from '@/lib/db/schema'
import { eq, desc, inArray, sql } from 'drizzle-orm'
import { errorResponse, ApiError } from '@/lib/api-utils'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params

    // Find feed
    const [feed] = await db
      .select({
        id: feeds.id,
        xHandle: feeds.xHandle,
        websiteUrl: feeds.websiteUrl,
        description: feeds.description,
        parentId: feeds.parentId
      })
      .from(feeds)
      .where(eq(feeds.slug, slug))
      .limit(1)

    if (!feed) {
      throw new ApiError('Feed not found', 404, 'not_found')
    }

    // Get updates for this feed
    const feedUpdates = await db
      .select({
        id: updates.id,
        projectName: updates.projectName,
        content: updates.content,
        createdAt: updates.createdAt
      })
      .from(updates)
      .where(eq(updates.feedId, feed.id))
      .orderBy(desc(updates.createdAt))
      .limit(100)

    // Get parent info if exists
    let parent = null
    if (feed.parentId) {
      const [parentFeed] = await db
        .select({
          slug: feeds.slug,
          description: feeds.description
        })
        .from(feeds)
        .where(eq(feeds.id, feed.parentId))
        .limit(1)

      if (parentFeed) {
        parent = {
          slug: parentFeed.slug,
          description: parentFeed.description ?? null
        }
      }
    }

    // Get children with post counts in a single query using subqueries
    const childrenFeeds = await db
      .select({
        id: feeds.id,
        slug: feeds.slug,
        description: feeds.description,
        lastPostAt: feeds.lastPostAt,
        postCount: sql<number>`(SELECT COUNT(*)::int FROM ${updates} WHERE ${updates.feedId} = ${feeds.id})`,
      })
      .from(feeds)
      .where(eq(feeds.parentId, feed.id))

    const children = childrenFeeds.map(child => ({
      slug: child.slug,
      description: child.description ?? null,
      lastPostAt: child.lastPostAt ?? null,
      postCount: child.postCount,
    }))

    // Get aggregated child updates if has children — single query with join
    let childUpdates = null
    if (childrenFeeds.length > 0) {
      const childIds = childrenFeeds.map(c => c.id)
      const allChildUpdates = await db
        .select({
          id: updates.id,
          projectName: updates.projectName,
          content: updates.content,
          createdAt: updates.createdAt,
          slug: feeds.slug,
        })
        .from(updates)
        .innerJoin(feeds, eq(updates.feedId, feeds.id))
        .where(inArray(updates.feedId, childIds))
        .orderBy(desc(updates.createdAt))
        .limit(50)

      childUpdates = allChildUpdates.map(u => ({
        id: u.id,
        slug: u.slug,
        project: u.projectName,
        content: u.content,
        created_at: u.createdAt,
      }))
    }

    return NextResponse.json({
      slug,
      x_handle: feed.xHandle ?? null,
      website_url: feed.websiteUrl ?? null,
      description: feed.description ?? null,
      updates: feedUpdates.map(u => ({
        id: u.id,
        project: u.projectName,
        content: u.content,
        created_at: u.createdAt
      })),
      ...(parent ? { parent } : {}),
      ...(children.length > 0 ? { children, childUpdates } : {}),
    })
  } catch (error) {
    return errorResponse(error)
  }
}

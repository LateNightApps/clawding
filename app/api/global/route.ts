import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { feeds, updates } from '@/lib/db/schema'
import { desc, eq, inArray } from 'drizzle-orm'
import { errorResponse } from '@/lib/api-utils'

const DEFAULT_LIMIT = 10
const MAX_LIMIT = 50

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl
    const limit = Math.min(
      Math.max(1, parseInt(searchParams.get('limit') ?? String(DEFAULT_LIMIT), 10) || DEFAULT_LIMIT),
      MAX_LIMIT
    )
    const offset = Math.max(0, parseInt(searchParams.get('offset') ?? '0', 10) || 0)

    // Get updates joined with feed slugs in a single query
    const updatesList = await db
      .select({
        id: updates.id,
        feedId: updates.feedId,
        projectName: updates.projectName,
        content: updates.content,
        createdAt: updates.createdAt,
        slug: feeds.slug,
        parentId: feeds.parentId,
      })
      .from(updates)
      .innerJoin(feeds, eq(updates.feedId, feeds.id))
      .orderBy(desc(updates.createdAt))
      .limit(limit)
      .offset(offset)

    // Batch resolve parent slugs
    const parentIds = [...new Set(updatesList.filter(u => u.parentId).map(u => u.parentId!))]
    const parentSlugMap = new Map<string, string>()

    if (parentIds.length > 0) {
      const parents = await db
        .select({ id: feeds.id, slug: feeds.slug })
        .from(feeds)
        .where(inArray(feeds.id, parentIds))

      parents.forEach(p => parentSlugMap.set(p.id, p.slug))
    }

    const mapped = updatesList.map(u => ({
      id: u.id,
      slug: u.slug,
      project: u.projectName,
      content: u.content,
      created_at: u.createdAt,
      parent_slug: u.parentId ? parentSlugMap.get(u.parentId) ?? null : null,
    }))

    return NextResponse.json({
      updates: mapped,
      hasMore: mapped.length === limit,
      offset,
      limit,
    })
  } catch (error) {
    return errorResponse(error)
  }
}

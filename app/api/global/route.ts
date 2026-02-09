import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { feeds, updates } from '@/lib/db/schema'
import { desc, eq } from 'drizzle-orm'
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

    const updatesList = await db
      .select({
        id: updates.id,
        projectName: updates.projectName,
        content: updates.content,
        createdAt: updates.createdAt,
        slug: feeds.slug,
      })
      .from(updates)
      .innerJoin(feeds, eq(updates.feedId, feeds.id))
      .orderBy(desc(updates.createdAt))
      .limit(limit)
      .offset(offset)

    const mapped = updatesList.map(u => ({
      id: u.id,
      slug: u.slug,
      project: u.projectName,
      content: u.content,
      created_at: u.createdAt,
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

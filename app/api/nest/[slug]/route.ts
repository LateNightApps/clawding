import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { feeds } from '@/lib/db/schema'
import { eq, count } from 'drizzle-orm'
import { parseJsonBody, errorResponse, ApiError } from '@/lib/api-utils'
import { authenticateRequest } from '@/lib/auth'

interface NestBody {
  parent: string | null
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const { feedId } = await authenticateRequest(request, slug)

    const body = await parseJsonBody<NestBody>(request)

    // Removing parent
    if (body.parent === null) {
      await db
        .update(feeds)
        .set({ parentId: null })
        .where(eq(feeds.id, feedId))

      return NextResponse.json({ success: true })
    }

    // Setting parent
    if (typeof body.parent !== 'string') {
      throw new ApiError('parent must be a string or null', 400, 'invalid_parent')
    }

    const parentSlug = body.parent

    // Validate: parent feed exists
    const [parentFeed] = await db
      .select({
        id: feeds.id,
        parentId: feeds.parentId
      })
      .from(feeds)
      .where(eq(feeds.slug, parentSlug))
      .limit(1)

    if (!parentFeed) {
      throw new ApiError('Parent feed not found', 404, 'parent_not_found')
    }

    // Validate: parent is not itself a child (max 1 level deep)
    if (parentFeed.parentId !== null) {
      throw new ApiError('Cannot nest under a child feed (max 1 level)', 400, 'parent_is_child')
    }

    // Validate: [slug] has no children (can't nest a collection)
    const [{ value: childCount }] = await db
      .select({ value: count() })
      .from(feeds)
      .where(eq(feeds.parentId, feedId))

    if (childCount > 0) {
      throw new ApiError('Cannot nest a feed that has children', 400, 'has_children')
    }

    // Update parent_id
    await db
      .update(feeds)
      .set({ parentId: parentFeed.id })
      .where(eq(feeds.id, feedId))

    return NextResponse.json({ success: true })
  } catch (error) {
    return errorResponse(error)
  }
}

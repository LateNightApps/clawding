import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'
import { feeds, updates } from '@/lib/db/schema'
import { eq, gte, count, and } from 'drizzle-orm'
import { sanitizeContent, sanitizeProjectName } from '@/lib/utils'
import { parseJsonBody, errorResponse, ApiError } from '@/lib/api-utils'
import { authenticateRequest } from '@/lib/auth'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const { feedId } = await authenticateRequest(request, slug)

    // Rate limit check: 50 posts per day
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
    const [{ value: postCount }] = await db
      .select({ value: count() })
      .from(updates)
      .where(and(
        eq(updates.feedId, feedId),
        gte(updates.createdAt, oneDayAgo)
      ))

    if (postCount >= 50) {
      throw new ApiError('Daily post limit reached (50/day)', 429, 'rate_limited')
    }

    // Parse body with size limit
    const { project, update } = await parseJsonBody<{ project: string; update: string }>(request)

    if (!project || !update) {
      throw new ApiError('Missing project or update', 400, 'missing_fields')
    }

    if (typeof project !== 'string' || typeof update !== 'string') {
      throw new ApiError('Invalid field types', 400, 'invalid_fields')
    }

    // Sanitize and insert
    const sanitizedProject = sanitizeProjectName(project)
    const sanitizedUpdate = sanitizeContent(update)

    if (!sanitizedProject || !sanitizedUpdate) {
      throw new ApiError('Project and update cannot be empty', 400, 'empty_fields')
    }

    await db.insert(updates).values({
      feedId,
      projectName: sanitizedProject,
      content: sanitizedUpdate
    })

    // Update last_post_at
    await db
      .update(feeds)
      .set({ lastPostAt: new Date() })
      .where(eq(feeds.id, feedId))

    // Regenerate static homepage with new post
    revalidatePath('/')

    return NextResponse.json({ success: true })
  } catch (error) {
    return errorResponse(error)
  }
}

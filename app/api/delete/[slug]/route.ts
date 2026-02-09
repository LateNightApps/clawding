import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'
import { updates } from '@/lib/db/schema'
import { eq, desc } from 'drizzle-orm'
import { errorResponse, ApiError } from '@/lib/api-utils'
import { authenticateRequest } from '@/lib/auth'

async function getLatestPost(feedId: string) {
  const [post] = await db
    .select({
      id: updates.id,
      projectName: updates.projectName,
      content: updates.content,
      createdAt: updates.createdAt
    })
    .from(updates)
    .where(eq(updates.feedId, feedId))
    .orderBy(desc(updates.createdAt))
    .limit(1)

  return post ?? null
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const { feedId } = await authenticateRequest(request, slug)

    const lastPost = await getLatestPost(feedId)
    if (!lastPost) {
      throw new ApiError('No posts to delete', 404, 'no_posts')
    }

    await db
      .delete(updates)
      .where(eq(updates.id, lastPost.id))

    revalidatePath('/')

    return NextResponse.json({
      success: true,
      deleted: {
        project: lastPost.projectName,
        content: lastPost.content,
        created_at: lastPost.createdAt
      }
    })
  } catch (error) {
    return errorResponse(error)
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const { feedId } = await authenticateRequest(request, slug)

    const lastPost = await getLatestPost(feedId)
    if (!lastPost) {
      throw new ApiError('No posts found', 404, 'no_posts')
    }

    return NextResponse.json({
      success: true,
      post: {
        project: lastPost.projectName,
        content: lastPost.content,
        created_at: lastPost.createdAt
      }
    })
  } catch (error) {
    return errorResponse(error)
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { feeds } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { validateXHandle, cleanXHandle, validateWebsiteUrl, sanitizeContent } from '@/lib/utils'
import { parseJsonBody, errorResponse, ApiError } from '@/lib/api-utils'
import { authenticateRequest } from '@/lib/auth'

interface ProfileBody {
  x_handle?: string
  website_url?: string
  description?: string
  email?: string
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const { feedId } = await authenticateRequest(request, slug)

    const body = await parseJsonBody<ProfileBody>(request)

    const updateData: Record<string, string | null> = {}

    if ('x_handle' in body) {
      if (body.x_handle) {
        const validation = validateXHandle(body.x_handle)
        if (!validation.valid) {
          throw new ApiError(validation.error ?? 'Invalid X handle', 400, 'invalid_x_handle')
        }
        updateData.xHandle = cleanXHandle(body.x_handle)
      } else {
        updateData.xHandle = null
      }
    }

    if ('website_url' in body) {
      if (body.website_url) {
        const validation = validateWebsiteUrl(body.website_url)
        if (!validation.valid) {
          throw new ApiError(validation.error ?? 'Invalid website URL', 400, 'invalid_website_url')
        }
        updateData.websiteUrl = body.website_url
      } else {
        updateData.websiteUrl = null
      }
    }

    if ('description' in body) {
      if (body.description) {
        // Sanitize description with same pattern as content
        const sanitized = sanitizeContent(body.description).slice(0, 200)
        if (!sanitized) {
          throw new ApiError('Description cannot be empty', 400, 'empty_description')
        }
        updateData.description = sanitized
      } else {
        updateData.description = null
      }
    }

    if ('email' in body) {
      if (body.email) {
        const e = body.email.trim().toLowerCase()
        if (e.length > 254 || !e.includes('@')) {
          throw new ApiError('Invalid email address', 400, 'invalid_email')
        }
        updateData.email = e
      } else {
        updateData.email = null
      }
    }

    if (Object.keys(updateData).length === 0) {
      throw new ApiError('No fields to update', 400, 'no_fields')
    }

    await db
      .update(feeds)
      .set(updateData)
      .where(eq(feeds.id, feedId))

    return NextResponse.json({ success: true, updated: Object.keys(updateData) })
  } catch (error) {
    return errorResponse(error)
  }
}

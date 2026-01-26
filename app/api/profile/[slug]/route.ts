import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { validateXHandle, cleanXHandle, validateWebsiteUrl } from '@/lib/utils'
import { parseJsonBody, errorResponse, ApiError } from '@/lib/api-utils'
import { authenticateRequest } from '@/lib/auth'

interface ProfileBody {
  x_handle?: string
  website_url?: string
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const { feedId } = await authenticateRequest(request, slug)

    const body = await parseJsonBody<ProfileBody>(request)

    const updates: Record<string, string | null> = {}

    if ('x_handle' in body) {
      if (body.x_handle) {
        const validation = validateXHandle(body.x_handle)
        if (!validation.valid) {
          throw new ApiError(validation.error ?? 'Invalid X handle', 400, 'invalid_x_handle')
        }
        updates.x_handle = cleanXHandle(body.x_handle)
      } else {
        updates.x_handle = null
      }
    }

    if ('website_url' in body) {
      if (body.website_url) {
        const validation = validateWebsiteUrl(body.website_url)
        if (!validation.valid) {
          throw new ApiError(validation.error ?? 'Invalid website URL', 400, 'invalid_website_url')
        }
        updates.website_url = body.website_url
      } else {
        updates.website_url = null
      }
    }

    if (Object.keys(updates).length === 0) {
      throw new ApiError('No fields to update', 400, 'no_fields')
    }

    const { error } = await supabase
      .from('feeds')
      .update(updates)
      .eq('id', feedId)

    if (error) {
      console.error('Error updating profile:', error)
      throw new ApiError('Failed to update profile', 500, 'update_failed')
    }

    return NextResponse.json({ success: true, updated: Object.keys(updates) })
  } catch (error) {
    return errorResponse(error)
  }
}

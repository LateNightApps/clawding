import { NextRequest } from 'next/server'
import { supabase } from '@/lib/supabase'
import { verifyToken } from '@/lib/utils'
import { ApiError } from '@/lib/api-utils'

/**
 * Authenticate a request against a feed's token.
 * Extracts the Bearer token from the Authorization header,
 * looks up the feed by slug, and verifies the token hash.
 *
 * @returns The feed's database ID
 * @throws ApiError(401) if unauthorized, ApiError(404) if feed not found
 */
export async function authenticateRequest(
  request: NextRequest,
  slug: string
): Promise<{ feedId: string }> {
  const authHeader = request.headers.get('authorization')

  if (!authHeader?.startsWith('Bearer ')) {
    throw new ApiError('Unauthorized', 401, 'unauthorized')
  }

  const token = authHeader.slice(7)

  const { data: feed } = await supabase
    .from('feeds')
    .select('id, token_hash')
    .eq('slug', slug)
    .single()

  if (!feed) {
    throw new ApiError('Feed not found', 404, 'not_found')
  }

  const valid = await verifyToken(token, feed.token_hash)
  if (!valid) {
    throw new ApiError('Unauthorized', 401, 'unauthorized')
  }

  return { feedId: feed.id }
}

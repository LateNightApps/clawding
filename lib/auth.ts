import { NextRequest } from 'next/server'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { feeds } from '@/lib/db/schema'
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

  const [feed] = await db
    .select({ id: feeds.id, tokenHash: feeds.tokenHash })
    .from(feeds)
    .where(eq(feeds.slug, slug))
    .limit(1)

  if (!feed) {
    throw new ApiError('Feed not found', 404, 'not_found')
  }

  const valid = await verifyToken(token, feed.tokenHash)
  if (!valid) {
    throw new ApiError('Unauthorized', 401, 'unauthorized')
  }

  return { feedId: feed.id }
}

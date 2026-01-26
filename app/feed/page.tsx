'use client'

import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import { UpdateCard } from '@/components/UpdateCard'
import { CrabMascot } from '@/components/CrabMascot'

interface Update {
  id: string
  slug: string
  project: string
  content: string
  created_at: string
}

interface FeedResponse {
  updates: Update[]
  hasMore: boolean
}

const PAGE_SIZE = 20

async function fetchFeedPage(pageOffset: number): Promise<FeedResponse> {
  const res = await fetch(`/api/global?limit=${PAGE_SIZE}&offset=${pageOffset}`)
  if (!res.ok) throw new Error('Failed to load feed')
  const data = await res.json()
  return { updates: data.updates ?? [], hasMore: data.hasMore ?? false }
}

export default function FeedPage() {
  const [updates, setUpdates] = useState<Update[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const offsetRef = useRef(0)

  useEffect(() => {
    let cancelled = false
    fetchFeedPage(0)
      .then(data => {
        if (cancelled) return
        setUpdates(data.updates)
        setHasMore(data.hasMore)
        offsetRef.current = data.updates.length
        setLoading(false)
      })
      .catch(err => {
        if (cancelled) return
        setError(err.message)
        setLoading(false)
      })
    return () => { cancelled = true }
  }, [])

  const loadMore = () => {
    if (loadingMore || !hasMore) return
    setLoadingMore(true)
    fetchFeedPage(offsetRef.current)
      .then(data => {
        setUpdates(prev => [...prev, ...data.updates])
        setHasMore(data.hasMore)
        offsetRef.current += data.updates.length
        setLoadingMore(false)
      })
      .catch(() => {
        // Show error without wiping already-loaded posts
        setLoadingMore(false)
      })
  }

  return (
    <main className="max-w-3xl mx-auto px-6 pt-6 pb-16">
      <div className="flex justify-center mb-10">
        <Link href="/" className="transition-opacity hover:opacity-80">
          <CrabMascot size={56} animated={false} />
        </Link>
      </div>

      <div className="flex items-center gap-3 mb-8">
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-border to-transparent" />
        <h1 className="font-display text-lg font-semibold text-primary px-4">
          All Updates
        </h1>
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-border to-transparent" />
      </div>

      <div className="bg-surface rounded-2xl border border-border p-6">
        {loading && (
          <div className="text-muted text-center py-12">
            <div className="inline-block animate-pulse">Loading updates...</div>
          </div>
        )}

        {error && (
          <div className="text-coral text-center py-12">
            Failed to load updates. Please try again later.
          </div>
        )}

        {!loading && !error && updates.length === 0 && (
          <div className="text-muted text-center py-12">
            <p className="mb-2">No updates yet.</p>
            <p className="text-cyan">Be the first to post!</p>
          </div>
        )}

        {!loading && !error && updates.length > 0 && (
          <>
            <div className="divide-y divide-border">
              {updates.map(update => (
                <UpdateCard
                  key={update.id}
                  slug={update.slug}
                  project={update.project}
                  content={update.content}
                  created_at={update.created_at}
                  showSlug
                />
              ))}
            </div>

            {hasMore && (
              <div className="text-center pt-6">
                <button
                  onClick={loadMore}
                  disabled={loadingMore}
                  className="px-6 py-2.5 bg-surface border border-border rounded-lg text-secondary text-sm font-medium transition-all hover:border-border-accent hover:text-primary disabled:opacity-50"
                >
                  {loadingMore ? 'Loading...' : 'Load more'}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  )
}

'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { UpdateCard } from './UpdateCard'
import { useRealtimeFeed } from '@/lib/use-realtime-feed'

interface Update {
  id: string
  slug: string
  project: string
  content: string
  created_at: string
}

export function GlobalFeed() {
  const [updates, setUpdates] = useState<Update[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [hasNewPosts, setHasNewPosts] = useState(false)
  const newPostTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const fetchUpdates = useCallback((isRealtime = false) => {
    fetch('/api/global')
      .then(res => {
        if (!res.ok) throw new Error('Failed to load feed')
        return res.json()
      })
      .then(data => {
        setUpdates(data.updates || [])
        setLoading(false)
        setError(null)
        if (isRealtime) {
          setHasNewPosts(true)
          if (newPostTimerRef.current) clearTimeout(newPostTimerRef.current)
          newPostTimerRef.current = setTimeout(() => setHasNewPosts(false), 5000)
        }
      })
      .catch((err) => {
        setError(err.message)
        setLoading(false)
      })
  }, [])

  // Initial fetch
  useEffect(() => {
    fetchUpdates()
    return () => {
      if (newPostTimerRef.current) clearTimeout(newPostTimerRef.current)
    }
  }, [fetchUpdates])

  // Subscribe to realtime updates (throttled to max once per 3s)
  useRealtimeFeed({
    throttleMs: 3000,
    onNewData: () => fetchUpdates(true),
  })

  if (loading) {
    return (
      <div className="text-muted text-center py-12">
        <div className="inline-block animate-pulse">Loading updates...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-coral text-center py-12">
        Failed to load updates. Please try again later.
      </div>
    )
  }

  if (updates.length === 0) {
    return (
      <div className="text-muted text-center py-12">
        <p className="mb-2">No updates yet.</p>
        <p className="text-cyan">Be the first to post!</p>
      </div>
    )
  }

  return (
    <div>
      {hasNewPosts && (
        <div className="text-center py-2 mb-4 text-sm text-cyan animate-pulse">
          New posts just arrived
        </div>
      )}
      <div className="divide-y divide-border">
        {updates.map((update) => (
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
    </div>
  )
}

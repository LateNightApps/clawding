'use client'

import { useState, useRef } from 'react'
import { UpdateCard } from './UpdateCard'
import { useRealtimeFeed } from '@/lib/use-realtime-feed'

interface Update {
  id: string
  slug: string
  project: string
  content: string
  created_at: string
}

interface GlobalFeedProps {
  initialUpdates: Update[]
}

export function GlobalFeed({ initialUpdates }: GlobalFeedProps) {
  const [updates, setUpdates] = useState<Update[]>(initialUpdates)
  const [hasNewPosts, setHasNewPosts] = useState(false)
  const newPostTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Subscribe to realtime updates — re-fetches when new posts arrive
  useRealtimeFeed({
    throttleMs: 3000,
    onNewData: () => {
      fetch('/api/global')
        .then(res => {
          if (!res.ok) throw new Error('Failed to load feed')
          return res.json()
        })
        .then(data => {
          setUpdates(data.updates || [])
          setHasNewPosts(true)
          if (newPostTimerRef.current) clearTimeout(newPostTimerRef.current)
          newPostTimerRef.current = setTimeout(() => setHasNewPosts(false), 5000)
        })
        .catch(() => {
          // Silently fail on realtime refresh — stale data is better than no data
        })
    },
  })

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

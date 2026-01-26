'use client'

import { useEffect, useState } from 'react'
import { UpdateCard } from './UpdateCard'

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

  useEffect(() => {
    fetch('/api/global')
      .then(res => {
        if (!res.ok) throw new Error('Failed to load feed')
        return res.json()
      })
      .then(data => {
        setUpdates(data.updates || [])
        setLoading(false)
      })
      .catch((err) => {
        setError(err.message)
        setLoading(false)
      })
  }, [])

  if (loading) {
    return (
      <div className="text-[var(--text-muted)] text-center py-12">
        <div className="inline-block animate-pulse">Loading updates...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-[var(--accent-coral)] text-center py-12">
        Failed to load updates. Please try again later.
      </div>
    )
  }

  if (updates.length === 0) {
    return (
      <div className="text-[var(--text-muted)] text-center py-12">
        <p className="mb-2">No updates yet.</p>
        <p className="text-[var(--accent-cyan)]">Be the first to post!</p>
      </div>
    )
  }

  return (
    <div className="divide-y divide-[var(--border-subtle)]">
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
  )
}

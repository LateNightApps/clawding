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
      <div className="text-zinc-500 text-center py-8">
        Loading updates...
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-red-500 text-center py-8">
        Failed to load updates. Please try again later.
      </div>
    )
  }

  if (updates.length === 0) {
    return (
      <div className="text-zinc-500 text-center py-8">
        No updates yet. Be the first to post!
      </div>
    )
  }

  return (
    <div>
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

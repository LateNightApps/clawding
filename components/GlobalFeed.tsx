'use client'

import { useEffect, useState } from 'react'
import { UpdateCard } from './UpdateCard'

interface Update {
  slug: string
  project: string
  content: string
  created_at: string
}

export function GlobalFeed() {
  const [updates, setUpdates] = useState<Update[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/global')
      .then(res => res.json())
      .then(data => {
        setUpdates(data.updates || [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="text-zinc-500 text-center py-8">
        Loading updates...
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
      {updates.map((update, i) => (
        <UpdateCard
          key={i}
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

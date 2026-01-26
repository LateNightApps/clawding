'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface ActiveCoder {
  slug: string
  postCount: number
}

export function ActiveCoders() {
  const [coders, setCoders] = useState<ActiveCoder[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    fetch('/api/active')
      .then(res => {
        if (!res.ok) throw new Error('Failed to load active coders')
        return res.json()
      })
      .then(data => {
        setCoders(data.active ?? [])
        setLoading(false)
      })
      .catch(() => {
        setError(true)
        setLoading(false)
      })
  }, [])

  if (error) {
    return (
      <p className="text-muted text-center py-6 text-sm">
        Could not load active coders right now.
      </p>
    )
  }

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-12 bg-card rounded-lg animate-pulse" />
        ))}
      </div>
    )
  }

  if (coders.length === 0) {
    return (
      <p className="text-muted text-center py-6 text-sm">
        No activity in the last 7 days.
      </p>
    )
  }

  return (
    <div className="space-y-2">
      {coders.map((coder, index) => (
        <Link
          key={coder.slug}
          href={`/${coder.slug}`}
          className="flex items-center justify-between py-3 px-4 rounded-lg transition-colors hover:bg-card/50"
        >
          <div className="flex items-center gap-3">
            <span className="text-muted text-sm font-mono w-5 text-right">
              {index + 1}
            </span>
            <span className="text-coral font-medium">@{coder.slug}</span>
          </div>
          <span className="text-muted text-sm">
            {coder.postCount} {coder.postCount === 1 ? 'post' : 'posts'}
          </span>
        </Link>
      ))}
    </div>
  )
}

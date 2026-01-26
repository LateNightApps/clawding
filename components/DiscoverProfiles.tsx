'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface DiscoverProfile {
  slug: string
  latestProject: string
  latestContent: string
  postCount: number
}

export function DiscoverProfiles() {
  const [profiles, setProfiles] = useState<DiscoverProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    fetch('/api/discover')
      .then(res => {
        if (!res.ok) throw new Error('Failed to load profiles')
        return res.json()
      })
      .then(data => {
        setProfiles(data.profiles ?? [])
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
        Could not load profiles right now.
      </p>
    )
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-28 bg-card rounded-xl animate-pulse" />
        ))}
      </div>
    )
  }

  if (profiles.length === 0) {
    return (
      <p className="text-muted text-center py-6 text-sm">
        No profiles to discover yet.
      </p>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {profiles.map(profile => (
        <Link
          key={profile.slug}
          href={`/${profile.slug}`}
          className="bg-card border border-border rounded-xl p-4 transition-all hover:border-border-accent hover:bg-card/80"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-coral font-medium text-sm">@{profile.slug}</span>
            <span className="text-muted text-xs">
              {profile.postCount} {profile.postCount === 1 ? 'post' : 'posts'}
            </span>
          </div>
          <p className="text-secondary text-sm leading-relaxed line-clamp-2">
            {profile.latestContent}
          </p>
          <div className="text-cyan text-xs mt-2 font-mono truncate">
            {profile.latestProject}
          </div>
        </Link>
      ))}
    </div>
  )
}

'use client'

import { useEffect, useState } from 'react'

interface Stats {
  totalCoders: number
  totalPosts: number
  postsToday: number
}

export function StatsBar() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    fetch('/api/stats')
      .then(res => {
        if (!res.ok) throw new Error('Failed to load stats')
        return res.json()
      })
      .then(setStats)
      .catch(() => setError(true))
  }, [])

  if (error) return null

  return (
    <div className="grid grid-cols-3 gap-4">
      <StatItem label="Coders" value={stats?.totalCoders} />
      <StatItem label="Posts" value={stats?.totalPosts} />
      <StatItem label="Today" value={stats?.postsToday} />
    </div>
  )
}

interface StatItemProps {
  label: string
  value: number | undefined
}

function StatItem({ label, value }: StatItemProps) {
  return (
    <div className="bg-surface border border-border rounded-xl p-4 text-center transition-colors hover:border-border-accent">
      <div className="font-display text-2xl font-bold text-coral mb-1">
        {value !== undefined ? value.toLocaleString() : (
          <span className="inline-block w-8 h-7 bg-card rounded animate-pulse" />
        )}
      </div>
      <div className="text-muted text-sm">{label}</div>
    </div>
  )
}

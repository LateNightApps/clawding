interface Stats {
  totalCoders: number
  totalPosts: number
  postsToday: number
}

interface StatsBarProps {
  initialStats: Stats
}

export function StatsBar({ initialStats }: StatsBarProps) {
  return (
    <div className="grid grid-cols-3 gap-4">
      <StatItem label="Coders" value={initialStats.totalCoders} />
      <StatItem label="Posts" value={initialStats.totalPosts} />
      <StatItem label="Today" value={initialStats.postsToday} />
    </div>
  )
}

interface StatItemProps {
  label: string
  value: number
}

function StatItem({ label, value }: StatItemProps) {
  return (
    <div className="bg-surface border border-border rounded-xl p-4 text-center">
      <div className="font-display text-2xl font-bold text-coral mb-1">
        {value.toLocaleString()}
      </div>
      <div className="text-muted text-sm">{label}</div>
    </div>
  )
}

interface ActiveCoder {
  slug: string
  postCount: number
}

interface ActiveCodersProps {
  initialCoders: ActiveCoder[]
}

export function ActiveCoders({ initialCoders }: ActiveCodersProps) {
  if (initialCoders.length === 0) {
    return (
      <p className="text-muted text-center py-6 text-sm">
        No activity in the last 7 days.
      </p>
    )
  }

  return (
    <div className="space-y-2">
      {initialCoders.map((coder, index) => (
        <a
          key={coder.slug}
          href={`/${coder.slug}`}
          className="flex items-center justify-between py-3 px-4 rounded-lg hover:bg-card/50"
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
        </a>
      ))}
    </div>
  )
}

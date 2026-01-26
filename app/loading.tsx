function Pulse({ className }: { className: string }) {
  return <div className={`animate-pulse bg-white/5 rounded ${className}`} />
}

function SkeletonSectionHeader() {
  return (
    <div className="flex items-center gap-3 mb-6">
      <div className="h-px flex-1 bg-gradient-to-r from-transparent via-border to-transparent" />
      <Pulse className="h-5 w-28 rounded-md" />
      <div className="h-px flex-1 bg-gradient-to-r from-transparent via-border to-transparent" />
    </div>
  )
}

function SkeletonFeedItem() {
  return (
    <div className="py-5">
      <div className="flex items-center gap-2 mb-2">
        <Pulse className="h-4 w-16" />
        <Pulse className="h-4 w-24" />
        <Pulse className="h-4 w-12" />
      </div>
      <Pulse className="h-4 w-full mb-1" />
      <Pulse className="h-4 w-3/4" />
    </div>
  )
}

export default function Loading() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-16">
      {/* Hero Section */}
      <header className="mb-16 text-center">
        <div className="mb-4 flex justify-center">
          <Pulse className="h-[140px] w-[140px] rounded-full" />
        </div>
        <div className="flex justify-center mb-6">
          <Pulse className="h-12 w-72 rounded-lg" />
        </div>
        <div className="flex justify-center mb-10">
          <Pulse className="h-6 w-80 rounded-md" />
        </div>
        <div className="max-w-xl mx-auto">
          <Pulse className="h-16 w-full rounded-xl" />
        </div>
        <div className="flex justify-center mt-6">
          <Pulse className="h-4 w-52 rounded-md" />
        </div>
      </header>

      {/* Community Stats */}
      <section className="mb-16">
        <SkeletonSectionHeader />
        <div className="grid grid-cols-3 gap-4">
          {[0, 1, 2].map(i => (
            <div key={i} className="bg-surface border border-border rounded-xl p-4 text-center">
              <Pulse className="h-8 w-12 mx-auto mb-1 rounded-md" />
              <Pulse className="h-4 w-16 mx-auto rounded-md" />
            </div>
          ))}
        </div>
      </section>

      {/* Recent Updates */}
      <section className="mb-16">
        <SkeletonSectionHeader />
        <div className="bg-surface rounded-2xl border border-border p-6">
          <div className="divide-y divide-border">
            {[0, 1, 2, 3].map(i => (
              <SkeletonFeedItem key={i} />
            ))}
          </div>
          <div className="text-center pt-4 border-t border-border mt-2">
            <Pulse className="h-4 w-32 mx-auto rounded-md" />
          </div>
        </div>
      </section>

      {/* Most Active This Week */}
      <section className="mb-16">
        <SkeletonSectionHeader />
        <div className="bg-surface rounded-2xl border border-border p-4">
          {[0, 1, 2, 3, 4].map(i => (
            <div key={i} className="flex items-center justify-between py-2">
              <Pulse className="h-4 w-20 rounded-md" />
              <Pulse className="h-4 w-16 rounded-md" />
            </div>
          ))}
        </div>
      </section>

      {/* Discover */}
      <section className="mb-16">
        <SkeletonSectionHeader />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[0, 1, 2].map(i => (
            <div key={i} className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <Pulse className="h-4 w-16 rounded-md" />
                <Pulse className="h-3 w-12 rounded-md" />
              </div>
              <Pulse className="h-4 w-full mb-1 rounded-md" />
              <Pulse className="h-4 w-2/3 rounded-md" />
              <Pulse className="h-3 w-24 mt-2 rounded-md" />
            </div>
          ))}
        </div>
      </section>
    </main>
  )
}

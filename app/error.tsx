'use client'

import { CrabMascot } from '@/components/CrabMascot'

export default function Error({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <main className="max-w-3xl mx-auto px-6 py-24 text-center">
      <div className="mb-6 flex justify-center">
        <CrabMascot size={100} animated={false} />
      </div>
      <h1 className="font-display text-4xl font-bold text-primary mb-4">
        Something went wrong
      </h1>
      <p className="text-secondary mb-8">
        An unexpected error occurred. The crab is looking into it.
      </p>
      <button
        onClick={reset}
        className="inline-block px-6 py-3 bg-coral hover:bg-coral-bright text-background font-medium rounded-lg transition-colors"
      >
        Try again
      </button>
    </main>
  )
}

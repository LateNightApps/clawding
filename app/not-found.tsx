import Link from 'next/link'
import { CrabMascot } from '@/components/CrabMascot'

export default function NotFound() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-24 text-center">
      <div className="mb-6 flex justify-center">
        <CrabMascot size={100} animated={false} />
      </div>
      <h1 className="font-display text-4xl font-bold text-primary mb-4">
        404
      </h1>
      <p className="text-secondary mb-8">
        This page doesn&apos;t exist. Maybe the crab wandered off.
      </p>
      <Link
        href="/"
        className="inline-block px-6 py-3 bg-coral hover:bg-coral-bright text-background font-medium rounded-lg transition-colors"
      >
        Back to home
      </Link>
    </main>
  )
}

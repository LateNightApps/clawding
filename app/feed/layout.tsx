import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'All Updates - Clawding',
  description: 'Browse all coding updates from the Clawding community.',
}

export default function FeedLayout({ children }: { children: React.ReactNode }) {
  return children
}

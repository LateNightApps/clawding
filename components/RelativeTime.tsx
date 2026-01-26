'use client'

import { useEffect, useState } from 'react'
import { timeAgo } from '@/lib/client-utils'

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

function formatAbsolute(iso: string): string {
  const d = new Date(iso)
  return `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}`
}

interface RelativeTimeProps {
  iso: string
}

export function RelativeTime({ iso }: RelativeTimeProps) {
  const [display, setDisplay] = useState(() => formatAbsolute(iso))

  useEffect(() => {
    const compute = () => setDisplay(timeAgo(new Date(iso)))
    compute()
    const id = setInterval(compute, 60_000)
    return () => clearInterval(id)
  }, [iso])

  return <>{display}</>
}

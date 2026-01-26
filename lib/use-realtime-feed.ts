'use client'

import { useEffect, useRef, useCallback } from 'react'
import { supabaseBrowser } from './supabase-browser'

interface UseRealtimeFeedOptions {
  /** Minimum ms between re-fetches. Default 3000 (3s). */
  throttleMs?: number
  /** Called when new data is available and should be re-fetched */
  onNewData: () => void
}

/**
 * Subscribes to new posts via Supabase Realtime.
 * Throttles notifications so the UI re-fetches at most
 * once per throttleMs, even if 100 posts arrive at once.
 */
export function useRealtimeFeed({
  throttleMs = 3000,
  onNewData,
}: UseRealtimeFeedOptions) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pendingRef = useRef(false)
  const callbackRef = useRef(onNewData)

  // Keep callback ref current without re-subscribing
  useEffect(() => {
    callbackRef.current = onNewData
  }, [onNewData])

  const scheduleFlush = useCallback(() => {
    // If a timer is already running, just mark that more data arrived
    if (timerRef.current) {
      pendingRef.current = true
      return
    }

    // Fire immediately for the first event
    callbackRef.current()

    // Then throttle subsequent events
    timerRef.current = setTimeout(() => {
      timerRef.current = null
      if (pendingRef.current) {
        pendingRef.current = false
        callbackRef.current()
      }
    }, throttleMs)
  }, [throttleMs])

  useEffect(() => {
    if (!supabaseBrowser) return

    const channel = supabaseBrowser
      .channel('global-feed')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'updates',
        },
        () => {
          scheduleFlush()
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'updates',
        },
        () => {
          scheduleFlush()
        }
      )
      .subscribe()

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
      supabaseBrowser?.removeChannel(channel)
    }
  }, [throttleMs, scheduleFlush])
}

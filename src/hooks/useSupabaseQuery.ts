import { useEffect, useRef, useState } from 'react'
import { supabase } from '../db/supabase'

export function useSupabaseQuery<T>(
  fetcher: () => Promise<T>,
  watchTables: string[],
  deps: unknown[]
): T | undefined {
  const [data, setData] = useState<T | undefined>(undefined)

  // The realtime subscription below is only re-created when `watchTables`
  // changes (rarely), so its callback would otherwise close over whichever
  // `fetcher` existed at subscribe time — e.g. one built from a still-null
  // id on first render — and keep re-running that stale, wrong query
  // forever, clobbering correct data every time an event comes in. Routing
  // every call through a ref keeps it on the latest fetcher without tying
  // the subscription's lifecycle to it.
  const fetcherRef = useRef(fetcher)
  fetcherRef.current = fetcher

  useEffect(() => {
    let cancelled = false
    fetcherRef.current().then((result) => {
      if (!cancelled) setData(result)
    })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  useEffect(() => {
    if (watchTables.length === 0) return

    const channel = supabase.channel(`watch:${watchTables.join(',')}:${Math.random()}`)
    for (const table of watchTables) {
      channel.on(
        'postgres_changes' as never,
        { event: '*', schema: 'public', table },
        () => {
          fetcherRef.current().then((result) => setData(result))
        }
      )
    }
    channel.subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, watchTables)

  return data
}

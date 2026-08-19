import { useEffect, useState } from 'react'
import { supabase } from '../db/supabase'

export function useSupabaseQuery<T>(
  fetcher: () => Promise<T>,
  watchTables: string[],
  deps: unknown[]
): T | undefined {
  const [data, setData] = useState<T | undefined>(undefined)

  useEffect(() => {
    let cancelled = false
    fetcher().then((result) => {
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
          fetcher().then((result) => setData(result))
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

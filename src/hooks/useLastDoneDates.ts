import { useMemo } from 'react'
import { useSupabaseQuery } from './useSupabaseQuery'
import { fetchWorkoutLogsForUser, fetchSetLogsByWorkoutLogIds } from '../db/queries'

export function useLastDoneDates(userId: number | null) {
  const logs = useSupabaseQuery(
    () => (userId ? fetchWorkoutLogsForUser(userId) : Promise.resolve([])),
    ['workout_logs'],
    [userId]
  )

  const logIds = useMemo(() => (logs ?? []).map((l) => l.id), [logs])

  const setLogs = useSupabaseQuery(
    () => fetchSetLogsByWorkoutLogIds(logIds),
    ['set_logs'],
    [logIds.join(',')]
  )

  return useMemo(() => {
    const workoutLogIdsWithSets = new Set((setLogs ?? []).map((s) => s.workoutLogId))
    const lastDoneByDay = new Map<number, string>()
    for (const log of logs ?? []) {
      if (!workoutLogIdsWithSets.has(log.id)) continue
      const current = lastDoneByDay.get(log.programDayId)
      if (!current || log.date > current) {
        lastDoneByDay.set(log.programDayId, log.date)
      }
    }
    return lastDoneByDay
  }, [logs, setLogs])
}

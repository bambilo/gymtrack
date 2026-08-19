import { useMemo } from 'react'
import { useSupabaseQuery } from './useSupabaseQuery'
import { fetchWorkoutLogsByUserAndDate, fetchSetLogsByWorkoutLogIds } from '../db/queries'
import { dateKey } from '../lib/date'

export function useTodaysLoggedDays(userId: number | null) {
  const todayKey = dateKey(new Date())

  const todaysLogs = useSupabaseQuery(
    () => (userId ? fetchWorkoutLogsByUserAndDate(userId, todayKey) : Promise.resolve([])),
    ['workout_logs'],
    [userId, todayKey]
  )

  const todaysLogIds = useMemo(() => (todaysLogs ?? []).map((l) => l.id), [todaysLogs])

  const todaysSetLogs = useSupabaseQuery(
    () => fetchSetLogsByWorkoutLogIds(todaysLogIds),
    ['set_logs'],
    [todaysLogIds.join(',')]
  )

  return useMemo(() => {
    const workoutLogIdsWithSets = new Set((todaysSetLogs ?? []).map((s) => s.workoutLogId))
    return new Set(
      (todaysLogs ?? [])
        .filter((l) => workoutLogIdsWithSets.has(l.id))
        .map((l) => l.programDayId)
    )
  }, [todaysLogs, todaysSetLogs])
}

import { useMemo } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db'
import type { WorkoutLog, SetLog } from '../db/types'
import { dateKey } from '../lib/date'

export function useTodaysLoggedDays(userId: number | null) {
  const todayKey = dateKey(new Date())

  const todaysLogs = useLiveQuery(
    () =>
      userId
        ? db.workoutLogs.where({ userId, date: todayKey }).toArray()
        : Promise.resolve<WorkoutLog[]>([]),
    [userId, todayKey]
  )

  const todaysLogIds = useMemo(() => (todaysLogs ?? []).map((l) => l.id), [todaysLogs])

  const todaysSetLogs = useLiveQuery(
    () =>
      todaysLogIds.length > 0
        ? db.setLogs.where('workoutLogId').anyOf(todaysLogIds).toArray()
        : Promise.resolve<SetLog[]>([]),
    [todaysLogIds]
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

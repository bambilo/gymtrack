import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db'
import type { ProgramDay } from '../db/types'

export function useProgramDays(userId: number | null) {
  return useLiveQuery(
    () =>
      userId
        ? db.programDays.where('userId').equals(userId).sortBy('order')
        : Promise.resolve<ProgramDay[]>([]),
    [userId]
  )
}

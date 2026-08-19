import { useSupabaseQuery } from './useSupabaseQuery'
import { fetchProgramDays } from '../db/queries'
import type { ProgramDay } from '../db/types'

export function useProgramDays(userId: number | null) {
  return useSupabaseQuery<ProgramDay[]>(
    () => (userId ? fetchProgramDays(userId) : Promise.resolve([])),
    ['program_days'],
    [userId]
  )
}

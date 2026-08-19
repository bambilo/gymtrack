import Dexie, { type EntityTable } from 'dexie'
import type { User, ProgramDay, ProgramExercise, WorkoutLog, SetLog } from './types'

export const db = new Dexie('GymTrackDB') as Dexie & {
  users: EntityTable<User, 'id'>
  programDays: EntityTable<ProgramDay, 'id'>
  programExercises: EntityTable<ProgramExercise, 'id'>
  workoutLogs: EntityTable<WorkoutLog, 'id'>
  setLogs: EntityTable<SetLog, 'id'>
}

db.version(1).stores({
  users: '++id, name',
  programDays: '++id, userId, dayOfWeek',
  programExercises: '++id, programDayId, order',
  workoutLogs: '++id, userId, date, programDayId',
  setLogs: '++id, workoutLogId, programExerciseId',
})

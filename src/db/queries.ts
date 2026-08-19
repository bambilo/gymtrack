import { db } from './db'
import type { ProgramDay, ProgramExercise } from './types'

export async function createUser(name: string) {
  return db.users.add({ name })
}

export async function updateUser(id: number, name: string) {
  await db.users.update(id, { name })
}

export async function deleteUser(id: number) {
  await db.users.delete(id)
}

export async function createProgramDay(userId: number, dayOfWeek: number, title: string) {
  const count = await db.programDays.where('userId').equals(userId).count()
  return db.programDays.add({ userId, dayOfWeek, title, order: count })
}

export async function updateProgramDay(
  id: number,
  changes: Partial<Pick<ProgramDay, 'dayOfWeek' | 'title' | 'order'>>
) {
  await db.programDays.update(id, changes)
}

export async function deleteProgramDay(id: number) {
  await db.programExercises.where('programDayId').equals(id).delete()
  await db.programDays.delete(id)
}

export async function createProgramExercise(
  programDayId: number,
  data: Omit<ProgramExercise, 'id' | 'programDayId' | 'order'>
) {
  const count = await db.programExercises.where('programDayId').equals(programDayId).count()
  return db.programExercises.add({ ...data, programDayId, order: count })
}

export async function updateProgramExercise(
  id: number,
  changes: Partial<Omit<ProgramExercise, 'id' | 'programDayId'>>
) {
  await db.programExercises.update(id, changes)
}

export async function deleteProgramExercise(id: number) {
  await db.programExercises.delete(id)
}

export async function reorderProgramExercises(orderedIds: number[]) {
  await db.transaction('rw', db.programExercises, async () => {
    for (const [order, id] of orderedIds.entries()) {
      await db.programExercises.update(id, { order })
    }
  })
}

export async function getOrCreateWorkoutLog(userId: number, date: string, programDayId: number) {
  const existing = await db.workoutLogs.where({ userId, date, programDayId }).first()
  if (existing) return existing.id!
  return db.workoutLogs.add({ userId, date, programDayId })
}

export async function upsertSetLog(
  workoutLogId: number,
  programExerciseId: number,
  setNo: number,
  weight: number,
  reps: number
) {
  const existing = await db.setLogs
    .where({ workoutLogId, programExerciseId, setNo })
    .first()
  if (existing) {
    await db.setLogs.update(existing.id!, { weight, reps })
  } else {
    await db.setLogs.add({ workoutLogId, programExerciseId, setNo, weight, reps })
  }
}

export async function deleteSetLog(workoutLogId: number, programExerciseId: number, setNo: number) {
  const existing = await db.setLogs
    .where({ workoutLogId, programExerciseId, setNo })
    .first()
  if (existing) await db.setLogs.delete(existing.id!)
}

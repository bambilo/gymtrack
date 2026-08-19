import { supabase } from './supabase'
import type { User, ProgramDay, ProgramExercise, WorkoutLog, SetLog } from './types'

function mapUser(row: any): User {
  return { id: row.id, name: row.name }
}

function mapProgramDay(row: any): ProgramDay {
  return { id: row.id, userId: row.user_id, dayOfWeek: row.day_of_week, title: row.title, order: row.order }
}

function mapProgramExercise(row: any): ProgramExercise {
  return {
    id: row.id,
    programDayId: row.program_day_id,
    order: row.order,
    name: row.name,
    targetSets: row.target_sets,
    targetReps: row.target_reps,
    intensity: row.intensity,
  }
}

function mapWorkoutLog(row: any): WorkoutLog {
  return { id: row.id, userId: row.user_id, date: row.date, programDayId: row.program_day_id }
}

function mapSetLog(row: any): SetLog {
  return {
    id: row.id,
    workoutLogId: row.workout_log_id,
    programExerciseId: row.program_exercise_id,
    setNo: row.set_no,
    weight: Number(row.weight),
    reps: row.reps,
  }
}

// ---- Reads ----

export async function fetchUsers(): Promise<User[]> {
  const { data, error } = await supabase.from('users').select('*').order('id')
  if (error) throw error
  return (data ?? []).map(mapUser)
}

export async function fetchUser(id: number): Promise<User | undefined> {
  const { data, error } = await supabase.from('users').select('*').eq('id', id).maybeSingle()
  if (error) throw error
  return data ? mapUser(data) : undefined
}

export async function fetchProgramDays(userId: number): Promise<ProgramDay[]> {
  const { data, error } = await supabase
    .from('program_days')
    .select('*')
    .eq('user_id', userId)
    .order('order')
  if (error) throw error
  return (data ?? []).map(mapProgramDay)
}

export async function fetchProgramDay(id: number): Promise<ProgramDay | undefined> {
  const { data, error } = await supabase.from('program_days').select('*').eq('id', id).maybeSingle()
  if (error) throw error
  return data ? mapProgramDay(data) : undefined
}

export async function fetchProgramExercises(programDayId: number): Promise<ProgramExercise[]> {
  const { data, error } = await supabase
    .from('program_exercises')
    .select('*')
    .eq('program_day_id', programDayId)
    .order('order')
  if (error) throw error
  return (data ?? []).map(mapProgramExercise)
}

export async function fetchWorkoutLogsForUser(userId: number): Promise<WorkoutLog[]> {
  const { data, error } = await supabase.from('workout_logs').select('*').eq('user_id', userId)
  if (error) throw error
  return (data ?? []).map(mapWorkoutLog)
}

export async function fetchWorkoutLogsByUserAndDate(userId: number, date: string): Promise<WorkoutLog[]> {
  const { data, error } = await supabase
    .from('workout_logs')
    .select('*')
    .eq('user_id', userId)
    .eq('date', date)
  if (error) throw error
  return (data ?? []).map(mapWorkoutLog)
}

export async function fetchSetLogsByWorkoutLogId(workoutLogId: number): Promise<SetLog[]> {
  const { data, error } = await supabase.from('set_logs').select('*').eq('workout_log_id', workoutLogId)
  if (error) throw error
  return (data ?? []).map(mapSetLog)
}

export async function fetchSetLogsByWorkoutLogIds(workoutLogIds: number[]): Promise<SetLog[]> {
  if (workoutLogIds.length === 0) return []
  const { data, error } = await supabase.from('set_logs').select('*').in('workout_log_id', workoutLogIds)
  if (error) throw error
  return (data ?? []).map(mapSetLog)
}

export async function fetchSetLogsByProgramExerciseId(programExerciseId: number): Promise<SetLog[]> {
  const { data, error } = await supabase
    .from('set_logs')
    .select('*')
    .eq('program_exercise_id', programExerciseId)
  if (error) throw error
  return (data ?? []).map(mapSetLog)
}

// ---- Writes: users ----

export async function createUser(name: string): Promise<number> {
  const { data, error } = await supabase.from('users').insert({ name }).select('id').single()
  if (error) throw error
  return data.id
}

export async function updateUser(id: number, name: string) {
  const { error } = await supabase.from('users').update({ name }).eq('id', id)
  if (error) throw error
}

export async function deleteUser(id: number) {
  const { error } = await supabase.from('users').delete().eq('id', id)
  if (error) throw error
}

// ---- Writes: program days / exercises ----

export async function createProgramDay(userId: number, dayOfWeek: number, title: string) {
  const days = await fetchProgramDays(userId)
  const { data, error } = await supabase
    .from('program_days')
    .insert({ user_id: userId, day_of_week: dayOfWeek, title, order: days.length })
    .select('id')
    .single()
  if (error) throw error
  return data.id as number
}

export async function updateProgramDay(
  id: number,
  changes: Partial<Pick<ProgramDay, 'dayOfWeek' | 'title' | 'order'>>
) {
  const payload: Record<string, unknown> = {}
  if (changes.dayOfWeek !== undefined) payload.day_of_week = changes.dayOfWeek
  if (changes.title !== undefined) payload.title = changes.title
  if (changes.order !== undefined) payload.order = changes.order
  const { error } = await supabase.from('program_days').update(payload).eq('id', id)
  if (error) throw error
}

export async function deleteProgramDay(id: number) {
  const { error } = await supabase.from('program_days').delete().eq('id', id)
  if (error) throw error
}

export async function createProgramExercise(
  programDayId: number,
  data: Omit<ProgramExercise, 'id' | 'programDayId' | 'order'>
) {
  const existing = await fetchProgramExercises(programDayId)
  const { data: inserted, error } = await supabase
    .from('program_exercises')
    .insert({
      program_day_id: programDayId,
      order: existing.length,
      name: data.name,
      target_sets: data.targetSets,
      target_reps: data.targetReps,
      intensity: data.intensity,
    })
    .select('id')
    .single()
  if (error) throw error
  return inserted.id as number
}

export async function updateProgramExercise(
  id: number,
  changes: Partial<Omit<ProgramExercise, 'id' | 'programDayId'>>
) {
  const payload: Record<string, unknown> = {}
  if (changes.name !== undefined) payload.name = changes.name
  if (changes.targetSets !== undefined) payload.target_sets = changes.targetSets
  if (changes.targetReps !== undefined) payload.target_reps = changes.targetReps
  if (changes.intensity !== undefined) payload.intensity = changes.intensity
  if (changes.order !== undefined) payload.order = changes.order
  const { error } = await supabase.from('program_exercises').update(payload).eq('id', id)
  if (error) throw error
}

export async function deleteProgramExercise(id: number) {
  const { error } = await supabase.from('program_exercises').delete().eq('id', id)
  if (error) throw error
}

export async function reorderProgramExercises(orderedIds: number[]) {
  await Promise.all(
    orderedIds.map((id, order) => supabase.from('program_exercises').update({ order }).eq('id', id))
  )
}

// ---- Writes: workout logs / set logs ----

export async function getOrCreateWorkoutLog(userId: number, date: string, programDayId: number) {
  const existing = await fetchWorkoutLogsByUserAndDate(userId, date)
  const match = existing.find((w) => w.programDayId === programDayId)
  if (match) return match.id

  const { data, error } = await supabase
    .from('workout_logs')
    .insert({ user_id: userId, date, program_day_id: programDayId })
    .select('id')
    .single()
  if (error) throw error
  return data.id as number
}

export async function upsertSetLog(
  workoutLogId: number,
  programExerciseId: number,
  setNo: number,
  weight: number,
  reps: number
) {
  const { data: existing, error: selectError } = await supabase
    .from('set_logs')
    .select('id')
    .eq('workout_log_id', workoutLogId)
    .eq('program_exercise_id', programExerciseId)
    .eq('set_no', setNo)
    .maybeSingle()
  if (selectError) throw selectError

  if (existing) {
    const { error } = await supabase.from('set_logs').update({ weight, reps }).eq('id', existing.id)
    if (error) throw error
  } else {
    const { error } = await supabase
      .from('set_logs')
      .insert({ workout_log_id: workoutLogId, program_exercise_id: programExerciseId, set_no: setNo, weight, reps })
    if (error) throw error
  }
}

export async function deleteSetLog(workoutLogId: number, programExerciseId: number, setNo: number) {
  const { error } = await supabase
    .from('set_logs')
    .delete()
    .eq('workout_log_id', workoutLogId)
    .eq('program_exercise_id', programExerciseId)
    .eq('set_no', setNo)
  if (error) throw error
}

export async function clearSetLogsForExercise(workoutLogId: number, programExerciseId: number) {
  const { error } = await supabase
    .from('set_logs')
    .delete()
    .eq('workout_log_id', workoutLogId)
    .eq('program_exercise_id', programExerciseId)
  if (error) throw error
}

export async function getLastSetLogsForExercise(
  programExerciseId: number,
  excludeWorkoutLogId: number | null
) {
  const setLogs = await fetchSetLogsByProgramExerciseId(programExerciseId)
  const relevant = setLogs.filter((s) => s.workoutLogId !== excludeWorkoutLogId)
  if (relevant.length === 0) return []

  const workoutLogIds = Array.from(new Set(relevant.map((s) => s.workoutLogId)))
  const { data, error } = await supabase.from('workout_logs').select('id, date').in('id', workoutLogIds)
  if (error) throw error
  const dateByLogId = new Map((data ?? []).map((w) => [w.id, w.date as string]))

  const withDate = relevant
    .map((s) => ({ ...s, date: dateByLogId.get(s.workoutLogId) }))
    .filter((s): s is typeof s & { date: string } => Boolean(s.date))
  if (withDate.length === 0) return []

  const maxDate = withDate.reduce((max, s) => (s.date > max ? s.date : max), withDate[0].date)
  return withDate.filter((s) => s.date === maxDate).sort((a, b) => a.setNo - b.setNo)
}

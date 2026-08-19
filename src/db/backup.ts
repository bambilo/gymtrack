import { supabase } from './supabase'
import type { User, ProgramDay, ProgramExercise, WorkoutLog, SetLog } from './types'
import { fetchUsers, fetchProgramDays as fetchAllProgramDays } from './queries'

const BACKUP_VERSION = 2

interface BackupFile {
  version: number
  exportedAt: string
  data: {
    users: User[]
    programDays: ProgramDay[]
    programExercises: ProgramExercise[]
    workoutLogs: WorkoutLog[]
    setLogs: SetLog[]
  }
}

async function fetchAll() {
  const users = await fetchUsers()
  const programDaysNested = await Promise.all(users.map((u) => fetchAllProgramDays(u.id)))
  const programDays = programDaysNested.flat()

  const { data: exerciseRows, error: exError } = await supabase.from('program_exercises').select('*')
  if (exError) throw exError
  const programExercises: ProgramExercise[] = (exerciseRows ?? []).map((row) => ({
    id: row.id,
    programDayId: row.program_day_id,
    order: row.order,
    name: row.name,
    targetSets: row.target_sets,
    targetReps: row.target_reps,
    intensity: row.intensity,
  }))

  const { data: workoutRows, error: wError } = await supabase.from('workout_logs').select('*')
  if (wError) throw wError
  const workoutLogs: WorkoutLog[] = (workoutRows ?? []).map((row) => ({
    id: row.id,
    userId: row.user_id,
    date: row.date,
    programDayId: row.program_day_id,
  }))

  const { data: setRows, error: sError } = await supabase.from('set_logs').select('*')
  if (sError) throw sError
  const setLogs: SetLog[] = (setRows ?? []).map((row) => ({
    id: row.id,
    workoutLogId: row.workout_log_id,
    programExerciseId: row.program_exercise_id,
    setNo: row.set_no,
    weight: Number(row.weight),
    reps: row.reps,
  }))

  return { users, programDays, programExercises, workoutLogs, setLogs }
}

export async function exportBackup() {
  const backup: BackupFile = {
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    data: await fetchAll(),
  }

  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `gymtrack-yedek-${backup.exportedAt.slice(0, 10)}.json`
  a.click()
  URL.revokeObjectURL(url)
}

function isBackupFile(value: unknown): value is BackupFile {
  if (!value || typeof value !== 'object') return false
  const v = value as Record<string, unknown>
  if (typeof v.version !== 'number' || !v.data || typeof v.data !== 'object') return false
  const data = v.data as Record<string, unknown>
  return ['users', 'programDays', 'programExercises', 'workoutLogs', 'setLogs'].every((key) =>
    Array.isArray(data[key])
  )
}

export async function importBackup(file: File) {
  const text = await file.text()
  const parsed = JSON.parse(text)
  if (!isBackupFile(parsed)) {
    throw new Error('Geçersiz yedek dosyası')
  }

  const { data } = parsed

  await supabase.from('set_logs').delete().gte('id', 0)
  await supabase.from('workout_logs').delete().gte('id', 0)
  await supabase.from('program_exercises').delete().gte('id', 0)
  await supabase.from('program_days').delete().gte('id', 0)
  await supabase.from('users').delete().gte('id', 0)

  if (data.users.length > 0) {
    const { error } = await supabase.from('users').insert(data.users.map((u) => ({ id: u.id, name: u.name })))
    if (error) throw error
  }
  if (data.programDays.length > 0) {
    const { error } = await supabase.from('program_days').insert(
      data.programDays.map((d) => ({
        id: d.id,
        user_id: d.userId,
        day_of_week: d.dayOfWeek,
        title: d.title,
        order: d.order,
      }))
    )
    if (error) throw error
  }
  if (data.programExercises.length > 0) {
    const { error } = await supabase.from('program_exercises').insert(
      data.programExercises.map((e) => ({
        id: e.id,
        program_day_id: e.programDayId,
        order: e.order,
        name: e.name,
        target_sets: e.targetSets,
        target_reps: e.targetReps,
        intensity: e.intensity,
      }))
    )
    if (error) throw error
  }
  if (data.workoutLogs.length > 0) {
    const { error } = await supabase.from('workout_logs').insert(
      data.workoutLogs.map((w) => ({
        id: w.id,
        user_id: w.userId,
        date: w.date,
        program_day_id: w.programDayId,
      }))
    )
    if (error) throw error
  }
  if (data.setLogs.length > 0) {
    const { error } = await supabase.from('set_logs').insert(
      data.setLogs.map((s) => ({
        id: s.id,
        workout_log_id: s.workoutLogId,
        program_exercise_id: s.programExerciseId,
        set_no: s.setNo,
        weight: s.weight,
        reps: s.reps,
      }))
    )
    if (error) throw error
  }
}

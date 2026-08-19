import { db } from './db'
import type { User, ProgramDay, ProgramExercise, WorkoutLog, SetLog } from './types'

const BACKUP_VERSION = 1

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

export async function exportBackup() {
  const backup: BackupFile = {
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    data: {
      users: await db.users.toArray(),
      programDays: await db.programDays.toArray(),
      programExercises: await db.programExercises.toArray(),
      workoutLogs: await db.workoutLogs.toArray(),
      setLogs: await db.setLogs.toArray(),
    },
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

  await db.transaction(
    'rw',
    db.users,
    db.programDays,
    db.programExercises,
    db.workoutLogs,
    db.setLogs,
    async () => {
      await db.setLogs.clear()
      await db.workoutLogs.clear()
      await db.programExercises.clear()
      await db.programDays.clear()
      await db.users.clear()

      await db.users.bulkAdd(parsed.data.users)
      await db.programDays.bulkAdd(parsed.data.programDays)
      await db.programExercises.bulkAdd(parsed.data.programExercises)
      await db.workoutLogs.bulkAdd(parsed.data.workoutLogs)
      await db.setLogs.bulkAdd(parsed.data.setLogs)
    }
  )
}

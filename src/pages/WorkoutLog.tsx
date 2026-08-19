import { useEffect, useMemo, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useCurrentUser } from '../context/CurrentUserContext'
import { dateKey, formatLongDate } from '../lib/date'
import {
  getOrCreateWorkoutLog,
  upsertSetLog,
  getLastSetLogsForExercise,
  clearSetLogsForExercise,
  fetchProgramDay,
  fetchProgramExercises,
  fetchSetLogsByWorkoutLogId,
} from '../db/queries'
import { useSupabaseQuery } from '../hooks/useSupabaseQuery'
import { PageHeader } from '../components/PageHeader'

export function WorkoutLog() {
  const { programDayId, date } = useParams()
  const dayId = Number(programDayId)
  const { userId } = useCurrentUser()
  const navigate = useNavigate()
  const today = dateKey(new Date())
  const targetDate = date ?? today
  const isPastEntry = targetDate !== today

  // Kept as a memoized promise (not just resolved state) so writes that fire
  // before the id has resolved still land on the correct workout log instead
  // of silently no-oping — getOrCreateWorkoutLog is idempotent, safe to await
  // repeatedly from multiple callers.
  const workoutLogPromise = useMemo(() => {
    if (!userId || !dayId) return null
    return getOrCreateWorkoutLog(userId, targetDate, dayId)
  }, [userId, dayId, targetDate])

  const [workoutLogId, setWorkoutLogId] = useState<number | null>(null)

  useEffect(() => {
    setWorkoutLogId(null)
    workoutLogPromise?.then(setWorkoutLogId)
  }, [workoutLogPromise])

  const programDay = useSupabaseQuery(() => fetchProgramDay(dayId), ['program_days'], [dayId])
  const exercises = useSupabaseQuery(
    () => fetchProgramExercises(dayId),
    ['program_exercises'],
    [dayId]
  )
  const setLogs = useSupabaseQuery(
    () => (workoutLogId ? fetchSetLogsByWorkoutLogId(workoutLogId) : Promise.resolve([])),
    ['set_logs'],
    [workoutLogId]
  )

  if (!userId) return null

  return (
    <div className="screen workout-log">
      <PageHeader
        title={programDay?.title ?? ''}
        backTo="/"
        subtitle={isPastEntry ? formatLongDate(targetDate) : undefined}
      />

      {exercises?.map((exercise) => (
        <ExerciseCard
          key={exercise.id}
          exercise={exercise}
          workoutLogId={workoutLogId}
          workoutLogPromise={workoutLogPromise}
          existingSets={setLogs?.filter((s) => s.programExerciseId === exercise.id) ?? []}
        />
      ))}

      <button className="primary-button" onClick={() => navigate('/')}>
        Antrenmanı Bitir
      </button>
    </div>
  )
}

interface ExerciseCardProps {
  exercise: { id: number; name: string; targetSets: number; targetReps: string; intensity: string }
  workoutLogId: number | null
  workoutLogPromise: Promise<number> | null
  existingSets: { setNo: number; weight: number; reps: number }[]
}

function ExerciseCard({ exercise, workoutLogId, workoutLogPromise, existingSets }: ExerciseCardProps) {
  const [extraSets, setExtraSets] = useState(0)
  const totalSets = Math.max(exercise.targetSets, ...existingSets.map((s) => s.setNo)) + extraSets

  const setRows = Array.from({ length: totalSets }, (_, i) => i + 1)

  const lastSets = useSupabaseQuery(
    () =>
      workoutLogId
        ? getLastSetLogsForExercise(exercise.id!, workoutLogId)
        : Promise.resolve([]),
    ['set_logs', 'workout_logs'],
    [exercise.id, workoutLogId]
  )

  const useLastValues = async () => {
    if (!workoutLogPromise || !lastSets || lastSets.length === 0) return
    const id = await workoutLogPromise
    for (const s of lastSets) {
      await upsertSetLog(id, exercise.id!, s.setNo, s.weight, s.reps)
    }
  }

  const firstSet = existingSets.find((s) => s.setNo === 1)

  const applyFirstSetToAll = async () => {
    if (!workoutLogPromise || !firstSet) return
    const id = await workoutLogPromise
    for (const setNo of setRows) {
      if (setNo === 1) continue
      await upsertSetLog(id, exercise.id!, setNo, firstSet.weight, firstSet.reps)
    }
  }

  const clearExercise = async () => {
    if (!workoutLogPromise) return
    if (!confirm(`"${exercise.name}" için bugün girdiğin değerler silinsin mi?`)) return
    const id = await workoutLogPromise
    await clearSetLogsForExercise(id, exercise.id!)
    setExtraSets(0)
  }

  return (
    <div className="card exercise-card">
      <div className="exercise-card-header">
        <h3>{exercise.name}</h3>
        <span className="exercise-meta">
          Hedef: {exercise.targetSets}×{exercise.targetReps} · {exercise.intensity}
        </span>
      </div>

      {lastSets && lastSets.length > 0 && (
        <div className="last-values-row">
          <span className="muted">
            Son sefer: {lastSets.map((s) => `${s.weight}kg×${s.reps}`).join(', ')}
          </span>
          <button type="button" className="link-button" onClick={useLastValues}>
            Bu değerleri kullan
          </button>
        </div>
      )}

      <div className="set-rows">
        <div className="set-row set-row-labels">
          <span>Set</span>
          <span>Kg</span>
          <span>Tekrar</span>
        </div>
        {setRows.map((setNo) => {
          const existing = existingSets.find((s) => s.setNo === setNo)
          return (
            <SetRow
              key={`${setNo}-${existing?.weight ?? ''}-${existing?.reps ?? ''}`}
              setNo={setNo}
              exerciseId={exercise.id!}
              workoutLogPromise={workoutLogPromise}
              initialWeight={existing?.weight}
              initialReps={existing?.reps}
            />
          )
        })}
      </div>

      <div className="exercise-card-actions">
        <button className="secondary-button" onClick={() => setExtraSets((n) => n + 1)}>
          + Set Ekle
        </button>
        {firstSet && setRows.length > 1 && (
          <button className="secondary-button" onClick={applyFirstSetToAll}>
            Set 1'i tüm setlere uygula
          </button>
        )}
        {existingSets.length > 0 && (
          <button className="secondary-button danger-button" onClick={clearExercise}>
            Temizle
          </button>
        )}
      </div>
    </div>
  )
}

interface SetRowProps {
  setNo: number
  exerciseId: number
  workoutLogPromise: Promise<number> | null
  initialWeight?: number
  initialReps?: number
}

function SetRow({ setNo, exerciseId, workoutLogPromise, initialWeight, initialReps }: SetRowProps) {
  const [weight, setWeight] = useState(initialWeight?.toString() ?? '')
  const [reps, setReps] = useState(initialReps?.toString() ?? '')

  const save = async (nextWeight: string, nextReps: string) => {
    if (!workoutLogPromise) return
    const w = parseFloat(nextWeight)
    const r = parseInt(nextReps, 10)
    if (Number.isFinite(w) && Number.isFinite(r)) {
      const id = await workoutLogPromise
      upsertSetLog(id, exerciseId, setNo, w, r)
    }
  }

  return (
    <div className="set-row">
      <span>{setNo}</span>
      <input
        type="number"
        inputMode="decimal"
        value={weight}
        placeholder="0"
        onChange={(e) => setWeight(e.target.value)}
        onBlur={() => save(weight, reps)}
      />
      <input
        type="number"
        inputMode="numeric"
        value={reps}
        placeholder="0"
        onChange={(e) => setReps(e.target.value)}
        onBlur={() => save(weight, reps)}
      />
    </div>
  )
}

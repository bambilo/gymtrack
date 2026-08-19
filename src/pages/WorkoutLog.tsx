import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db'
import { useCurrentUser } from '../context/CurrentUserContext'
import { dateKey, formatLongDate } from '../lib/date'
import { getOrCreateWorkoutLog, upsertSetLog, getLastSetLogsForExercise } from '../db/queries'
import { PageHeader } from '../components/PageHeader'

export function WorkoutLog() {
  const { programDayId, date } = useParams()
  const dayId = Number(programDayId)
  const { userId } = useCurrentUser()
  const navigate = useNavigate()
  const today = dateKey(new Date())
  const targetDate = date ?? today
  const isPastEntry = targetDate !== today

  const [workoutLogId, setWorkoutLogId] = useState<number | null>(null)

  useEffect(() => {
    if (!userId || !dayId) return
    getOrCreateWorkoutLog(userId, targetDate, dayId).then(setWorkoutLogId)
  }, [userId, dayId, targetDate])

  const programDay = useLiveQuery(() => db.programDays.get(dayId), [dayId])
  const exercises = useLiveQuery(
    () => db.programExercises.where('programDayId').equals(dayId).sortBy('order'),
    [dayId]
  )
  const setLogs = useLiveQuery(
    () => (workoutLogId ? db.setLogs.where('workoutLogId').equals(workoutLogId).toArray() : []),
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
  existingSets: { setNo: number; weight: number; reps: number }[]
}

function ExerciseCard({ exercise, workoutLogId, existingSets }: ExerciseCardProps) {
  const [extraSets, setExtraSets] = useState(0)
  const totalSets = Math.max(exercise.targetSets, ...existingSets.map((s) => s.setNo)) + extraSets

  const setRows = Array.from({ length: totalSets }, (_, i) => i + 1)

  const lastSets = useLiveQuery(
    () =>
      workoutLogId
        ? getLastSetLogsForExercise(exercise.id!, workoutLogId)
        : Promise.resolve([]),
    [exercise.id, workoutLogId]
  )

  const useLastValues = async () => {
    if (!workoutLogId || !lastSets || lastSets.length === 0) return
    for (const s of lastSets) {
      await upsertSetLog(workoutLogId, exercise.id!, s.setNo, s.weight, s.reps)
    }
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
              workoutLogId={workoutLogId}
              initialWeight={existing?.weight}
              initialReps={existing?.reps}
            />
          )
        })}
      </div>

      <button className="secondary-button" onClick={() => setExtraSets((n) => n + 1)}>
        + Set Ekle
      </button>
    </div>
  )
}

interface SetRowProps {
  setNo: number
  exerciseId: number
  workoutLogId: number | null
  initialWeight?: number
  initialReps?: number
}

function SetRow({ setNo, exerciseId, workoutLogId, initialWeight, initialReps }: SetRowProps) {
  const [weight, setWeight] = useState(initialWeight?.toString() ?? '')
  const [reps, setReps] = useState(initialReps?.toString() ?? '')

  const save = (nextWeight: string, nextReps: string) => {
    if (!workoutLogId) return
    const w = parseFloat(nextWeight)
    const r = parseInt(nextReps, 10)
    if (Number.isFinite(w) && Number.isFinite(r)) {
      upsertSetLog(workoutLogId, exerciseId, setNo, w, r)
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

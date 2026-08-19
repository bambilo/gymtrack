import { useState } from 'react'
import type { ProgramDay, ProgramExercise } from '../db/types'
import { useCurrentUser } from '../context/CurrentUserContext'
import { dayName } from '../lib/date'
import { PageHeader } from '../components/PageHeader'
import {
  createProgramDay,
  deleteProgramDay,
  createProgramExercise,
  updateProgramExercise,
  deleteProgramExercise,
  reorderProgramExercises,
  fetchProgramExercises,
} from '../db/queries'
import { useProgramDays } from '../hooks/useProgramDays'
import { useSupabaseQuery } from '../hooks/useSupabaseQuery'

const WEEKDAYS = [1, 2, 3, 4, 5, 6, 7]

export function ProgramEditor() {
  const { userId } = useCurrentUser()
  const [selectedDayId, setSelectedDayId] = useState<number | null>(null)

  const programDays = useProgramDays(userId)

  const selectedDay = programDays?.find((d) => d.id === selectedDayId)

  if (!userId) return null

  if (selectedDay) {
    return (
      <ExerciseEditor
        day={selectedDay}
        onBack={() => setSelectedDayId(null)}
        onDeleted={() => setSelectedDayId(null)}
      />
    )
  }

  return (
    <div className="screen program-editor">
      <PageHeader title="Programım" backTo="/settings" backLabel="← Ayarlar" />

      <div className="program-day-grid">
        {programDays?.map((day) => (
          <div key={day.id} className="program-day-card program-day-card-editable">
            <button
              type="button"
              className="program-day-card-main"
              onClick={() => setSelectedDayId(day.id)}
            >
              <span className="program-day-title">{day.title}</span>
              <span className="muted">{dayName(day.dayOfWeek)}</span>
            </button>
            <button
              type="button"
              className="link-button danger"
              onClick={() => {
                if (confirm(`"${day.title}" gününü silmek istediğine emin misin?`)) {
                  deleteProgramDay(day.id)
                }
              }}
            >
              Sil
            </button>
          </div>
        ))}
      </div>

      <NewDayForm userId={userId} nextOrder={programDays?.length ?? 0} />
    </div>
  )
}

function NewDayForm({ userId }: { userId: number; nextOrder: number }) {
  const [title, setTitle] = useState('')
  const [dayOfWeek, setDayOfWeek] = useState(1)

  const submit = async () => {
    const trimmed = title.trim()
    if (!trimmed) return
    await createProgramDay(userId, dayOfWeek, trimmed)
    setTitle('')
  }

  return (
    <form
      className="card new-day-form"
      onSubmit={(e) => {
        e.preventDefault()
        submit()
      }}
    >
      <h3>Yeni Gün Ekle</h3>
      <input
        type="text"
        placeholder="Gün başlığı (ör. Göğüs & Triceps)"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      <select value={dayOfWeek} onChange={(e) => setDayOfWeek(Number(e.target.value))}>
        {WEEKDAYS.map((w) => (
          <option key={w} value={w}>
            {dayName(w)}
          </option>
        ))}
      </select>
      <button type="submit" className="primary-button">
        Ekle
      </button>
    </form>
  )
}

function ExerciseEditor({
  day,
  onBack,
  onDeleted,
}: {
  day: ProgramDay
  onBack: () => void
  onDeleted: () => void
}) {
  const exercises = useSupabaseQuery(
    () => fetchProgramExercises(day.id),
    ['program_exercises'],
    [day.id]
  )

  const move = (id: number, direction: -1 | 1) => {
    if (!exercises) return
    const idx = exercises.findIndex((e) => e.id === id)
    const swapWith = idx + direction
    if (idx < 0 || swapWith < 0 || swapWith >= exercises.length) return
    const ids = exercises.map((e) => e.id)
    ;[ids[idx], ids[swapWith]] = [ids[swapWith], ids[idx]]
    reorderProgramExercises(ids)
  }

  return (
    <div className="screen program-editor">
      <header className="page-header">
        <button type="button" className="link-button" onClick={onBack}>
          ← Programım
        </button>
        <h1>{day.title}</h1>
      </header>

      <ul className="exercise-list exercise-list-editable">
        {exercises?.map((exercise, idx) => (
          <ExerciseRow
            key={exercise.id}
            exercise={exercise}
            canMoveUp={idx > 0}
            canMoveDown={exercises ? idx < exercises.length - 1 : false}
            onMove={(dir) => move(exercise.id, dir)}
          />
        ))}
      </ul>

      <NewExerciseForm dayId={day.id} />

      <button
        type="button"
        className="link-button danger"
        onClick={() => {
          if (confirm(`"${day.title}" gününü silmek istediğine emin misin?`)) {
            deleteProgramDay(day.id)
            onDeleted()
          }
        }}
      >
        Bu günü sil
      </button>
    </div>
  )
}

function ExerciseRow({
  exercise,
  canMoveUp,
  canMoveDown,
  onMove,
}: {
  exercise: ProgramExercise
  canMoveUp: boolean
  canMoveDown: boolean
  onMove: (direction: -1 | 1) => void
}) {
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(exercise.name)
  const [targetSets, setTargetSets] = useState(String(exercise.targetSets))
  const [targetReps, setTargetReps] = useState(exercise.targetReps)
  const [intensity, setIntensity] = useState(exercise.intensity)

  const save = async () => {
    await updateProgramExercise(exercise.id, {
      name: name.trim() || exercise.name,
      targetSets: Number(targetSets) || exercise.targetSets,
      targetReps: targetReps.trim() || exercise.targetReps,
      intensity: intensity.trim() || exercise.intensity,
    })
    setEditing(false)
  }

  if (editing) {
    return (
      <li className="exercise-edit-row">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="İsim" />
        <div className="exercise-edit-meta">
          <input
            value={targetSets}
            onChange={(e) => setTargetSets(e.target.value)}
            placeholder="Set"
            inputMode="numeric"
          />
          <input value={targetReps} onChange={(e) => setTargetReps(e.target.value)} placeholder="Tekrar" />
          <input value={intensity} onChange={(e) => setIntensity(e.target.value)} placeholder="Yoğunluk" />
        </div>
        <div className="exercise-edit-actions">
          <button type="button" className="secondary-button" onClick={save}>
            Kaydet
          </button>
          <button type="button" className="link-button" onClick={() => setEditing(false)}>
            Vazgeç
          </button>
        </div>
      </li>
    )
  }

  return (
    <li>
      <div>
        <div>{exercise.name}</div>
        <span className="exercise-meta">
          {exercise.targetSets}×{exercise.targetReps} · {exercise.intensity}
        </span>
      </div>
      <div className="exercise-row-actions">
        <button type="button" className="link-button" disabled={!canMoveUp} onClick={() => onMove(-1)}>
          ↑
        </button>
        <button type="button" className="link-button" disabled={!canMoveDown} onClick={() => onMove(1)}>
          ↓
        </button>
        <button type="button" className="link-button" onClick={() => setEditing(true)}>
          Düzenle
        </button>
        <button
          type="button"
          className="link-button danger"
          onClick={() => deleteProgramExercise(exercise.id)}
        >
          Sil
        </button>
      </div>
    </li>
  )
}

function NewExerciseForm({ dayId }: { dayId: number }) {
  const [name, setName] = useState('')
  const [targetSets, setTargetSets] = useState('3')
  const [targetReps, setTargetReps] = useState('8-10')
  const [intensity, setIntensity] = useState('RIR 1-2')

  const submit = async () => {
    const trimmed = name.trim()
    if (!trimmed) return
    await createProgramExercise(dayId, {
      name: trimmed,
      targetSets: Number(targetSets) || 1,
      targetReps: targetReps.trim() || '8-10',
      intensity: intensity.trim() || '',
    })
    setName('')
  }

  return (
    <form
      className="card new-exercise-form"
      onSubmit={(e) => {
        e.preventDefault()
        submit()
      }}
    >
      <h3>Egzersiz Ekle</h3>
      <input type="text" placeholder="Egzersiz adı" value={name} onChange={(e) => setName(e.target.value)} />
      <div className="exercise-edit-meta">
        <input
          value={targetSets}
          onChange={(e) => setTargetSets(e.target.value)}
          placeholder="Set"
          inputMode="numeric"
        />
        <input value={targetReps} onChange={(e) => setTargetReps(e.target.value)} placeholder="Tekrar" />
        <input value={intensity} onChange={(e) => setIntensity(e.target.value)} placeholder="Yoğunluk" />
      </div>
      <button type="submit" className="primary-button">
        Ekle
      </button>
    </form>
  )
}

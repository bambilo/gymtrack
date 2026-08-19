import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useCurrentUser } from '../context/CurrentUserContext'
import { dateKey, formatLongDate } from '../lib/date'
import { useProgramDays } from '../hooks/useProgramDays'
import { useSupabaseQuery } from '../hooks/useSupabaseQuery'
import { fetchWorkoutLogsForUser, fetchSetLogsByWorkoutLogIds } from '../db/queries'
import { PageHeader } from '../components/PageHeader'
import { BottomNav } from '../components/BottomNav'

const MONTH_NAMES = [
  'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
  'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık',
]
const WEEKDAY_LABELS = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz']

export function Calendar() {
  const { userId } = useCurrentUser()
  const [monthOffset, setMonthOffset] = useState(0)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)

  const viewDate = useMemo(() => {
    const d = new Date()
    d.setDate(1)
    d.setMonth(d.getMonth() + monthOffset)
    return d
  }, [monthOffset])

  const year = viewDate.getFullYear()
  const month = viewDate.getMonth()

  const workoutLogs = useSupabaseQuery(
    () => (userId ? fetchWorkoutLogsForUser(userId) : Promise.resolve([])),
    ['workout_logs'],
    [userId]
  )

  const workoutLogIds = useMemo(() => (workoutLogs ?? []).map((w) => w.id), [workoutLogs])

  const setLogs = useSupabaseQuery(
    () => fetchSetLogsByWorkoutLogIds(workoutLogIds),
    ['set_logs'],
    [workoutLogIds.join(',')]
  )

  const programDays = useProgramDays(userId)

  const titleById = useMemo(
    () => new Map((programDays ?? []).map((d) => [d.id, d.title])),
    [programDays]
  )

  const dayInfo = useMemo(() => {
    const loggedWorkoutLogIds = new Set((setLogs ?? []).map((s) => s.workoutLogId))
    const map = new Map<string, string>()
    for (const w of workoutLogs ?? []) {
      if (!loggedWorkoutLogIds.has(w.id)) continue
      map.set(w.date, titleById.get(w.programDayId) ?? '')
    }
    return map
  }, [workoutLogs, setLogs, titleById])

  const firstOfMonth = new Date(year, month, 1)
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const leadingBlanks = (firstOfMonth.getDay() + 6) % 7 // Monday-first

  const cells: (number | null)[] = [
    ...Array(leadingBlanks).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]

  const todayKey = dateKey(new Date())

  return (
    <div className="screen calendar">
      <PageHeader title="Takvim" backTo="/" />

      <div className="calendar-nav">
        <button className="secondary-button" onClick={() => setMonthOffset((m) => m - 1)}>‹</button>
        <span>{MONTH_NAMES[month]} {year}</span>
        <button className="secondary-button" onClick={() => setMonthOffset((m) => m + 1)}>›</button>
      </div>

      <div className="calendar-grid">
        {WEEKDAY_LABELS.map((w) => (
          <div key={w} className="calendar-weekday">{w}</div>
        ))}
        {cells.map((day, idx) => {
          if (day === null) return <div key={idx} className="calendar-cell empty" />
          const key = dateKey(new Date(year, month, day))
          const title = dayInfo.get(key)
          const hasWorkout = title !== undefined
          const isToday = key === todayKey
          const isSelected = key === selectedDate
          return (
            <button
              type="button"
              key={idx}
              className={`calendar-cell ${hasWorkout ? 'has-workout' : ''} ${isToday ? 'is-today' : ''} ${isSelected ? 'is-selected' : ''}`}
              onClick={() => setSelectedDate(key)}
            >
              <span className="calendar-day-num">{day}</span>
              {title && <span className="calendar-day-title">{title}</span>}
            </button>
          )
        })}
      </div>

      {selectedDate && (
        <div className="day-entry-picker">
          <div className="history-day-header">
            <button type="button" className="link-button" onClick={() => setSelectedDate(null)}>
              ✕ Kapat
            </button>
            <h2>{formatLongDate(selectedDate)}</h2>
          </div>
          <div className="program-day-grid">
            {programDays?.map((day) => (
              <Link
                key={day.id}
                to={`/log/${day.id}/${selectedDate}`}
                className="program-day-card"
                onClick={() => setSelectedDate(null)}
              >
                <span className="program-day-title">{day.title}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  )
}

import { useMemo, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  LabelList,
} from 'recharts'
import { db } from '../db/db'
import type { ProgramExercise } from '../db/types'
import { useCurrentUser } from '../context/CurrentUserContext'
import { useProgramDays } from '../hooks/useProgramDays'
import { PageHeader } from '../components/PageHeader'
import { BottomNav } from '../components/BottomNav'

export function History() {
  const { userId } = useCurrentUser()
  const [selectedDayId, setSelectedDayId] = useState<number | null>(null)
  const [selectedName, setSelectedName] = useState<string | null>(null)

  const programDays = useProgramDays(userId)

  const dayExercises = useLiveQuery(
    () =>
      selectedDayId
        ? db.programExercises.where('programDayId').equals(selectedDayId).sortBy('order')
        : Promise.resolve<ProgramExercise[]>([]),
    [selectedDayId]
  )

  const exerciseNames = useMemo(() => {
    if (!dayExercises) return []
    return Array.from(new Set(dayExercises.map((e) => e.name)))
  }, [dayExercises])

  const selectedExerciseIds = useMemo(() => {
    if (!dayExercises || !selectedName) return []
    return dayExercises.filter((e) => e.name === selectedName).map((e) => e.id)
  }, [dayExercises, selectedName])

  const chartData = useLiveQuery(async () => {
    if (selectedExerciseIds.length === 0) return []
    const setLogs = await db.setLogs.where('programExerciseId').anyOf(selectedExerciseIds).toArray()
    if (setLogs.length === 0) return []

    const workoutLogIds = Array.from(new Set(setLogs.map((s) => s.workoutLogId)))
    const workoutLogs = await db.workoutLogs.where('id').anyOf(workoutLogIds).toArray()
    const dateByLogId = new Map(workoutLogs.map((w) => [w.id, w.date]))

    const entries = setLogs
      .map((s) => {
        const date = dateByLogId.get(s.workoutLogId)
        return date ? { date, setNo: s.setNo, weight: s.weight, reps: s.reps } : null
      })
      .filter((e): e is { date: string; setNo: number; weight: number; reps: number } => e !== null)
      .sort((a, b) => a.date.localeCompare(b.date) || a.setNo - b.setNo)

    const countByDate = new Map<string, number>()
    for (const e of entries) countByDate.set(e.date, (countByDate.get(e.date) ?? 0) + 1)

    return entries.map((e) => ({
      label:
        (countByDate.get(e.date) ?? 0) > 1
          ? `${formatShortDate(e.date)} S${e.setNo}`
          : formatShortDate(e.date),
      weight: e.weight,
      reps: e.reps,
    }))
  }, [selectedExerciseIds])

  const yDomain = useMemo<[number, number]>(() => {
    if (!chartData || chartData.length === 0) return [0, 10]
    const weights = chartData.map((d) => d.weight)
    const min = Math.min(...weights)
    const max = Math.max(...weights)
    const padding = Math.max((max - min) * 0.2, 5)
    return [Math.max(0, Math.floor(min - padding)), Math.ceil(max + padding)]
  }, [chartData])

  const stats = useMemo(() => {
    if (!chartData || chartData.length === 0) return null
    const weights = chartData.map((d) => d.weight)
    const best = Math.max(...weights)
    const first = weights[0]
    const last = weights[weights.length - 1]
    const diff = last - first
    return { best, first, last, diff }
  }, [chartData])

  const selectedDay = programDays?.find((d) => d.id === selectedDayId)

  return (
    <div className="screen history">
      <PageHeader title="Geçmiş" backTo="/" />

      {!selectedDayId ? (
        <div className="program-day-grid">
          {programDays?.map((day) => (
            <button
              key={day.id}
              type="button"
              className="program-day-card"
              onClick={() => setSelectedDayId(day.id)}
            >
              <span className="program-day-title">{day.title}</span>
            </button>
          ))}
        </div>
      ) : (
        <>
          <div className="history-day-header">
            <button
              type="button"
              className="link-button"
              onClick={() => {
                setSelectedDayId(null)
                setSelectedName(null)
              }}
            >
              ← Programlar
            </button>
            <h2>{selectedDay?.title}</h2>
          </div>

          <div className="exercise-picker">
            {exerciseNames.map((name) => (
              <button
                key={name}
                className={`chip ${selectedName === name ? 'chip-active' : ''}`}
                onClick={() => setSelectedName(name)}
              >
                {name}
              </button>
            ))}
          </div>

          {selectedName && (
            <div className="card chart-card">
              <div className="chart-card-header">
                <h3>{selectedName}</h3>
                {stats && (
                  <span className={`trend-badge ${stats.diff >= 0 ? 'trend-up' : 'trend-down'}`}>
                    {stats.diff >= 0 ? '▲' : '▼'} {Math.abs(stats.diff).toFixed(1)} kg
                  </span>
                )}
              </div>

              {chartData && chartData.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={260}>
                    <AreaChart data={chartData} margin={{ top: 24, right: 24, left: 12, bottom: 0 }}>
                      <defs>
                        <linearGradient id="weightGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#4ade80" stopOpacity={0.45} />
                          <stop offset="100%" stopColor="#4ade80" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid stroke="#232838" strokeDasharray="4 4" vertical={false} />
                      <XAxis
                        dataKey="label"
                        tick={{ fontSize: 10, fill: '#9ca3af' }}
                        axisLine={{ stroke: '#232838' }}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fontSize: 11, fill: '#9ca3af' }}
                        axisLine={false}
                        tickLine={false}
                        width={40}
                        domain={yDomain}
                        allowDecimals={false}
                      />
                      <Tooltip content={<ChartTooltip />} />
                      <Area
                        type="monotone"
                        dataKey="weight"
                        stroke="#4ade80"
                        strokeWidth={2.5}
                        fill="url(#weightGradient)"
                        dot={{ r: 3, fill: '#4ade80', strokeWidth: 0 }}
                        activeDot={{ r: 5, fill: '#4ade80', stroke: '#0b0f19', strokeWidth: 2 }}
                      >
                        {chartData.length <= 6 && (
                          <LabelList
                            dataKey="reps"
                            position="top"
                            formatter={(value) => `${value} tekrar`}
                            style={{ fontSize: 10, fill: '#9ca3af' }}
                          />
                        )}
                      </Area>
                    </AreaChart>
                  </ResponsiveContainer>

                  {stats && (
                    <div className="chart-stats">
                      <div className="chart-stat">
                        <span className="muted">İlk</span>
                        <strong>{stats.first} kg</strong>
                      </div>
                      <div className="chart-stat">
                        <span className="muted">En İyi</span>
                        <strong>{stats.best} kg</strong>
                      </div>
                      <div className="chart-stat">
                        <span className="muted">Son</span>
                        <strong>{stats.last} kg</strong>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <p className="muted">Henüz veri yok.</p>
              )}
            </div>
          )}
        </>
      )}

      <BottomNav />
    </div>
  )
}

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload || payload.length === 0) return null
  return (
    <div className="chart-tooltip">
      <p className="chart-tooltip-date">{label}</p>
      <p className="chart-tooltip-value">{payload[0].value} kg × {payload[0].payload.reps} tekrar</p>
    </div>
  )
}

function formatShortDate(dateStr: string) {
  const [, month, day] = dateStr.split('-')
  return `${day}.${month}`
}

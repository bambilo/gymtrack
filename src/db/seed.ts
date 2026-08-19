import { db } from './db'
import type { ProgramExercise } from './types'

type ExerciseSeed = Omit<ProgramExercise, 'id' | 'programDayId'>
type DaySeed = { dayOfWeek: number; title: string; exercises: ExerciseSeed[] }

function ex(name: string, targetSets: number, targetReps: string, intensity: string, order: number): ExerciseSeed {
  return { name, targetSets, targetReps, intensity, order }
}

const ARDA_PROGRAM: DaySeed[] = [
  {
    dayOfWeek: 1,
    title: 'Göğüs, Omuz & Triceps',
    exercises: [
      ex('Plate Loaded Chest Press', 2, '5-6', 'RIR 1', 1),
      ex('Smith Machine Low Incline Press', 2, '5-6', 'RIR 1', 2),
      ex('Chest Fly Machine', 1, '6-8', 'Failure', 3),
      ex('Shoulder Press Machine', 2, '6-8', 'RIR 1', 4),
      ex('Lateral Raise', 3, '8-10', 'Failure', 5),
      ex('Triceps Pushdown', 2, '6-8', 'Failure', 6),
      ex('Overhead Rope Extension', 2, '8-10', 'Failure', 7),
    ],
  },
  {
    dayOfWeek: 2,
    title: 'Sırt & Biceps',
    exercises: [
      ex('Lat Pulldown', 2, '6-8', 'RIR 1 - Failure', 1),
      ex('Plate Loaded Wide Grip Row', 3, '6-8', 'RIR 1 - Failure', 2),
      ex('Cable Row', 1, '8-10', 'Failure', 3),
      ex('Incline Dumbell Curl', 2, '6-8', 'Failure', 4),
      ex('Cable Curl', 2, '6-8', 'Failure', 5),
      ex('Hammer Curl / Reverse Barbell Curl (Super Set)', 2, '8-10', 'Failure', 6),
    ],
  },
  {
    dayOfWeek: 3,
    title: 'Bacak',
    exercises: [
      ex('Leg Press', 2, '6-8', 'RIR 1-2', 1),
      ex('Smith Machine Squat', 2, '6-8', 'RIR 1-2', 2),
      ex('Leg Extansion', 2, '8-10', 'Failure', 3),
      ex('Seated Leg Curl', 3, '8-10', 'RIR 1', 4),
    ],
  },
  {
    dayOfWeek: 5,
    title: 'Omuz, Göğüs & Triceps',
    exercises: [
      ex('Shoulder Press Machine', 2, '6-8', 'RIR 1', 1),
      ex('Lateral Raise', 3, '8-10', 'Failure', 2),
      ex('Smith Machine Low Incline Press', 2, '5-6', 'RIR 1', 3),
      ex('Chest Fly Machine', 2, '6-8', 'Failure', 4),
      ex('Cable Rear Delt Fly', 2, '8-10', 'Failure', 5),
      ex('Triceps Pushdown', 2, '6-8', 'Failure', 6),
      ex('Overhead Rope Extension', 2, '8-10', 'Failure', 7),
    ],
  },
  {
    dayOfWeek: 6,
    title: 'Sırt, Bacak & Biceps',
    exercises: [
      ex('Plate Loaded Wide Grip Row', 3, '6-8', 'RIR 1 - Failure', 1),
      ex('Lat Pulldown', 2, '6-8', 'RIR 1 - Failure', 2),
      ex('Romanian Deadlift', 2, '5-6', 'RIR 1-2', 3),
      ex('Cable Curl', 2, '6-8', 'Failure', 4),
      ex('Hammer Curl / Reverse Barbell Curl (Super Set)', 2, '8-10', 'Failure', 5),
      ex('Leg Extansion', 2, '6-8', 'Failure', 6),
      ex('Seated Leg Curl', 1, '8-10', 'Failure', 7),
    ],
  },
]

const DILAY_PROGRAM: DaySeed[] = [
  {
    dayOfWeek: 1,
    title: 'Kalça & Ön Bacak',
    exercises: [
      ex('Hip Thrust', 3, '8-10', 'RIR 2', 1),
      ex('Bulgarian Split Squat', 3, '8-10', 'RIR 2', 2),
      ex('Seated Adductor', 2, '8-10', '1.Set RIR1 / 2.Set RIR0', 3),
      ex('Seated Abductor', 2, '8-10', '1.Set RIR1 / 2.Set RIR0', 4),
      ex('Leg Extension', 2, '8-10', '1.Set RIR1 / 2.Set RIR0', 5),
      ex('Leg Curl', 2, '8-10', 'RIR 2', 6),
    ],
  },
  {
    dayOfWeek: 2,
    title: 'Bacak, Sırt & Arka Kol',
    exercises: [
      ex('Horizontal Leg Press', 3, '8-10', 'RIR 2', 1),
      ex('Lat Pulldown', 3, '8-10', 'RIR 2', 2),
      ex('Seated Cable Row', 3, '8-10', 'RIR 2', 3),
      ex('Rope Triceps Pushdown', 2, '8-10', '1.Set RIR1 / 2.Set RIR0', 4),
      ex('Overhead Rope Triceps Extension', 2, '8-10', '1.Set RIR1 / 2.Set RIR0', 5),
    ],
  },
  {
    dayOfWeek: 4,
    title: 'Hamstring, Kalça & Sırt',
    exercises: [
      ex('45° Back Extension', 2, '8-10', 'RIR 1-2', 1),
      ex('Lat Pulldown', 2, '8-10', 'RIR 2', 2),
      ex('Seated Cable Row', 2, '8-10', 'RIR 2', 3),
      ex('Seated Adductor', 2, '8-10', '1.Set RIR1 / 2.Set RIR0', 4),
      ex('Seated Abductor', 2, '8-10', '1.Set RIR1 / 2.Set RIR0', 5),
      ex('Leg Curl', 3, '8-10', 'RIR 2', 6),
    ],
  },
  {
    dayOfWeek: 5,
    title: 'Alt Vücut & Arka Kol',
    exercises: [
      ex('Hip Thrust', 3, '8-10', 'RIR 2', 1),
      ex('Dumbbell Sumo Squat', 2, '8-10', 'RIR 1-2', 2),
      ex('Horizontal Leg Press', 3, '8-10', 'RIR 2', 3),
      ex('Overhead Rope Triceps Extension', 2, '8-10', '1.Set RIR1 / 2.Set RIR0', 4),
      ex('Leg Extension', 2, '8-10', '1.Set RIR1 / 2.Set RIR0', 5),
      ex('Seated Abductor', 2, '8-10', '1.Set RIR1 / 2.Set RIR0', 6),
    ],
  },
]

async function seedUserProgram(name: string, days: DaySeed[]) {
  const existing = await db.users.where('name').equals(name).first()
  const userId: number = existing?.id ?? (await db.users.add({ name }))

  const hasDays = await db.programDays.where('userId').equals(userId).count()
  if (hasDays > 0) return

  for (const [dayOrder, day] of days.entries()) {
    const programDayId = await db.programDays.add({
      userId,
      dayOfWeek: day.dayOfWeek,
      title: day.title,
      order: dayOrder,
    })
    await db.programExercises.bulkAdd(
      day.exercises.map((e) => ({ ...e, programDayId }))
    )
  }
}

export async function seedDatabase() {
  await seedUserProgram('Arda', ARDA_PROGRAM)
  await seedUserProgram('Dilay', DILAY_PROGRAM)
}

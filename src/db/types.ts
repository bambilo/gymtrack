export interface User {
  id: number
  name: string
}

// dayOfWeek: 1 = Pazartesi ... 7 = Pazar (ISO weekday)
export interface ProgramDay {
  id: number
  userId: number
  dayOfWeek: number
  title: string
  order: number
}

export interface ProgramExercise {
  id: number
  programDayId: number
  order: number
  name: string
  targetSets: number
  targetReps: string
  intensity: string
}

export interface WorkoutLog {
  id: number
  userId: number
  date: string // YYYY-MM-DD
  programDayId: number
}

export interface SetLog {
  id: number
  workoutLogId: number
  programExerciseId: number
  setNo: number
  weight: number
  reps: number
}

import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { CurrentUserProvider, useCurrentUser } from './context/CurrentUserContext'
import { ProfileSelect } from './pages/ProfileSelect'
import { Home } from './pages/Home'
import { WorkoutLog } from './pages/WorkoutLog'
import { History } from './pages/History'
import { Calendar } from './pages/Calendar'
import { Settings } from './pages/Settings'
import { ProgramEditor } from './pages/ProgramEditor'
import { PwaStatus } from './components/PwaStatus'

function Router() {
  const { userId } = useCurrentUser()

  if (!userId) {
    return <ProfileSelect />
  }

  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/log/:programDayId" element={<WorkoutLog />} />
      <Route path="/log/:programDayId/:date" element={<WorkoutLog />} />
      <Route path="/history" element={<History />} />
      <Route path="/calendar" element={<Calendar />} />
      <Route path="/settings" element={<Settings />} />
      <Route path="/settings/program" element={<ProgramEditor />} />
    </Routes>
  )
}

function App() {
  return (
    <CurrentUserProvider>
      <BrowserRouter>
        <PwaStatus />
        <Router />
      </BrowserRouter>
    </CurrentUserProvider>
  )
}

export default App

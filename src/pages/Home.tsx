import { Link } from 'react-router-dom'
import { useCurrentUser } from '../context/CurrentUserContext'
import { dayName, isoWeekday } from '../lib/date'
import { useCurrentUserRecord } from '../hooks/useCurrentUserRecord'
import { useProgramDays } from '../hooks/useProgramDays'
import { useTodaysLoggedDays } from '../hooks/useTodaysLoggedDays'
import { BottomNav } from '../components/BottomNav'

export function Home() {
  const { setUserId } = useCurrentUser()
  const { userId, user } = useCurrentUserRecord()
  const todayIso = isoWeekday(new Date())

  const programDays = useProgramDays(userId)
  const loggedProgramDayIds = useTodaysLoggedDays(userId)

  if (!userId || !user) return null

  return (
    <div className="screen home">
      <header className="home-header">
        <div>
          <p className="muted">Merhaba,</p>
          <h1>{user.name}</h1>
        </div>
        <button className="link-button" onClick={() => setUserId(null)}>
          Profil değiştir
        </button>
      </header>

      <p className="today-label">Bugün {dayName(todayIso)} · hangi programı çalışacaksın?</p>

      {programDays && programDays.length === 0 ? (
        <div className="card">
          <p className="muted">Henüz bir programın yok.</p>
          <Link to="/settings/program" className="primary-button">
            Programı Oluştur
          </Link>
        </div>
      ) : (
        <div className="program-day-grid">
          {programDays?.map((day) => (
            <Link key={day.id} to={`/log/${day.id}`} className="program-day-card">
              <span className="program-day-title">{day.title}</span>
              {loggedProgramDayIds.has(day.id) && (
                <span className="program-day-badge">Bugün yapıldı ✓</span>
              )}
            </Link>
          ))}
        </div>
      )}

      <BottomNav />
    </div>
  )
}

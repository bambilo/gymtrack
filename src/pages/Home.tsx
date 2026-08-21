import { Link } from 'react-router-dom'
import { useCurrentUser } from '../context/CurrentUserContext'
import { dayName, isoWeekday, relativeDayLabel } from '../lib/date'
import { useCurrentUserRecord } from '../hooks/useCurrentUserRecord'
import { useProgramDays } from '../hooks/useProgramDays'
import { useLastDoneDates } from '../hooks/useLastDoneDates'
import { BottomNav } from '../components/BottomNav'

export function Home() {
  const { setUserId } = useCurrentUser()
  const { userId, user } = useCurrentUserRecord()
  const todayIso = isoWeekday(new Date())

  const programDays = useProgramDays(userId)
  const lastDoneDates = useLastDoneDates(userId)

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
          {programDays?.map((day) => {
            const lastDate = lastDoneDates.get(day.id)
            return (
              <Link key={day.id} to={`/log/${day.id}`} className="program-day-card">
                <span className="program-day-title">{day.title}</span>
                {lastDate && (
                  <span className="program-day-badge">{relativeDayLabel(lastDate)}</span>
                )}
              </Link>
            )
          })}
        </div>
      )}

      <BottomNav />
    </div>
  )
}

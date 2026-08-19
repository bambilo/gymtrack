import { Link } from 'react-router-dom'

export function BottomNav() {
  return (
    <nav className="bottom-nav">
      <Link to="/">Bugün</Link>
      <Link to="/calendar">Takvim</Link>
      <Link to="/history">Geçmiş</Link>
      <Link to="/settings">Ayarlar</Link>
    </nav>
  )
}

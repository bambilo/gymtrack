import { NavLink } from 'react-router-dom'

const linkClass = ({ isActive }: { isActive: boolean }) => (isActive ? 'active' : '')

export function BottomNav() {
  return (
    <nav className="bottom-nav">
      <NavLink to="/" end className={linkClass}>Bugün</NavLink>
      <NavLink to="/calendar" className={linkClass}>Takvim</NavLink>
      <NavLink to="/history" className={linkClass}>Geçmiş</NavLink>
      <NavLink to="/settings" className={linkClass}>Ayarlar</NavLink>
    </nav>
  )
}

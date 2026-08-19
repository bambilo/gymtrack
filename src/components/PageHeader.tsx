import { Link } from 'react-router-dom'

interface PageHeaderProps {
  title: string
  backTo: string
  backLabel?: string
  subtitle?: string
}

export function PageHeader({ title, backTo, backLabel = '← Geri', subtitle }: PageHeaderProps) {
  return (
    <header className="page-header">
      <Link to={backTo} className="link-button">{backLabel}</Link>
      <h1>{title}</h1>
      {subtitle && <p className="muted">{subtitle}</p>}
    </header>
  )
}

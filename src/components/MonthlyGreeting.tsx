import { useState } from 'react'

const YEAR = new Date().getFullYear()
const MONTH = new Date().getMonth() // 0 = Ocak
const DAY = new Date().getDate()

const MONTH_NAMES_TR = [
  'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
  'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık',
]

const STORAGE_KEY = `monthlyGreetingDismissed:${YEAR}-${MONTH}`

export function MonthlyGreeting() {
  const [dismissed, setDismissed] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === '1'
    } catch {
      return false
    }
  })

  const withinWindow = DAY <= 3
  if (!withinWindow || dismissed) return null

  const close = () => {
    setDismissed(true)
    try {
      localStorage.setItem(STORAGE_KEY, '1')
    } catch {
      // ignore
    }
  }

  return (
    <div className="greeting-overlay" onClick={close}>
      <div className="greeting-card" onClick={(e) => e.stopPropagation()}>
        <button className="greeting-close" onClick={close} aria-label="Kapat">
          ✕
        </button>
        <p className="greeting-title">Yeni {MONTH_NAMES_TR[MONTH]}ımız kutlu olsun!</p>
        <p className="greeting-text">
          Bu ay hedeflerimize daha çok yaklaşma dileğiyle <span className="greeting-heart">🩷</span>
        </p>
        <button className="primary-button greeting-cta" onClick={close}>
          Hadi başlayalım
        </button>
      </div>
    </div>
  )
}

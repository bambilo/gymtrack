import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useCurrentUser } from '../context/CurrentUserContext'
import { useCurrentUserRecord } from '../hooks/useCurrentUserRecord'
import { updateUser, deleteUser } from '../db/queries'
import { exportBackup, importBackup } from '../db/backup'
import { PageHeader } from '../components/PageHeader'

export function Settings() {
  const { setUserId } = useCurrentUser()
  const { userId, user } = useCurrentUserRecord()
  const [name, setName] = useState('')
  const [importMessage, setImportMessage] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  if (!userId || !user) return null

  const saveName = async () => {
    const trimmed = name.trim()
    if (!trimmed) return
    await updateUser(userId, trimmed)
    setName('')
  }

  const removeProfile = async () => {
    if (!confirm(`"${user.name}" profilini silmek istediğine emin misin?`)) return
    await deleteUser(userId)
    setUserId(null)
  }

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    if (!confirm('Bu işlem mevcut tüm veriyi silip yedekle değiştirecek. Devam edilsin mi?')) return
    try {
      await importBackup(file)
      setUserId(null)
      setImportMessage('Yedek başarıyla içe aktarıldı.')
    } catch {
      setImportMessage('Yedek dosyası okunamadı. Dosyanın bozuk olmadığından emin ol.')
    }
  }

  return (
    <div className="screen settings">
      <PageHeader title="Ayarlar" backTo="/" />

      <div className="card">
        <h3>Program</h3>
        <p className="muted">Antrenman günlerini ve egzersizlerini düzenle.</p>
        <Link to="/settings/program" className="secondary-button">
          Programı Düzenle
        </Link>
      </div>

      <div className="card">
        <h3>Profil</h3>
        <p className="muted">Şu anki profil: {user.name}</p>
        <form
          className="rename-form"
          onSubmit={(e) => {
            e.preventDefault()
            saveName()
          }}
        >
          <input
            type="text"
            placeholder="Yeni isim"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <button type="submit" className="secondary-button">
            Yeniden Adlandır
          </button>
        </form>
        <button type="button" className="link-button danger" onClick={removeProfile}>
          Profili Sil
        </button>
      </div>

      <div className="card">
        <h3>Yedekleme</h3>
        <p className="muted">
          Tüm veriler ortak sunucuda saklanıyor ve herkes birbirinin verisini görebiliyor. Yine de
          düzenli olarak yedek almanı öneririz.
        </p>
        <button type="button" className="secondary-button" onClick={() => exportBackup()}>
          Yedeği Dışa Aktar
        </button>
        <button
          type="button"
          className="secondary-button"
          onClick={() => fileInputRef.current?.click()}
        >
          Yedekten İçe Aktar
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json"
          style={{ display: 'none' }}
          onChange={handleImportFile}
        />
        {importMessage && <p className="muted">{importMessage}</p>}
      </div>
    </div>
  )
}

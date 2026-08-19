import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCurrentUser } from '../context/CurrentUserContext'
import { createUser, fetchUsers } from '../db/queries'
import { useSupabaseQuery } from '../hooks/useSupabaseQuery'

export function ProfileSelect() {
  const users = useSupabaseQuery(fetchUsers, ['users'], [])
  const { setUserId } = useCurrentUser()
  const navigate = useNavigate()
  const [creating, setCreating] = useState(false)
  const [name, setName] = useState('')

  if (!users) return null

  const submitNewProfile = async () => {
    const trimmed = name.trim()
    if (!trimmed) return
    const id = await createUser(trimmed)
    setUserId(id)
    navigate('/settings/program')
  }

  return (
    <div className="screen profile-select">
      <h1>Kim antrenman yapıyor?</h1>
      <div className="profile-grid">
        {users.map((u) => (
          <button key={u.id} className="profile-card" onClick={() => setUserId(u.id!)}>
            {u.name}
          </button>
        ))}
        {!creating && (
          <button className="profile-card" onClick={() => setCreating(true)}>
            + Yeni Profil
          </button>
        )}
      </div>

      {creating && (
        <form
          className="new-profile-form"
          onSubmit={(e) => {
            e.preventDefault()
            submitNewProfile()
          }}
        >
          <input
            type="text"
            autoFocus
            placeholder="İsim"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <button type="submit" className="primary-button">
            Oluştur
          </button>
        </form>
      )}
    </div>
  )
}

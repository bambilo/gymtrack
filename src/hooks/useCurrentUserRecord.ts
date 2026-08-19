import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db'
import { useCurrentUser } from '../context/CurrentUserContext'

export function useCurrentUserRecord() {
  const { userId } = useCurrentUser()
  const user = useLiveQuery(() => (userId ? db.users.get(userId) : undefined), [userId])
  return { userId, user }
}

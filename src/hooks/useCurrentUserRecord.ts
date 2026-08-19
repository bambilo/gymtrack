import { useCurrentUser } from '../context/CurrentUserContext'
import { useSupabaseQuery } from './useSupabaseQuery'
import { fetchUser } from '../db/queries'

export function useCurrentUserRecord() {
  const { userId } = useCurrentUser()
  const user = useSupabaseQuery(
    () => (userId ? fetchUser(userId) : Promise.resolve(undefined)),
    ['users'],
    [userId]
  )
  return { userId, user }
}

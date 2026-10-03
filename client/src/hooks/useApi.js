import { useAuth } from '@clerk/clerk-react'
import { useMemo } from 'react'
import { createApi } from '../lib/api'

export function useApi() {
  const { getToken } = useAuth()
  return useMemo(() => createApi(getToken), [getToken])
}
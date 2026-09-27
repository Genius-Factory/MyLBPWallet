import axios from 'axios'

export function createApi(getToken) {
  const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || '', timeout: 15000 })
  api.interceptors.request.use(async config => {
    const token = await getToken()
    if (!token) throw new Error('Your session has expired. Please sign in again.')
    config.headers.Authorization = `Bearer ${token}`
    return config
  })
  return api
}

export function apiError(error, fallback = 'Something went wrong. Please retry.') {
  if (error.response?.status === 401) return 'Your session has expired. Please sign in again.'
  return error.response?.data?.error || error.message || fallback
}
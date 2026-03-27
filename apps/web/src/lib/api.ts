import axios from 'axios'
import { useAuthStore } from '@/stores/authStore'

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  withCredentials: true,
})

// Attach JWT to every request
apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Auto-refresh on 401
apiClient.interceptors.response.use(
  (res) => res,
  async (error) => {
    if (error.response?.status === 401 && !error.config._retry) {
      error.config._retry = true
      try {
        const { data } = await apiClient.post('/auth/refresh')
        useAuthStore.getState().setAuth(data.user, data.accessToken)
        error.config.headers.Authorization = `Bearer ${data.accessToken}`
        return apiClient(error.config)
      } catch {
        useAuthStore.getState().logout()
        window.location.href = '/auth'
      }
    }
    return Promise.reject(error)
  }
)

export default apiClient

import axios from 'axios'
import { useAuthStore } from '@/stores/authStore'
import router from '@/router'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
})

let manejar401EnProgreso = false

api.interceptors.request.use((config) => {
  const authStore = useAuthStore()
  if (authStore.token) {
    config.headers.Authorization = `Bearer ${authStore.token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const esLogout = error.config?.url?.includes('/auth/logout')
    if (error.response?.status === 401 && !esLogout && !manejar401EnProgreso) {
      manejar401EnProgreso = true
      const authStore = useAuthStore()
      authStore.logout()
      router.push('/login')
      setTimeout(() => (manejar401EnProgreso = false), 500)
    }
    return Promise.reject(error)
  },
)

export default api

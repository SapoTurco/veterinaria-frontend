import api from './axios'
import type { LoginRequest, LoginResponse, RegisterRequest, ChangePasswordRequest } from '@/types/auth'

export const authApi = {
  login(data: LoginRequest) {
    return api.post<LoginResponse>('/auth/login', data)
  },

  register(data: RegisterRequest) {
    return api.post('/auth/register', data)
  },

  cambiarPassword(data: ChangePasswordRequest) {
    return api.post('/auth/cambiar-password', data)
  },

  logout() {
    return api.post('/auth/logout')
  },
}

import api from './axios'
import type { CrearClienteRequest, ActualizarClienteRequest } from '@/types/cliente'

interface ClienteProfileData {
  primerNombre?: string
  segundoNombre?: string
  primerApellido?: string
  segundoApellido?: string
  telefono?: string
  correo?: string
  direccion?: string
}

export const clientesApi = {
  getAll(includeInactive = false) {
    return api.get('/clientes', { params: { includeInactive } })
  },

  getById(id: number) {
    return api.get(`/clientes/${id}`)
  },

  getProfile() {
    return api.get('/clientes/me')
  },

  updateProfile(data: ClienteProfileData) {
    return api.put('/clientes/me', data)
  },

  create(data: CrearClienteRequest) {
    return api.post('/clientes', data)
  },

  update(id: number, data: ActualizarClienteRequest) {
    return api.put(`/clientes/${id}`, data)
  },

  delete(id: number) {
    return api.delete(`/clientes/${id}`)
  },

  cambiarEstado(id: number, estado: boolean) {
    return api.patch(`/clientes/${id}/estado`, { estado })
  },

  crearUsuario(id: number, data: { email: string; password: string }) {
    return api.post(`/clientes/${id}/usuario`, data)
  },
}

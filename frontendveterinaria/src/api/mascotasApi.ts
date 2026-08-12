import api from './axios'
import type { CrearMascotaRequest } from '@/types/mascota'

export const mascotasApi = {
  getAll(includeInactive = false) {
    return api.get('/mascotas', { params: { includeInactive } })
  },

  getMisMascotas(params?: { page?: number; size?: number }) {
    return api.get('/mascotas/mis-mascotas', { params })
  },

  getById(id: number) {
    return api.get(`/mascotas/${id}`)
  },

  getByCliente(idCliente: number) {
    return api.get(`/mascotas/cliente/${idCliente}`)
  },

  create(data: CrearMascotaRequest) {
    return api.post('/mascotas', data)
  },

  update(id: number, data: Partial<CrearMascotaRequest>) {
    return api.put(`/mascotas/${id}`, data)
  },

  delete(id: number) {
    return api.delete(`/mascotas/${id}`)
  },

  reactivar(id: number) {
    return api.patch(`/mascotas/${id}/reactivar`)
  },
}

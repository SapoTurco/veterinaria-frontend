import api from './axios'
import type { CrearServicioRequest } from '@/types/servicio'

export const serviciosApi = {
  getAll(includeInactive = false, tipo?: string) {
    return api.get('/servicios', { params: { includeInactive, tipo } })
  },

  getById(id: number) {
    return api.get(`/servicios/${id}`)
  },

  create(data: CrearServicioRequest) {
    return api.post('/servicios', data)
  },

  update(id: number, data: Partial<CrearServicioRequest>) {
    return api.put(`/servicios/${id}`, data)
  },

  delete(id: number) {
    return api.delete(`/servicios/${id}`)
  },

  reactivar(id: number) {
    return api.patch(`/servicios/${id}/reactivar`)
  },
}

import api from './axios'
import type { CrearEmpleadoRequest } from '@/types/empleado'

export const empleadosApi = {
  getAll(includeInactive = false) {
    return api.get('/empleados', { params: { includeInactive } })
  },

  getById(id: number) {
    return api.get(`/empleados/${id}`)
  },

  create(data: CrearEmpleadoRequest) {
    return api.post('/empleados', data)
  },

  update(id: number, data: Partial<CrearEmpleadoRequest>) {
    return api.put(`/empleados/${id}`, data)
  },

  delete(id: number) {
    return api.delete(`/empleados/${id}`)
  },

  cambiarEstado(id: number, estado: boolean) {
    return api.patch(`/empleados/${id}/estado`, { estado })
  },
}

import api from './axios'
import type { CrearCitaRequest } from '@/types/cita'

export const citasApi = {
  getAll(includeInactive = false) {
    return api.get('/citas', { params: { includeInactive } })
  },

  getMisCitas(params?: { page?: number; size?: number }) {
    return api.get('/citas/mis-citas', { params })
  },

  getById(id: number) {
    return api.get(`/citas/${id}`)
  },

  getByCliente(idCliente: number) {
    return api.get(`/citas/cliente/${idCliente}`)
  },

  getByMascota(idMascota: number) {
    return api.get(`/citas/mascota/${idMascota}`)
  },

  getByEmpleado(idEmpleado: number) {
    return api.get(`/citas/empleado/${idEmpleado}`)
  },

  create(data: CrearCitaRequest) {
    return api.post('/citas', data)
  },

  update(id: number, data: Partial<CrearCitaRequest>) {
    return api.put(`/citas/${id}`, data)
  },

  confirmar(id: number, data: CrearCitaRequest) {
    return api.post(`/citas/${id}/confirmar`, data)
  },

  cambiarEstado(id: number, estado: string) {
    return api.patch(`/citas/${id}/estado`, { estadoCita: estado })
  },

  cancelar(id: number) {
    return api.post(`/citas/${id}/cancelar`)
  },

  getDisponibilidad(fecha: string) {
    return api.get(`/citas/disponibilidad/${fecha}`)
  },

  registrarConsulta(data: { idCita: number; peso?: number; temperatura?: number; sintomas: string; diagnosticoGeneral?: string; tratamientoIndicado?: string; observaciones?: string }) {
    return api.post('/citas/consulta', data)
  },

  registrarEstetica(data: { idCita: number; detalles?: string; observaciones?: string }) {
    return api.post('/citas/estetica', data)
  },
}

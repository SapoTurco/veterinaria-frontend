import api from './axios'
import type { CrearFacturaRequest } from '@/types/factura'

export const facturasApi = {
  getAll(includeInactive = false) {
    return api.get('/facturas', { params: { includeInactive } })
  },

  getMisFacturas(params?: { page?: number; size?: number }) {
    return api.get('/facturas/mis-facturas', { params })
  },

  getById(id: number) {
    return api.get(`/facturas/${id}`)
  },

  getByCliente(idCliente: number) {
    return api.get(`/facturas/cliente/${idCliente}`)
  },

  create(data: CrearFacturaRequest) {
    return api.post('/facturas', data)
  },

  cambiarEstado(id: number, estado: string) {
    return api.patch(`/facturas/${id}/estado`, { estadoFactura: estado })
  },
}

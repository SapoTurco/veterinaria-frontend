import api from './axios'
import type { CrearPagoRequest } from '@/types/pago'

export const pagosApi = {
  getAll(includeInactive = false) {
    return api.get('/pagos', { params: { includeInactive } })
  },

  getByFactura(idFactura: number) {
    return api.get(`/pagos/factura/${idFactura}`)
  },

  create(data: CrearPagoRequest) {
    return api.post('/pagos', data)
  },
}

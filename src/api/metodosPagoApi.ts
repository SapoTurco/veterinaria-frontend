import api from './axios'

export interface MetodoPago {
  idMetodoPago: number
  nombre: string
  descripcion: string | null
  estado: boolean
}

export const metodosPagoApi = {
  getAll() {
    return api.get<MetodoPago[]>('/metodos-pago')
  },
}

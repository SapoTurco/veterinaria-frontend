import api from './axios'

export interface Historial {
  idHistorial: number
  idMascota: number
  nombreMascota: string
  idCita: number
  tipoHistorial: 'MEDICO' | 'ESTETICA'
  resumen: string
  fechaRegistro: string
  createdAt: string | null
  updatedAt: string | null
}

export const historialApi = {
  getByMascota(idMascota: number) {
    return api.get<Historial[]>(`/historial/mascota/${idMascota}`)
  },
}

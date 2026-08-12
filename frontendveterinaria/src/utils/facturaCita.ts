import { citasApi } from '@/api/citasApi'
import { facturasApi } from '@/api/facturasApi'
import type { Factura } from '@/types/factura'

const FACTURA_KEY = (idCita: number) => `cita_factura_${idCita}`

export async function vincularFacturaDeCita(idCita: number): Promise<Factura | null> {
  try {
    const citaRes = await citasApi.getById(idCita)
    const cita = citaRes.data
    const facRes = await facturasApi.getByCliente(cita.idCliente)
    const lista = facRes.data || []
    const pendienteMatching = lista.find(
      (f: any) =>
        f.estadoFactura === 'PENDIENTE' &&
        (f.items || []).some((i: any) => i.idServicio === cita.idServicio)
    ) || lista.find((f: any) => f.estadoFactura === 'PENDIENTE')
    if (pendienteMatching) {
      localStorage.setItem(FACTURA_KEY(idCita), String(pendienteMatching.idFactura))
      return pendienteMatching
    }
    return null
  } catch {
    return null
  }
}

export function getFacturaIdDeCita(idCita: number): number | null {
  const raw = localStorage.getItem(FACTURA_KEY(idCita))
  const parsed = Number(raw)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null
}

export function guardarFacturaIdDeCita(idCita: number, idFactura: number) {
  localStorage.setItem(FACTURA_KEY(idCita), String(idFactura))
}

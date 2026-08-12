<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { citasApi } from '@/api/citasApi'
import { serviciosApi } from '@/api/serviciosApi'
import { empleadosApi } from '@/api/empleadosApi'
import { historialApi } from '@/api/historialApi'
import { facturasApi } from '@/api/facturasApi'
import { pagosApi } from '@/api/pagosApi'
import { metodosPagoApi, type MetodoPago } from '@/api/metodosPagoApi'
import { useAuthStore } from '@/stores/authStore'
import type { Cita } from '@/types/cita'
import type { Servicio } from '@/types/servicio'
import type { Empleado } from '@/types/empleado'
import type { Factura } from '@/types/factura'
import { mapaNumerosCitasPorCliente } from '@/types/cita'
import { getFacturaIdDeCita, guardarFacturaIdDeCita, vincularFacturaDeCita } from '@/utils/facturaCita'
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const id = Number(route.params.id)

const canConfirmar = authStore.hasAnyRole('ADMIN', 'RECEPCIONISTA')
const esProfesional = authStore.esProfesional

const cita = ref<Cita | null>(null)
const loading = ref(true)
const error = ref('')
const success = ref('')
const numeroCita = ref<number | null>(null)
const totalCitasCliente = ref<number | null>(null)

const initials = computed(() => {
  if (!cita.value) return '?'
  return cita.value.nombreMascota?.[0]?.toUpperCase() || '?'
})

// 3-dot menu actions
const showAssignModal = ref(false)
const showCancelDialog = ref(false)

// Assign modal data
const servicios = ref<Servicio[]>([])
const empleados = ref<Empleado[]>([])
const formServicio = ref<number | null>(null)
const formFecha = ref('')
const formHora = ref('')
const submitting = ref(false)

// Historia clínica / estética (modal de detalle)
const historialCita = ref<{ tipoHistorial: string; resumen: string; fechaRegistro: string } | null>(null)
const showHistorialModal = ref(false)

// Factura y pago
const facturaCita = ref<Factura | null>(null)
const showPagoModal = ref(false)
const metodosPago = ref<MetodoPago[]>([])
const metodoPagoSeleccionado = ref<number | null>(null)
const pagando = ref(false)
const pagoError = ref('')

const empladosFiltrados = computed(() => {
  const activos = empleados.value.filter((e: any) => e.estado === true)
  if (!formServicio.value) return activos
  const servicio = servicios.value.find(s => s.idServicio === formServicio.value)
  if (!servicio) return activos
  return activos.filter(e =>
    (servicio.tipoServicio === 'CONSULTA' && e.nombreCargo === 'VETERINARIO') ||
    (servicio.tipoServicio === 'ESTETICA' && e.nombreCargo === 'ESTILISTA')
  )
})

const puedeAtender = computed(() => {
  if (!cita.value) return false
  if (authStore.hasAnyRole('ADMIN')) return cita.value.estadoCita === 'CONFIRMADA'
  if (esProfesional) {
    return cita.value.estadoCita === 'CONFIRMADA' && authStore.idEmpleadoActual === cita.value.idEmpleado
  }
  return false
})

const citaAtendida = computed(() => !!cita.value && cita.value.estadoCita === 'ATENDIDA')
const puedeVerHistorial = computed(() => !!citaAtendida.value && !!historialCita.value)
const puedePagar = computed(() => {
  if (!citaAtendida.value) return false
  if (!facturaCita.value) return false
  return facturaCita.value.estadoFactura === 'PENDIENTE'
})

onMounted(async () => {
  if (authStore.esProfesional) {
    await authStore.cargarEmpleadoActual()
  }
  try {
    const res = await citasApi.getById(id)
    cita.value = res.data
    await cargarNumeroCita(res.data)
    if (canConfirmar) {
      const [serviciosRes, empleadosRes] = await Promise.allSettled([
        serviciosApi.getAll(),
        empleadosApi.getAll()
      ])
      if (serviciosRes.status === 'fulfilled') servicios.value = serviciosRes.value.data
      if (empleadosRes.status === 'fulfilled') empleados.value = empleadosRes.value.data
    }
    await cargarHistorialYFactura()
  } catch (e: any) {
    error.value = e.response?.data?.message || 'No se pudo cargar la cita'
  } finally {
    loading.value = false
  }
})

async function cargarNumeroCita(c: Cita) {
  if (!c.idCliente) return
  try {
    const res = await citasApi.getByCliente(c.idCliente)
    const citas = res.data || []
    const mapa = mapaNumerosCitasPorCliente(citas)
    numeroCita.value = mapa[c.idCita] ?? null
    totalCitasCliente.value = citas.length
  } catch {
    numeroCita.value = null
    totalCitasCliente.value = null
  }
}

async function cargarHistorialYFactura() {
  if (!cita.value) return
  const c = cita.value
  if (c.estadoCita !== 'ATENDIDA') return

  try {
    const histRes = await historialApi.getByMascota(c.idMascota)
    const registro = (histRes.data || []).find(h => h.idCita === c.idCita)
    if (registro) {
      historialCita.value = {
        tipoHistorial: registro.tipoHistorial,
        resumen: registro.resumen,
        fechaRegistro: registro.fechaRegistro,
      }
    }
  } catch {
    // sin historial
  }

  let idFactura = getFacturaIdDeCita(c.idCita)
  if (!idFactura) {
    const vinc = await vincularFacturaDeCita(c.idCita)
    if (vinc) {
      idFactura = vinc.idFactura
      guardarFacturaIdDeCita(c.idCita, vinc.idFactura)
    }
  }
  if (idFactura) {
    try {
      const fac = await facturasApi.getById(idFactura)
      facturaCita.value = fac.data
    } catch {
      facturaCita.value = null
    }
  }
}

async function abrirPago() {
  if (!facturaCita.value) return
  pagoError.value = ''
  metodoPagoSeleccionado.value = null
  try {
    const res = await metodosPagoApi.getAll()
    metodosPago.value = (res.data || []).filter(m => m.estado)
    showPagoModal.value = true
  } catch {
    pagoError.value = 'No se pudieron cargar los métodos de pago'
  }
}

async function ejecutarPago() {
  if (!facturaCita.value || !metodoPagoSeleccionado.value) return
  pagando.value = true
  pagoError.value = ''
  try {
    await pagosApi.create({
      idFactura: facturaCita.value.idFactura,
      idMetodoPago: metodoPagoSeleccionado.value,
      monto: facturaCita.value.total,
    })
    const fac = await facturasApi.getById(facturaCita.value.idFactura)
    facturaCita.value = fac.data
    showPagoModal.value = false
    success.value = 'Pago registrado correctamente'
    setTimeout(() => success.value = '', 4000)
  } catch (e: any) {
    pagoError.value = e.response?.data?.message || 'No se pudo registrar el pago'
  } finally {
    pagando.value = false
  }
}

function estadoColor(estado: string) {
  const colors: Record<string, string> = {
    PENDIENTE: 'badge-warning',
    CONFIRMADA: 'badge-info',
    ATENDIDA: 'badge-success',
    CANCELADA: 'badge-error',
  }
  return colors[estado] || 'badge-ghost'
}

function formatFecha(fecha: string | null) {
  if (!fecha) return '—'
  const parts = fecha.split('-')
  const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]))
  return d.toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' })
}

function formatHora(hora: string) {
  if (!hora) return ''
  const parts = hora.split(':')
  const h = Number(parts[0])
  const m = Number(parts[1])
  const ampm = h >= 12 ? 'PM' : 'AM'
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${ampm}`
}

function formatCurrency(valor: number) {
  return valor?.toLocaleString('es-CO') || '0'
}

function formatFechaHora(iso: string | null | undefined) {
  if (!iso) return '—'
  const d = new Date(iso)
  if (isNaN(d.getTime())) return '—'
  return d.toLocaleString('es-CO', { dateStyle: 'long', timeStyle: 'short' })
}

function nombreMetodoPago(id: number | null): string {
  const m = metodosPago.value.find(x => x.idMetodoPago === id)
  return m?.nombre || 'Método de pago'
}

// Open assign modal
function openAssignModal() {
  if (!cita.value) return
  formServicio.value = cita.value.idServicio
  formFecha.value = cita.value.fechaCita || ''
  formHora.value = cita.value.horaCita?.substring(0, 5) || ''
  showAssignModal.value = true
}

async function handleAssign() {
  if (!formServicio.value || !formFecha.value || !formHora.value || !cita.value) return
  submitting.value = true
  try {
    await citasApi.confirmar(id, {
      idMascota: cita.value.idMascota,
      idServicio: formServicio.value,
      fechaCita: formFecha.value,
      horaCita: formHora.value,
      motivo: cita.value?.motivo || '',
      observaciones: cita.value?.observaciones || ''
    })
    const res = await citasApi.getById(id)
    cita.value = res.data
    showAssignModal.value = false
    success.value = 'Cita confirmada correctamente'
    setTimeout(() => success.value = '', 3000)
  } catch (e: any) {
    error.value = e.response?.data?.message || 'No se pudo confirmar la cita'
    showAssignModal.value = false
  } finally {
    submitting.value = false
  }
}

async function handleCancel() {
  try {
    await citasApi.cambiarEstado(id, 'CANCELADA')
    const res = await citasApi.getById(id)
    cita.value = res.data
    showCancelDialog.value = false
    success.value = 'Cita cancelada'
    setTimeout(() => success.value = '', 3000)
  } catch (e: any) {
    error.value = e.response?.data?.message || 'No se pudo cancelar'
    showCancelDialog.value = false
  }
}

async function handleConfirmar() {
  try {
    await citasApi.cambiarEstado(id, 'CONFIRMADA')
    const res = await citasApi.getById(id)
    cita.value = res.data
    success.value = 'Cita confirmada correctamente'
    setTimeout(() => success.value = '', 3000)
  } catch (e: any) {
    error.value = e.response?.data?.message || 'No se pudo confirmar'
  }
}
</script>

<template>
  <div class="max-w-5xl mx-auto">
    <div v-if="error" class="alert alert-error mb-4">
      <span>{{ error }}</span>
      <button class="btn btn-ghost btn-xs" @click="error = ''">X</button>
    </div>

    <div v-if="success" class="alert mb-4 bg-[#7a9e7e]/15 border border-[#7a9e7e]/30 text-[#7a9e7e]">
      <span>{{ success }}</span>
    </div>

    <div v-if="loading" class="flex justify-center py-20">
      <span class="loading loading-spinner loading-lg text-primary"></span>
    </div>

    <template v-else-if="cita">
      <!-- Header -->
      <div class="flex items-center gap-4 mb-6">
        <button class="btn btn-ghost btn-sm btn-circle" @click="router.back()">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div class="flex-1">
          <h1 class="text-2xl font-extrabold text-[#FFFFE3]">
            Cita #{{ numeroCita ?? cita.idCita }}
            <span v-if="totalCitasCliente !== null" class="text-sm font-medium text-base-content/40">de {{ totalCitasCliente }}</span>
          </h1>
          <p class="text-sm text-base-content/50">Detalle de la cita</p>
        </div>
        <div class="flex items-center gap-2">
          <button
            v-if="canConfirmar && cita.estadoCita === 'PENDIENTE'"
            class="btn btn-success btn-sm gap-1"
            @click="handleConfirmar"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
            Confirmar
          </button>
          <button
            v-if="puedeAtender"
            class="btn btn-success btn-sm gap-1"
            @click="router.push(`/citas/${cita.idCita}/${cita.tipoServicio === 'ESTETICA' ? 'estetica' : 'consulta'}`)"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Atender
          </button>
          <button
            v-if="puedeVerHistorial"
            class="btn btn-primary btn-sm gap-1"
            @click="showHistorialModal = true"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Ver {{ cita.tipoServicio === 'ESTETICA' ? 'estética' : 'consulta' }}
          </button>
          <span class="badge badge-lg" :class="estadoColor(cita.estadoCita)">{{ cita.estadoCita }}</span>
          <div v-if="canConfirmar && (cita.estadoCita === 'PENDIENTE' || cita.estadoCita === 'CONFIRMADA')" class="dropdown dropdown-end">
            <div tabindex="0" role="button" class="btn btn-ghost btn-circle btn-sm">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 5v.01M12 12v.01M12 19v.01" />
              </svg>
            </div>
            <ul tabindex="0" class="dropdown-content menu p-2 shadow-lg bg-[#2A2A2A] border border-white/10 rounded-xl w-52 z-50">
              <li>
                <a @click="router.push(`/citas/${cita.idCita}/editar`)" class="text-[#CBCBCB] hover:bg-white/10 hover:text-[#FFFFE3]">
                  Editar
                </a>
              </li>
              <li>
                <a @click="showCancelDialog = true" class="text-red-400 hover:bg-red-500/20">Cancelar</a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <!-- Info Card -->
      <div class="bg-base-100 rounded-2xl border border-base-300 overflow-hidden mb-6">
        <div class="bg-gradient-to-r from-[#0D7377]/20 to-transparent px-6 py-5 flex items-center gap-5">
          <div class="w-16 h-16 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center shadow-lg">
            <span class="text-primary font-bold text-xl">{{ initials }}</span>
          </div>
          <div class="flex-1">
            <h2 class="text-lg font-bold text-[#FFFFE3]">{{ cita.nombreMascota }}</h2>
            <p class="text-sm text-base-content/50">{{ cita.nombreServicio }} · {{ cita.tipoServicio }}</p>
          </div>
        </div>
        <div class="px-6 py-5 grid grid-cols-2 md:grid-cols-3 gap-5">
          <div>
            <p class="text-xs text-base-content/40 uppercase tracking-wider mb-1">Fecha</p>
            <p class="text-sm font-medium">{{ formatFecha(cita.fechaCita) }}</p>
          </div>
          <div>
            <p class="text-xs text-base-content/40 uppercase tracking-wider mb-1">Hora</p>
            <p class="text-sm font-medium">{{ formatHora(cita.horaCita) }}</p>
          </div>
          <div>
            <p class="text-xs text-base-content/40 uppercase tracking-wider mb-1">Duración</p>
            <p class="text-sm font-medium">{{ cita.duracionMinutos }} min</p>
          </div>
          <div>
            <p class="text-xs text-base-content/40 uppercase tracking-wider mb-1">Mascota</p>
            <p
              class="text-sm font-medium text-primary cursor-pointer hover:underline"
              @click="router.push(`/mascotas/${cita.idMascota}`)"
            >
              {{ cita.nombreMascota }}
            </p>
          </div>
          <div>
            <p class="text-xs text-base-content/40 uppercase tracking-wider mb-1">Cliente</p>
            <p
              class="text-sm font-medium text-primary cursor-pointer hover:underline"
              @click="router.push(`/clientes/${cita.idCliente}`)"
            >
              {{ cita.nombreCliente }}
            </p>
          </div>
          <div>
            <p class="text-xs text-base-content/40 uppercase tracking-wider mb-1">Profesional</p>
            <p class="text-sm font-medium">{{ cita.nombreEmpleado || 'Sin asignar' }}</p>
          </div>
          <div>
            <p class="text-xs text-base-content/40 uppercase tracking-wider mb-1">Servicio</p>
            <p class="text-sm font-medium">{{ cita.nombreServicio }}</p>
          </div>
          <div>
            <p class="text-xs text-base-content/40 uppercase tracking-wider mb-1">Tipo</p>
            <p class="text-sm font-medium">{{ cita.tipoServicio }}</p>
          </div>
          <div>
            <p class="text-xs text-base-content/40 uppercase tracking-wider mb-1">Estado</p>
            <span class="badge badge-sm" :class="estadoColor(cita.estadoCita)">{{ cita.estadoCita }}</span>
          </div>
        </div>
      </div>

      <!-- Detalles adicionales -->
      <div v-if="cita.motivo || cita.observaciones" class="bg-base-100 rounded-2xl border border-base-300 overflow-hidden">
        <div class="px-6 py-4 border-b border-base-300">
          <h3 class="font-bold text-[#FFFFE3]">Detalles</h3>
        </div>
        <div class="px-6 py-5 space-y-4">
          <div v-if="cita.motivo">
            <p class="text-xs text-base-content/40 uppercase tracking-wider mb-1">Motivo</p>
            <p class="text-sm">{{ cita.motivo }}</p>
          </div>
          <div v-if="cita.observaciones">
            <p class="text-xs text-base-content/40 uppercase tracking-wider mb-1">Observaciones</p>
            <p class="text-sm">{{ cita.observaciones }}</p>
          </div>
        </div>
      </div>

      <!-- Assign Modal -->
      <dialog :class="{ 'modal modal-open': showAssignModal }" v-if="showAssignModal">
        <div class="modal-box bg-[#1a1a2e] border border-white/10">
          <h3 class="font-bold text-lg text-[#FFFFE3] mb-4">
            {{ cita.estadoCita === 'PENDIENTE' ? 'Asignar Cita' : 'Reasignar Cita' }}
          </h3>
          <div class="space-y-4">
            <div class="form-control">
              <label class="label"><span class="label-text">Servicio</span></label>
              <select v-model="formServicio" class="select select-bordered bg-[#2A2A2A] border-white/10">
                <option :value="null" disabled>Seleccionar servicio</option>
                <option v-for="s in servicios.filter((s: any) => s.estado === true)" :key="s.idServicio" :value="s.idServicio">
                  {{ s.nombre }} - {{ s.tipoServicio }}
                </option>
              </select>
            </div>
            <div class="form-control">
              <label class="label"><span class="label-text">Fecha</span></label>
              <input type="date" v-model="formFecha" class="input input-bordered bg-[#2A2A2A] border-white/10" />
            </div>
            <div class="form-control">
              <label class="label"><span class="label-text">Hora</span></label>
              <input type="time" v-model="formHora" class="input input-bordered bg-[#2A2A2A] border-white/10" />
            </div>
            <div class="form-control">
              <label class="label"><span class="label-text">Profesional</span></label>
              <div class="text-sm text-base-content/70">
                {{ cita.nombreEmpleado || 'Sin asignar' }}
              </div>
            </div>
          </div>
          <div class="modal-action">
            <button class="btn btn-ghost" @click="showAssignModal = false">Cancelar</button>
            <button
              class="btn btn-primary"
              :disabled="!formServicio || !formFecha || !formHora || submitting"
              @click="handleAssign"
            >
              {{ submitting ? 'Confirmando...' : 'Confirmar' }}
            </button>
          </div>
        </div>
        <form method="dialog" class="modal-backdrop" @click="showAssignModal = false">
          <button>close</button>
        </form>
      </dialog>

      <ConfirmDialog
        :show="showCancelDialog"
        title="Cancelar Cita"
        message="¿Estás seguro de cancelar esta cita? Esta acción no se puede deshacer."
        confirmText="Cancelar cita"
        variant="error"
        @confirm="handleCancel"
        @cancel="showCancelDialog = false"
      />

      <!-- Historial / Detalle de la atención -->
      <dialog :class="{ 'modal modal-open': showHistorialModal }" v-if="showHistorialModal && historialCita">
        <div class="modal-box bg-[#1a1a2e] border border-white/10">
          <h3 class="font-bold text-lg text-[#FFFFE3] mb-4 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            {{ historialCita.tipoHistorial === 'MEDICO' ? 'Consulta Médica' : 'Servicio Estético' }} - Cita #{{ numeroCita ?? cita.idCita }}
          </h3>
          <div class="space-y-4">
            <div class="bg-base-200/50 rounded-lg p-3 text-sm">
              <p><span class="font-medium text-base-content/60">Mascota:</span> <span class="text-[#FFFFE3]">{{ cita.nombreMascota }}</span></p>
              <p><span class="font-medium text-base-content/60">Cliente:</span> <span class="text-[#FFFFE3]">{{ cita.nombreCliente }}</span></p>
              <p><span class="font-medium text-base-content/60">Profesional:</span> <span class="text-[#FFFFE3]">{{ cita.nombreEmpleado || 'Sin asignar' }}</span></p>
              <p><span class="font-medium text-base-content/60">Registrado:</span> <span class="text-[#FFFFE3]">{{ formatFechaHora(historialCita.fechaRegistro) }}</span></p>
            </div>
            <div>
              <p class="text-xs text-base-content/40 uppercase tracking-wider mb-1">Descripción completa</p>
              <div class="bg-base-200/50 rounded-lg p-4 text-sm whitespace-pre-wrap">{{ historialCita.resumen }}</div>
            </div>
          </div>
          <div class="modal-action">
            <button class="btn btn-ghost" @click="showHistorialModal = false">Cerrar</button>
          </div>
        </div>
        <form method="dialog" class="modal-backdrop" @click="showHistorialModal = false">
          <button>close</button>
        </form>
      </dialog>

      <!-- Pago de factura -->
      <dialog :class="{ 'modal modal-open': showPagoModal }" v-if="showPagoModal && facturaCita">
        <div class="modal-box bg-[#1a1a2e] border border-white/10">
          <h3 class="font-bold text-lg text-[#FFFFE3] mb-2 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-warning" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h2m4 0h2m-9-5l2-4m9 4l-2-4M5 5h14a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2z" />
            </svg>
            Pagar factura #{{ facturaCita.idFactura }}
          </h3>
          <p class="text-sm text-base-content/60 mb-4">La cita ya fue atendida. Selecciona el método de pago.</p>

          <div v-if="pagoError" class="alert alert-error mb-4">
            <span>{{ pagoError }}</span>
          </div>

          <div class="bg-base-200/50 rounded-lg p-3 mb-4 flex items-center justify-between">
            <span class="text-sm text-base-content/60">Total a pagar</span>
            <span class="text-xl font-extrabold text-warning">${{ formatCurrency(facturaCita.total) }}</span>
          </div>

          <div class="form-control">
            <label class="label"><span class="label-text">Método de pago *</span></label>
            <div class="grid grid-cols-1 gap-2">
              <label
                v-for="m in metodosPago"
                :key="m.idMetodoPago"
                class="card bg-[#2A2A2A] border cursor-pointer transition-colors px-4 py-3 flex items-center gap-3"
                :class="metodoPagoSeleccionado === m.idMetodoPago ? 'border-primary shadow-lg shadow-primary/10' : 'border-white/10 hover:border-white/25'"
                @click="metodoPagoSeleccionado = m.idMetodoPago"
              >
                <input
                  type="radio"
                  name="metodoPagoCaja"
                  class="radio radio-sm radio-primary"
                  :value="m.idMetodoPago"
                  v-model="metodoPagoSeleccionado"
                />
                <span class="text-sm font-medium text-[#FFFFE3]">{{ m.descripcion || m.nombre }}</span>
              </label>
            </div>
          </div>

          <div class="modal-action">
            <button class="btn btn-ghost" :disabled="pagando" @click="showPagoModal = false">Cancelar</button>
            <button
              class="btn btn-success gap-1"
              :disabled="pagando || !metodoPagoSeleccionado"
              @click="ejecutarPago"
            >
              <span v-if="pagando" class="loading loading-spinner loading-sm"></span>
              <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
              Pagar
            </button>
          </div>
        </div>
        <form method="dialog" class="modal-backdrop" @click="showPagoModal = false">
          <button>close</button>
        </form>
      </dialog>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'
import { citasApi } from '@/api/citasApi'
import { empleadosApi } from '@/api/empleadosApi'
import { serviciosApi } from '@/api/serviciosApi'
import type { Cita } from '@/types/cita'
import { getDuracionServicio, formatHora, getHorarioLaboral } from '@/types/cita'
import DataTable from '@/components/common/DataTable.vue'
import PaginationBar from '@/components/common/PaginationBar.vue'
import SearchFilter from '@/components/common/SearchFilter.vue'
import SearchSelect from '@/components/common/SearchSelect.vue'
import CalendarDayPicker from '@/components/common/CalendarDayPicker.vue'
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'

const router = useRouter()
const authStore = useAuthStore()

const allData = ref<Cita[]>([])
const loading = ref(true)
const error = ref('')
const page = ref(0)
const size = ref(10)
const search = ref('')
const filtroEstado = ref('')
const showCancelDialog = ref(false)
const selectedCita = ref<Cita | null>(null)

const empleados = ref<any[]>([])
const servicios = ref<any[]>([])

const showConfirmDialog = ref(false)
const citaAConfirmar = ref<Cita | null>(null)
const confirmForm = ref({
  idServicio: 0,
  idEmpleado: 0,
  fechaCita: '',
  horaCita: '',
  motivo: '',
  observaciones: '',
})
const confirmLoading = ref(false)
const confirmError = ref('')
const citasDelDia = ref<Cita[]>([])

const esEmpleado = computed(() => authStore.hasAnyRole('VETERINARIO', 'ESTILISTA'))
const puedeVerEmpleados = computed(() => authStore.hasAnyRole('ADMIN', 'RECEPCIONISTA', 'VETERINARIO', 'ESTILISTA'))

const columns = computed(() => [
  { key: 'fechaCita', label: 'Fecha', sortable: true },
  { key: 'horaCita', label: 'Hora' },
  { key: 'nombreMascota', label: 'Mascota' },
  { key: 'nombreEmpleado', label: 'Profesional' },
  { key: 'nombreServicio', label: 'Servicio' },
  { key: 'estadoCita', label: 'Estado', sortable: true },
])

const estados = ['', 'PENDIENTE', 'CONFIRMADA', 'ATENDIDA', 'CANCELADA']

const filteredData = computed(() => {
  let result = allData.value
  if (filtroEstado.value) {
    result = result.filter(c => c.estadoCita === filtroEstado.value)
  }
  if (search.value) {
    const q = search.value.toLowerCase()
    result = result.filter(c =>
      c.nombreMascota?.toLowerCase().includes(q) ||
      c.nombreEmpleado?.toLowerCase().includes(q) ||
      c.nombreServicio?.toLowerCase().includes(q)
    )
  }
  const orden: Record<string, number> = { PENDIENTE: 0, CONFIRMADA: 1, ATENDIDA: 2, CANCELADA: 3 }
  return [...result].sort((a, b) => {
    const estadoDiff = (orden[a.estadoCita] ?? 4) - (orden[b.estadoCita] ?? 4)
    if (estadoDiff !== 0) return estadoDiff
    const dateDiff = b.fechaCita.localeCompare(a.fechaCita) || b.horaCita.localeCompare(a.horaCita)
    if (dateDiff !== 0) return dateDiff
    return b.idCita - a.idCita
  })
})

const totalPages = computed(() => Math.max(1, Math.ceil(filteredData.value.length / size.value)))
const totalElements = computed(() => filteredData.value.length)
const data = computed(() => {
  const start = page.value * size.value
  return filteredData.value.slice(start, start + size.value)
})

const servicioSeleccionado = computed(() =>
  servicios.value.find((s: any) => s.idServicio === confirmForm.value.idServicio)
)

const duracionServicio = computed(() => {
  if (!servicioSeleccionado.value) return 60
  return getDuracionServicio(servicioSeleccionado.value.tipoServicio)
})

const empleadosFiltrados = computed(() => {
  const activos = empleados.value.filter((e: any) => e.estado === true)
  if (!servicioSeleccionado.value) {
    return activos.filter((e: any) => {
      const roles = e.roles || []
      return roles.some((r: string) => r === 'VETERINARIO' || r === 'ESTILISTA')
    })
  }
  const tipoServicio = servicioSeleccionado.value.tipoServicio
  const rolRequerido = tipoServicio === 'ESTETICA' ? 'ESTILISTA' : 'VETERINARIO'
  return activos.filter((e: any) => {
    const roles = e.roles || []
    return roles.some((r: string) => r === rolRequerido)
  })
})

const empleadoOptions = computed(() =>
  empleadosFiltrados.value.map((e: any) => ({
    value: e.idEmpleado,
    label: `${e.primerNombre} ${e.primerApellido}`,
    sublabel: e.nombreCargo,
  }))
)

const servicioOptions = computed(() =>
  servicios.value.filter((s: any) => s.estado === true).map((s: any) => ({
    value: s.idServicio,
    label: s.nombre,
    sublabel: `$${s.precio?.toLocaleString()} - ${s.tipoServicio}`,
  }))
)

const horarioLaboral = computed(() => {
  if (!confirmForm.value.fechaCita) return { inicio: 7, fin: 18 }
  const fecha = new Date(confirmForm.value.fechaCita + 'T00:00:00')
  return getHorarioLaboral(fecha)
})

const horasDisponibles = computed(() => {
  const { inicio, fin } = horarioLaboral.value
  const horas: string[] = []

  const esHoy = confirmForm.value.fechaCita === minDate.value
  const ahora = new Date()
  const minutosAhora = esHoy ? ahora.getHours() * 60 + ahora.getMinutes() : -1

  for (let h = inicio; h < fin; h++) {
    for (let m = 0; m < 60; m += 30) {
      const slotInicio = h * 60 + m
      const horaFin = slotInicio + duracionServicio.value
      if (horaFin > fin * 60) break

      if (esHoy && slotInicio <= minutosAhora) continue

      const horaStr = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
      const ocupada = citasDelDia.value.some(c => {
        if (c.estadoCita === 'CANCELADA' || c.estadoCita === 'ATENDIDA') return false
        if (confirmForm.value.idEmpleado && c.idEmpleado !== confirmForm.value.idEmpleado) return false
        const parts = c.horaCita.split(':')
        const cH = parseInt(parts[0] || '0')
        const cM = parseInt(parts[1] || '0')
        const cInicio = cH * 60 + cM
        const cFin = cInicio + getDuracionServicio(c.tipoServicio)
        return slotInicio < cFin && horaFin > cInicio
      })

      if (!ocupada) {
        horas.push(horaStr)
      }
    }
  }

  return horas
})

const minDate = computed(() => {
  const hoy = new Date()
  const year = hoy.getFullYear()
  const month = String(hoy.getMonth() + 1).padStart(2, '0')
  const day = String(hoy.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
})

async function loadData() {
  loading.value = true
  error.value = ''
  try {
    if (authStore.esProfesional) {
      await authStore.cargarEmpleadoActual()
      if (authStore.idEmpleadoActual) {
        const response = await citasApi.getByEmpleado(authStore.idEmpleadoActual)
        allData.value = response.data
      } else {
        allData.value = []
      }
    } else {
      const response = await citasApi.getAll()
      allData.value = response.data
    }
  } catch (e: any) {
    error.value = e.response?.data?.message || 'No se pudieron cargar las citas'
  } finally {
    loading.value = false
  }
}

async function loadEmpleadosYServicios() {
  try {
    const calls: Promise<any>[] = [serviciosApi.getAll()]
    if (puedeVerEmpleados.value) {
      calls.unshift(empleadosApi.getAll())
    }
    const results = await Promise.allSettled(calls)
    let idx = 0
    if (puedeVerEmpleados.value) {
      const empResult = results[idx++] as PromiseSettledResult<any>
      if (empResult.status === 'fulfilled') {
        empleados.value = empResult.value.data
      }
    }
    const serResult = results[idx] as PromiseSettledResult<any>
    if (serResult.status === 'fulfilled') {
      servicios.value = serResult.value.data
    }
  } catch {
  }
}

function abrirConfirmar(cita: Cita) {
  citaAConfirmar.value = cita
  confirmForm.value = {
    idServicio: cita.idServicio,
    idEmpleado: cita.idEmpleado || 0,
    fechaCita: cita.fechaCita,
    horaCita: cita.horaCita,
    motivo: cita.motivo || '',
    observaciones: cita.observaciones || '',
  }
  confirmError.value = ''
  showConfirmDialog.value = true
  loadCitasDelDiaConfirm(cita.fechaCita)
}

async function loadCitasDelDiaConfirm(fecha: string) {
  if (!fecha) {
    citasDelDia.value = []
    return
  }
  try {
    const res = await citasApi.getDisponibilidad(fecha)
    citasDelDia.value = res.data
  } catch {
    citasDelDia.value = []
  }
}

watch(() => confirmForm.value.fechaCita, (nuevaFecha) => {
  confirmForm.value.horaCita = ''
  if (nuevaFecha) loadCitasDelDiaConfirm(nuevaFecha)
})

watch(() => confirmForm.value.idServicio, () => {
  confirmForm.value.horaCita = ''
})

watch(() => confirmForm.value.idEmpleado, () => {
  confirmForm.value.horaCita = ''
})

async function ejecutarConfirmar() {
  if (!citaAConfirmar.value) return
  if (!confirmForm.value.idEmpleado || !confirmForm.value.idServicio || !confirmForm.value.fechaCita || !confirmForm.value.horaCita) {
    confirmError.value = 'Completa todos los campos obligatorios'
    return
  }

  confirmLoading.value = true
  confirmError.value = ''

  try {
    await citasApi.confirmar(citaAConfirmar.value.idCita, {
      idMascota: citaAConfirmar.value.idMascota,
      idEmpleado: confirmForm.value.idEmpleado,
      idServicio: confirmForm.value.idServicio,
      fechaCita: confirmForm.value.fechaCita,
      horaCita: confirmForm.value.horaCita,
      motivo: confirmForm.value.motivo,
      observaciones: confirmForm.value.observaciones,
    })
    showConfirmDialog.value = false
    citaAConfirmar.value = null
    loadData()
  } catch (e: any) {
    confirmError.value = e.response?.data?.message || 'Error al confirmar la cita'
  } finally {
    confirmLoading.value = false
  }
}

function cerrarConfirmar() {
  showConfirmDialog.value = false
  citaAConfirmar.value = null
  confirmError.value = ''
}

async function cambiarEstado(cita: Cita, nuevoEstado: string) {
  try {
    if (nuevoEstado === 'CANCELADA') {
      selectedCita.value = cita
      showCancelDialog.value = true
      return
    }
    if (nuevoEstado === 'ATENDIDA') {
      if (cita.tipoServicio === 'CONSULTA') {
        router.push(`/citas/${cita.idCita}/consulta`)
      } else if (cita.tipoServicio === 'ESTETICA') {
        router.push(`/citas/${cita.idCita}/estetica`)
      } else {
        await citasApi.cambiarEstado(cita.idCita, nuevoEstado)
        loadData()
      }
      return
    }
    await citasApi.cambiarEstado(cita.idCita, nuevoEstado)
    loadData()
  } catch (e) {
    console.error('Error changing estado', e)
  }
}

async function confirmCancel() {
  if (!selectedCita.value) return
  try {
    await citasApi.cancelar(selectedCita.value.idCita)
    showCancelDialog.value = false
    loadData()
  } catch (e) {
    console.error('Error canceling cita', e)
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

function handlePageChange(newPage: number) {
  page.value = newPage
}

function formatFechaCita(fecha: string): string {
  const parts = fecha.split('-')
  const y = Number(parts[0])
  const m = Number(parts[1])
  const d = Number(parts[2])
  return new Date(y, m - 1, d).toLocaleDateString('es-CO')
}

function handleSearch() {
  page.value = 0
}

onMounted(() => {
  loadData()
  loadEmpleadosYServicios()
})
</script>

<template>
  <div>
    <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
      <h1 class="text-2xl sm:text-3xl font-extrabold text-[#FFFFE3]">Citas</h1>
      <button v-if="!esEmpleado" class="btn btn-primary" @click="router.push('/citas/nueva')">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
        Nueva Cita
      </button>
    </div>

    <div v-if="error" class="alert alert-error mb-4">
      <span>{{ error }}</span>
    </div>

    <div class="card bg-base-100 shadow-md">
      <div class="card-body">
        <div class="flex items-center gap-4 mb-4">
          <div class="flex-1">
            <SearchFilter v-model="search" @search="handleSearch" placeholder="Buscar por mascota, profesional..." />
          </div>
          <select v-model="filtroEstado" class="select select-bordered" @change="handleSearch">
            <option value="">Todos los estados</option>
            <option v-for="e in estados.slice(1)" :key="e" :value="e">{{ e }}</option>
          </select>
        </div>

        <DataTable :columns="columns" :data="data" :loading="loading" emptyMessage="No se encontraron citas">
          <template #cell-fechaCita="{ value }">
            {{ formatFechaCita(value) }}
          </template>
          <template #cell-horaCita="{ value }">
            {{ formatHora(value) }}
          </template>
          <template #cell-nombreEmpleado="{ value }">
            {{ value || 'Sin Asignar' }}
          </template>
          <template #cell-estadoCita="{ value }">
            <span class="badge" :class="estadoColor(value)">{{ value }}</span>
          </template>
          <template #actions="{ item }">
            <button
              class="btn btn-ghost btn-xs text-info"
              @click="router.push(`/citas/${item.idCita}`)"
            >
              Ver
            </button>
          </template>
        </DataTable>

        <PaginationBar
          :page="page"
          :totalPages="totalPages"
          :totalElements="totalElements"
          :size="size"
          @update:page="handlePageChange"
        />
      </div>
    </div>

    <ConfirmDialog
      :show="showCancelDialog"
      title="Cancelar cita"
      message="¿Estás seguro de cancelar esta cita?"
      confirmText="Cancelar cita"
      variant="error"
      @confirm="confirmCancel"
      @cancel="showCancelDialog = false"
    />

    <dialog :class="{ 'modal modal-open': showConfirmDialog }" v-if="showConfirmDialog">
      <div class="modal-box max-w-2xl bg-base-100">
        <h3 class="font-bold text-lg mb-4">
          {{ citaAConfirmar?.estadoCita === 'PENDIENTE' ? 'Asignar cita' : 'Reasignar cita' }}
        </h3>

        <div v-if="citaAConfirmar" class="space-y-4">
          <div class="bg-base-200/50 rounded-lg p-3 text-sm">
            <p><span class="font-medium">Mascota:</span> {{ citaAConfirmar.nombreMascota }}</p>
            <p><span class="font-medium">Cliente:</span> {{ citaAConfirmar.nombreCliente }}</p>
            <p v-if="citaAConfirmar.motivo"><span class="font-medium">Motivo:</span> {{ citaAConfirmar.motivo }}</p>
          </div>

          <div v-if="confirmError" class="alert alert-error">
            <span>{{ confirmError }}</span>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div class="form-control">
              <label class="label py-0"><span class="label-text font-medium text-sm">Servicio *</span></label>
              <SearchSelect
                v-model="confirmForm.idServicio"
                :options="servicioOptions"
                placeholder="Buscar servicio..."
                :required="true"
              />
            </div>
            <div class="form-control">
              <label class="label py-0">
                <span class="label-text font-medium text-sm">
                  {{ servicioSeleccionado?.tipoServicio === 'ESTETICA' ? 'Estilista' : 'Veterinario' }} *
                </span>
              </label>
              <SearchSelect
                v-model="confirmForm.idEmpleado"
                :options="empleadoOptions"
                :placeholder="`Buscar ${servicioSeleccionado?.tipoServicio === 'ESTETICA' ? 'estilista' : 'veterinario'}...`"
                :required="true"
              />
            </div>
          </div>

          <div v-if="servicioSeleccionado" class="bg-base-200/50 rounded-lg p-3 text-sm">
            <div class="flex items-center justify-between">
              <span class="text-base-content/60">{{ servicioSeleccionado.nombre }}</span>
              <span class="font-bold text-primary">${{ servicioSeleccionado.precio?.toLocaleString() }}</span>
            </div>
            <div class="text-xs text-base-content/50 mt-1">
              Duración: {{ duracionServicio }} minutos
            </div>
          </div>

          <div class="form-control">
            <label class="label py-0"><span class="label-text font-medium text-sm">Fecha *</span></label>
            <div class="rounded-xl p-4 bg-base-50">
              <CalendarDayPicker
                v-model="confirmForm.fechaCita"
                :min-date="minDate"
              />
            </div>
          </div>

          <div class="form-control">
            <label class="label py-0">
              <span class="label-text font-medium text-sm">
                Hora * <span class="font-normal text-base-content/50">(horario: {{ horarioLaboral.inicio }}:00 - {{ horarioLaboral.fin }}:00)</span>
              </span>
            </label>
            <select
              v-model="confirmForm.horaCita"
              class="select select-bordered select-sm w-full"
              :disabled="!confirmForm.fechaCita || horasDisponibles.length === 0"
              required
            >
              <option value="" disabled>
                {{ !confirmForm.fechaCita ? 'Selecciona una fecha primero' : horasDisponibles.length === 0 ? 'No hay horas disponibles' : 'Seleccionar hora' }}
              </option>
              <option v-for="hora in horasDisponibles" :key="hora" :value="hora">
                {{ formatHora(hora) }}
              </option>
            </select>
          </div>

          <div class="form-control">
            <label class="label py-0"><span class="label-text font-medium text-sm">Observaciones</span></label>
            <textarea v-model="confirmForm.observaciones" class="textarea textarea-bordered textarea-sm w-full" rows="2" placeholder="Notas adicionales..."></textarea>
          </div>
        </div>

        <div class="modal-action">
          <button class="btn btn-ghost" @click="cerrarConfirmar">Cancelar</button>
          <button
            class="btn btn-primary"
            :disabled="confirmLoading || !confirmForm.idEmpleado || !confirmForm.idServicio || !confirmForm.fechaCita || !confirmForm.horaCita"
            @click="ejecutarConfirmar"
          >
            <span v-if="confirmLoading" class="loading loading-spinner loading-sm"></span>
            {{ citaAConfirmar?.estadoCita === 'PENDIENTE' ? 'Confirmar y asignar' : 'Reconfirmar' }}
          </button>
        </div>
      </div>
      <form method="dialog" class="modal-backdrop" @click="cerrarConfirmar">
        <button>close</button>
      </form>
    </dialog>
  </div>
</template>

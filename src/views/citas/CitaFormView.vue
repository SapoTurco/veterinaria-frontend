<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'
import { citasApi } from '@/api/citasApi'
import { mascotasApi } from '@/api/mascotasApi'
import { empleadosApi } from '@/api/empleadosApi'
import { serviciosApi } from '@/api/serviciosApi'
import SearchSelect from '@/components/common/SearchSelect.vue'
import CalendarDayPicker from '@/components/common/CalendarDayPicker.vue'
import { getDuracionServicio, formatHora, getHorarioLaboral } from '@/types/cita'
import type { Cita } from '@/types/cita'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const isEdit = !!route.params.id
const puedeVerEmpleados = computed(() => authStore.hasAnyRole('ADMIN', 'RECEPCIONISTA', 'VETERINARIO', 'ESTILISTA'))

const form = ref({
  fechaCita: '',
  horaCita: '',
  motivo: '',
  observaciones: '',
  idMascota: 0,
  idEmpleado: 0,
  idServicio: 0,
})

const mascotas = ref<any[]>([])
const empleados = ref<any[]>([])
const servicios = ref<any[]>([])
const loading = ref(false)
const error = ref('')
const citasDelDia = ref<Cita[]>([])
const inicializando = ref(false)
const submitted = ref(false)

const formValid = computed(() =>
  form.value.idMascota !== 0 &&
  form.value.idServicio !== 0 &&
  form.value.idEmpleado !== 0 &&
  form.value.fechaCita !== '' &&
  form.value.horaCita !== '' &&
  form.value.motivo.trim() !== ''
)

const mascotaOptions = computed(() =>
  mascotas.value.filter(m => m.estado === true).map(m => ({
    value: m.idMascota,
    label: m.nombre,
    sublabel: m.nombreCliente,
  }))
)

const servicioOptions = computed(() =>
  servicios.value.filter(s => s.estado === true).map(s => ({
    value: s.idServicio,
    label: s.nombre,
    sublabel: `$${s.precio.toLocaleString()} - ${s.tipoServicio}`,
  }))
)

const servicioSeleccionado = computed(() =>
  servicios.value.find(s => s.idServicio === form.value.idServicio)
)

const duracionServicio = computed(() => {
  if (!servicioSeleccionado.value) return 60
  return getDuracionServicio(servicioSeleccionado.value.tipoServicio)
})

const tipoServicioLabel = computed(() => {
  if (!servicioSeleccionado.value) return ''
  const labels: Record<string, string> = {
    CONSULTA: 'Consulta',
    ESTETICA: 'Estética',
    OTRO: 'Otro',
  }
  return labels[servicioSeleccionado.value.tipoServicio] || ''
})

const empleadosFiltrados = computed(() => {
  const activos = empleados.value.filter(e => e.estado === true)
  if (!servicioSeleccionado.value) {
    return activos.filter(e => {
      const roles = e.roles || []
      return roles.some((r: string) => r === 'VETERINARIO' || r === 'ESTILISTA')
    })
  }

  const tipoServicio = servicioSeleccionado.value.tipoServicio
  const rolRequerido = tipoServicio === 'ESTETICA' ? 'ESTILISTA' : 'VETERINARIO'

  return activos.filter(e => {
    const roles = e.roles || []
    return roles.some((r: string) => r === rolRequerido)
  })
})

const empleadoOptions = computed(() =>
  empleadosFiltrados.value.map(e => ({
    value: e.idEmpleado,
    label: `${e.primerNombre} ${e.primerApellido}`,
    sublabel: e.nombreCargo,
  }))
)

const horarioLaboral = computed(() => {
  if (!form.value.fechaCita) return { inicio: 7, fin: 18 }
  const fecha = new Date(form.value.fechaCita + 'T00:00:00')
  return getHorarioLaboral(fecha)
})

const horasDisponibles = computed(() => {
  const { inicio, fin } = horarioLaboral.value
  const horas: string[] = []

  const esHoy = form.value.fechaCita === minDate.value
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
        if (isEdit && c.idCita === Number(route.params.id)) return false
        if (form.value.idEmpleado && c.idEmpleado !== form.value.idEmpleado) return false
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

const horaFinEstimada = computed(() => {
  if (!form.value.horaCita) return ''
  const parts = form.value.horaCita.split(':')
  const h = parseInt(parts[0] || '0')
  const m = parseInt(parts[1] || '0')
  const totalMin = h * 60 + m + duracionServicio.value
  const finH = Math.floor(totalMin / 60)
  const finM = totalMin % 60
  return formatHora(`${String(finH).padStart(2, '0')}:${String(finM).padStart(2, '0')}`)
})

function normalizarHora(hora: string): string {
  if (!hora) return hora
  const parts = hora.split(':')
  if (parts.length >= 2) return `${parts[0]}:${parts[1]}`
  return hora
}

const minDate = computed(() => {
  const hoy = new Date()
  const year = hoy.getFullYear()
  const month = String(hoy.getMonth() + 1).padStart(2, '0')
  const day = String(hoy.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
})

async function loadCitasDelDia() {
  if (!form.value.fechaCita) {
    citasDelDia.value = []
    return
  }
  try {
    const res = await citasApi.getDisponibilidad(form.value.fechaCita)
    citasDelDia.value = res.data
  } catch {
    citasDelDia.value = []
  }
}

watch(() => form.value.fechaCita, () => {
  if (inicializando.value) return
  form.value.horaCita = ''
  loadCitasDelDia()
})

watch(() => form.value.idServicio, () => {
  if (inicializando.value) return
  form.value.horaCita = ''
})

onMounted(async () => {
  try {
    const calls: Promise<any>[] = [mascotasApi.getAll(), serviciosApi.getAll()]
    if (puedeVerEmpleados.value) {
      calls.push(empleadosApi.getAll())
    }
    const results = await Promise.allSettled(calls)
    let idx = 0
    const mascotaResult = results[idx++] as PromiseSettledResult<any>
    if (mascotaResult.status === 'fulfilled') mascotas.value = mascotaResult.value.data
    const servicioResult = results[idx++] as PromiseSettledResult<any>
    if (servicioResult.status === 'fulfilled') servicios.value = servicioResult.value.data
    if (puedeVerEmpleados.value) {
      const empResult = results[idx] as PromiseSettledResult<any> | undefined
      if (empResult?.status === 'fulfilled') {
        empleados.value = empResult.value.data
      }
    }

    if (isEdit) {
      const citaRes = await citasApi.getById(Number(route.params.id))
      const cita = citaRes.data
      inicializando.value = true
      form.value = {
        fechaCita: cita.fechaCita,
        horaCita: normalizarHora(cita.horaCita),
        motivo: cita.motivo,
        observaciones: cita.observaciones || '',
        idMascota: cita.idMascota || 0,
        idEmpleado: cita.idEmpleado || 0,
        idServicio: cita.idServicio || 0,
      }
      await loadCitasDelDia()
      form.value.horaCita = normalizarHora(cita.horaCita)
      inicializando.value = false
    }
  } catch (e) {
    console.error('Error loading form data', e)
  }
})

async function handleSubmit() {
  submitted.value = true

  if (!formValid.value) {
    return
  }

  loading.value = true
  error.value = ''

  try {
    if (isEdit) {
      await citasApi.confirmar(Number(route.params.id), form.value)
    } else {
      await citasApi.create(form.value)
    }
    router.push('/citas')
  } catch (e: any) {
    error.value = e.response?.data?.message || 'Error al guardar la cita'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="max-w-2xl mx-auto">
    <div class="flex items-center gap-3 mb-6">
      <button class="btn btn-ghost btn-sm btn-circle" @click="router.back()">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" /></svg>
      </button>
      <div>
        <h1 class="text-2xl sm:text-3xl font-extrabold text-[#FFFFE3]">{{ isEdit ? 'Editar Cita' : 'Nueva Cita' }}</h1>
        <p class="text-sm text-base-content/60">{{ isEdit ? 'Actualiza los datos de la cita' : 'Agenda una nueva cita para una mascota' }}</p>
      </div>
    </div>

    <div v-if="error" class="alert alert-error mb-4">
      <span>{{ error }}</span>
    </div>

    <form @submit.prevent="handleSubmit" class="space-y-3">
      <!-- Mascota -->
      <div class="bg-base-100 rounded-xl p-5 space-y-3">
        <h4 class="text-sm font-semibold text-base-content/70 uppercase tracking-wide flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" /></svg>
          Mascota
        </h4>
        <div class="form-control">
          <label class="label py-0"><span class="label-text font-medium text-sm">Mascota *</span></label>
          <SearchSelect
            v-model="form.idMascota"
            :options="mascotaOptions"
            placeholder="Buscar mascota por nombre o dueño..."
            :required="true"
          />
          <label v-if="submitted && !form.idMascota" class="label py-0">
            <span class="label-text-alt text-error text-xs">Debes seleccionar una mascota</span>
          </label>
        </div>
      </div>

      <!-- Empleado y Servicio -->
      <div class="bg-base-100 rounded-xl p-5 space-y-3">
        <h4 class="text-sm font-semibold text-base-content/70 uppercase tracking-wide flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
          Profesional y servicio
        </h4>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div class="form-control">
            <label class="label py-0"><span class="label-text font-medium text-sm">Servicio *</span></label>
            <SearchSelect
              v-model="form.idServicio"
              :options="servicioOptions"
              placeholder="Buscar servicio..."
              :required="true"
            />
            <label v-if="submitted && !form.idServicio" class="label py-0">
              <span class="label-text-alt text-error text-xs">Debes seleccionar un servicio</span>
            </label>
          </div>
          <div class="form-control">
            <label class="label py-0">
              <span class="label-text font-medium text-sm">
                {{ servicioSeleccionado?.tipoServicio === 'ESTETICA' ? 'Estilista' : 'Veterinario' }} *
              </span>
            </label>
            <SearchSelect
              v-model="form.idEmpleado"
              :options="empleadoOptions"
              :placeholder="`Buscar ${servicioSeleccionado?.tipoServicio === 'ESTETICA' ? 'estilista' : 'veterinario'}...`"
              :required="true"
            />
            <label v-if="submitted && !form.idEmpleado" class="label py-0">
              <span class="label-text-alt text-error text-xs">Debes seleccionar un profesional</span>
            </label>
          </div>
        </div>
        <div v-if="servicioSeleccionado" class="bg-base-200/50 rounded-lg p-3">
          <div class="flex items-center justify-between text-sm">
            <span class="text-base-content/60">{{ servicioSeleccionado.nombre }} ({{ tipoServicioLabel }})</span>
            <span class="font-bold text-primary">${{ servicioSeleccionado.precio?.toLocaleString() }}</span>
          </div>
          <div class="text-xs text-base-content/50 mt-1">
            Duración: {{ duracionServicio }} minutos
          </div>
        </div>
      </div>

      <!-- Fecha y Hora -->
      <div class="bg-base-100 rounded-xl p-5 space-y-3">
        <h4 class="text-sm font-semibold text-base-content/70 uppercase tracking-wide flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
          Fecha y hora
        </h4>

        <!-- Calendario -->
        <div class="form-control">
          <label class="label py-0"><span class="label-text font-medium text-sm">Fecha *</span></label>
          <div class="rounded-xl p-4 bg-base-50">
            <CalendarDayPicker
              v-model="form.fechaCita"
              :id-empleado="form.idEmpleado || undefined"
              :min-date="minDate"
            />
          </div>
          <label v-if="submitted && !form.fechaCita" class="label py-0">
            <span class="label-text-alt text-error text-xs">Debes seleccionar una fecha</span>
          </label>
        </div>

        <!-- Hora -->
        <div class="form-control">
          <label class="label py-0">
            <span class="label-text font-medium text-sm">
              Hora * <span class="font-normal text-base-content/50">(horario: {{ horarioLaboral.inicio }}:00 - {{ horarioLaboral.fin }}:00)</span>
            </span>
          </label>
          <select
            v-model="form.horaCita"
            class="select select-bordered select-sm w-full"
            :disabled="!form.fechaCita || horasDisponibles.length === 0"
          >
            <option value="" disabled>
              {{ !form.fechaCita ? 'Selecciona una fecha primero' : horasDisponibles.length === 0 ? 'No hay horas disponibles' : 'Seleccionar hora' }}
            </option>
            <option v-for="hora in horasDisponibles" :key="hora" :value="hora">
              {{ formatHora(hora) }}
            </option>
          </select>
          <label v-if="submitted && !form.horaCita" class="label py-0">
            <span class="label-text-alt text-error text-xs">Debes seleccionar una hora</span>
          </label>
        </div>

        <p v-if="form.horaCita && servicioSeleccionado" class="text-xs text-base-content/50">
          La cita finalizará aproximadamente a las {{ horaFinEstimada }}
        </p>
      </div>

      <!-- Detalles -->
      <div class="bg-base-100 rounded-xl p-5 space-y-3">
        <h4 class="text-sm font-semibold text-base-content/70 uppercase tracking-wide flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
          Detalles
        </h4>
        <div class="form-control">
          <label class="label py-0"><span class="label-text font-medium text-sm">Motivo *</span></label>
          <textarea v-model="form.motivo" class="textarea textarea-bordered textarea-sm w-full" rows="2" placeholder="Motivo de la consulta..."></textarea>
          <label v-if="submitted && !form.motivo.trim()" class="label py-0">
            <span class="label-text-alt text-error text-xs">Debes escribir el motivo de la consulta</span>
          </label>
        </div>
        <div class="form-control">
          <label class="label py-0"><span class="label-text font-medium text-sm">Observaciones</span></label>
          <textarea v-model="form.observaciones" class="textarea textarea-bordered textarea-sm w-full" rows="2" placeholder="Notas adicionales..."></textarea>
        </div>
      </div>

      <!-- Acciones -->
      <div class="flex justify-end gap-3 pt-2">
        <button type="button" class="btn btn-ghost" @click="router.back()">Cancelar</button>
        <button type="submit" class="btn btn-primary gap-2" :disabled="loading">
          <span v-if="loading" class="loading loading-spinner loading-sm"></span>
          <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg>
          {{ isEdit ? 'Actualizar' : 'Crear Cita' }}
        </button>
      </div>
    </form>
  </div>
</template>

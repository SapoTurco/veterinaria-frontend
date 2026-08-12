<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { citasApi } from '@/api/citasApi'
import { getDuracionServicio, formatHora } from '@/types/cita'
import type { Cita } from '@/types/cita'

const props = defineProps<{
  modelValue: string
  idEmpleado?: number
  tipoServicio?: string
  minDate?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const today = new Date()
const currentMonth = ref(today.getMonth())
const currentYear = ref(today.getFullYear())
const hoveredDay = ref<number | null>(null)
const tooltipPosition = ref({ x: 0, y: 0 })
const citasPorDia = ref<Map<string, Cita[]>>(new Map())
const loadingCitas = ref(false)

const monthNames = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
]

const dayNames = ['Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab', 'Dom']

const daysInMonth = computed(() => {
  return new Date(currentYear.value, currentMonth.value + 1, 0).getDate()
})

const firstDayOfWeek = computed(() => {
  const day = new Date(currentYear.value, currentMonth.value, 1).getDay()
  return day === 0 ? 6 : day - 1
})

const calendarDays = computed(() => {
  const days: (number | null)[] = []
  for (let i = 0; i < firstDayOfWeek.value; i++) {
    days.push(null)
  }
  for (let i = 1; i <= daysInMonth.value; i++) {
    days.push(i)
  }
  return days
})

function formatDateKey(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

function isSelected(day: number): boolean {
  if (!props.modelValue) return false
  const selected = new Date(props.modelValue + 'T00:00:00')
  return (
    selected.getFullYear() === currentYear.value &&
    selected.getMonth() === currentMonth.value &&
    selected.getDate() === day
  )
}

function isToday(day: number): boolean {
  return (
    today.getFullYear() === currentYear.value &&
    today.getMonth() === currentMonth.value &&
    today.getDate() === day
  )
}

function isPastDay(day: number): boolean {
  const date = new Date(currentYear.value, currentMonth.value, day)
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  return date < todayStart
}

function isBeforeMinDate(day: number): boolean {
  if (!props.minDate) return false
  const min = new Date(props.minDate + 'T00:00:00')
  const date = new Date(currentYear.value, currentMonth.value, day)
  return date < min
}

function isDisabled(day: number): boolean {
  if (isPastDay(day) || isBeforeMinDate(day)) return true
  return getDayStatus(day) === 'full'
}

function getDayStatus(day: number): 'free' | 'partial' | 'full' | 'past' {
  if (isPastDay(day) || isBeforeMinDate(day)) return 'past'
  const key = formatDateKey(currentYear.value, currentMonth.value, day)
  const citas = citasPorDia.value.get(key)
  if (!citas || citas.length === 0) return 'free'

  const date = new Date(currentYear.value, currentMonth.value, day)
  const esDomingo = date.getDay() === 0
  const maxMinutes = esDomingo ? 6 * 60 : 11 * 60
  let totalOcupado = 0

  for (const cita of citas) {
    if (cita.estadoCita === 'CANCELADA' || cita.estadoCita === 'ATENDIDA') continue
    if (props.idEmpleado && cita.idEmpleado !== props.idEmpleado) continue
    if (props.tipoServicio && cita.tipoServicio !== props.tipoServicio) continue
    totalOcupado += getDuracionServicio(cita.tipoServicio)
  }

  const esHoy = today.getFullYear() === currentYear.value && today.getMonth() === currentMonth.value && today.getDate() === day
  if (esHoy) {
    const minutosPasados = today.getHours() * 60 + today.getMinutes()
    const inicioJornada = esDomingo ? 7 * 60 : 7 * 60
    const horasRestantes = maxMinutes - Math.max(minutosPasados, inicioJornada)
    if (totalOcupado >= horasRestantes) return 'full'
  } else {
    if (totalOcupado >= maxMinutes) return 'full'
  }

  if (totalOcupado > 0) return 'partial'
  return 'free'
}

function getCitasDelDia(day: number): Cita[] {
  const key = formatDateKey(currentYear.value, currentMonth.value, day)
  const todas = citasPorDia.value.get(key) || []
  return todas.filter(c => {
    if (c.estadoCita === 'CANCELADA' || c.estadoCita === 'ATENDIDA') return false
    if (props.idEmpleado && c.idEmpleado !== props.idEmpleado) return false
    if (props.tipoServicio && c.tipoServicio !== props.tipoServicio) return false
    return true
  })
}

function getHorasOcupadas(day: number): string[] {
  const citas = getCitasDelDia(day)
  const esHoy = today.getFullYear() === currentYear.value && today.getMonth() === currentMonth.value && today.getDate() === day
  const minutosAhora = esHoy ? today.getHours() * 60 + today.getMinutes() : -1
  return citas.filter(c => {
    if (!esHoy) return true
    const parts = c.horaCita.split(':')
    const cH = parseInt(parts[0] || '0')
    const cM = parseInt(parts[1] || '0')
    const cInicio = cH * 60 + cM
    return cInicio >= minutosAhora
  }).sort((a, b) => a.horaCita.localeCompare(b.horaCita)).map(c => {
    const duracion = getDuracionServicio(c.tipoServicio)
    const inicio = formatHora(c.horaCita)
    const parts = c.horaCita.split(':')
    const h = parseInt(parts[0] || '0')
    const m = parseInt(parts[1] || '0')
    const finMinutes = h * 60 + m + duracion
    const finH = Math.floor(finMinutes / 60)
    const finM = finMinutes % 60
    const finStr = `${String(finH).padStart(2, '0')}:${String(finM).padStart(2, '0')}`
    return `${inicio} - ${formatHora(finStr)}`
  })
}

function selectDay(day: number) {
  if (isDisabled(day)) return
  const dateStr = formatDateKey(currentYear.value, currentMonth.value, day)
  emit('update:modelValue', dateStr)
}

function prevMonth() {
  if (currentMonth.value === 0) {
    currentMonth.value = 11
    currentYear.value--
  } else {
    currentMonth.value--
  }
  loadCitasDelMes()
}

function nextMonth() {
  if (currentMonth.value === 11) {
    currentMonth.value = 0
    currentYear.value++
  } else {
    currentMonth.value++
  }
  loadCitasDelMes()
}

function goToToday() {
  currentMonth.value = today.getMonth()
  currentYear.value = today.getFullYear()
  loadCitasDelMes()
}

function onDayHover(event: MouseEvent, day: number) {
  if (isDisabled(day)) {
    hoveredDay.value = null
    return
  }
  hoveredDay.value = day
  const rect = (event.target as HTMLElement).getBoundingClientRect()
  tooltipPosition.value = {
    x: rect.left + rect.width / 2,
    y: rect.top - 8,
  }
}

function onDayLeave() {
  hoveredDay.value = null
}

async function loadCitasDelMes() {
  loadingCitas.value = true
  try {
    const diasEnMes = new Date(currentYear.value, currentMonth.value + 1, 0).getDate()
    const promises: Promise<void>[] = []

    for (let dia = 1; dia <= diasEnMes; dia++) {
      const key = formatDateKey(currentYear.value, currentMonth.value, dia)
      const date = new Date(currentYear.value, currentMonth.value, dia)
      if (date < new Date(today.getFullYear(), today.getMonth(), today.getDate())) continue

      const promise = citasApi.getDisponibilidad(key)
        .then(res => {
          citasPorDia.value.set(key, res.data)
        })
        .catch(() => {
          citasPorDia.value.set(key, [])
        })
      promises.push(promise)
    }

    await Promise.all(promises)
  } catch {
    // ignore
  } finally {
    loadingCitas.value = false
  }
}

watch(() => props.modelValue, (val) => {
  if (val) {
    const d = new Date(val + 'T00:00:00')
    if (d.getMonth() !== currentMonth.value || d.getFullYear() !== currentYear.value) {
      currentMonth.value = d.getMonth()
      currentYear.value = d.getFullYear()
      loadCitasDelMes()
    }
  }
})

watch([currentMonth, currentYear], () => {
  loadCitasDelMes()
})

onMounted(() => {
  loadCitasDelMes()
})
</script>

<template>
  <div class="calendar-container relative">
    <!-- Header del calendario -->
    <div class="flex items-center justify-between mb-3">
      <button type="button" class="btn btn-ghost btn-sm btn-circle" @click="prevMonth">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      <div class="flex items-center gap-2">
        <span class="font-bold text-sm">{{ monthNames[currentMonth] }} {{ currentYear }}</span>
        <button type="button" class="btn btn-ghost btn-xs" @click="goToToday">Hoy</button>
      </div>
      <button type="button" class="btn btn-ghost btn-sm btn-circle" @click="nextMonth">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>

    <!-- Días de la semana -->
    <div class="grid grid-cols-7 gap-1 mb-1">
      <div
        v-for="dayName in dayNames"
        :key="dayName"
        class="text-center text-xs font-semibold text-base-content/50 py-1"
      >
        {{ dayName }}
      </div>
    </div>

    <!-- Días del mes -->
    <div class="grid grid-cols-7 gap-1 relative">
      <div
        v-for="(day, index) in calendarDays"
        :key="index"
        class="relative"
      >
        <button
          v-if="day !== null"
          type="button"
          class="w-full aspect-square flex flex-col items-center justify-center rounded-lg text-sm transition-all duration-150 relative"
          :class="{
            'bg-primary text-primary-content font-bold shadow-md': isSelected(day),
            'hover:bg-base-200 cursor-pointer': !isDisabled(day) && !isSelected(day),
            'text-base-content/30 cursor-not-allowed': isDisabled(day) && !isSelected(day),
            'text-base-content': !isDisabled(day) && !isSelected(day),
          }"
          :disabled="isDisabled(day)"
          @click="selectDay(day)"
          @mouseenter="onDayHover($event, day)"
          @mouseleave="onDayLeave"
        >
          <span>{{ day }}</span>
          <!-- Indicador de estado del día -->
          <div
            v-if="!isDisabled(day)"
            class="absolute bottom-0.5 left-1/2 -translate-x-1/2 flex gap-0.5"
          >
            <span
              v-if="getDayStatus(day) === 'free'"
              class="w-1 h-1 rounded-full bg-success"
            ></span>
            <span
              v-else-if="getDayStatus(day) === 'partial'"
              class="w-1 h-1 rounded-full bg-warning"
            ></span>
            <span
              v-else-if="getDayStatus(day) === 'full'"
              class="w-1 h-1 rounded-full bg-error"
            ></span>
          </div>
        </button>
        <div v-else class="w-full aspect-square"></div>
      </div>

      <!-- Tooltip de disponibilidad -->
      <Teleport to="body">
        <div
          v-if="hoveredDay !== null"
          class="calendar-tooltip fixed z-50 bg-base-100 border border-base-300 rounded-xl shadow-2xl p-3 min-w-[280px] max-w-[360px] pointer-events-none"
          :style="{
            left: tooltipPosition.x + 'px',
            top: tooltipPosition.y + 'px',
            transform: 'translate(-50%, -100%)',
          }"
        >
          <div class="flex items-center justify-between mb-2">
            <span class="font-bold text-sm">
              {{ new Date(currentYear, currentMonth, hoveredDay).toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' }) }}
            </span>
            <span
              class="badge badge-xs"
              :class="{
                'badge-success': getDayStatus(hoveredDay) === 'free',
                'badge-warning': getDayStatus(hoveredDay) === 'partial',
                'badge-error': getDayStatus(hoveredDay) === 'full',
              }"
            >
              {{ getDayStatus(hoveredDay) === 'free' ? 'Disponible' : getDayStatus(hoveredDay) === 'partial' ? 'Parcial' : 'Lleno' }}
            </span>
          </div>

          <div v-if="getHorasOcupadas(hoveredDay).length === 0" class="text-xs text-base-content/50">
            No hay citas agendadas para este día
          </div>
          <div v-else class="space-y-1 max-h-40 overflow-y-auto">
            <div class="text-xs font-semibold text-base-content/60 mb-1">Horas ocupadas:</div>
            <div
              v-for="(hora, idx) in getHorasOcupadas(hoveredDay)"
              :key="idx"
              class="text-xs bg-base-200 rounded px-2 py-1 flex items-center gap-1.5"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3 text-base-content/40 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{{ hora }}</span>
            </div>
          </div>

          <div v-if="currentYear === today.getFullYear() && currentMonth === today.getMonth() && hoveredDay === today.getDate()" class="text-xs text-primary font-semibold mt-2 pt-2 border-t border-base-300">
            Hoy
          </div>

          <!-- Flecha del tooltip -->
          <div class="absolute left-1/2 -translate-x-1/2 -bottom-1.5 w-3 h-3 bg-base-100 border-r border-b border-base-300 rotate-45"></div>
        </div>
      </Teleport>
    </div>

    <!-- Loading indicator -->
    <div v-if="loadingCitas" class="flex justify-center py-1">
      <span class="loading loading-spinner loading-xs text-primary"></span>
    </div>

    <!-- Leyenda -->
    <div class="flex items-center justify-center gap-4 mt-2 text-xs text-base-content/50">
      <div class="flex items-center gap-1">
        <span class="w-2 h-2 rounded-full bg-success"></span>
        Disponible
      </div>
      <div class="flex items-center gap-1">
        <span class="w-2 h-2 rounded-full bg-warning"></span>
        Parcial
      </div>
      <div class="flex items-center gap-1">
        <span class="w-2 h-2 rounded-full bg-error"></span>
        Lleno
      </div>
    </div>
  </div>
</template>

<style scoped>
.calendar-tooltip {
  animation: tooltipFadeIn 0.15s ease-out;
}

@keyframes tooltipFadeIn {
  from {
    opacity: 0;
    transform: translate(-50%, -100%) translateY(4px);
  }
  to {
    opacity: 1;
    transform: translate(-50%, -100%) translateY(0);
  }
}
</style>

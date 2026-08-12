<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { mascotasApi } from '@/api/mascotasApi'
import { citasApi } from '@/api/citasApi'
import type { Mascota } from '@/types/mascota'
import type { Cita } from '@/types/cita'
import PaginationBar from '@/components/common/PaginationBar.vue'
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'

const route = useRoute()
const router = useRouter()
const mascota = ref<Mascota | null>(null)
const citas = ref<Cita[]>([])
const numerosCitas = computed(() => {
  const mapa: Record<number, number> = {}
  const ordenadas = [...citas.value].sort((a, b) => a.idCita - b.idCita)
  ordenadas.forEach((c, i) => {
    mapa[c.idCita] = i + 1
  })
  return mapa
})
const loading = ref(true)
const error = ref('')
const success = ref('')
const id = Number(route.params.id)
const showDeleteDialog = ref(false)
const showReactivateDialog = ref(false)
const page = ref(0)
const size = ref(5)

const initials = computed(() => {
  if (!mascota.value) return '?'
  return mascota.value.nombre?.[0]?.toUpperCase() || '?'
})

const citasPendientes = computed(() => citas.value.filter(c => c.estadoCita === 'PENDIENTE' || c.estadoCita === 'CONFIRMADA'))

const citasOrdenadas = computed(() =>
  [...citas.value].sort((a, b) => {
    const fechaA = a.fechaCita + (a.horaCita || '')
    const fechaB = b.fechaCita + (b.horaCita || '')
    return fechaB.localeCompare(fechaA)
  })
)
const totalCitasPages = computed(() => Math.max(1, Math.ceil(citasOrdenadas.value.length / size.value)))
const citasPaginadas = computed(() => {
  const start = page.value * size.value
  return citasOrdenadas.value.slice(start, start + size.value)
})

onMounted(async () => {
  try {
    const [mascotaRes, citasRes] = await Promise.all([
      mascotasApi.getById(id),
      citasApi.getByMascota(id),
    ])
    mascota.value = mascotaRes.data
    citas.value = citasRes.data
  } catch (e: any) {
    error.value = e.response?.data?.message || 'Error al cargar los datos de la mascota'
  } finally {
    loading.value = false
  }
})

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

async function handleDelete() {
  try {
    await mascotasApi.delete(id)
    showDeleteDialog.value = false
    success.value = 'Mascota desactivada correctamente'
    setTimeout(() => router.back(), 1500)
  } catch (e: any) {
    error.value = e.response?.data?.message || 'No se pudo desactivar'
    showDeleteDialog.value = false
  }
}

async function handleReactivate() {
  try {
    await mascotasApi.reactivar(id)
    showReactivateDialog.value = false
    const res = await mascotasApi.getById(id)
    mascota.value = res.data
    success.value = 'Mascota reactivada correctamente'
    setTimeout(() => success.value = '', 3000)
  } catch (e: any) {
    error.value = e.response?.data?.message || 'No se pudo reactivar'
    showReactivateDialog.value = false
  }
}

function formatHora(hora: string) {
  if (!hora) return ''
  const parts = hora.split(':')
  const h = Number(parts[0])
  const m = Number(parts[1])
  const ampm = h >= 12 ? 'PM' : 'AM'
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${ampm}`
}
</script>

<template>
  <div class="max-w-5xl mx-auto">
    <div v-if="error" class="alert alert-error mb-4">
      <span>{{ error }}</span>
    </div>

    <div v-if="loading" class="flex justify-center py-20">
      <span class="loading loading-spinner loading-lg text-primary"></span>
    </div>

    <template v-else-if="mascota">
      <!-- Header -->
      <div class="flex items-center gap-4 mb-6">
        <button class="btn btn-ghost btn-sm btn-circle" @click="router.back()">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div class="flex-1">
          <h1 class="text-2xl font-extrabold text-[#FFFFE3]">{{ mascota.nombre }}</h1>
          <p class="text-sm text-base-content/50">Detalle de mascota</p>
        </div>
        <span class="badge badge-lg" :class="mascota.estado ? 'badge-success' : 'badge-error'">
          {{ mascota.estado ? 'Activa' : 'Inactiva' }}
        </span>
        <!-- 3-dot menu -->
        <div class="dropdown dropdown-end">
          <div tabindex="0" role="button" class="btn btn-ghost btn-circle">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 5v.01M12 12v.01M12 19v.01" />
            </svg>
          </div>
          <ul tabindex="0" class="dropdown-content menu p-2 shadow-lg bg-[#2A2A2A] border border-white/10 rounded-xl w-52 z-50">
            <li><a @click="router.push(`/mascotas/${id}/editar`)" class="text-[#CBCBCB] hover:bg-white/10 hover:text-[#FFFFE3]">Editar</a></li>
            <li v-if="mascota.estado"><a @click="showDeleteDialog = true" class="text-red-400 hover:bg-red-500/20">Desactivar</a></li>
            <li v-if="!mascota.estado"><a @click="showReactivateDialog = true" class="text-green-400 hover:bg-green-500/20">Reactivar</a></li>
          </ul>
        </div>
      </div>

      <!-- Info Card -->
      <div class="bg-base-100 rounded-2xl border border-base-300 overflow-hidden mb-6">
        <div class="bg-gradient-to-r from-[#0D7377]/20 to-transparent px-6 py-5 flex items-center gap-5">
          <div class="w-16 h-16 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center shadow-lg">
            <span class="text-primary font-bold text-xl">{{ initials }}</span>
          </div>
          <div class="flex-1">
            <h2 class="text-lg font-bold text-[#FFFFE3]">{{ mascota.nombre }}</h2>
            <p class="text-sm text-base-content/50">{{ mascota.especie }} · {{ mascota.raza }} · {{ mascota.sexo }}</p>
          </div>
          <button
            v-if="citasPendientes.length > 0"
            class="badge badge-lg badge-warning gap-1"
          >
            {{ citasPendientes.length }} cita(s) activa(s)
          </button>
        </div>
        <div class="px-6 py-5 grid grid-cols-2 md:grid-cols-4 gap-5">
          <div>
            <p class="text-xs text-base-content/40 uppercase tracking-wider mb-1">Especie</p>
            <p class="text-sm font-medium">{{ mascota.especie }}</p>
          </div>
          <div>
            <p class="text-xs text-base-content/40 uppercase tracking-wider mb-1">Raza</p>
            <p class="text-sm font-medium">{{ mascota.raza }}</p>
          </div>
          <div>
            <p class="text-xs text-base-content/40 uppercase tracking-wider mb-1">Fecha nacimiento</p>
            <p class="text-sm font-medium">{{ formatFecha(mascota.fechaNacimiento) }}</p>
          </div>
          <div>
            <p class="text-xs text-base-content/40 uppercase tracking-wider mb-1">Peso</p>
            <p class="text-sm font-medium">{{ mascota.peso }} kg</p>
          </div>
          <div>
            <p class="text-xs text-base-content/40 uppercase tracking-wider mb-1">Dueño</p>
            <p
              class="text-sm font-medium text-primary cursor-pointer hover:underline"
              @click="router.push(`/clientes/${mascota.idCliente}`)"
            >
              {{ mascota.nombreCliente }}
            </p>
          </div>
        </div>
      </div>

      <!-- Historial de Citas -->
      <div class="bg-base-100 rounded-2xl border border-base-300 overflow-hidden">
        <div class="px-6 py-4 border-b border-base-300">
          <h3 class="font-bold text-[#FFFFE3]">Historial de Citas ({{ citas.length }})</h3>
        </div>
        <div v-if="citas.length === 0" class="px-6 py-12 text-center text-base-content/40">
          No tiene citas registradas
        </div>
        <div v-else class="divide-y divide-base-300">
          <div v-for="cita in citasPaginadas"
            :key="cita.idCita"
            class="px-6 py-4 flex items-center gap-4 hover:bg-base-200/50 cursor-pointer transition-colors"
            @click="router.push(`/citas/${cita.idCita}`)"
          >
            <div class="w-10 h-10 rounded-full flex items-center justify-center" :class="cita.estadoCita === 'PENDIENTE' ? 'bg-warning/10' : cita.estadoCita === 'CONFIRMADA' ? 'bg-info/10' : cita.estadoCita === 'ATENDIDA' ? 'bg-success/10' : 'bg-error/10'">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" :class="cita.estadoCita === 'PENDIENTE' ? 'text-warning' : cita.estadoCita === 'CONFIRMADA' ? 'text-info' : cita.estadoCita === 'ATENDIDA' ? 'text-success' : 'text-error'" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div class="w-8 text-center shrink-0">
              <span class="text-xs font-bold text-base-content/50">#{{ numerosCitas[cita.idCita] ?? '—' }}</span>
            </div>
            <div class="flex-1">
              <p class="font-medium text-sm">{{ cita.nombreServicio }}</p>
              <p class="text-xs text-base-content/50">{{ formatFecha(cita.fechaCita) }} · {{ formatHora(cita.horaCita) }}</p>
            </div>
            <span class="badge badge-sm" :class="estadoColor(cita.estadoCita)">{{ cita.estadoCita }}</span>
          </div>
        </div>
        <div v-if="citasOrdenadas.length > size" class="px-6 pb-2">
          <PaginationBar
            :page="page"
            :totalPages="totalCitasPages"
            :totalElements="citasOrdenadas.length"
            :size="size"
            @update:page="page = $event"
          />
        </div>
      </div>
    </template>

    <ConfirmDialog
      :show="showDeleteDialog"
      title="Desactivar mascota"
      message="¿Estás seguro de desactivar esta mascota? No se podrán agendar citas hasta que sea reactivada."
      confirmText="Desactivar"
      variant="error"
      @confirm="handleDelete"
      @cancel="showDeleteDialog = false"
    />

    <ConfirmDialog
      :show="showReactivateDialog"
      title="Reactivar mascota"
      message="¿Estás seguro de reactivar esta mascota?"
      confirmText="Reactivar"
      variant="success"
      @confirm="handleReactivate"
      @cancel="showReactivateDialog = false"
    />
  </div>
</template>

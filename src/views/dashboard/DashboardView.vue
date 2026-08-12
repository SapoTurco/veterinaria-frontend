<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useAuthStore } from '@/stores/authStore'
import { clientesApi } from '@/api/clientesApi'
import { mascotasApi } from '@/api/mascotasApi'
import { citasApi } from '@/api/citasApi'
import { facturasApi } from '@/api/facturasApi'
import { formatHora } from '@/types/cita'

const authStore = useAuthStore()

const stats = ref({
  clientes: 0,
  mascotas: 0,
  citas: 0,
  facturas: 0,
})
const loading = ref(true)
const error = ref('')
const proximasCitas = ref<any[]>([])

function formatCitaFecha(fecha: string): string {
  if (!fecha) return ''
  const parts = fecha.split('-')
  const d = parts[2] || ''
  const m = parts[1] || ''
  return `${parseInt(d)}/${parseInt(m)}`
}

onMounted(async () => {
  try {
    if (authStore.hasRole('CLIENTE')) {
      const [mascotas, citas, facturas] = await Promise.allSettled([
        authStore.hasModule('MASCOTAS') ? mascotasApi.getMisMascotas() : Promise.resolve({ data: [] }),
        authStore.hasModule('CITAS') ? citasApi.getMisCitas() : Promise.resolve({ data: [] }),
        authStore.hasModule('FACTURACION') ? facturasApi.getMisFacturas() : Promise.resolve({ data: [] }),
      ])
      const mascotasData = mascotas.status === 'fulfilled' ? mascotas.value : { data: [] }
      const citasData = citas.status === 'fulfilled' ? citas.value : { data: [] }
      const facturasData = facturas.status === 'fulfilled' ? facturas.value : { data: [] }
      stats.value = {
        clientes: 0,
        mascotas: Array.isArray(mascotasData.data) ? mascotasData.data.length : 0,
        citas: Array.isArray(citasData.data) ? citasData.data.filter((c: any) => c.estadoCita === 'PENDIENTE' || c.estadoCita === 'CONFIRMADA').length : 0,
        facturas: Array.isArray(facturasData.data) ? facturasData.data.length : 0,
      }
      const todasCitas = Array.isArray(citasData.data) ? citasData.data : []
      proximasCitas.value = todasCitas
        .filter((c: any) => c.estadoCita === 'PENDIENTE' || c.estadoCita === 'CONFIRMADA')
        .sort((a: any, b: any) => `${a.fechaCita}T${a.horaCita || '00:00'}`.localeCompare(`${b.fechaCita}T${b.horaCita || '00:00'}`))
        .slice(0, 3)
    } else {
      const esProfesional = authStore.hasAnyRole('VETERINARIO', 'ESTILISTA')
      if (esProfesional) {
        await authStore.cargarEmpleadoActual()
      }
      const citasPromise = esProfesional && authStore.idEmpleadoActual
        ? citasApi.getByEmpleado(authStore.idEmpleadoActual)
        : citasApi.getAll()
      const [clientes, mascotas, citas, facturas] = await Promise.allSettled([
        authStore.hasModule('CLIENTES') ? clientesApi.getAll() : Promise.resolve({ data: [] }),
        authStore.hasModule('MASCOTAS') ? mascotasApi.getAll() : Promise.resolve({ data: [] }),
        authStore.hasModule('CITAS') ? citasPromise : Promise.resolve({ data: [] }),
        authStore.hasModule('FACTURACION') ? facturasApi.getAll() : Promise.resolve({ data: [] }),
      ])
      const clientesData = clientes.status === 'fulfilled' ? clientes.value : { data: [] }
      const mascotasData = mascotas.status === 'fulfilled' ? mascotas.value : { data: [] }
      const citasData = citas.status === 'fulfilled' ? citas.value : { data: [] }
      const facturasData = facturas.status === 'fulfilled' ? facturas.value : { data: [] }
      stats.value = {
        clientes: Array.isArray(clientesData.data) ? clientesData.data.filter((c: any) => c.estado === true).length : 0,
        mascotas: Array.isArray(mascotasData.data) ? mascotasData.data.filter((m: any) => m.estado === true).length : 0,
        citas: Array.isArray(citasData.data) ? citasData.data.filter((c: any) => c.estadoCita === 'PENDIENTE' || c.estadoCita === 'CONFIRMADA').length : 0,
        facturas: Array.isArray(facturasData.data) ? facturasData.data.length : 0,
      }
      const todasCitas = Array.isArray(citasData.data) ? citasData.data : []
      proximasCitas.value = todasCitas
        .filter((c: any) => c.estadoCita === 'PENDIENTE' || c.estadoCita === 'CONFIRMADA')
        .sort((a: any, b: any) => `${a.fechaCita}T${a.horaCita || '00:00'}`.localeCompare(`${b.fechaCita}T${b.horaCita || '00:00'}`))
        .slice(0, 3)
    }
  } catch (e: any) {
    error.value = e.response?.data?.message || 'No se pudieron cargar los datos'
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div>
    <h1 class="text-2xl sm:text-3xl font-extrabold mb-6 text-[#FFFFE3]">
      Bienvenido, {{ authStore.nombreCompleto }}
    </h1>

    <div v-if="loading" class="flex justify-center py-12">
      <span class="loading loading-spinner loading-lg text-[#0D7377]"></span>
    </div>

    <div v-else-if="error" class="dashboard-card rounded-2xl">
      <div class="card-body text-center py-12">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 mx-auto text-[#c47070]/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
        <h3 class="text-lg font-medium mt-4 text-[#FFFFE3]">Algo salio mal</h3>
        <p class="text-[#CBCBCB]/60 mt-2">{{ error }}</p>
      </div>
    </div>

    <template v-else>
      <!-- Stats para empleados -->
      <template v-if="!authStore.hasRole('CLIENTE')">
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div class="stat-card rounded-2xl p-6 group hover:scale-[1.02] transition-transform duration-300" v-if="authStore.hasModule('CLIENTES')">
            <div class="flex items-center gap-4">
              <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-[#0D7377] to-[#4A4A4A] flex items-center justify-center shadow-lg shadow-[#0D7377]/20">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-[#FFFFE3]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div>
                <div class="text-xs font-medium text-[#CBCBCB]/60 uppercase tracking-wide">Clientes</div>
                <div class="text-3xl font-extrabold text-[#FFFFE3]">{{ stats.clientes }}</div>
                <div class="text-xs text-[#CBCBCB]/50">Total registrados</div>
              </div>
            </div>
          </div>

          <div class="stat-card rounded-2xl p-6 group hover:scale-[1.02] transition-transform duration-300" v-if="authStore.hasModule('MASCOTAS')">
            <div class="flex items-center gap-4">
              <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-[#1A8A8E] to-[#0D7377] flex items-center justify-center shadow-lg shadow-[#1A8A8E]/20">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-[#FFFFE3]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                </svg>
              </div>
              <div>
                <div class="text-xs font-medium text-[#CBCBCB]/60 uppercase tracking-wide">Mascotas</div>
                <div class="text-3xl font-extrabold text-[#FFFFE3]">{{ stats.mascotas }}</div>
                <div class="text-xs text-[#CBCBCB]/50">Total registradas</div>
              </div>
            </div>
          </div>

          <div class="stat-card rounded-2xl p-6 group hover:scale-[1.02] transition-transform duration-300" v-if="authStore.hasModule('CITAS')">
            <div class="flex items-center gap-4">
              <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-[#FFFFE3]/20 to-[#FFFFE3]/5 flex items-center justify-center shadow-lg shadow-[#FFFFE3]/10 border border-[#FFFFE3]/10">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-[#FFFFE3]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <div class="text-xs font-medium text-[#CBCBCB]/60 uppercase tracking-wide">Citas</div>
                <div class="text-3xl font-extrabold text-[#FFFFE3]">{{ stats.citas }}</div>
                <div class="text-xs text-[#CBCBCB]/50">Total programadas</div>
              </div>
            </div>
          </div>

          <div class="stat-card rounded-2xl p-6 group hover:scale-[1.02] transition-transform duration-300" v-if="authStore.hasModule('FACTURACION')">
            <div class="flex items-center gap-4">
              <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-[#7a9e7e] to-[#5a7e5e] flex items-center justify-center shadow-lg shadow-[#7a9e7e]/20">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-[#FFFFE3]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" />
                </svg>
              </div>
              <div>
                <div class="text-xs font-medium text-[#CBCBCB]/60 uppercase tracking-wide">Facturas</div>
                <div class="text-3xl font-extrabold text-[#FFFFE3]">{{ stats.facturas }}</div>
                <div class="text-xs text-[#CBCBCB]/50">Total emitidas</div>
              </div>
            </div>
          </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div class="dashboard-card rounded-2xl p-6">
            <h2 class="text-lg font-bold text-[#FFFFE3] mb-4">Accesos rapidos</h2>
            <div class="grid grid-cols-2 gap-3">
              <router-link to="/citas/nueva" class="dashboard-btn" v-if="authStore.hasModule('CITAS')">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                </svg>
                Nueva Cita
              </router-link>
              <router-link to="/clientes" class="dashboard-btn" v-if="authStore.hasModule('CLIENTES')">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Ver Clientes
              </router-link>
              <router-link to="/mascotas" class="dashboard-btn" v-if="authStore.hasModule('MASCOTAS')">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                </svg>
                Ver Mascotas
              </router-link>
              <router-link to="/servicios" class="dashboard-btn" v-if="authStore.hasModule('TARIFAS')">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                </svg>
                Ver Servicios
              </router-link>
            </div>
          </div>

          <div class="dashboard-card rounded-2xl p-6 flex flex-col">
            <h2 class="text-lg font-bold text-[#FFFFE3] mb-4">Proximas Citas</h2>
            <div v-if="proximasCitas.length === 0" class="flex-1 flex items-center justify-center">
              <div class="text-center py-4">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 mx-auto text-[#CBCBCB]/20 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p class="text-[#CBCBCB]/40 text-sm">No hay citas pendientes</p>
              </div>
            </div>
            <div v-else class="flex-1 flex flex-col gap-3">
              <router-link
                v-for="cita in proximasCitas"
                :key="cita.idCita"
                :to="`/citas/${cita.idCita}`"
                class="cita-item rounded-xl p-4 flex items-center gap-3 cursor-pointer"
              >
                <div class="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                     :class="cita.estadoCita === 'PENDIENTE' ? 'bg-[#E8650A]/20 text-[#E8650A]' : 'bg-[#1A8A8E]/20 text-[#1A8A8E]'">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-semibold text-[#FFFFE3] truncate">{{ cita.nombreMascota }}</p>
                  <p class="text-xs text-[#CBCBCB]/60 truncate">{{ cita.nombreServicio }}</p>
                </div>
                <div class="text-right shrink-0">
                  <p class="text-xs font-medium text-[#FFFFE3]">{{ formatCitaFecha(cita.fechaCita || '') }}</p>
                  <p class="text-xs text-[#CBCBCB]/60">{{ formatHora(cita.horaCita || '') }}</p>
                </div>
              </router-link>
            </div>
          </div>
        </div>
      </template>

      <!-- Vista para clientes -->
      <template v-if="authStore.hasRole('CLIENTE')">
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
          <div class="stat-card rounded-2xl p-6 group hover:scale-[1.02] transition-transform duration-300" v-if="authStore.hasModule('MASCOTAS')">
            <div class="flex items-center gap-4">
              <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-[#1A8A8E] to-[#0D7377] flex items-center justify-center shadow-lg shadow-[#1A8A8E]/20">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-[#FFFFE3]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                </svg>
              </div>
              <div>
                <div class="text-xs font-medium text-[#CBCBCB]/60 uppercase tracking-wide">Mis Mascotas</div>
                <div class="text-3xl font-extrabold text-[#FFFFE3]">{{ stats.mascotas }}</div>
                <div class="text-xs text-[#CBCBCB]/50">Mascotas registradas</div>
              </div>
            </div>
          </div>
          <div class="stat-card rounded-2xl p-6 group hover:scale-[1.02] transition-transform duration-300" v-if="authStore.hasModule('CITAS')">
            <div class="flex items-center gap-4">
              <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-[#FFFFE3]/20 to-[#FFFFE3]/5 flex items-center justify-center shadow-lg shadow-[#FFFFE3]/10 border border-[#FFFFE3]/10">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-[#FFFFE3]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <div class="text-xs font-medium text-[#CBCBCB]/60 uppercase tracking-wide">Mis Citas</div>
                <div class="text-3xl font-extrabold text-[#FFFFE3]">{{ stats.citas }}</div>
                <div class="text-xs text-[#CBCBCB]/50">Citas programadas</div>
              </div>
            </div>
          </div>
          <div class="stat-card rounded-2xl p-6 group hover:scale-[1.02] transition-transform duration-300" v-if="authStore.hasModule('FACTURACION')">
            <div class="flex items-center gap-4">
              <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-[#7a9e7e] to-[#5a7e5e] flex items-center justify-center shadow-lg shadow-[#7a9e7e]/20">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-[#FFFFE3]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" />
                </svg>
              </div>
              <div>
                <div class="text-xs font-medium text-[#CBCBCB]/60 uppercase tracking-wide">Mis Facturas</div>
                <div class="text-3xl font-extrabold text-[#FFFFE3]">{{ stats.facturas }}</div>
                <div class="text-xs text-[#CBCBCB]/50">Facturas totales</div>
              </div>
            </div>
          </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div class="dashboard-card rounded-2xl p-6">
            <h2 class="text-lg font-bold text-[#FFFFE3] mb-4">Accesos rapidos</h2>
            <div class="grid grid-cols-2 gap-3">
              <router-link to="/mis-mascotas" class="dashboard-btn" v-if="authStore.hasModule('MASCOTAS')">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                </svg>
                Mis Mascotas
              </router-link>
              <router-link to="/mis-citas" class="dashboard-btn" v-if="authStore.hasModule('CITAS')">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Mis Citas
              </router-link>
              <router-link to="/mis-facturas" class="dashboard-btn" v-if="authStore.hasModule('FACTURACION')">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" />
                </svg>
                Mis Facturas
              </router-link>
            </div>
          </div>

          <div class="dashboard-card rounded-2xl p-6 flex flex-col">
            <h2 class="text-lg font-bold text-[#FFFFE3] mb-4">Proximas Citas</h2>
            <div v-if="proximasCitas.length === 0" class="flex-1 flex items-center justify-center">
              <div class="text-center py-4">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 mx-auto text-[#CBCBCB]/20 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p class="text-[#CBCBCB]/40 text-sm">No hay citas pendientes</p>
              </div>
            </div>
            <div v-else class="flex-1 flex flex-col gap-3">
              <router-link
                v-for="cita in proximasCitas"
                :key="cita.idCita"
                :to="`/citas/${cita.idCita}`"
                class="cita-item rounded-xl p-4 flex items-center gap-3 cursor-pointer"
              >
                <div class="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                     :class="cita.estadoCita === 'PENDIENTE' ? 'bg-[#E8650A]/20 text-[#E8650A]' : 'bg-[#1A8A8E]/20 text-[#1A8A8E]'">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-semibold text-[#FFFFE3] truncate">{{ cita.nombreMascota }}</p>
                  <p class="text-xs text-[#CBCBCB]/60 truncate">{{ cita.nombreServicio }}</p>
                </div>
                <div class="text-right shrink-0">
                  <p class="text-xs font-medium text-[#FFFFE3]">{{ formatCitaFecha(cita.fechaCita || '') }}</p>
                  <p class="text-xs text-[#CBCBCB]/60">{{ formatHora(cita.horaCita || '') }}</p>
                </div>
              </router-link>
            </div>
          </div>
        </div>
      </template>
    </template>
  </div>
</template>

<style scoped>
.stat-card {
  background: rgba(42, 42, 42, 0.7);
  backdrop-filter: blur(12px);
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.2);
}

.stat-card:hover {
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}

.dashboard-card {
  background: rgba(42, 42, 42, 0.6);
  backdrop-filter: blur(12px);
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.15);
}

.dashboard-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  border-radius: 0.75rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: #FFFFE3;
  background: rgba(13, 115, 119, 0.15);
  transition: all 0.2s ease;
}

.dashboard-btn:hover {
  background: rgba(13, 115, 119, 0.3);
  transform: translateY(-1px);
}

.cita-item {
  background: rgba(255, 255, 255, 0.03);
  transition: all 0.2s ease;
}

.cita-item:hover {
  background: rgba(13, 115, 119, 0.15);
  transform: translateX(2px);
}
</style>

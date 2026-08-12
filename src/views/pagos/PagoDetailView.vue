<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { pagosApi } from '@/api/pagosApi'
import type { Pago } from '@/types/pago'

const route = useRoute()
const router = useRouter()
const pago = ref<Pago | null>(null)
const loading = ref(true)
const error = ref('')
const id = Number(route.params.id)

onMounted(async () => {
  try {
    const res = await pagosApi.getAll()
    pago.value = res.data.find((p: Pago) => p.idPago === id) || null
    if (!pago.value) {
      error.value = 'Pago no encontrado'
    }
  } catch (e: any) {
    error.value = e.response?.data?.message || 'No se pudo cargar el pago'
  } finally {
    loading.value = false
  }
})

function formatFecha(fecha: string | null) {
  if (!fecha) return '—'
  const d = new Date(fecha.includes('T') ? fecha : fecha.replace(' ', 'T'))
  if (isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' })
}

function formatCurrency(valor: number) {
  return '$' + (valor?.toLocaleString('es-CO') || '0')
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

    <template v-else-if="pago">
      <!-- Header -->
      <div class="flex items-center gap-4 mb-6">
        <button class="btn btn-ghost btn-sm btn-circle" @click="router.back()">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div class="flex-1">
          <h1 class="text-xl sm:text-2xl font-extrabold text-[#FFFFE3]">Pago #{{ pago.idPago }}</h1>
          <p class="text-sm text-base-content/50">Detalle del pago</p>
        </div>
        <span class="badge badge-lg badge-success">Completado</span>
      </div>

      <!-- Info Card -->
      <div class="bg-base-100 rounded-2xl overflow-hidden mb-6">
        <div class="bg-gradient-to-r from-[#0D7377]/20 to-transparent px-6 py-5 flex items-center gap-5">
          <div class="w-16 h-16 rounded-full bg-gradient-to-br from-success/30 to-success/10 flex items-center justify-center shadow-lg">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-7 w-7 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <div class="flex-1">
            <h2 class="text-lg font-bold text-[#FFFFE3]">Pago #{{ pago.idPago }}</h2>
            <p class="text-sm text-base-content/50">{{ pago.nombreMetodoPago }}</p>
          </div>
          <div class="text-right">
            <p class="text-xs text-base-content/40 uppercase tracking-wider">Monto</p>
            <p class="text-2xl font-extrabold text-success">{{ formatCurrency(pago.monto) }}</p>
          </div>
        </div>
        <div class="px-6 py-5 grid grid-cols-2 md:grid-cols-3 gap-5">
          <div>
            <p class="text-xs text-base-content/40 uppercase tracking-wider mb-1">Fecha de pago</p>
            <p class="text-sm font-medium">{{ formatFecha(pago.fechaPago) }}</p>
          </div>
          <div>
            <p class="text-xs text-base-content/40 uppercase tracking-wider mb-1">Método de pago</p>
            <p class="text-sm font-medium">{{ pago.nombreMetodoPago }}</p>
          </div>
          <div>
            <p class="text-xs text-base-content/40 uppercase tracking-wider mb-1">Monto</p>
            <p class="text-sm font-bold text-success">{{ formatCurrency(pago.monto) }}</p>
          </div>
          <div>
            <p class="text-xs text-base-content/40 uppercase tracking-wider mb-1">Factura #</p>
            <p
              class="text-sm font-medium text-primary cursor-pointer hover:underline"
              @click="router.push(`/facturas/${pago.idFactura}`)"
            >
              {{ pago.idFactura }}
            </p>
          </div>
          <div v-if="pago.referenciaPago">
            <p class="text-xs text-base-content/40 uppercase tracking-wider mb-1">Referencia</p>
            <p class="text-sm font-medium">{{ pago.referenciaPago }}</p>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

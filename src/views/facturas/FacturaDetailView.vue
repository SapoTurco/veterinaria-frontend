<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { facturasApi } from '@/api/facturasApi'
import { pagosApi } from '@/api/pagosApi'
import { metodosPagoApi } from '@/api/metodosPagoApi'
import type { Factura } from '@/types/factura'
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'

const route = useRoute()
const router = useRouter()
const factura = ref<Factura | null>(null)
const loading = ref(true)
const error = ref('')
const success = ref('')
const id = Number(route.params.id)
const showPagoModal = ref(false)
const metodosPago = ref<any[]>([])
const metodoPagoSeleccionado = ref<number | null>(null)
const pagando = ref(false)
const pagoError = ref('')
const showAnulDialog = ref(false)

const initials = computed(() => {
  if (!factura.value) return '?'
  return factura.value.nombreCliente?.[0]?.toUpperCase() || '?'
})

onMounted(async () => {
  try {
    const res = await facturasApi.getById(id)
    factura.value = res.data
  } catch (e: any) {
    error.value = e.response?.data?.message || 'No se pudo cargar la factura'
  } finally {
    loading.value = false
  }
})

function estadoColor(estado: string) {
  const colors: Record<string, string> = {
    PENDIENTE: 'badge-warning',
    PAGADA: 'badge-success',
    ANULADA: 'badge-error',
  }
  return colors[estado] || 'badge-ghost'
}

function formatFecha(fecha: string | null) {
  if (!fecha) return '—'
  const parts = fecha.split('-')
  const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]))
  return d.toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' })
}

function formatCurrency(valor: number) {
  return '$' + (valor?.toLocaleString('es-CO') || '0')
}

async function abrirPago() {
  metodoPagoSeleccionado.value = null
  pagoError.value = ''
  showPagoModal.value = true
  if (metodosPago.value.length === 0) {
    try {
      const res = await metodosPagoApi.getAll()
      metodosPago.value = (res.data || []).filter((m: any) => m.estado === true)
    } catch (e) {
      pagoError.value = 'No se pudieron cargar los métodos de pago'
    }
  }
}

function cerrarPago() {
  if (pagando.value) return
  showPagoModal.value = false
  pagoError.value = ''
}

async function ejecutarPago() {
  if (!factura.value || !metodoPagoSeleccionado.value) return
  pagando.value = true
  pagoError.value = ''
  try {
    await pagosApi.create({
      idFactura: factura.value.idFactura,
      idMetodoPago: metodoPagoSeleccionado.value,
      monto: factura.value.total || 0,
    })
    const res = await facturasApi.getById(id)
    factura.value = res.data
    showPagoModal.value = false
    success.value = 'Factura pagada correctamente'
    setTimeout(() => success.value = '', 3000)
  } catch (e: any) {
    pagoError.value = e.response?.data?.message || 'Error al procesar el pago'
  } finally {
    pagando.value = false
  }
}

async function handleAnular() {
  try {
    await facturasApi.cambiarEstado(id, 'ANULADA')
    const res = await facturasApi.getById(id)
    factura.value = res.data
    showAnulDialog.value = false
    success.value = 'Factura anulada'
    setTimeout(() => success.value = '', 3000)
  } catch (e: any) {
    error.value = e.response?.data?.message || 'No se pudo anular'
    showAnulDialog.value = false
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

    <template v-else-if="factura">
      <!-- Header -->
      <div class="flex items-center gap-4 mb-6">
        <button class="btn btn-ghost btn-sm btn-circle" @click="router.back()">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div class="flex-1">
          <h1 class="text-2xl font-extrabold text-[#FFFFE3]">Factura #{{ factura.idFactura }}</h1>
          <p class="text-sm text-base-content/50">Detalle de la factura</p>
        </div>
        <button
          v-if="factura.estadoFactura === 'PENDIENTE'"
          class="btn btn-success btn-md gap-1"
          @click="abrirPago"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
          </svg>
          Pagar
        </button>
        <span class="badge badge-lg" :class="estadoColor(factura.estadoFactura)">{{ factura.estadoFactura }}</span>
        <!-- 3-dot menu -->
        <div v-if="factura.estadoFactura === 'PENDIENTE'" class="dropdown dropdown-end">
          <div tabindex="0" role="button" class="btn btn-ghost btn-circle">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 5v.01M12 12v.01M12 19v.01" />
            </svg>
          </div>
          <ul tabindex="0" class="dropdown-content menu p-2 shadow-lg bg-[#2A2A2A] border border-white/10 rounded-xl w-52 z-50">
            <li>
              <a @click="showAnulDialog = true" class="text-red-400 hover:bg-red-500/20">Anular</a>
            </li>
          </ul>
        </div>
      </div>

      <!-- Info Card -->
      <div class="bg-base-100 rounded-2xl border border-base-300 overflow-hidden mb-6">
        <div class="bg-gradient-to-r from-[#0D7377]/20 to-transparent px-6 py-5 flex items-center gap-5">
          <div class="w-16 h-16 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center shadow-lg">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-7 w-7 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" />
            </svg>
          </div>
          <div class="flex-1">
            <h2 class="text-lg font-bold text-[#FFFFE3]">Factura #{{ factura.idFactura }}</h2>
            <p class="text-sm text-base-content/50">{{ factura.nombreCliente }}</p>
          </div>
          <div class="text-right">
            <p class="text-xs text-base-content/40 uppercase tracking-wider">Total</p>
            <p class="text-2xl font-extrabold text-primary">{{ formatCurrency(factura.total) }}</p>
          </div>
        </div>
        <div class="px-6 py-5 grid grid-cols-2 md:grid-cols-4 gap-5">
          <div>
            <p class="text-xs text-base-content/40 uppercase tracking-wider mb-1">Fecha</p>
            <p class="text-sm font-medium">{{ formatFecha(factura.fechaFactura) }}</p>
          </div>
          <div>
            <p class="text-xs text-base-content/40 uppercase tracking-wider mb-1">Cliente</p>
            <p class="text-sm font-medium">{{ factura.nombreCliente }}</p>
          </div>
          <div>
            <p class="text-xs text-base-content/40 uppercase tracking-wider mb-1">Estado</p>
            <span class="badge badge-sm" :class="estadoColor(factura.estadoFactura)">{{ factura.estadoFactura }}</span>
          </div>
          <div>
            <p class="text-xs text-base-content/40 uppercase tracking-wider mb-1">Descuento</p>
            <p class="text-sm font-medium">{{ formatCurrency(factura.descuento) }}</p>
          </div>
        </div>
      </div>

      <!-- Items -->
      <div class="bg-base-100 rounded-2xl border border-base-300 overflow-hidden">
        <div v-if="!factura.items || factura.items.length === 0" class="px-6 py-12 text-center text-base-content/40">
          No hay items en esta factura
        </div>
        <div v-else>
          <table class="table w-full">
            <thead>
              <tr class="border-b border-base-300">
                <th class="text-xs text-base-content/40 uppercase tracking-wider">Servicio</th>
                <th class="text-xs text-base-content/40 uppercase tracking-wider text-center">Cantidad</th>
                <th class="text-xs text-base-content/40 uppercase tracking-wider text-right">Precio</th>
                <th class="text-xs text-base-content/40 uppercase tracking-wider text-right">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in factura.items" :key="item.idDetalle" class="border-b border-base-300/50">
                <td class="font-medium">{{ item.nombreServicio }}</td>
                <td class="text-center">{{ item.cantidad }}</td>
                <td class="text-right">{{ formatCurrency(item.precio) }}</td>
                <td class="text-right font-medium">{{ formatCurrency(item.subtotal) }}</td>
              </tr>
            </tbody>
            <tfoot>
              <tr class="border-t border-base-300">
                <td colspan="3" class="text-right font-medium text-base-content/60">Subtotal</td>
                <td class="text-right font-medium">{{ formatCurrency(factura.subtotal) }}</td>
              </tr>
              <tr v-if="factura.descuento > 0">
                <td colspan="3" class="text-right font-medium text-base-content/60">Descuento</td>
                <td class="text-right font-medium text-error">-{{ formatCurrency(factura.descuento) }}</td>
              </tr>
              <tr class="border-t border-base-300">
                <td colspan="3" class="text-right font-bold text-[#FFFFE3]">Total</td>
                <td class="text-right font-extrabold text-primary text-lg">{{ formatCurrency(factura.total) }}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

    </template>

    <!-- Modal de pago -->
    <dialog :class="{ 'modal modal-open': showPagoModal }" v-if="showPagoModal">
      <div class="modal-box bg-[#1a1a2e] border border-white/10 max-w-sm p-0">
        <div class="px-5 pt-5 pb-4">
          <div class="flex items-center justify-between mb-4">
            <h3 class="font-bold text-lg text-[#FFFFE3]">Pagar factura #{{ factura?.idFactura }}</h3>
            <button class="btn btn-ghost btn-circle btn-xs text-base-content/40 hover:text-[#FFFFE3]" @click="cerrarPago">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>

          <div v-if="pagoError" class="alert alert-error mb-3 py-2 text-sm">
            <span>{{ pagoError }}</span>
          </div>

          <div class="bg-white/5 rounded-lg px-4 py-2.5 mb-4 flex items-center justify-between">
            <span class="text-xs text-base-content/50 uppercase tracking-wider">Total</span>
            <span class="text-lg font-extrabold text-primary">{{ formatCurrency(factura?.total ?? 0) }}</span>
          </div>

          <div class="form-control mb-4">
            <label class="label pb-1">
              <span class="label-text text-xs uppercase tracking-wider text-base-content/50">Método de pago</span>
            </label>
            <div class="grid grid-cols-1 gap-1.5">
              <label
                v-for="m in metodosPago"
                :key="m.idMetodoPago"
                class="flex items-center gap-2.5 px-3 py-2 rounded-lg cursor-pointer transition-all"
                :class="metodoPagoSeleccionado === m.idMetodoPago ? 'bg-primary/10 border border-primary/30' : 'bg-white/5 border border-transparent hover:bg-white/10'"
                @click="metodoPagoSeleccionado = m.idMetodoPago"
              >
                <input
                  type="radio"
                  name="metodoPagoEmpleado"
                  class="radio radio-xs radio-primary"
                  :value="m.idMetodoPago"
                  v-model="metodoPagoSeleccionado"
                />
                <span class="text-sm text-[#FFFFE3]">{{ m.descripcion || m.nombre }}</span>
              </label>
            </div>
          </div>
        </div>

        <div class="px-5 py-3 border-t border-white/10 flex justify-end gap-2">
          <button class="btn btn-ghost btn-sm" :disabled="pagando" @click="cerrarPago">Cancelar</button>
          <button
            class="btn btn-success btn-sm gap-1"
            :disabled="pagando || !metodoPagoSeleccionado"
            @click="ejecutarPago"
          >
            <span v-if="pagando" class="loading loading-spinner loading-xs"></span>
            <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
            Pagar
          </button>
        </div>
      </div>
      <form method="dialog" class="modal-backdrop" @click="cerrarPago">
        <button>close</button>
      </form>
    </dialog>

    <ConfirmDialog
      :show="showAnulDialog"
      title="Anular factura"
      message="¿Estás seguro de anular esta factura? Esta acción no se puede deshacer."
      confirmText="Anular"
      variant="error"
      @confirm="handleAnular"
      @cancel="showAnulDialog = false"
    />
  </div>
</template>

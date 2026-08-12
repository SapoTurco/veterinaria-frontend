<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { facturasApi } from '@/api/facturasApi'
import { pagosApi } from '@/api/pagosApi'
import { metodosPagoApi } from '@/api/metodosPagoApi'
import type { Factura } from '@/types/factura'

const facturas = ref<Factura[]>([])
const loading = ref(true)
const error = ref('')

const showPayModal = ref(false)
const facturaSeleccionada = ref<Factura | null>(null)
const metodosPago = ref<any[]>([])
const saving = ref(false)
const errorPago = ref('')
const exitoPago = ref(false)

const pagoForm = ref({
  idMetodoPago: 0,
  monto: 0,
  referenciaPago: '',
})

const metodoPagoLabel = computed(() => {
  const m = metodosPago.value.find((x: any) => x.idMetodoPago === pagoForm.value.idMetodoPago)
  return m ? (m.descripcion || m.nombre) : 'Seleccionar método de pago'
})

const facturasOrdenadas = computed(() => {
  return [...facturas.value].sort((a, b) => b.idFactura - a.idFactura)
})

const numerosFacturas = computed(() => {
  const mapa: Record<number, number> = {}
  const ordenadas = [...facturas.value].sort((a, b) => a.idFactura - b.idFactura)
  ordenadas.forEach((f, i) => {
    mapa[f.idFactura] = i + 1
  })
  return mapa
})

function seleccionarMetodo(metodo: any) {
  pagoForm.value.idMetodoPago = metodo.idMetodoPago
  const el = document.activeElement as HTMLElement | null
  el?.blur()
}

function estadoColor(estado: string) {
  const colors: Record<string, string> = {
    PENDIENTE: 'badge-warning',
    PAGADA: 'badge-success',
    ANULADA: 'badge-error',
  }
  return colors[estado] || 'badge-ghost'
}

function estadoLabel(estado: string) {
  const labels: Record<string, string> = {
    PENDIENTE: 'Pendiente de pago',
    PAGADA: 'Pagada',
    ANULADA: 'Anulada',
  }
  return labels[estado] || estado
}

function formatFecha(fecha: string) {
  const parts = fecha.split('-')
  const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]))
  return d.toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' })
}

async function openPayModal(factura: Factura) {
  facturaSeleccionada.value = factura
  pagoForm.value = {
    idMetodoPago: 0,
    monto: factura.total || 0,
    referenciaPago: '',
  }
  errorPago.value = ''
  exitoPago.value = false
  showPayModal.value = true

  if (metodosPago.value.length === 0) {
    try {
      const res = await metodosPagoApi.getAll()
      metodosPago.value = (res.data || []).filter((m: any) => m.estado === true)
    } catch (e) {
      console.error('Error loading metodos de pago', e)
    }
  }
}

function closePayModal() {
  showPayModal.value = false
  facturaSeleccionada.value = null
  errorPago.value = ''
  exitoPago.value = false
}

async function handlePago() {
  if (!facturaSeleccionada.value) return
  saving.value = true
  errorPago.value = ''
  try {
    await pagosApi.create({
      idFactura: facturaSeleccionada.value.idFactura,
      idMetodoPago: pagoForm.value.idMetodoPago,
      monto: pagoForm.value.monto,
      referenciaPago: pagoForm.value.referenciaPago || undefined,
    })

    exitoPago.value = true

    const response = await facturasApi.getMisFacturas()
    facturas.value = response.data

    setTimeout(() => {
      closePayModal()
    }, 2000)
  } catch (e: any) {
    errorPago.value = e.response?.data?.message || 'Error al procesar el pago'
  } finally {
    saving.value = false
  }
}

onMounted(async () => {
  try {
    const response = await facturasApi.getMisFacturas()
    facturas.value = response.data
  } catch (e: any) {
    error.value = e.response?.data?.message || 'No se pudieron cargar las facturas'
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div>
    <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
      <h1 class="text-2xl sm:text-3xl font-extrabold text-[#FFFFE3]">Mis Facturas</h1>
    </div>

    <div v-if="loading" class="flex justify-center py-12">
      <span class="loading loading-spinner loading-lg text-primary"></span>
    </div>

    <div v-else-if="error" class="card bg-base-100 shadow-md">
      <div class="card-body text-center py-12">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 mx-auto text-error/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
        <h3 class="text-lg font-medium mt-4">Algo salió mal</h3>
        <p class="text-base-content/50 mt-2">{{ error }}</p>
      </div>
    </div>

    <div v-else-if="facturas.length === 0" class="card bg-base-100 shadow-md">
      <div class="card-body text-center py-12">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 mx-auto text-base-content/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" />
        </svg>
        <h3 class="text-lg font-medium mt-4">No tienes facturas</h3>
        <p class="text-base-content/50 mt-2">Tus facturas aparecerán aquí después de tus citas</p>
      </div>
    </div>

    <div v-else class="space-y-4">
      <div
        v-for="factura in facturasOrdenadas"
        :key="factura.idFactura"
        class="card bg-base-100 shadow-md"
      >
        <div class="card-body">
          <div class="flex items-center justify-between">
            <div>
              <div class="flex items-center gap-2">
                <h3 class="font-bold">
                  Factura #{{ numerosFacturas[factura.idFactura] ?? factura.idFactura }}
                  <span class="text-sm font-medium text-base-content/40">de {{ facturas.length }}</span>
                </h3>
                <span class="badge badge-sm" :class="estadoColor(factura.estadoFactura)">
                  {{ estadoLabel(factura.estadoFactura) }}
                </span>
              </div>
              <p class="text-sm text-base-content/60 mt-1">
                {{ formatFecha(factura.fechaFactura) }}
              </p>
            </div>
            <div class="text-right">
              <p class="text-2xl font-bold text-primary">
                ${{ factura.total?.toLocaleString() }}
              </p>
              <button
                v-if="factura.estadoFactura === 'PENDIENTE'"
                class="btn btn-primary btn-sm mt-2 gap-2"
                @click="openPayModal(factura)"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
                Pagar
              </button>
            </div>
          </div>

          <div v-if="factura.items && factura.items.length > 0" class="mt-4">
            <table class="table table-sm">
              <thead>
                <tr>
                  <th>Servicio</th>
                  <th class="text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="detalle in factura.items" :key="detalle.idDetalle">
                  <td>{{ detalle.nombreServicio }}</td>
                  <td class="text-right">${{ detalle.subtotal?.toLocaleString() }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal de Pago -->
    <dialog :class="{ 'modal modal-open': showPayModal }" v-if="showPayModal">
      <div class="modal-box bg-[#1a1a2e] max-w-sm p-0">
        <!-- Exito -->
        <div v-if="exitoPago" class="px-5 py-8 text-center">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 mx-auto text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 class="text-base font-bold mt-3 text-[#FFFFE3]">Pago exitoso</h3>
          <p class="text-xs text-base-content/50 mt-1">Tu pago ha sido registrado correctamente</p>
        </div>

        <!-- Formulario -->
        <template v-else>
          <div class="px-5 pt-5 pb-4">
            <div class="flex items-center justify-between mb-4">
              <h3 class="font-bold text-lg text-[#FFFFE3]">Pagar Factura</h3>
              <button class="btn btn-ghost btn-circle btn-xs text-base-content/40 hover:text-[#FFFFE3]" @click="closePayModal">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div v-if="errorPago" class="alert alert-error mb-3 py-2 text-sm">
              <span>{{ errorPago }}</span>
            </div>

            <div v-if="facturaSeleccionada" class="bg-white/5 rounded-lg px-4 py-2.5 mb-4 flex items-center justify-between">
              <span class="text-xs text-base-content/50 uppercase tracking-wider">Total</span>
              <span class="text-lg font-extrabold text-primary">${{ facturaSeleccionada.total?.toLocaleString() }}</span>
            </div>

            <form @submit.prevent="handlePago">
              <div class="form-control mb-4">
                <label class="label pb-1">
                  <span class="label-text text-xs uppercase tracking-wider text-base-content/50">Método de pago</span>
                </label>
                <div class="grid grid-cols-1 gap-1.5">
                  <label
                    v-for="metodo in metodosPago"
                    :key="metodo.idMetodoPago"
                    class="flex items-center gap-2.5 px-3 py-2 rounded-lg cursor-pointer transition-all"
                    :class="pagoForm.idMetodoPago === metodo.idMetodoPago ? 'bg-primary/10 border border-primary/30' : 'bg-white/5 border border-transparent hover:bg-white/10'"
                    @click="seleccionarMetodo(metodo)"
                  >
                    <input
                      type="radio"
                      name="metodoPagoCliente"
                      class="radio radio-xs radio-primary"
                      :value="metodo.idMetodoPago"
                      :checked="pagoForm.idMetodoPago === metodo.idMetodoPago"
                    />
                    <span class="text-sm text-[#FFFFE3]">{{ metodo.descripcion || metodo.nombre }}</span>
                  </label>
                </div>
              </div>

              <div class="px-0 py-3 flex justify-end gap-2">
                <button type="button" class="btn btn-ghost btn-sm" @click="closePayModal">Cancelar</button>
                <button type="submit" class="btn btn-success btn-sm gap-1" :disabled="saving || pagoForm.idMetodoPago === 0 || pagoForm.monto <= 0">
                  <span v-if="saving" class="loading loading-spinner loading-xs"></span>
                  <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                  </svg>
                  Confirmar Pago
                </button>
              </div>
            </form>
          </div>
        </template>
      </div>
      <form method="dialog" class="modal-backdrop" @click="closePayModal">
        <button>close</button>
      </form>
    </dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { pagosApi } from '@/api/pagosApi'
import type { Pago } from '@/types/pago'
import DataTable from '@/components/common/DataTable.vue'
import PaginationBar from '@/components/common/PaginationBar.vue'

const allData = ref<Pago[]>([])
const router = useRouter()
const loading = ref(true)
const error = ref('')
const page = ref(0)
const size = ref(10)

const columns = [
  { key: 'idPago', label: '#', sortable: true },
  { key: 'fechaPago', label: 'Fecha', sortable: true },
  { key: 'monto', label: 'Monto', sortable: true },
  { key: 'nombreMetodoPago', label: 'Método de pago' },
  { key: 'idFactura', label: 'Factura #' },
  { key: 'referenciaPago', label: 'Referencia' },
]

const sortedData = computed(() =>
  [...allData.value].sort((a, b) => (b.fechaPago || '').localeCompare(a.fechaPago || ''))
)

const totalPages = computed(() => Math.max(1, Math.ceil(sortedData.value.length / size.value)))
const totalElements = computed(() => sortedData.value.length)
const data = computed(() => {
  const start = page.value * size.value
  return sortedData.value.slice(start, start + size.value)
})

async function loadData() {
  loading.value = true
  error.value = ''
  try {
    const response = await pagosApi.getAll()
    allData.value = response.data
  } catch (e: any) {
    error.value = e.response?.data?.message || 'No se pudieron cargar los pagos'
  } finally {
    loading.value = false
  }
}

function handlePageChange(newPage: number) {
  page.value = newPage
}

function formatFecha(fecha: string | null) {
  if (!fecha) return '—'
  const d = new Date(fecha.includes('T') ? fecha : fecha.replace(' ', 'T'))
  if (isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('es-CO')
}

onMounted(loadData)
</script>

<template>
  <div>
    <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
      <h1 class="text-2xl sm:text-3xl font-extrabold text-[#FFFFE3]">Pagos</h1>
    </div>

    <div v-if="error" class="alert alert-error mb-4">
      <span>{{ error }}</span>
    </div>

    <div class="card bg-base-100 shadow-md">
      <div class="card-body">
        <DataTable :columns="columns" :data="data" :loading="loading" emptyMessage="No se encontraron pagos">
          <template #cell-fechaPago="{ value }">
            {{ formatFecha(value) }}
          </template>
          <template #cell-monto="{ value }">
            ${{ value?.toLocaleString() }}
          </template>
          <template #actions="{ item }">
            <div class="flex gap-1">
              <button
                class="btn btn-ghost btn-xs text-info"
                @click="router.push(`/pagos/${item.idPago}`)"
              >
                Ver
              </button>
            </div>
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
  </div>
</template>

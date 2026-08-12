<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { facturasApi } from '@/api/facturasApi'
import type { Factura } from '@/types/factura'
import DataTable from '@/components/common/DataTable.vue'
import PaginationBar from '@/components/common/PaginationBar.vue'
import SearchFilter from '@/components/common/SearchFilter.vue'

const allData = ref<Factura[]>([])
const router = useRouter()
const loading = ref(true)
const error = ref('')
const page = ref(0)
const size = ref(10)
const search = ref('')
const filtroEstado = ref('')

const columns = [
  { key: 'idFactura', label: '#', sortable: true },
  { key: 'fechaFactura', label: 'Fecha', sortable: true },
  { key: 'nombreCliente', label: 'Cliente' },
  { key: 'total', label: 'Total', sortable: true },
  { key: 'estadoFactura', label: 'Estado', sortable: true },
]

const filteredData = computed(() => {
  let result = allData.value
  if (filtroEstado.value) {
    result = result.filter(f => f.estadoFactura === filtroEstado.value)
  }
  if (search.value) {
    const q = search.value.toLowerCase()
    result = result.filter(f =>
      f.nombreCliente?.toLowerCase().includes(q)
    )
  }
  return [...result].sort((a, b) => {
    const estadoOrder: Record<string, number> = { PENDIENTE: 0, PAGADA: 1, ANULADA: 2 }
    const orderA = estadoOrder[a.estadoFactura] ?? 3
    const orderB = estadoOrder[b.estadoFactura] ?? 3
    if (orderA !== orderB) return orderA - orderB
    return b.idFactura - a.idFactura
  })
})

const totalPages = computed(() => Math.max(1, Math.ceil(filteredData.value.length / size.value)))
const totalElements = computed(() => filteredData.value.length)
const data = computed(() => {
  const start = page.value * size.value
  return filteredData.value.slice(start, start + size.value)
})

async function loadData() {
  loading.value = true
  error.value = ''
  try {
    const response = await facturasApi.getAll()
    allData.value = response.data
  } catch (e: any) {
    error.value = e.response?.data?.message || 'No se pudieron cargar las facturas'
  } finally {
    loading.value = false
  }
}

async function cambiarEstado(factura: Factura, nuevoEstado: string) {
  try {
    await facturasApi.cambiarEstado(factura.idFactura, nuevoEstado)
    loadData()
  } catch (e) {
    console.error('Error changing estado', e)
  }
}

function estadoColor(estado: string) {
  const colors: Record<string, string> = {
    PENDIENTE: 'badge-warning',
    PAGADA: 'badge-success',
    ANULADA: 'badge-error',
  }
  return colors[estado] || 'badge-ghost'
}

function handlePageChange(newPage: number) {
  page.value = newPage
}

function handleSearch() {
  page.value = 0
}

onMounted(loadData)
</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-3xl font-extrabold text-[#FFFFE3]">Facturas</h1>
    </div>

    <div v-if="error" class="alert alert-error mb-4">
      <span>{{ error }}</span>
    </div>

    <div class="card bg-base-100 shadow-md">
      <div class="card-body">
        <div class="flex items-center gap-4 mb-4">
          <div class="flex-1">
            <SearchFilter v-model="search" @search="handleSearch" placeholder="Buscar por cliente..." />
          </div>
          <select v-model="filtroEstado" class="select select-bordered" @change="handleSearch">
            <option value="">Todos los estados</option>
            <option value="PENDIENTE">Pendiente</option>
            <option value="PAGADA">Pagada</option>
            <option value="ANULADA">Anulada</option>
          </select>
        </div>

        <DataTable :columns="columns" :data="data" :loading="loading" emptyMessage="No se encontraron facturas">
          <template #cell-fechaFactura="{ value }">
            {{ new Date(value).toLocaleDateString('es-CO') }}
          </template>
          <template #cell-total="{ value }">
            ${{ value?.toLocaleString() }}
          </template>
          <template #cell-estadoFactura="{ value }">
            <span class="badge" :class="estadoColor(value)">{{ value }}</span>
          </template>
          <template #actions="{ item }">
            <button
              class="btn btn-ghost btn-xs text-info"
              @click="router.push(`/facturas/${item.idFactura}`)"
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
  </div>
</template>

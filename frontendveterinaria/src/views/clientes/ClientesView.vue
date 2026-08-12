<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { clientesApi } from '@/api/clientesApi'
import type { Cliente } from '@/types/cliente'
import DataTable from '@/components/common/DataTable.vue'
import PaginationBar from '@/components/common/PaginationBar.vue'
import SearchFilter from '@/components/common/SearchFilter.vue'
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'

const router = useRouter()
const allData = ref<Cliente[]>([])
const loading = ref(true)
const error = ref('')
const success = ref('')
const page = ref(0)
const size = ref(10)
const search = ref('')
const showDeleteDialog = ref(false)
const selectedCliente = ref<Cliente | null>(null)
const showInactive = ref(false)

const columns = [
  { key: 'primerNombre', label: 'Nombre', sortable: true },
  { key: 'numeroDocumento', label: 'Documento' },
  { key: 'telefono', label: 'Teléfono' },
  { key: 'correo', label: 'Correo' },
  { key: 'createdAt', label: 'Fecha registro', sortable: true },
]

function nombreCompleto(cliente: Cliente): string {
  return [cliente.primerNombre, cliente.segundoNombre, cliente.primerApellido, cliente.segundoApellido]
    .filter(Boolean).join(' ')
}

const filteredData = computed(() => {
  let result = allData.value
  if (!showInactive.value) {
    result = result.filter(c => c.estado)
  }
  if (search.value) {
    const q = search.value.toLowerCase()
    result = result.filter(c =>
      nombreCompleto(c).toLowerCase().includes(q) ||
      c.numeroDocumento?.toLowerCase().includes(q) ||
      c.correo?.toLowerCase().includes(q)
    )
  }
  return [...result].sort((a, b) => {
    if (a.estado !== b.estado) return a.estado ? -1 : 1
    return (b.createdAt || '').localeCompare(a.createdAt || '')
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
    const response = await clientesApi.getAll(showInactive.value)
    allData.value = response.data
  } catch (e: any) {
    error.value = e.response?.data?.message || 'No se pudieron cargar los clientes'
  } finally {
    loading.value = false
  }
}

watch(showInactive, loadData)

function confirmDelete(cliente: Cliente) {
  selectedCliente.value = cliente
  showDeleteDialog.value = true
}

async function handleDelete() {
  if (!selectedCliente.value) return
  try {
    await clientesApi.cambiarEstado(selectedCliente.value.idCliente, false)
    showDeleteDialog.value = false
    loadData()
  } catch (e: any) {
    error.value = e.response?.data?.message || 'No se pudo eliminar el cliente'
    showDeleteDialog.value = false
  }
}

async function reactivar(cliente: Cliente) {
  try {
    await clientesApi.cambiarEstado(cliente.idCliente, true)
    loadData()
  } catch (e: any) {
    error.value = e.response?.data?.message || 'Error al reactivar'
  }
}

function handlePageChange(newPage: number) { page.value = newPage }
function handleSearch() { page.value = 0 }
function handleSort(field: string) { console.log('Sort by', field) }

onMounted(loadData)
</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-3xl font-extrabold text-[#FFFFE3]">Clientes</h1>
      <button class="btn btn-primary" @click="router.push('/clientes/nueva')">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
        Nuevo Cliente
      </button>
    </div>

    <div v-if="error" class="alert alert-error mb-4">
      <span>{{ error }}</span>
      <button class="btn btn-ghost btn-xs" @click="error = ''">X</button>
    </div>

    <div v-if="success" class="alert mb-4 bg-[#7a9e7e]/15 border border-[#7a9e7e]/30 text-[#7a9e7e]">
      <span>{{ success }}</span>
    </div>

    <div class="card bg-base-100 shadow-md">
      <div class="card-body">
        <div class="flex items-center gap-4 mb-4">
          <div class="flex-1">
            <SearchFilter v-model="search" @search="handleSearch" placeholder="Buscar por nombre, documento..." />
          </div>
          <label class="label cursor-pointer gap-2">
            <input type="checkbox" v-model="showInactive" class="toggle toggle-sm toggle-warning" />
            <span class="label-text text-sm">Mostrar Inactivos</span>
          </label>
        </div>

        <DataTable
          :columns="columns"
          :data="data"
          :loading="loading"
          emptyMessage="No se encontraron clientes"
          @sort="handleSort"
        >
          <template #cell-primerNombre="{ item }">
            <span :class="{ 'opacity-50 line-through': !item.estado }">
              {{ nombreCompleto(item) }}
            </span>
          </template>
          <template #cell-createdAt="{ value }">
            {{ new Date(value).toLocaleDateString('es-CO') }}
          </template>
          <template #actions="{ item }">
            <button class="btn btn-ghost btn-xs text-info" @click="router.push(`/clientes/${item.idCliente}`)">
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

    <!-- Dialog Eliminar -->
    <ConfirmDialog
      :show="showDeleteDialog"
      title="Eliminar cliente"
      :message="`¿Estás seguro de eliminar a ${selectedCliente ? nombreCompleto(selectedCliente) : ''}?`"
      confirmText="Eliminar"
      variant="error"
      @confirm="handleDelete"
      @cancel="showDeleteDialog = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { mascotasApi } from '@/api/mascotasApi'
import type { Mascota } from '@/types/mascota'
import DataTable from '@/components/common/DataTable.vue'
import PaginationBar from '@/components/common/PaginationBar.vue'
import SearchFilter from '@/components/common/SearchFilter.vue'
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'

const router = useRouter()
const allData = ref<Mascota[]>([])
const loading = ref(true)
const error = ref('')
const page = ref(0)
const size = ref(10)
const search = ref('')
const showDeleteDialog = ref(false)
const selectedMascota = ref<Mascota | null>(null)
const showInactive = ref(false)

const columns = [
  { key: 'nombre', label: 'Nombre', sortable: true },
  { key: 'especie', label: 'Especie' },
  { key: 'raza', label: 'Raza' },
  { key: 'sexo', label: 'Sexo' },
  { key: 'nombreCliente', label: 'Dueño' },
]

const filteredData = computed(() => {
  let result = allData.value
  result = result.filter(m => showInactive.value ? !m.estado : m.estado)
  if (search.value) {
    const q = search.value.toLowerCase()
    result = result.filter(m =>
      m.nombre?.toLowerCase().includes(q) ||
      m.especie?.toLowerCase().includes(q) ||
      m.raza?.toLowerCase().includes(q) ||
      m.nombreCliente?.toLowerCase().includes(q)
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
    const response = await mascotasApi.getAll(showInactive.value)
    allData.value = response.data
  } catch (e: any) {
    error.value = e.response?.data?.message || 'No se pudieron cargar las mascotas'
  } finally {
    loading.value = false
  }
}

watch(showInactive, loadData)

function confirmDelete(mascota: Mascota) {
  selectedMascota.value = mascota
  showDeleteDialog.value = true
}

async function handleDelete() {
  if (!selectedMascota.value) return
  try {
    await mascotasApi.delete(selectedMascota.value.idMascota)
    showDeleteDialog.value = false
    loadData()
  } catch (e) {
    console.error('Error deleting mascota', e)
  }
}

async function reactivar(mascota: Mascota) {
  try {
    await mascotasApi.reactivar(mascota.idMascota)
    loadData()
  } catch (e: any) {
    error.value = e.response?.data?.message || 'Error al reactivar'
  }
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
    <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
      <h1 class="text-2xl sm:text-3xl font-extrabold text-[#FFFFE3]">Mascotas</h1>
      <button class="btn btn-primary gap-2" @click="router.push('/mascotas/nueva')">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
        Nueva Mascota
      </button>
    </div>

    <div v-if="error" class="alert alert-error mb-4">
      <span>{{ error }}</span>
    </div>

    <div class="card bg-base-100 shadow-md">
      <div class="card-body">
        <div class="flex items-center gap-4 mb-4">
          <div class="flex-1">
            <SearchFilter v-model="search" @search="handleSearch" placeholder="Buscar por nombre, especie..." />
          </div>
          <div class="flex items-center gap-2">
            <label class="label cursor-pointer gap-2">
              <input type="checkbox" v-model="showInactive" class="toggle toggle-sm toggle-warning" />
              <span class="label-text text-sm">Mostrar inactivos</span>
            </label>
          </div>
        </div>

        <DataTable
          :columns="columns"
          :data="data"
          :loading="loading"
          emptyMessage="No se encontraron mascotas"
        >
          <template #cell-nombre="{ item }">
            <span :class="{ 'opacity-50 line-through': !item.estado }">
              {{ item.nombre }}
            </span>
          </template>
          <template #actions="{ item }">
            <button class="btn btn-ghost btn-xs text-info" @click="router.push(`/mascotas/${item.idMascota}`)">
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

    <ConfirmDialog
      :show="showDeleteDialog"
      title="Eliminar mascota"
      :message="`¿Estás seguro de eliminar a ${selectedMascota?.nombre}?`"
      confirmText="Eliminar"
      variant="error"
      @confirm="handleDelete"
      @cancel="showDeleteDialog = false"
    />
  </div>
</template>

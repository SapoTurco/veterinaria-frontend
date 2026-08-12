<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { empleadosApi } from '@/api/empleadosApi'
import type { Empleado } from '@/types/empleado'
import DataTable from '@/components/common/DataTable.vue'
import SearchFilter from '@/components/common/SearchFilter.vue'
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'

const data = ref<Empleado[]>([])
const router = useRouter()
const loading = ref(true)
const error = ref('')
const showInactive = ref(false)
const search = ref('')
const selected = ref<Empleado | null>(null)

const columns = [
  { key: 'primerNombre', label: 'Nombre', sortable: true },
  { key: 'telefono', label: 'Teléfono' },
  { key: 'correo', label: 'Correo' },
  { key: 'nombreCargo', label: 'Cargo' },
  { key: 'fechaIngreso', label: 'Fecha ingreso' },
]

const visibleData = computed(() => {
  let result = [...data.value]
  result = result.filter(e => showInactive.value ? !e.estado : e.estado)
  if (search.value) {
    const q = search.value.toLowerCase()
    result = result.filter(e =>
      fullName(e).toLowerCase().includes(q) ||
      e.nombreCargo?.toLowerCase().includes(q) ||
      e.correo?.toLowerCase().includes(q)
    )
  }
  return result.sort((a, b) => {
    if (a.estado !== b.estado) return a.estado ? -1 : 1
    return (b.createdAt || '').localeCompare(a.createdAt || '')
  })
})

function handleSearch() {}

async function loadData() {
  loading.value = true
  error.value = ''
  try {
    const empleadosRes = await empleadosApi.getAll(showInactive.value)
    data.value = empleadosRes.data.sort((a: any, b: any) => (b.createdAt || '').localeCompare(a.createdAt || ''))
  } catch (e: any) {
    error.value = e.response?.data?.message || 'No se pudieron cargar los empleados'
  } finally {
    loading.value = false
  }
}

watch(showInactive, loadData)

function fullName(empleado: Empleado): string {
  const parts = [empleado.primerNombre, empleado.segundoNombre, empleado.primerApellido, empleado.segundoApellido].filter(Boolean)
  return parts.join(' ')
}

const showDeleteDialog = ref(false)

function confirmDelete(empleado: Empleado) {
  selected.value = empleado
  showDeleteDialog.value = true
}

async function handleDelete() {
  if (!selected.value) return
  try {
    await empleadosApi.cambiarEstado(selected.value.idEmpleado, false)
    showDeleteDialog.value = false
    loadData()
  } catch (e: any) {
    error.value = e.response?.data?.message || 'Error al eliminar el empleado'
  }
}

async function reactivar(empleado: Empleado) {
  try {
    await empleadosApi.cambiarEstado(empleado.idEmpleado, true)
    loadData()
  } catch (e: any) {
    error.value = e.response?.data?.message || 'Error al reactivar'
  }
}

onMounted(async () => {
  await loadData()
})
</script>

<template>
  <div>
    <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
      <h1 class="text-2xl sm:text-3xl font-extrabold text-[#FFFFE3]">Empleados</h1>
      <button class="btn btn-primary" @click="router.push('/empleados/nueva')">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
        Nuevo Empleado
      </button>
    </div>

    <div v-if="error" class="alert alert-error mb-4">
      <span>{{ error }}</span>
    </div>

    <div class="card bg-base-100 shadow-md">
      <div class="card-body">
        <div class="flex items-center gap-4 mb-4">
          <div class="flex-1">
            <SearchFilter v-model="search" @search="handleSearch" placeholder="Buscar por nombre, cargo, correo..." />
          </div>
          <label class="label cursor-pointer gap-2">
            <input type="checkbox" v-model="showInactive" class="toggle toggle-sm toggle-warning" />
            <span class="label-text text-sm">Mostrar inactivos</span>
          </label>
        </div>
        <DataTable :columns="columns" :data="visibleData" :loading="loading" emptyMessage="No hay empleados">
          <template #cell-primerNombre="{ item }">
            <span :class="{ 'opacity-50 line-through': !item.estado }">
              {{ fullName(item) }}
            </span>
          </template>
          <template #cell-fechaIngreso="{ value }">
            {{ new Date(value).toLocaleDateString('es-CO') }}
          </template>
          <template #actions="{ item }">
            <button class="btn btn-ghost btn-xs text-info" @click="router.push(`/empleados/${item.idEmpleado}`)">
              Ver
            </button>
          </template>
        </DataTable>
      </div>
    </div>

    <ConfirmDialog
      :show="showDeleteDialog"
      title="Eliminar empleado"
      :message="`¿Estás seguro de eliminar a ${selected?.primerNombre} ${selected?.primerApellido}?`"
      confirmText="Eliminar"
      variant="error"
      @confirm="handleDelete"
      @cancel="showDeleteDialog = false"
    />
  </div>
</template>

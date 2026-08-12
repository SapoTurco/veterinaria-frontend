<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { serviciosApi } from '@/api/serviciosApi'
import type { Servicio } from '@/types/servicio'
import DataTable from '@/components/common/DataTable.vue'
import SearchFilter from '@/components/common/SearchFilter.vue'
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'

const data = ref<Servicio[]>([])
const loading = ref(true)
const showForm = ref(false)
const showDeleteDialog = ref(false)
const selectedServicio = ref<Servicio | null>(null)
const editMode = ref(false)
const showInactive = ref(false)
const search = ref('')
const submitted = ref(false)

const form = ref({
  idServicio: 0,
  nombre: '',
  descripcion: '',
  tipoServicio: 'CONSULTA',
  precio: 0,
})

const formValid = computed(() =>
  form.value.nombre.trim() !== '' &&
  form.value.precio > 0
)

const columns = [
  { key: 'nombre', label: 'Nombre', sortable: true },
  { key: 'tipoServicio', label: 'Tipo' },
  { key: 'precio', label: 'Precio', sortable: true },
  { key: 'descripcion', label: 'Descripción' },
  { key: 'estado', label: 'Estado' },
]

const visibleData = computed(() => {
  let result = [...data.value]
  if (!showInactive.value) {
    result = result.filter(s => s.estado)
  }
  if (search.value) {
    const q = search.value.toLowerCase()
    result = result.filter(s =>
      s.nombre?.toLowerCase().includes(q) ||
      s.tipoServicio?.toLowerCase().includes(q)
    )
  }
  return result.sort((a, b) => {
    if (a.estado !== b.estado) return a.estado ? -1 : 1
    if (a.idServicio === b.idServicio) return 0
    return (b.createdAt || '').localeCompare(a.createdAt || '')
  })
})

function handleSearch() {}

async function loadData() {
  loading.value = true
  try {
    const response = await serviciosApi.getAll(showInactive.value)
    data.value = response.data
  } catch (e) {
    console.error('Error loading servicios', e)
  } finally {
    loading.value = false
  }
}

watch(showInactive, loadData)

function openForm(servicio?: Servicio) {
  submitted.value = false
  if (servicio) {
    editMode.value = true
    form.value = {
      idServicio: servicio.idServicio,
      nombre: servicio.nombre,
      descripcion: servicio.descripcion || '',
      tipoServicio: servicio.tipoServicio,
      precio: servicio.precio,
    }
  } else {
    editMode.value = false
    form.value = { idServicio: 0, nombre: '', descripcion: '', tipoServicio: 'CONSULTA', precio: 0 }
  }
  showForm.value = true
}

async function handleSubmit() {
  submitted.value = true

  if (!formValid.value) {
    return
  }

  try {
    if (editMode.value && form.value.idServicio) {
      await serviciosApi.update(form.value.idServicio, form.value)
    } else {
      await serviciosApi.create(form.value)
    }
    showForm.value = false
    loadData()
  } catch (e) {
    console.error('Error saving servicio', e)
  }
}

function confirmDelete(servicio: Servicio) {
  selectedServicio.value = servicio
  showDeleteDialog.value = true
}

async function handleDelete() {
  if (!selectedServicio.value) return
  try {
    await serviciosApi.delete(selectedServicio.value.idServicio)
    showDeleteDialog.value = false
    loadData()
  } catch (e) {
    console.error('Error deleting servicio', e)
  }
}

async function reactivar(servicio: Servicio) {
  try {
    await serviciosApi.reactivar(servicio.idServicio)
    loadData()
  } catch (e: any) {
    console.error('Error reactivando servicio', e)
  }
}

onMounted(loadData)
</script>

<template>
  <div>
    <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
      <h1 class="text-2xl sm:text-3xl font-extrabold text-[#FFFFE3]">Servicios</h1>
      <button class="btn btn-primary" @click="openForm()">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
        Nuevo Servicio
      </button>
    </div>

    <div class="card bg-base-100 shadow-md">
      <div class="card-body">
        <div class="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-4">
          <div class="flex-1">
            <SearchFilter v-model="search" @search="handleSearch" placeholder="Buscar por nombre, tipo..." />
          </div>
          <label class="label cursor-pointer gap-2">
            <input type="checkbox" v-model="showInactive" class="toggle toggle-sm toggle-warning" />
            <span class="label-text text-sm">Mostrar inactivos</span>
          </label>
        </div>
        <DataTable :columns="columns" :data="visibleData" :loading="loading" emptyMessage="No hay servicios">
          <template #cell-nombre="{ item }">
            <span :class="{ 'opacity-50 line-through': !item.estado }">
              {{ item.nombre }}
            </span>
          </template>
          <template #cell-precio="{ value }">
            ${{ value?.toLocaleString() }}
          </template>
          <template #cell-estado="{ value }">
            <span :class="value ? 'badge badge-success badge-sm' : 'badge badge-error badge-sm'">
              {{ value ? 'Activo' : 'Inactivo' }}
            </span>
          </template>
          <template #actions="{ item }">
            <div class="flex gap-1">
              <button class="btn btn-ghost btn-xs" @click="openForm(item)">Editar</button>
              <button
                v-if="item.estado"
                class="btn btn-ghost btn-xs text-error"
                @click="confirmDelete(item)"
              >
                Eliminar
              </button>
              <button
                v-if="!item.estado"
                class="btn btn-ghost btn-xs text-success"
                @click="reactivar(item)"
              >
                Reactivar
              </button>
            </div>
          </template>
        </DataTable>
      </div>
    </div>

    <!-- Form Modal -->
    <dialog :class="{ modal: true, 'modal-open': showForm }">
      <div class="modal-box max-w-lg">
        <div class="flex items-center justify-between mb-4">
          <h3 class="font-bold text-xl">{{ editMode ? 'Editar Servicio' : 'Nuevo Servicio' }}</h3>
          <button class="btn btn-ghost btn-sm btn-circle" @click="showForm = false">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <form @submit.prevent="handleSubmit" class="space-y-3">
          <!-- Info basica -->
          <div class="bg-base-200/50 rounded-lg p-4 space-y-3">
            <h4 class="text-sm font-semibold text-base-content/70 uppercase tracking-wide flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              Información del servicio
            </h4>
            <div class="form-control">
              <label class="label py-0"><span class="label-text font-medium text-sm">Nombre *</span></label>
              <input v-model="form.nombre" type="text" class="input input-bordered input-sm w-full" placeholder="Nombre del servicio" />
              <label v-if="submitted && !form.nombre.trim()" class="label py-0">
                <span class="label-text-alt text-error text-xs">Debes ingresar el nombre del servicio</span>
              </label>
            </div>
            <div class="form-control">
              <label class="label py-0"><span class="label-text font-medium text-sm">Descripción</span></label>
              <textarea v-model="form.descripcion" class="textarea textarea-bordered textarea-sm w-full" rows="2" placeholder="Descripción del servicio..."></textarea>
            </div>
          </div>

          <!-- Tipo y Precio -->
          <div class="bg-base-200/50 rounded-lg p-4 space-y-3">
            <h4 class="text-sm font-semibold text-base-content/70 uppercase tracking-wide flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg>
              Tipo y precio
            </h4>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div class="form-control">
                <label class="label py-0"><span class="label-text font-medium text-sm">Tipo *</span></label>
                <select v-model="form.tipoServicio" class="select select-bordered select-sm w-full">
                  <option value="CONSULTA">Consulta</option>
                  <option value="ESTETICA">Estética</option>
                  <option value="OTRO">Otro</option>
                </select>
              </div>
              <div class="form-control">
                <label class="label py-0"><span class="label-text font-medium text-sm">Precio ($) *</span></label>
                <input v-model.number="form.precio" type="number" class="input input-bordered input-sm w-full" min="0" step="100" />
                <label v-if="submitted && form.precio <= 0" class="label py-0">
                  <span class="label-text-alt text-error text-xs">Debes ingresar un precio mayor a 0</span>
                </label>
              </div>
            </div>
          </div>

          <div class="modal-action">
            <button type="button" class="btn btn-ghost" @click="showForm = false">Cancelar</button>
            <button type="submit" class="btn btn-primary gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg>
              {{ editMode ? 'Actualizar' : 'Guardar' }}
            </button>
          </div>
        </form>
      </div>
      <form method="dialog" class="modal-backdrop">
        <button @click="showForm = false">close</button>
      </form>
    </dialog>

    <ConfirmDialog
      :show="showDeleteDialog"
      title="Eliminar servicio"
      :message="`¿Estás seguro de eliminar ${selectedServicio?.nombre}?`"
      confirmText="Eliminar"
      variant="error"
      @confirm="handleDelete"
      @cancel="showDeleteDialog = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { adminApi } from '@/api/adminApi'
import type { Rol } from '@/types/admin'
import DataTable from '@/components/common/DataTable.vue'
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'

const data = ref<Rol[]>([])
const loading = ref(true)
const showForm = ref(false)
const showDeleteDialog = ref(false)
const selected = ref<Rol | null>(null)
const editMode = ref(false)
const showInactive = ref(false)
const submitted = ref(false)

const form = ref({
  nombre: '',
  descripcion: '',
})

const formValid = computed(() => form.value.nombre.trim() !== '')

const columns = [
  { key: 'idRol', label: 'ID', sortable: true },
  { key: 'nombre', label: 'Nombre', sortable: true },
  { key: 'descripcion', label: 'Descripción' },
]

const visibleData = computed(() => {
  let result = [...data.value]
  if (!showInactive.value) {
    result = result.filter(r => r.estado)
  }
  return result.sort((a, b) => {
    if (a.estado !== b.estado) return a.estado ? -1 : 1
    return (a.idRol - b.idRol)
  })
})

async function loadData() {
  loading.value = true
  try {
    const response = await adminApi.getRoles(showInactive.value)
    data.value = response.data
  } catch (e) {
    console.error('Error loading roles', e)
  } finally {
    loading.value = false
  }
}

watch(showInactive, loadData)

function openForm(rol?: Rol) {
  submitted.value = false
  if (rol) {
    editMode.value = true
    selected.value = rol
    form.value = { nombre: rol.nombre, descripcion: rol.descripcion }
  } else {
    editMode.value = false
    selected.value = null
    form.value = { nombre: '', descripcion: '' }
  }
  showForm.value = true
}

async function handleSubmit() {
  submitted.value = true

  if (!formValid.value) {
    return
  }

  try {
    if (editMode.value && selected.value) {
      await adminApi.updateRol(selected.value.idRol, form.value)
    } else {
      await adminApi.createRol(form.value)
    }
    showForm.value = false
    loadData()
  } catch (e) {
    console.error('Error saving rol', e)
  }
}

function confirmDelete(rol: Rol) {
  selected.value = rol
  showDeleteDialog.value = true
}

async function handleDelete() {
  if (!selected.value) return
  try {
    await adminApi.deleteRol(selected.value.idRol)
    showDeleteDialog.value = false
    loadData()
  } catch (e) {
    console.error('Error deleting rol', e)
  }
}

async function reactivar(rol: Rol) {
  try {
    await adminApi.reactivarRol(rol.idRol)
    loadData()
  } catch (e) {
    console.error('Error reactivando rol', e)
  }
}

onMounted(loadData)
</script>

<template>
  <div>
    <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
      <h1 class="text-2xl sm:text-3xl font-extrabold text-[#FFFFE3]">Roles</h1>
      <button class="btn btn-primary" @click="openForm()">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
        Nuevo Rol
      </button>
    </div>

    <div class="card bg-base-100 shadow-md">
      <div class="card-body">
        <div class="flex items-center gap-4 mb-4">
          <div class="flex items-center gap-2">
            <label class="label cursor-pointer gap-2">
              <input type="checkbox" v-model="showInactive" class="toggle toggle-sm toggle-warning" />
              <span class="label-text text-sm">Mostrar inactivos</span>
            </label>
          </div>
        </div>
        <DataTable :columns="columns" :data="visibleData" :loading="loading" emptyMessage="No hay roles">
          <template #cell-nombre="{ item }">
            <span :class="{ 'opacity-50 line-through': !item.estado }">
              {{ item.nombre }}
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
        <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
          <h3 class="font-bold text-xl">{{ editMode ? 'Editar Rol' : 'Nuevo Rol' }}</h3>
          <button class="btn btn-ghost btn-sm btn-circle" @click="showForm = false">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <form @submit.prevent="handleSubmit" class="space-y-3">
          <div class="bg-base-200/50 rounded-lg p-4 space-y-3">
            <h4 class="text-sm font-semibold text-base-content/70 uppercase tracking-wide flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
              Información del rol
            </h4>
            <div class="form-control">
              <label class="label py-0"><span class="label-text font-medium text-sm">Nombre *</span></label>
              <input v-model="form.nombre" type="text" class="input input-bordered input-sm w-full" placeholder="Ej: ADMIN, VETERINARIO..." />
              <label v-if="submitted && !form.nombre.trim()" class="label py-0">
                <span class="label-text-alt text-error text-xs">Debes ingresar el nombre del rol</span>
              </label>
            </div>
            <div class="form-control">
              <label class="label py-0"><span class="label-text font-medium text-sm">Descripción</span></label>
              <textarea v-model="form.descripcion" class="textarea textarea-bordered textarea-sm w-full" rows="3" placeholder="Descripción del rol y sus funciones..."></textarea>
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
      title="Eliminar rol"
      :message="`¿Estás seguro de eliminar el rol ${selected?.nombre}?`"
      confirmText="Eliminar"
      variant="error"
      @confirm="handleDelete"
      @cancel="showDeleteDialog = false"
    />
  </div>
</template>

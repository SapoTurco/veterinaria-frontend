<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { mascotasApi } from '@/api/mascotasApi'
import { clientesApi } from '@/api/clientesApi'
import { useAuthStore } from '@/stores/authStore'
import SearchSelect from '@/components/common/SearchSelect.vue'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const isEdit = !!route.params.id
const MAX_MASCOTAS = 5

const isCliente = authStore.hasRole('CLIENTE') && !authStore.hasAnyRole('ADMIN', 'RECEPCIONISTA', 'VETERINARIO', 'ESTILISTA')

const form = ref({
  idCliente: 0,
  nombre: '',
  especie: '',
  raza: '',
  sexo: 'MACHO',
  fechaNacimiento: '',
  peso: '',
  observaciones: '',
})

const clientes = ref<any[]>([])
const loading = ref(false)
const error = ref('')
const mascotasActivasCount = ref(0)
const limitReached = ref(false)
const submitted = ref(false)

const formValid = computed(() =>
  form.value.nombre.trim() !== '' &&
  form.value.especie !== '' &&
  form.value.sexo !== ''
)

const pesoError = computed(() => {
  if (!form.value.peso) return ''
  const peso = Number(form.value.peso)
  return Number.isFinite(peso) && peso >= 0.01 && peso <= 500
    ? ''
    : 'El peso debe estar entre 0.01 y 500 kg'
})

const species = ['Perro', 'Gato', 'Ave', 'Reptil', 'Conejo', 'Hamster', 'Otro']

const hoy = computed(() => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
})

const clienteOptions = computed(() =>
  clientes.value.filter(c => c.estado === true).map(c => ({
    value: c.idCliente,
    label: `${c.primerNombre} ${c.primerApellido}`,
    sublabel: `${c.numeroDocumento} - ${c.correo || ''}`,
  }))
)

onMounted(async () => {
  if (!isCliente) {
    try {
      const res = await clientesApi.getAll()
      clientes.value = res.data
    } catch (e) {
      console.error('Error loading clientes', e)
    }
  } else {
    try {
      const res = await clientesApi.getProfile()
      form.value.idCliente = res.data.idCliente

      const mascotasRes = await mascotasApi.getMisMascotas()
      const mascotasActivas = (mascotasRes.data || []).filter((m: any) => m.estado === true)
      mascotasActivasCount.value = mascotasActivas.length
      limitReached.value = mascotasActivasCount.value >= MAX_MASCOTAS && !isEdit
    } catch (e) {
      console.error('Error loading profile', e)
    }
  }

  if (isEdit) {
    try {
      const res = await mascotasApi.getById(Number(route.params.id))
      const m = res.data
      form.value = {
        idCliente: m.idCliente,
        nombre: m.nombre,
        especie: m.especie,
        raza: m.raza || '',
        sexo: m.sexo,
        fechaNacimiento: m.fechaNacimiento || '',
        peso: m.peso?.toString() || '',
        observaciones: m.observaciones || '',
      }
    } catch (e) {
      console.error('Error loading mascota', e)
    }
  }
})

async function handleSubmit() {
  submitted.value = true
  error.value = ''

  if (!formValid.value || pesoError.value) {
    return
  }

  loading.value = true
  if (isCliente && !isEdit && mascotasActivasCount.value >= MAX_MASCOTAS) {
    error.value = `Has alcanzado el límite de ${MAX_MASCOTAS} mascotas activas. Desactiva una mascota existente para agregar una nueva.`
    loading.value = false
    return
  }

  if (form.value.fechaNacimiento && form.value.fechaNacimiento > hoy.value) {
    error.value = 'La fecha de nacimiento no puede ser una fecha futura'
    loading.value = false
    return
  }

  try {
    const data: any = {
      idCliente: form.value.idCliente,
      nombre: form.value.nombre,
      especie: form.value.especie,
      sexo: form.value.sexo,
    }
    if (form.value.raza) data.raza = form.value.raza
    if (form.value.fechaNacimiento) data.fechaNacimiento = form.value.fechaNacimiento
    if (form.value.peso) data.peso = parseFloat(form.value.peso)
    if (form.value.observaciones) data.observaciones = form.value.observaciones

    if (isEdit) {
      await mascotasApi.update(Number(route.params.id), data)
    } else {
      await mascotasApi.create(data)
    }
    router.push(isCliente ? '/mis-mascotas' : '/mascotas')
  } catch (e: any) {
    error.value = e.response?.data?.message || 'Error al guardar la mascota'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="max-w-2xl mx-auto">
    <div class="flex items-center gap-3 mb-6">
      <button class="btn btn-ghost btn-sm btn-circle" @click="router.back()">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" /></svg>
      </button>
      <div>
        <h1 class="text-2xl sm:text-3xl font-extrabold text-[#FFFFE3]">{{ isEdit ? 'Editar Mascota' : 'Nueva Mascota' }}</h1>
        <p class="text-sm text-base-content/60">{{ isEdit ? 'Actualiza los datos de la mascota' : 'Registra una nueva mascota en el sistema' }}</p>
      </div>
    </div>

    <div v-if="error" class="alert alert-error mb-4">
      <span>{{ error }}</span>
    </div>

    <form @submit.prevent="handleSubmit" class="space-y-3">
      <!-- Info basica -->
      <div class="bg-base-100 rounded-xl p-5 space-y-3">
        <h4 class="text-sm font-semibold text-base-content/70 uppercase tracking-wide flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" /></svg>
          Información básica
        </h4>
        <div class="form-control">
          <label class="label py-0"><span class="label-text font-medium text-sm">Nombre *</span></label>
          <input v-model="form.nombre" type="text" class="input input-bordered input-sm w-full" placeholder="Nombre de la mascota" />
          <label v-if="submitted && !form.nombre.trim()" class="label py-0">
            <span class="label-text-alt text-error text-xs">Debes ingresar el nombre</span>
          </label>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div class="form-control">
            <label class="label py-0"><span class="label-text font-medium text-sm">Especie *</span></label>
            <select v-model="form.especie" class="select select-bordered select-sm w-full">
              <option value="" disabled>Seleccionar</option>
              <option v-for="s in species" :key="s" :value="s">{{ s }}</option>
            </select>
            <label v-if="submitted && !form.especie" class="label py-0">
              <span class="label-text-alt text-error text-xs">Debes seleccionar una especie</span>
            </label>
          </div>
          <div class="form-control">
            <label class="label py-0"><span class="label-text font-medium text-sm">Raza</span></label>
            <input v-model="form.raza" type="text" class="input input-bordered input-sm w-full" placeholder="Ej: Labrador, Siames..." />
          </div>
        </div>
      </div>

      <!-- Detalles -->
      <div class="bg-base-100 rounded-xl p-5 space-y-3">
        <h4 class="text-sm font-semibold text-base-content/70 uppercase tracking-wide flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
          Detalles
        </h4>
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div class="form-control">
            <label class="label py-0"><span class="label-text font-medium text-sm">Sexo *</span></label>
            <select v-model="form.sexo" class="select select-bordered select-sm w-full">
              <option value="MACHO">Macho</option>
              <option value="HEMBRA">Hembra</option>
            </select>
          </div>
          <div class="form-control">
            <label class="label py-0"><span class="label-text font-medium text-sm">Peso (kg)</span></label>
            <input v-model="form.peso" type="number" step="0.01" class="input input-bordered input-sm w-full" placeholder="Ej: 5.2" />
            <label v-if="pesoError" class="label py-0">
              <span class="label-text-alt text-error text-xs">{{ pesoError }}</span>
            </label>
          </div>
          <div class="form-control">
            <label class="label py-0"><span class="label-text font-medium text-sm">Fecha nacimiento *</span></label>
            <input
              v-model="form.fechaNacimiento"
              type="date"
              class="input input-bordered input-sm w-full"
              :max="hoy"
              :style="{ colorScheme: 'dark' }"
            />
            <label v-if="submitted && form.fechaNacimiento && form.fechaNacimiento > hoy" class="label py-0">
              <span class="label-text-alt text-error text-xs">La fecha no puede ser futura</span>
            </label>
          </div>
        </div>
        <div class="form-control">
          <label class="label py-0"><span class="label-text font-medium text-sm">Observaciones</span></label>
          <textarea v-model="form.observaciones" class="textarea textarea-bordered textarea-sm w-full" rows="2" placeholder="Alergias, condiciones medicas, etc."></textarea>
        </div>
      </div>

      <!-- Dueño (solo admin/recepcionista) -->
      <div v-if="!isCliente" class="bg-base-100 rounded-xl p-5 space-y-3">
        <h4 class="text-sm font-semibold text-base-content/70 uppercase tracking-wide flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
          Dueño
        </h4>
        <div class="form-control">
          <label class="label py-0"><span class="label-text font-medium text-sm">Cliente *</span></label>
          <SearchSelect
            v-model="form.idCliente"
            :options="clienteOptions"
            placeholder="Buscar por nombre o documento..."
            :required="true"
          />
          <label v-if="submitted && !form.idCliente" class="label py-0">
            <span class="label-text-alt text-error text-xs">Debes seleccionar un cliente</span>
          </label>
        </div>
      </div>

      <!-- Acciones -->
      <div class="flex justify-end gap-3 pt-2">
        <button type="button" class="btn btn-ghost" @click="router.back()">Cancelar</button>
        <button type="submit" class="btn btn-primary gap-2" :disabled="loading">
          <span v-if="loading" class="loading loading-spinner loading-sm"></span>
          <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg>
          {{ isEdit ? 'Actualizar' : 'Crear Mascota' }}
        </button>
      </div>
    </form>
  </div>
</template>

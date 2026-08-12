<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { clientesApi } from '@/api/clientesApi'

const route = useRoute()
const router = useRouter()
const isEdit = !!route.params.id

const form = ref({
  tipoDocumento: 'CC',
  numeroDocumento: '',
  primerNombre: '',
  segundoNombre: '',
  primerApellido: '',
  segundoApellido: '',
  telefono: '',
  correo: '',
  direccion: '',
})

const crearUsuario = ref(false)
const usuarioForm = ref({ password: '' })
const editPassword = ref('')
const loading = ref(false)
const error = ref('')

const nombreUsuarioPreview = computed(() => {
  if (!form.value.correo) return ''
  return form.value.correo.split('@')[0]
})

onMounted(async () => {
  if (isEdit) {
    try {
      const res = await clientesApi.getById(Number(route.params.id))
      const c = res.data
      form.value = {
        tipoDocumento: c.tipoDocumento || 'CC',
        numeroDocumento: c.numeroDocumento || '',
        primerNombre: c.primerNombre,
        segundoNombre: c.segundoNombre || '',
        primerApellido: c.primerApellido,
        segundoApellido: c.segundoApellido || '',
        telefono: c.telefono || '',
        correo: c.correo || '',
        direccion: c.direccion || '',
      }
    } catch (e: any) {
      error.value = e.response?.data?.message || 'No se pudo cargar el cliente'
    }
  }
})

async function handleSubmit() {
  loading.value = true
  error.value = ''
  try {
    if (isEdit) {
      const payload: any = { ...form.value }
      if (editPassword.value) {
        payload.password = editPassword.value
      }
      await clientesApi.update(Number(route.params.id), payload)
    } else {
      const res = await clientesApi.create(form.value)
      if (crearUsuario.value && form.value.correo && usuarioForm.value.password) {
        await clientesApi.crearUsuario(res.data.idCliente, {
          email: form.value.correo,
          password: usuarioForm.value.password,
        })
      }
    }
    router.push('/clientes')
  } catch (e: any) {
    error.value = e.response?.data?.message || 'Error al guardar el cliente'
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
        <h1 class="text-3xl font-extrabold text-[#FFFFE3]">{{ isEdit ? 'Editar Cliente' : 'Nuevo Cliente' }}</h1>
        <p class="text-sm text-base-content/60">{{ isEdit ? 'Actualiza los datos del cliente' : 'Registra un nuevo cliente en el sistema' }}</p>
      </div>
    </div>

    <div v-if="error" class="alert alert-error mb-4">
      <span>{{ error }}</span>
    </div>

    <form @submit.prevent="handleSubmit" class="space-y-3">
      <!-- Documento -->
      <div class="bg-base-100 rounded-xl border border-base-300 p-5 space-y-3">
        <h4 class="text-sm font-semibold text-base-content/70 uppercase tracking-wide flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0" /></svg>
          Documento
        </h4>
        <div class="grid grid-cols-2 gap-3">
          <div class="form-control">
            <label class="label py-0"><span class="label-text font-medium text-sm">Tipo *</span></label>
            <select v-model="form.tipoDocumento" class="select select-bordered select-sm w-full" required>
              <option value="CC">Cedula de Ciudadania</option>
              <option value="CE">Cedula de Extranjeria</option>
              <option value="PASAPORTE">Pasaporte</option>
            </select>
          </div>
          <div class="form-control">
            <label class="label py-0"><span class="label-text font-medium text-sm">Numero *</span></label>
            <input v-model="form.numeroDocumento" type="text" class="input input-bordered input-sm w-full" required placeholder="Numero de documento" />
          </div>
        </div>
      </div>

      <!-- Datos personales -->
      <div class="bg-base-100 rounded-xl border border-base-300 p-5 space-y-3">
        <h4 class="text-sm font-semibold text-base-content/70 uppercase tracking-wide flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
          Datos personales
        </h4>
        <div class="grid grid-cols-2 gap-3">
          <div class="form-control">
            <label class="label py-0"><span class="label-text font-medium text-sm">Primer nombre *</span></label>
            <input v-model="form.primerNombre" type="text" class="input input-bordered input-sm w-full" required placeholder="Primer nombre" />
          </div>
          <div class="form-control">
            <label class="label py-0"><span class="label-text font-medium text-sm">Segundo nombre</span></label>
            <input v-model="form.segundoNombre" type="text" class="input input-bordered input-sm w-full" placeholder="Segundo nombre" />
          </div>
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div class="form-control">
            <label class="label py-0"><span class="label-text font-medium text-sm">Primer apellido *</span></label>
            <input v-model="form.primerApellido" type="text" class="input input-bordered input-sm w-full" required placeholder="Primer apellido" />
          </div>
          <div class="form-control">
            <label class="label py-0"><span class="label-text font-medium text-sm">Segundo apellido</span></label>
            <input v-model="form.segundoApellido" type="text" class="input input-bordered input-sm w-full" placeholder="Segundo apellido" />
          </div>
        </div>
      </div>

      <!-- Contacto -->
      <div class="bg-base-100 rounded-xl border border-base-300 p-5 space-y-3">
        <h4 class="text-sm font-semibold text-base-content/70 uppercase tracking-wide flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
          Contacto
        </h4>
        <div class="grid grid-cols-2 gap-3">
          <div class="form-control">
            <label class="label py-0"><span class="label-text font-medium text-sm">Telefono</span></label>
            <input v-model="form.telefono" type="tel" class="input input-bordered input-sm w-full" placeholder="Telefono" />
          </div>
          <div class="form-control">
            <label class="label py-0"><span class="label-text font-medium text-sm">Correo</span></label>
            <input v-model="form.correo" type="email" class="input input-bordered input-sm w-full" placeholder="Correo electronico" />
          </div>
        </div>
        <div class="form-control">
          <label class="label py-0"><span class="label-text font-medium text-sm">Direccion</span></label>
          <input v-model="form.direccion" type="text" class="input input-bordered input-sm w-full" placeholder="Direccion" />
        </div>
      </div>

      <!-- Credenciales (solo al crear) -->
      <div v-if="!isEdit" class="bg-base-100 rounded-xl border border-base-300 p-5 space-y-3">
        <h4 class="text-sm font-semibold text-base-content/70 uppercase tracking-wide flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg>
          Credenciales de acceso
        </h4>
        <div class="form-control">
          <label class="label cursor-pointer gap-3">
            <input type="checkbox" v-model="crearUsuario" class="checkbox checkbox-sm checkbox-primary" />
            <span class="label-text text-sm">Crear usuario para que el cliente pueda iniciar sesion</span>
          </label>
        </div>
        <div v-if="crearUsuario" class="space-y-3">
          <div class="form-control">
            <label class="label py-0"><span class="label-text font-medium text-sm">Nombre de usuario</span></label>
            <input :value="nombreUsuarioPreview" type="text" class="input input-bordered input-sm w-full bg-base-200" disabled :placeholder="form.correo ? '' : 'Se genera desde el correo de contacto'" />
          </div>
          <div class="form-control">
            <label class="label py-0"><span class="label-text font-medium text-sm">Contrasena *</span></label>
            <input v-model="usuarioForm.password" type="password" class="input input-bordered input-sm w-full" placeholder="Minimo 8 caracteres" minlength="8" required />
          </div>
        </div>
      </div>

      <!-- Cambiar contrasena (solo al editar) -->
      <div v-if="isEdit" class="bg-base-100 rounded-xl border border-base-300 p-5 space-y-3">
        <h4 class="text-sm font-semibold text-base-content/70 uppercase tracking-wide flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg>
          Cambiar contrasena
        </h4>
        <div class="form-control">
          <label class="label py-0"><span class="label-text font-medium text-sm">Nueva contrasena (dejar vacio para no cambiar)</span></label>
          <input v-model="editPassword" type="password" class="input input-bordered input-sm w-full" placeholder="Minimo 8 caracteres" minlength="8" />
        </div>
      </div>

      <!-- Acciones -->
      <div class="flex justify-end gap-3 pt-2">
        <button type="button" class="btn btn-ghost" @click="router.back()">Cancelar</button>
        <button
          type="submit"
          class="btn btn-primary gap-2"
          :disabled="loading || (!isEdit && crearUsuario && (!form.correo || usuarioForm.password.length < 8))"
        >
          <span v-if="loading" class="loading loading-spinner loading-sm"></span>
          <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg>
          {{ isEdit ? 'Actualizar' : 'Crear Cliente' }}
        </button>
      </div>
    </form>
  </div>
</template>

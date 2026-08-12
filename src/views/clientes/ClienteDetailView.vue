<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { clientesApi } from '@/api/clientesApi'
import { mascotasApi } from '@/api/mascotasApi'
import { adminApi } from '@/api/adminApi'
import type { Cliente } from '@/types/cliente'
import type { Mascota } from '@/types/mascota'
import type { Usuario } from '@/types/admin'
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'
import { useAuthStore } from '@/stores/authStore'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const esAdmin = computed(() => authStore.hasRole('ADMIN'))
const cliente = ref<Cliente | null>(null)
const mascotas = ref<Mascota[]>([])
const loading = ref(true)
const error = ref('')
const success = ref('')
const id = Number(route.params.id)
const showDeleteDialog = ref(false)
const showReactivateDialog = ref(false)
const showPasswordDialog = ref(false)
const nuevaPassword = ref('')
const resetPasswordLoading = ref(false)
const resetError = ref('')
const resetSuccess = ref('')
const mostrarClave = ref(false)
const showCrearCuentaDialog = ref(false)
const cuentaEmail = ref('')
const cuentaPassword = ref('')
const cuentaMostrarClave = ref(false)
const crearCuentaLoading = ref(false)
const crearCuentaError = ref('')
const crearCuentaSuccess = ref('')

const nombreCompleto = computed(() => {
  if (!cliente.value) return ''
  return [cliente.value.primerNombre, cliente.value.segundoNombre, cliente.value.primerApellido, cliente.value.segundoApellido]
    .filter(Boolean).join(' ')
})

const initials = computed(() => {
  if (!cliente.value) return '?'
  return ((cliente.value.primerNombre?.[0] || '') + (cliente.value.primerApellido?.[0] || '')).toUpperCase()
})

const usuarios = ref<Usuario[]>([])

const tieneCuenta = computed(() => {
  return (usuarios.value || []).some((u) => u.idCliente === cliente.value?.idCliente)
})

const puedeCrearCuenta = computed(() => {
  return authStore.hasModule('CLIENTES') && !tieneCuenta.value
})

onMounted(async () => {
  cargarUsuarios()
  try {
    const [clienteRes, mascotasRes] = await Promise.all([
      clientesApi.getById(id),
      mascotasApi.getByCliente(id),
    ])
    cliente.value = clienteRes.data
    mascotas.value = (mascotasRes.data || []).filter((m: any) => m.estado === true)
  } catch (e: any) {
    error.value = e.response?.data?.message || 'No se pudo cargar el cliente'
  } finally {
    loading.value = false
  }
})

async function cargarUsuarios() {
  if (!authStore.hasModule('CLIENTES')) return
  try {
    const res = await adminApi.getUsuarios()
    usuarios.value = res.data || []
  } catch {
    usuarios.value = []
  }
}

async function handleDelete() {
  try {
    await clientesApi.cambiarEstado(id, false)
    showDeleteDialog.value = false
    success.value = 'Cliente desactivado correctamente'
    setTimeout(() => router.push('/clientes'), 1500)
  } catch (e: any) {
    error.value = e.response?.data?.message || 'No se pudo desactivar'
    showDeleteDialog.value = false
  }
}

async function handleReactivate() {
  try {
    await clientesApi.cambiarEstado(id, true)
    showReactivateDialog.value = false
    const res = await clientesApi.getById(id)
    cliente.value = res.data
    success.value = 'Cliente reactivado correctamente'
    setTimeout(() => success.value = '', 3000)
  } catch (e: any) {
    error.value = e.response?.data?.message || 'No se pudo reactivar'
    showReactivateDialog.value = false
  }
}

async function openPasswordDialog() {
  nuevaPassword.value = ''
  resetError.value = ''
  resetSuccess.value = ''
  mostrarClave.value = false
  resetPasswordLoading.value = false
  showPasswordDialog.value = true
}

async function handleResetPassword() {
  if (nuevaPassword.value.length < 8) {
    resetError.value = 'La contraseña debe tener al menos 8 caracteres'
    return
  }
  try {
    const res = await adminApi.getUsuarios()
    const usuario = (res.data || []).find((u: Usuario) => u.idCliente === cliente.value?.idCliente)
    if (!usuario) {
      resetError.value = 'Este cliente no tiene usuario asociado'
      return
    }
    resetPasswordLoading.value = true
    resetError.value = ''
    await adminApi.restablecerPassword(usuario.idUsuario, nuevaPassword.value)
    resetSuccess.value = 'Contraseña restablecida correctamente'
    setTimeout(() => {
      showPasswordDialog.value = false
      resetSuccess.value = ''
    }, 1500)
  } catch (e: any) {
    resetError.value = e.response?.data?.message || 'No se pudo restablecer la contraseña'
  } finally {
    resetPasswordLoading.value = false
  }
}

function formatFecha(fecha: string | null) {
  if (!fecha) return '—'
  const dateStr = fecha.split('T')[0] ?? fecha
  const parts = dateStr.split('-')
  const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]))
  return d.toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' })
}

function openCrearCuentaDialog() {
  cuentaEmail.value = ''
  cuentaPassword.value = ''
  cuentaMostrarClave.value = false
  crearCuentaError.value = ''
  crearCuentaSuccess.value = ''
  crearCuentaLoading.value = false
  showCrearCuentaDialog.value = true
}

async function handleCrearCuenta() {
  cuentaEmail.value = cuentaEmail.value.trim().toLowerCase()
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cuentaEmail.value)) {
    crearCuentaError.value = 'Ingresa un correo electrónico válido para la cuenta'
    return
  }
  if (cuentaPassword.value.length < 8) {
    crearCuentaError.value = 'La contraseña debe tener al menos 8 caracteres'
    return
  }
  try {
    crearCuentaLoading.value = true
    crearCuentaError.value = ''
    await clientesApi.crearUsuario(id, {
      email: cuentaEmail.value,
      password: cuentaPassword.value,
    })
    crearCuentaSuccess.value = 'Cuenta creada correctamente'
    cargarUsuarios()
    setTimeout(() => {
      showCrearCuentaDialog.value = false
      crearCuentaSuccess.value = ''
    }, 1500)
  } catch (e: any) {
    crearCuentaError.value = e.response?.data?.message || 'No se pudo crear la cuenta'
  } finally {
    crearCuentaLoading.value = false
  }
}
</script>

<template>
  <div class="max-w-5xl mx-auto">
    <div v-if="error" class="alert alert-error mb-4">
      <span>{{ error }}</span>
      <button class="btn btn-ghost btn-xs" @click="error = ''">X</button>
    </div>

    <div v-if="success" class="alert mb-4 bg-[#7a9e7e]/15 border border-[#7a9e7e]/30 text-[#7a9e7e]">
      <span>{{ success }}</span>
    </div>

    <div v-if="loading" class="flex justify-center py-20">
      <span class="loading loading-spinner loading-lg text-primary"></span>
    </div>

    <template v-else-if="cliente">
      <!-- Header -->
      <div class="flex items-center gap-4 mb-6">
        <button class="btn btn-ghost btn-sm btn-circle" @click="router.back()">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div class="flex-1">
          <h1 class="text-xl sm:text-2xl font-extrabold text-[#FFFFE3] flex items-center gap-2">
            {{ nombreCompleto }}
            <svg v-if="tieneCuenta" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="h-5 w-5 text-primary inline-block shrink-0" title="Tiene cuenta de acceso">
              <path fill-rule="evenodd" d="M8.603 3.799A4.49 4.49 0 0112 2.25c1.357 0 2.573.6 3.397 1.549a4.49 4.49 0 013.498 1.307 4.491 4.491 0 011.307 3.497A4.49 4.49 0 0121.75 12a4.49 4.49 0 01-1.549 3.397 4.491 4.491 0 01-1.307 3.497 4.491 4.491 0 01-3.497 1.307A4.49 4.49 0 0112 21.75a4.49 4.49 0 01-3.397-1.549 4.49 4.49 0 01-3.498-1.306 4.491 4.491 0 01-1.307-3.498A4.49 4.49 0 012.25 12c0-1.357.6-2.573 1.549-3.397a4.49 4.49 0 011.307-3.497 4.49 4.49 0 013.497-1.307zm7.007 6.387a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clip-rule="evenodd" />
            </svg>
          </h1>
          <p class="text-sm text-base-content/50">Detalle del cliente</p>
        </div>
        <span class="badge badge-lg hidden sm:inline-flex" :class="cliente.estado ? 'badge-success' : 'badge-error'">
          {{ cliente.estado ? 'Activo' : 'Inactivo' }}
        </span>
        <!-- 3-dot menu -->
        <div class="dropdown dropdown-end">
          <div tabindex="0" role="button" class="btn btn-ghost btn-circle">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 5v.01M12 12v.01M12 19v.01" />
            </svg>
          </div>
          <ul tabindex="0" class="dropdown-content menu p-2 shadow-lg bg-[#2A2A2A] rounded-xl w-52 z-50">
            <li><a @click="router.push(`/clientes/${id}/editar`)" class="text-[#CBCBCB] hover:bg-white/10 hover:text-[#FFFFE3]">Editar</a></li>
            <li v-if="puedeCrearCuenta"><a @click="openCrearCuentaDialog" class="text-[#CBCBCB] hover:bg-white/10 hover:text-[#FFFFE3]">Crear cuenta</a></li>
            <li v-if="esAdmin && tieneCuenta"><a @click="openPasswordDialog" class="text-[#CBCBCB] hover:bg-white/10 hover:text-[#FFFFE3]">Restablecer contraseña</a></li>
            <li v-if="cliente.estado"><a @click="showDeleteDialog = true" class="text-red-400 hover:bg-red-500/20">Desactivar</a></li>
            <li v-if="!cliente.estado"><a @click="showReactivateDialog = true" class="text-green-400 hover:bg-green-500/20">Reactivar</a></li>
          </ul>
        </div>
      </div>

      <!-- Info Card -->
      <div class="bg-base-100 rounded-2xl overflow-hidden mb-6">
        <div class="bg-gradient-to-r from-[#0D7377]/20 to-transparent px-6 py-5 flex items-center gap-5">
          <div class="w-16 h-16 rounded-full bg-gradient-to-br from-[#0D7377] to-[#4A4A4A] flex items-center justify-center shadow-lg">
            <span class="text-[#FFFFE3] font-bold text-xl">{{ initials }}</span>
          </div>
          <div class="flex-1">
            <h2 class="text-lg font-bold text-[#FFFFE3] flex items-center gap-1.5">
              {{ nombreCompleto }}
              <svg v-if="tieneCuenta" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="h-5 w-5 text-primary inline-block shrink-0" title="Tiene cuenta de acceso">
                <path fill-rule="evenodd" d="M8.603 3.799A4.49 4.49 0 0112 2.25c1.357 0 2.573.6 3.397 1.549a4.49 4.49 0 013.498 1.307 4.491 4.491 0 011.307 3.497A4.49 4.49 0 0121.75 12a4.49 4.49 0 01-1.549 3.397 4.491 4.491 0 01-1.307 3.497 4.491 4.491 0 01-3.497 1.307A4.49 4.49 0 0112 21.75a4.49 4.49 0 01-3.397-1.549 4.49 4.49 0 01-3.498-1.306 4.491 4.491 0 01-1.307-3.498A4.49 4.49 0 012.25 12c0-1.357.6-2.573 1.549-3.397a4.49 4.49 0 011.307-3.497 4.49 4.49 0 013.497-1.307zm7.007 6.387a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clip-rule="evenodd" />
              </svg>
            </h2>
            <p class="text-sm text-base-content/50">{{ cliente.tipoDocumento }} {{ cliente.numeroDocumento }}</p>
          </div>
        </div>
        <div class="px-6 py-5 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
          <div>
            <p class="text-xs text-base-content/40 uppercase tracking-wider mb-1">Teléfono</p>
            <p class="text-sm font-medium">{{ cliente.telefono || '—' }}</p>
          </div>
          <div>
            <p class="text-xs text-base-content/40 uppercase tracking-wider mb-1">Correo</p>
            <p class="text-sm font-medium">{{ cliente.correo || '—' }}</p>
          </div>
          <div>
            <p class="text-xs text-base-content/40 uppercase tracking-wider mb-1">Dirección</p>
            <p class="text-sm font-medium">{{ cliente.direccion || '—' }}</p>
          </div>
          <div>
            <p class="text-xs text-base-content/40 uppercase tracking-wider mb-1">Fecha registro</p>
            <p class="text-sm font-medium">{{ formatFecha(cliente.createdAt) }}</p>
          </div>
        </div>
      </div>

      <!-- Mascotas -->
      <div class="bg-base-100 rounded-2xl overflow-hidden">
        <div class="px-6 py-4 border-b border-base-300">
          <h3 class="font-bold text-[#FFFFE3]">Mascotas ({{ mascotas.length }})</h3>
        </div>
        <div v-if="mascotas.length === 0" class="px-6 py-12 text-center text-base-content/40">
          No tiene mascotas registradas
        </div>
        <div v-else class="divide-y divide-base-300">
          <div
            v-for="mascota in mascotas"
            :key="mascota.idMascota"
            class="px-6 py-4 flex items-center gap-4 hover:bg-base-200/50 cursor-pointer transition-colors"
            @click="router.push(`/mascotas/${mascota.idMascota}`)"
          >
            <div class="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
              </svg>
            </div>
            <div class="flex-1">
              <p class="font-medium text-sm">{{ mascota.nombre }}</p>
              <p class="text-xs text-base-content/50">{{ mascota.especie }} · {{ mascota.raza }}</p>
            </div>
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-base-content/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>
      </div>
    </template>

    <dialog :class="{ modal: true, 'modal-open': showPasswordDialog }" v-if="showPasswordDialog">
      <div class="modal-box bg-[#1a1a2e] w-full max-w-sm sm:w-96">
        <h3 class="font-bold text-lg text-[#FFFFE3] mb-1 flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
          </svg>
          Restablecer contraseña
        </h3>
        <p class="text-sm text-base-content/50 mb-5">
          Escribe la nueva contraseña. Debe tener al menos 8 caracteres.
        </p>

        <div v-if="resetError" class="alert alert-error mb-4 py-2 text-sm">
          <span>{{ resetError }}</span>
        </div>

        <div v-if="resetSuccess" class="alert mb-4 py-2 text-sm bg-[#7a9e7e]/15 border border-[#7a9e7e]/30 text-[#7a9e7e]">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
          </svg>
          <span>{{ resetSuccess }}</span>
        </div>

        <form @submit.prevent="handleResetPassword" class="space-y-4" @keydown.esc="showPasswordDialog = false">
          <div class="form-control">
            <label class="label pb-1">
              <span class="label-text text-xs uppercase tracking-wider text-base-content/50">Nueva contraseña</span>
            </label>
            <div class="relative">
              <input
                v-model="nuevaPassword"
                :type="mostrarClave ? 'text' : 'password'"
                class="input input-bordered w-full bg-[#2A2A2A] border-white/10 pr-10 focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/30"
                placeholder="Mínimo 8 caracteres"
                minlength="8"
                required
              />
              <button
                type="button"
                class="absolute right-2 top-1/2 -translate-y-1/2 text-base-content/40 hover:text-base-content btn btn-ghost btn-circle btn-xs"
                @click="mostrarClave = !mostrarClave"
                tabindex="-1"
              >
                <svg v-if="!mostrarClave" xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                </svg>
              </button>
            </div>
          </div>

          <div class="modal-action pt-4 -mb-4">
            <button type="button" class="btn btn-ghost btn-sm" :disabled="resetPasswordLoading" @click="showPasswordDialog = false">Cancelar</button>
            <button type="submit" class="btn btn-primary btn-sm gap-1" :disabled="resetPasswordLoading">
              <span v-if="resetPasswordLoading" class="loading loading-spinner loading-sm"></span>
              <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L15 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
              Restablecer
            </button>
          </div>
        </form>
      </div>
      <form method="dialog" class="modal-backdrop" @click="showPasswordDialog = false">
        <button>close</button>
      </form>
    </dialog>

    <dialog :class="{ modal: true, 'modal-open': showCrearCuentaDialog }" v-if="showCrearCuentaDialog">
      <div class="modal-box bg-[#1a1a2e] w-full max-w-sm sm:w-96">
        <h3 class="font-bold text-lg text-[#FFFFE3] mb-1 flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
          </svg>
          Crear cuenta de acceso
        </h3>
        <p class="text-sm text-base-content/50 mb-5">
          Define el correo y la contraseña para crear la cuenta de acceso del cliente.
        </p>

        <div v-if="crearCuentaError" class="alert alert-error mb-4 py-2 text-sm">
          <span>{{ crearCuentaError }}</span>
        </div>

        <div v-if="crearCuentaSuccess" class="alert mb-4 py-2 text-sm bg-[#7a9e7e]/15 border border-[#7a9e7e]/30 text-[#7a9e7e]">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
          </svg>
          <span>{{ crearCuentaSuccess }}</span>
        </div>

        <form @submit.prevent="handleCrearCuenta" class="space-y-4" @keydown.esc="showCrearCuentaDialog = false">
          <div class="form-control">
            <label class="label pb-1">
              <span class="label-text text-xs uppercase tracking-wider text-base-content/50">Correo de la cuenta *</span>
            </label>
            <input
              v-model="cuentaEmail"
              type="text"
              inputmode="email"
              autocomplete="email"
              class="input input-bordered w-full bg-[#2A2A2A] border-white/10 focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/30"
              placeholder="correo@ejemplo.com"
              @blur="cuentaEmail = cuentaEmail.trim().toLowerCase()"
            />
          </div>
          <div class="form-control">
            <label class="label pb-1">
              <span class="label-text text-xs uppercase tracking-wider text-base-content/50">Contraseña</span>
            </label>
            <div class="relative">
              <input
                v-model="cuentaPassword"
                :type="cuentaMostrarClave ? 'text' : 'password'"
                class="input input-bordered w-full bg-[#2A2A2A] border-white/10 pr-10 focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/30"
                placeholder="Mínimo 8 caracteres"
                minlength="8"
                required
              />
              <button
                type="button"
                class="absolute right-2 top-1/2 -translate-y-1/2 text-base-content/40 hover:text-base-content btn btn-ghost btn-circle btn-xs"
                @click="cuentaMostrarClave = !cuentaMostrarClave"
                tabindex="-1"
              >
                <svg v-if="!cuentaMostrarClave" xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                </svg>
              </button>
            </div>
          </div>

          <div class="modal-action pt-4 -mb-4">
            <button type="button" class="btn btn-ghost btn-sm" :disabled="crearCuentaLoading" @click="showCrearCuentaDialog = false">Cancelar</button>
            <button type="submit" class="btn btn-primary btn-sm gap-1" :disabled="crearCuentaLoading">
              <span v-if="crearCuentaLoading" class="loading loading-spinner loading-sm"></span>
              <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
              Crear cuenta
            </button>
          </div>
        </form>
      </div>
      <form method="dialog" class="modal-backdrop" @click="showCrearCuentaDialog = false">
        <button>close</button>
      </form>
    </dialog>

    <ConfirmDialog
      :show="showDeleteDialog"
      title="Desactivar cliente"
      message="¿Estás seguro de desactivar este cliente? No podrá iniciar sesión hasta que sea reactivado."
      confirmText="Desactivar"
      variant="error"
      @confirm="handleDelete"
      @cancel="showDeleteDialog = false"
    />

    <ConfirmDialog
      :show="showReactivateDialog"
      title="Reactivar cliente"
      message="¿Estás seguro de reactivar este cliente?"
      confirmText="Reactivar"
      variant="success"
      @confirm="handleReactivate"
      @cancel="showReactivateDialog = false"
    />
  </div>
</template>

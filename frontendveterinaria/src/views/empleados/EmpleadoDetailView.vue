<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { empleadosApi } from '@/api/empleadosApi'
import { adminApi } from '@/api/adminApi'
import type { Empleado } from '@/types/empleado'
import type { Usuario } from '@/types/admin'
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'

const route = useRoute()
const router = useRouter()
const empleado = ref<Empleado | null>(null)
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
const usuarios = ref<Usuario[]>([])

const fullName = computed(() => {
  if (!empleado.value) return ''
  return [empleado.value.primerNombre, empleado.value.segundoNombre, empleado.value.primerApellido, empleado.value.segundoApellido]
    .filter(Boolean).join(' ')
})

const tieneCuenta = computed(() => {
  return usuarios.value.some((u: Usuario) => u.idEmpleado === empleado.value?.idEmpleado)
})

const initials = computed(() => {
  if (!empleado.value) return '?'
  return ((empleado.value.primerNombre?.[0] || '') + (empleado.value.primerApellido?.[0] || '')).toUpperCase()
})

onMounted(async () => {
  try {
    const [res, resUsuarios] = await Promise.all([
      empleadosApi.getById(id),
      adminApi.getUsuarios()
    ])
    empleado.value = res.data
    usuarios.value = resUsuarios.data || []
  } catch (e: any) {
    error.value = e.response?.data?.message || 'No se pudo cargar el empleado'
  } finally {
    loading.value = false
  }
})

async function handleDelete() {
  try {
    await empleadosApi.cambiarEstado(id, false)
    showDeleteDialog.value = false
    success.value = 'Empleado desactivado correctamente'
    setTimeout(() => router.push('/empleados'), 1500)
  } catch (e: any) {
    error.value = e.response?.data?.message || 'No se pudo desactivar'
    showDeleteDialog.value = false
  }
}

async function handleReactivate() {
  try {
    await empleadosApi.cambiarEstado(id, true)
    showReactivateDialog.value = false
    const res = await empleadosApi.getById(id)
    empleado.value = res.data
    success.value = 'Empleado reactivado correctamente'
    setTimeout(() => success.value = '', 3000)
  } catch (e: any) {
    error.value = e.response?.data?.message || 'No se pudo reactivar'
    showReactivateDialog.value = false
  }
}

function openPasswordDialog() {
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
    const usuario = (res.data || []).find((u: Usuario) => u.idEmpleado === empleado.value?.idEmpleado)
    if (!usuario) {
      resetError.value = 'Este empleado no tiene usuario asociado'
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
  const parts = fecha.split('-')
  const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]))
  return d.toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' })
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

    <template v-else-if="empleado">
      <!-- Header -->
      <div class="flex items-center gap-4 mb-6">
        <button class="btn btn-ghost btn-sm btn-circle" @click="router.back()">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div class="flex-1">
          <h1 class="text-2xl font-extrabold text-[#FFFFE3] flex items-center gap-2">
            {{ fullName }}
            <svg v-if="tieneCuenta" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="h-5 w-5 text-primary inline-block shrink-0" title="Tiene cuenta de acceso">
              <path fill-rule="evenodd" d="M8.603 3.799A4.49 4.49 0 0112 2.25c1.357 0 2.573.6 3.397 1.549a4.49 4.49 0 013.498 1.307 4.491 4.491 0 011.307 3.497A4.49 4.49 0 0121.75 12a4.49 4.49 0 01-1.549 3.397 4.491 4.491 0 01-1.307 3.497 4.491 4.491 0 01-3.497 1.307A4.49 4.49 0 0112 21.75a4.49 4.49 0 01-3.397-1.549 4.49 4.49 0 01-3.498-1.306 4.491 4.491 0 01-1.307-3.498A4.49 4.49 0 012.25 12c0-1.357.6-2.573 1.549-3.397a4.49 4.49 0 011.307-3.497 4.49 4.49 0 013.497-1.307zm7.007 6.387a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clip-rule="evenodd" />
            </svg>
          </h1>
          <p class="text-sm text-base-content/50">Detalle del empleado</p>
        </div>
        <span class="badge badge-lg" :class="empleado.estado ? 'badge-success' : 'badge-error'">
          {{ empleado.estado ? 'Activo' : 'Inactivo' }}
        </span>
        <!-- 3-dot menu -->
        <div class="dropdown dropdown-end">
          <div tabindex="0" role="button" class="btn btn-ghost btn-circle">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 5v.01M12 12v.01M12 19v.01" />
            </svg>
          </div>
          <ul tabindex="0" class="dropdown-content menu p-2 shadow-lg bg-[#2A2A2A] border border-white/10 rounded-xl w-52 z-50">
            <li><a @click="router.push(`/empleados/${id}/editar`)" class="text-[#CBCBCB] hover:bg-white/10 hover:text-[#FFFFE3]">Editar</a></li>
            <li><a @click="openPasswordDialog" class="text-[#CBCBCB] hover:bg-white/10 hover:text-[#FFFFE3]">Restablecer contraseña</a></li>
            <li v-if="empleado.estado"><a @click="showDeleteDialog = true" class="text-red-400 hover:bg-red-500/20">Desactivar</a></li>
            <li v-if="!empleado.estado"><a @click="showReactivateDialog = true" class="text-green-400 hover:bg-green-500/20">Reactivar</a></li>
          </ul>
        </div>
      </div>

      <!-- Info Card -->
      <div class="bg-base-100 rounded-2xl border border-base-300 overflow-hidden mb-6">
        <div class="bg-gradient-to-r from-[#0D7377]/20 to-transparent px-6 py-5 flex items-center gap-5">
          <div class="w-16 h-16 rounded-full bg-gradient-to-br from-[#0D7377] to-[#4A4A4A] flex items-center justify-center shadow-lg">
            <span class="text-[#FFFFE3] font-bold text-xl">{{ initials }}</span>
          </div>
          <div class="flex-1">
            <h2 class="text-lg font-bold text-[#FFFFE3] flex items-center gap-2">
              {{ fullName }}
              <svg v-if="tieneCuenta" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="h-5 w-5 text-primary inline-block shrink-0" title="Tiene cuenta de acceso">
                <path fill-rule="evenodd" d="M8.603 3.799A4.49 4.49 0 0112 2.25c1.357 0 2.573.6 3.397 1.549a4.49 4.49 0 013.498 1.307 4.491 4.491 0 011.307 3.497A4.49 4.49 0 0121.75 12a4.49 4.49 0 01-1.549 3.397 4.491 4.491 0 01-1.307 3.497 4.491 4.491 0 01-3.497 1.307A4.49 4.49 0 0112 21.75a4.49 4.49 0 01-3.397-1.549 4.49 4.49 0 01-3.498-1.306 4.491 4.491 0 01-1.307-3.498A4.49 4.49 0 012.25 12c0-1.357.6-2.573 1.549-3.397a4.49 4.49 0 011.307-3.497 4.49 4.49 0 013.497-1.307zm7.007 6.387a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clip-rule="evenodd" />
              </svg>
            </h2>
            <p class="text-sm text-base-content/50">{{ empleado.nombreCargo }}</p>
          </div>
        </div>
        <div class="px-6 py-5 grid grid-cols-2 md:grid-cols-3 gap-5">
          <div>
            <p class="text-xs text-base-content/40 uppercase tracking-wider mb-1">Documento</p>
            <p class="text-sm font-medium">{{ empleado.tipoDocumento }} {{ empleado.numeroDocumento }}</p>
          </div>
          <div>
            <p class="text-xs text-base-content/40 uppercase tracking-wider mb-1">Teléfono</p>
            <p class="text-sm font-medium">{{ empleado.telefono || '—' }}</p>
          </div>
          <div>
            <p class="text-xs text-base-content/40 uppercase tracking-wider mb-1">Correo</p>
            <p class="text-sm font-medium">{{ empleado.correo || '—' }}</p>
          </div>
          <div>
            <p class="text-xs text-base-content/40 uppercase tracking-wider mb-1">Dirección</p>
            <p class="text-sm font-medium">{{ empleado.direccion || '—' }}</p>
          </div>
          <div>
            <p class="text-xs text-base-content/40 uppercase tracking-wider mb-1">Cargo</p>
            <p class="text-sm font-medium">{{ empleado.nombreCargo }}</p>
          </div>
          <div>
            <p class="text-xs text-base-content/40 uppercase tracking-wider mb-1">Fecha ingreso</p>
            <p class="text-sm font-medium">{{ formatFecha(empleado.fechaIngreso) }}</p>
          </div>
        </div>
      </div>
    </template>

    <dialog :class="{ modal: true, 'modal-open': showPasswordDialog }" v-if="showPasswordDialog">
      <div class="modal-box bg-[#1a1a2e] border border-white/10 w-96">
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

          <div class="modal-action border-t border-white/10 pt-4 -mb-4">
            <button type="button" class="btn btn-ghost btn-sm" :disabled="resetPasswordLoading" @click="showPasswordDialog = false">Cancelar</button>
            <button type="submit" class="btn btn-primary btn-sm gap-1" :disabled="resetPasswordLoading">
              <span v-if="resetPasswordLoading" class="loading loading-spinner loading-sm"></span>
              <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
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

    <ConfirmDialog
      :show="showDeleteDialog"
      title="Desactivar empleado"
      message="¿Estás seguro de desactivar este empleado? No podrá iniciar sesión hasta que sea reactivado."
      confirmText="Desactivar"
      variant="error"
      @confirm="handleDelete"
      @cancel="showDeleteDialog = false"
    />

    <ConfirmDialog
      :show="showReactivateDialog"
      title="Reactivar empleado"
      message="¿Estás seguro de reactivar este empleado?"
      confirmText="Reactivar"
      variant="success"
      @confirm="handleReactivate"
      @cancel="showReactivateDialog = false"
    />
  </div>
</template>

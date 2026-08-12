<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { adminApi } from '@/api/adminApi'
import type { Rol, Modulo } from '@/types/admin'
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'

const roles = ref<Rol[]>([])
const modulos = ref<Modulo[]>([])
const permisos = ref<any[]>([])
const selectedRol = ref<number>(0)
const loading = ref(true)
const showAsignDialog = ref(false)
const showRevocarDialog = ref(false)
const selectedModulo = ref<Modulo | null>(null)
const showInactiveRoles = ref(false)

const rolesFiltrados = computed(() => {
  let lista = [...roles.value]
  if (!showInactiveRoles.value) {
    lista = lista.filter(r => r.estado)
  }
  return lista.sort((a, b) => {
    if (a.estado !== b.estado) return a.estado ? -1 : 1
    return a.nombre.localeCompare(b.nombre)
  })
})

async function loadData() {
  loading.value = true
  try {
    const [rolesRes, modulosRes] = await Promise.all([
      adminApi.getRoles(),
      adminApi.getModulos(),
    ])
    roles.value = rolesRes.data ?? []
    modulos.value = modulosRes.data ?? []
    if (roles.value.length > 0) {
      selectedRol.value = roles.value[0]!.idRol
      loadPermisos()
    }
  } catch (e) {
    console.error('Error loading data', e)
  } finally {
    loading.value = false
  }
}

async function loadPermisos() {
  if (!selectedRol.value) return
  try {
    const response = await adminApi.getPermisos(selectedRol.value)
    permisos.value = response.data
  } catch (e) {
    console.error('Error loading permisos', e)
  }
}

async function asignarPermiso(modulo: Modulo) {
  try {
    await adminApi.asignarPermiso({ idRol: selectedRol.value, idModulo: modulo.idModulo })
    loadPermisos()
  } catch (e) {
    console.error('Error assigning permiso', e)
  }
}

function confirmRevocar(modulo: Modulo) {
  selectedModulo.value = modulo
  showRevocarDialog.value = true
}

async function revocarPermiso() {
  if (!selectedModulo.value) return
  try {
    await adminApi.revocarPermiso(selectedRol.value, selectedModulo.value.idModulo)
    showRevocarDialog.value = false
    loadPermisos()
  } catch (e) {
    console.error('Error revoking permiso', e)
  }
}

function tienePermiso(modulo: Modulo): boolean {
  return permisos.value?.some((p: any) => p.idModulo === modulo.idModulo && p.estado) || false
}

const permisosActivos = computed(() => permisos.value.filter((p: any) => p.estado))
const modulosDisponibles = computed(() => modulos.value.filter((m) => !tienePermiso(m)))

onMounted(loadData)
</script>

<template>
  <div>
    <div class="mb-6">
      <h1 class="text-3xl font-extrabold text-[#FFFFE3]">Permisos por Rol</h1>
      <p class="text-sm text-base-content/60 mt-1">Asigna o revoca módulos de acceso para cada rol</p>
    </div>

    <div v-if="loading" class="flex justify-center py-12">
      <span class="loading loading-spinner loading-lg text-primary"></span>
    </div>

    <template v-else>
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Panel izquierdo: selector de rol -->
        <div class="bg-base-100 rounded-xl border border-base-300 p-6">
          <h4 class="text-sm font-semibold text-base-content/70 uppercase tracking-wide flex items-center gap-2 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
            Roles
          </h4>
          <div class="flex items-center justify-end mb-2">
            <label class="label cursor-pointer gap-2">
              <input type="checkbox" v-model="showInactiveRoles" class="toggle toggle-sm toggle-warning" />
              <span class="label-text text-xs">Mostrar inactivos</span>
            </label>
          </div>
          <div class="space-y-2">
            <button
              v-for="rol in rolesFiltrados"
              :key="rol.idRol"
              class="w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200"
              :class="selectedRol === rol.idRol
                ? 'bg-[#0D7377]/20 text-[#FFFFE3] border border-[#0D7377]/40 shadow-sm'
                : 'text-[#CBCBCB] hover:bg-white/5 border border-transparent'"
              @click="selectedRol = rol.idRol; loadPermisos()"
            >
              <div class="flex items-center justify-between">
                <span>{{ rol.nombre }}</span>
                <svg v-if="selectedRol === rol.idRol" xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-[#0D7377]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4" /></svg>
              </div>
            </button>
          </div>
        </div>

        <!-- Panel derecho: permisos -->
        <div class="lg:col-span-2 bg-base-100 rounded-xl border border-base-300 p-6">
          <div v-if="!selectedRol" class="flex flex-col items-center justify-center py-12 text-base-content/40">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg>
            <p class="text-sm">Selecciona un rol para ver sus permisos</p>
          </div>

          <template v-else>
            <!-- Permisos actuales -->
            <div class="mb-6">
              <h4 class="text-sm font-semibold text-base-content/70 uppercase tracking-wide flex items-center gap-2 mb-3">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-[#7a9e7e]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4" /></svg>
                Permisos activos ({{ permisosActivos.length }})
              </h4>
              <div v-if="permisosActivos.length > 0" class="flex flex-wrap gap-2">
                <div
                  v-for="permiso in permisosActivos"
                  :key="permiso.idRolModulo"
                  class="group flex items-center gap-2 bg-[#0D7377]/15 border border-[#0D7377]/25 text-[#FFFFE3] rounded-lg px-3 py-2 text-sm font-medium"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5 text-[#0D7377]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4" /></svg>
                  {{ permiso.nombreModulo }}
                  <button
                    class="ml-1 text-[#CBCBCB]/40 hover:text-[#c47070] transition-colors"
                    @click="confirmRevocar({ idModulo: permiso.idModulo, nombre: permiso.nombreModulo, descripcion: '', estado: true })"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
              </div>
              <p v-else class="text-sm text-base-content/40 py-4 text-center bg-base-200/30 rounded-lg">
                Este rol no tiene ningun permiso asignado
              </p>
            </div>

            <!-- Modulos disponibles -->
            <div>
              <h4 class="text-sm font-semibold text-base-content/70 uppercase tracking-wide flex items-center gap-2 mb-3">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-[#CBCBCB]/60" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" /></svg>
                Modulos disponibles ({{ modulosDisponibles.length }})
              </h4>
              <div v-if="modulosDisponibles.length > 0" class="flex flex-wrap gap-2">
                <button
                  v-for="modulo in modulosDisponibles"
                  :key="modulo.idModulo"
                  class="flex items-center gap-1.5 bg-base-200/50 border border-base-300/60 text-[#CBCBCB] rounded-lg px-3 py-2 text-sm font-medium hover:bg-[#0D7377]/10 hover:border-[#0D7377]/30 hover:text-[#FFFFE3] transition-all duration-200"
                  @click="asignarPermiso(modulo)"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" /></svg>
                  {{ modulo.nombre }}
                </button>
              </div>
              <p v-else class="text-sm text-base-content/40 py-4 text-center bg-base-200/30 rounded-lg">
                Todos los modulos estan asignados a este rol
              </p>
            </div>
          </template>
        </div>
      </div>
    </template>

    <ConfirmDialog
      :show="showRevocarDialog"
      title="Revocar permiso"
      :message="`¿Estas seguro de revocar el permiso de ${selectedModulo?.nombre}?`"
      confirmText="Revocar"
      variant="error"
      @confirm="revocarPermiso"
      @cancel="showRevocarDialog = false"
    />
  </div>
</template>

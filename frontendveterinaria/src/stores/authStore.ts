import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authApi } from '@/api/authApi'
import { empleadosApi } from '@/api/empleadosApi'
import api from '@/api/axios'
import type { LoginRequest, RegisterRequest } from '@/types/auth'

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(localStorage.getItem('token'))
  const usuario = ref(JSON.parse(localStorage.getItem('usuario') || 'null'))
  const idEmpleadoActual = ref<number | null>(null)
  const cargoEmpleadoActual = ref<string>('')
  const rolesEmpleadoActual = ref<string[]>([])

  const ALL_MODULOS = ['CLIENTES', 'MASCOTAS', 'CITAS', 'FACTURACION', 'HISTORIAL', 'USUARIOS', 'ROLES', 'TARIFAS', 'CALIFICACIONES']

  const MODULOS_POR_ROL: Record<string, string[]> = {
    ADMIN: ALL_MODULOS,
    RECEPCIONISTA: ['CLIENTES', 'MASCOTAS', 'CITAS', 'FACTURACION'],
    VETERINARIO: ['MASCOTAS', 'CITAS', 'HISTORIAL'],
    ESTILISTA: ['MASCOTAS', 'CITAS', 'HISTORIAL'],
    CLIENTE: ['MASCOTAS', 'CITAS', 'FACTURACION', 'CALIFICACIONES'],
  }

  const isAuthenticated = computed(() => !!token.value)
  const roles = computed(() => usuario.value?.roles || [])
  const modulos = computed(() => {
    const backend = usuario.value?.modulos
    if (Array.isArray(backend) && backend.length > 0) return backend
    return MODULOS_POR_ROL[roles.value[0]] || []
  })
  const nombreUsuario = computed(() => usuario.value?.nombreUsuario || '')
  const nombreCompleto = computed(() => usuario.value?.nombreCompleto || usuario.value?.nombreUsuario || '')
  const esProfesional = computed(() => hasAnyRole('VETERINARIO', 'ESTILISTA'))

  function hasRole(role: string): boolean {
    return roles.value.includes(role)
  }

  function hasAnyRole(...rolesToCheck: string[]): boolean {
    return rolesToCheck.some((r) => roles.value.includes(r))
  }

  function hasModule(modulo: string): boolean {
    return modulos.value.includes(modulo)
  }

  function hasAnyModule(...modulosToCheck: string[]): boolean {
    return modulosToCheck.some((m) => modulos.value.includes(m))
  }

  async function fetchProfile() {
    try {
      const response = await api.get('/clientes/me')
      const c = response.data
      const fullName = [c.primerNombre, c.segundoNombre, c.primerApellido, c.segundoApellido]
        .filter(Boolean)
        .join(' ')
      if (fullName && usuario.value) {
        usuario.value.nombreCompleto = fullName
        localStorage.setItem('usuario', JSON.stringify(usuario.value))
      }
    } catch {
      // No es cliente, no se puede obtener el nombre completo
    }
  }

  async function cargarEmpleadoActual() {
    if (idEmpleadoActual.value) return
    const correo = usuario.value?.correo
    if (!correo) return
    try {
      const res = await empleadosApi.getAll()
      const emp = (res.data || []).find((e: any) => e.correo?.toLowerCase() === correo.toLowerCase())
      if (emp) {
        idEmpleadoActual.value = emp.idEmpleado
        cargoEmpleadoActual.value = emp.nombreCargo || ''
        rolesEmpleadoActual.value = emp.roles || []
      }
    } catch {
      // no se pudo identificar al empleado
    }
  }

  function limpiarEmpleadoActual() {
    idEmpleadoActual.value = null
    cargoEmpleadoActual.value = ''
    rolesEmpleadoActual.value = []
  }

  async function login(data: LoginRequest) {
    const response = await authApi.login(data)
    const { token: newToken, ...userData } = response.data
    token.value = newToken
    usuario.value = userData
    localStorage.setItem('token', newToken)
    localStorage.setItem('usuario', JSON.stringify(userData))
    await fetchProfile()
  }

  async function register(data: RegisterRequest) {
    await authApi.register(data)
  }

  async function logout() {
    try {
      await authApi.logout()
    } catch {
      // ignore error
    } finally {
      token.value = null
      usuario.value = null
      localStorage.removeItem('token')
      localStorage.removeItem('usuario')
      limpiarEmpleadoActual()
    }
  }

  return {
    token,
    usuario,
    isAuthenticated,
    roles,
    modulos,
    nombreUsuario,
    nombreCompleto,
    esProfesional,
    idEmpleadoActual,
    cargoEmpleadoActual,
    rolesEmpleadoActual,
    hasRole,
    hasAnyRole,
    hasModule,
    hasAnyModule,
    login,
    register,
    logout,
    fetchProfile,
    cargarEmpleadoActual,
  }
})

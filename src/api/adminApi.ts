import api from './axios'
import type { CrearRolRequest, AsignarPermisoRequest, AsignarRolUsuarioRequest } from '@/types/admin'

export const adminApi = {
  getRoles(includeInactive = false) {
    return api.get('/admin/roles', { params: { includeInactive } })
  },

  createRol(data: CrearRolRequest) {
    return api.post('/admin/roles', data)
  },

  updateRol(id: number, data: CrearRolRequest) {
    return api.put(`/admin/roles/${id}`, data)
  },

  deleteRol(id: number) {
    return api.delete(`/admin/roles/${id}`)
  },

  reactivarRol(id: number) {
    return api.patch(`/admin/roles/${id}/reactivar`)
  },

  getPermisos(idRol: number) {
    return api.get(`/admin/permisos/rol/${idRol}`)
  },

  asignarPermiso(data: AsignarPermisoRequest) {
    return api.post('/admin/permisos', data)
  },

  revocarPermiso(idRol: number, idModulo: number) {
    return api.delete(`/admin/permisos/${idRol}/${idModulo}`)
  },

  getUsuarioRoles(idUsuario: number) {
    return api.get(`/admin/usuario-roles/usuario/${idUsuario}`)
  },

  asignarRolUsuario(data: AsignarRolUsuarioRequest) {
    return api.post('/admin/usuario-roles', data)
  },

  revocarRolUsuario(idUsuario: number, idRol: number) {
    return api.delete(`/admin/usuario-roles/${idUsuario}/${idRol}`)
  },

  getCargos() {
    return api.get('/cargos')
  },

  getMetodosPago() {
    return api.get('/metodos-pago')
  },

  getModulos() {
    return api.get('/modulos')
  },

  getUsuarios() {
    return api.get('/admin/usuarios')
  },

  restablecerPassword(idUsuario: number, nuevaPassword: string) {
    return api.post(`/admin/usuarios/${idUsuario}/password`, { nuevaPassword })
  },
}

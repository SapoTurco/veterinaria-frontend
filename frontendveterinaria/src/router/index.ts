import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/auth/LoginView.vue'),
      meta: { layout: 'auth' },
    },
    {
      path: '/register',
      name: 'register',
      component: () => import('@/views/auth/RegisterView.vue'),
      meta: { layout: 'auth' },
    },
    {
      path: '/',
      component: () => import('@/layouts/DefaultLayout.vue'),
      meta: { requiresAuth: true },
      children: [
        {
          path: '',
          name: 'dashboard',
          component: () => import('@/views/dashboard/DashboardView.vue'),
        },
        {
          path: 'mis-mascotas',
          name: 'mis-mascotas',
          component: () => import('@/views/mascotas/MisMascotasView.vue'),
          meta: { modulos: ['MASCOTAS'], roles: ['CLIENTE'] },
        },
        {
          path: 'mis-citas',
          name: 'mis-citas',
          component: () => import('@/views/citas/MisCitasView.vue'),
          meta: { modulos: ['CITAS'], roles: ['CLIENTE'] },
        },
        {
          path: 'mis-citas/nueva',
          name: 'cliente-cita-create',
          component: () => import('@/views/citas/ClienteCitaFormView.vue'),
          meta: { modulos: ['CITAS'], roles: ['CLIENTE'] },
        },
        {
          path: 'mis-facturas',
          name: 'mis-facturas',
          component: () => import('@/views/facturas/MisFacturasView.vue'),
          meta: { modulos: ['FACTURACION'], roles: ['CLIENTE'] },
        },
        {
          path: 'mi-perfil',
          name: 'mi-perfil',
          component: () => import('@/views/clientes/MiPerfilView.vue'),
        },
        {
          path: 'clientes',
          name: 'clientes',
          component: () => import('@/views/clientes/ClientesView.vue'),
          meta: { modulos: ['CLIENTES'] },
        },
        {
          path: 'clientes/:id',
          name: 'cliente-detail',
          component: () => import('@/views/clientes/ClienteDetailView.vue'),
          meta: { modulos: ['CLIENTES'] },
        },
        {
          path: 'clientes/nueva',
          name: 'cliente-create',
          component: () => import('@/views/clientes/ClienteFormView.vue'),
          meta: { modulos: ['CLIENTES'] },
        },
        {
          path: 'clientes/:id/editar',
          name: 'cliente-edit',
          component: () => import('@/views/clientes/ClienteFormView.vue'),
          meta: { modulos: ['CLIENTES'] },
        },
        {
          path: 'mascotas',
          name: 'mascotas',
          component: () => import('@/views/mascotas/MascotasView.vue'),
          meta: { modulos: ['MASCOTAS'] },
        },
        {
          path: 'mascotas/:id',
          name: 'mascota-detail',
          component: () => import('@/views/mascotas/MascotaDetailView.vue'),
          meta: { modulos: ['MASCOTAS'] },
        },
        {
          path: 'mascotas/nueva',
          name: 'mascota-create',
          component: () => import('@/views/mascotas/MascotaFormView.vue'),
          meta: { modulos: ['MASCOTAS'] },
        },
        {
          path: 'mascotas/:id/editar',
          name: 'mascota-edit',
          component: () => import('@/views/mascotas/MascotaFormView.vue'),
          meta: { modulos: ['MASCOTAS'] },
        },
        {
          path: 'citas',
          name: 'citas',
          component: () => import('@/views/citas/CitasView.vue'),
          meta: { modulos: ['CITAS'] },
        },
        {
          path: 'citas/nueva',
          name: 'cita-create',
          component: () => import('@/views/citas/CitaFormView.vue'),
          meta: { modulos: ['CITAS'] },
        },
        {
          path: 'citas/:id/editar',
          name: 'cita-edit',
          component: () => import('@/views/citas/CitaFormView.vue'),
          meta: { modulos: ['CITAS'] },
        },
        {
          path: 'citas/:id/consulta',
          name: 'cita-consulta',
          component: () => import('@/views/citas/ConsultaFormView.vue'),
          meta: { modulos: ['CITAS'] },
        },
        {
          path: 'citas/:id/estetica',
          name: 'cita-estetica',
          component: () => import('@/views/citas/EsteticaFormView.vue'),
          meta: { modulos: ['CITAS'] },
        },
        {
          path: 'citas/:id',
          name: 'cita-detail',
          component: () => import('@/views/citas/CitaDetailView.vue'),
          meta: { modulos: ['CITAS'] },
        },
        {
          path: 'facturas',
          name: 'facturas',
          component: () => import('@/views/facturas/FacturasView.vue'),
          meta: { modulos: ['FACTURACION'] },
        },
        {
          path: 'facturas/:id',
          name: 'factura-detail',
          component: () => import('@/views/facturas/FacturaDetailView.vue'),
          meta: { modulos: ['FACTURACION'] },
        },
        {
          path: 'pagos',
          name: 'pagos',
          component: () => import('@/views/pagos/PagosView.vue'),
          meta: { modulos: ['FACTURACION'] },
        },
        {
          path: 'pagos/:id',
          name: 'pago-detail',
          component: () => import('@/views/pagos/PagoDetailView.vue'),
          meta: { modulos: ['FACTURACION'] },
        },
        {
          path: 'servicios',
          name: 'servicios',
          component: () => import('@/views/servicios/ServiciosView.vue'),
        },
        {
          path: 'empleados',
          name: 'empleados',
          component: () => import('@/views/empleados/EmpleadosView.vue'),
          meta: { modulos: ['USUARIOS'] },
        },
        {
          path: 'empleados/nueva',
          name: 'empleado-create',
          component: () => import('@/views/empleados/EmpleadoFormView.vue'),
          meta: { modulos: ['USUARIOS'] },
        },
        {
          path: 'empleados/:id/editar',
          name: 'empleado-edit',
          component: () => import('@/views/empleados/EmpleadoFormView.vue'),
          meta: { modulos: ['USUARIOS'] },
        },
        {
          path: 'empleados/:id',
          name: 'empleado-detail',
          component: () => import('@/views/empleados/EmpleadoDetailView.vue'),
          meta: { modulos: ['USUARIOS'] },
        },
        {
          path: 'admin/roles',
          name: 'admin-roles',
          component: () => import('@/views/admin/RolesView.vue'),
          meta: { modulos: ['ROLES'] },
        },
        {
          path: 'admin/permisos',
          name: 'admin-permisos',
          component: () => import('@/views/admin/PermisosView.vue'),
          meta: { modulos: ['ROLES'] },
        },
        {
          path: 'activate-account',
          name: 'activate-account',
          component: () => import('@/views/auth/ActivateAccountView.vue'),
          meta: { layout: 'auth' },
        },
      ],
    },
  ],
})

router.beforeEach((to) => {
  const authStore = useAuthStore()
  const isAuthenticated = authStore.isAuthenticated

  if (to.meta.requiresAuth && !isAuthenticated) {
    return { name: 'login' }
  }

  if ((to.name === 'login' || to.name === 'register') && isAuthenticated) {
    return { name: 'dashboard' }
  }

  if (to.meta.modulos && !authStore.hasAnyModule(...(to.meta.modulos as string[]))) {
    return { name: 'dashboard' }
  }

  if (to.meta.roles && !authStore.hasAnyRole(...(to.meta.roles as string[]))) {
    return { name: 'dashboard' }
  }
})

export default router

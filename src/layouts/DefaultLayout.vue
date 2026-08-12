<script setup lang="ts">
import { RouterView, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'

const authStore = useAuthStore()
const router = useRouter()

async function handleLogout() {
  await authStore.logout()
  router.push('/login')
}
</script>

<template>
  <div class="min-h-screen bg-layout">
    <div class="flex min-h-screen">
      <!-- Sidebar -->
      <aside class="w-64 sidebar-glass flex flex-col">
        <div class="p-4 border-b border-white/10">
          <h1 class="text-xl font-bold text-[#FFFFE3] flex items-center gap-2">
            <img src="/logo.svg" alt="VetClinic" class="w-8 h-8 rounded-full shadow-md" />
            VetClinic
          </h1>
        </div>
        <nav class="flex-1 p-4 space-y-1 overflow-y-auto">
          <!-- Dashboard -->
          <router-link
            to="/"
            class="nav-link flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200"
            :class="$route.path === '/' ? 'nav-link-active' : 'nav-link-inactive'"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            Dashboard
          </router-link>

          <!-- CLIENTE: Mis cosas -->
          <template v-if="authStore.hasRole('CLIENTE')">
            <router-link
              v-if="authStore.hasModule('MASCOTAS')"
              to="/mis-mascotas"
              class="nav-link flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200"
              :class="$route.path === '/mis-mascotas' ? 'nav-link-active' : 'nav-link-inactive'"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 5.172C10 3.782 8.423 2.679 6.5 3c-2.823.47-4.113 6.006-4 7 .137 1.217 1.5 2 2.5 2s2-.5 3-.5 1.863.283 3 .5c1-.5 1.363-.783 1.5-2 .113-.994-1.177-6.53-4-7C8.423 2.678 6.5 3.782 6.5 5.172V7" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5.172C14 3.782 12.423 2.679 10.5 3c-2.823.47-4.113 6.006-4 7 .137 1.217 1.5 2 2.5 2s2-.5 3-.5 1.863.283 3 .5c1-.5 1.363-.783 1.5-2 .113-.994-1.177-6.53-4-7C12.423 2.678 10.5 3.782 10.5 5.172V7" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 14c-2.5 0-5 1.5-5 3v1h10v-1c0-1.5-2.5-3-5-3z" />
              </svg>
              Mis Mascotas
            </router-link>
            <router-link
              v-if="authStore.hasModule('CITAS')"
              to="/mis-citas"
              class="nav-link flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200"
              :class="$route.path === '/mis-citas' ? 'nav-link-active' : 'nav-link-inactive'"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Mis Citas
            </router-link>
            <router-link
              v-if="authStore.hasModule('FACTURACION')"
              to="/mis-facturas"
              class="nav-link flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200"
              :class="$route.path === '/mis-facturas' ? 'nav-link-active' : 'nav-link-inactive'"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" />
              </svg>
              Mis Facturas
            </router-link>
          </template>

          <!-- CLIENTES -->
          <template v-if="authStore.hasModule('CLIENTES') && !authStore.hasRole('CLIENTE')">
            <router-link
              to="/clientes"
              class="nav-link flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200"
              :class="$route.path.startsWith('/clientes') ? 'nav-link-active' : 'nav-link-inactive'"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Clientes
            </router-link>
          </template>

          <!-- MASCOTAS -->
          <template v-if="authStore.hasModule('MASCOTAS') && !authStore.hasRole('CLIENTE')">
            <router-link
              to="/mascotas"
              class="nav-link flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200"
              :class="$route.path.startsWith('/mascotas') ? 'nav-link-active' : 'nav-link-inactive'"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 5.172C10 3.782 8.423 2.679 6.5 3c-2.823.47-4.113 6.006-4 7 .137 1.217 1.5 2 2.5 2s2-.5 3-.5 1.863.283 3 .5c1-.5 1.363-.783 1.5-2 .113-.994-1.177-6.53-4-7C8.423 2.678 6.5 3.782 6.5 5.172V7" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5.172C14 3.782 12.423 2.679 10.5 3c-2.823.47-4.113 6.006-4 7 .137 1.217 1.5 2 2.5 2s2-.5 3-.5 1.863.283 3 .5c1-.5 1.363-.783 1.5-2 .113-.994-1.177-6.53-4-7C12.423 2.678 10.5 3.782 10.5 5.172V7" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 14c-2.5 0-5 1.5-5 3v1h10v-1c0-1.5-2.5-3-5-3z" />
              </svg>
              Mascotas
            </router-link>
          </template>

          <!-- CITAS -->
          <template v-if="authStore.hasModule('CITAS') && !authStore.hasRole('CLIENTE')">
            <router-link
              to="/citas"
              class="nav-link flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200"
              :class="$route.path.startsWith('/citas') ? 'nav-link-active' : 'nav-link-inactive'"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Citas
            </router-link>
          </template>

          <!-- FACTURAS / PAGOS -->
          <template v-if="authStore.hasModule('FACTURACION') && !authStore.hasRole('CLIENTE')">
            <router-link
              to="/facturas"
              class="nav-link flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200"
              :class="$route.path.startsWith('/facturas') ? 'nav-link-active' : 'nav-link-inactive'"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" />
              </svg>
              Facturas
            </router-link>
            <router-link
              to="/pagos"
              class="nav-link flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200"
              :class="$route.path.startsWith('/pagos') ? 'nav-link-active' : 'nav-link-inactive'"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
              Pagos
            </router-link>
          </template>

          <!-- SERVICIOS (TARIFAS) -->
          <template v-if="authStore.hasModule('TARIFAS')">
            <router-link
              to="/servicios"
              class="nav-link flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200"
              :class="$route.path.startsWith('/servicios') ? 'nav-link-active' : 'nav-link-inactive'"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M11.5 3.5c0-.83-.67-1.5-1.5-1.5S8.5 2.67 8.5 3.5 9.17 5 10 5s1.5-.67 1.5-1.5z"/>
                <path d="M15.5 3.5c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5.67 1.5 1.5 1.5 1.5-.67 1.5-1.5z"/>
                <path d="M7.5 6.5c0-.83-.67-1.5-1.5-1.5S4.5 5.67 4.5 6.5 5.17 8 6 8s1.5-.67 1.5-1.5z"/>
                <path d="M19.5 6.5c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5.67 1.5 1.5 1.5 1.5-.67 1.5-1.5z"/>
                <path d="M12 22c-3 0-5.5-1.5-5.5-4 0-2 1.5-3.5 3-4.5.7-.5 1.5-.8 2.5-.8s1.8.3 2.5.8c1.5 1 3 2.5 3 4.5 0 2.5-2.5 4-5.5 4z"/>
              </svg>
              Servicios
            </router-link>
          </template>

          <!-- EMPLEADOS (USUARIOS) -->
          <template v-if="authStore.hasModule('USUARIOS')">
            <router-link
              to="/empleados"
              class="nav-link flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200"
              :class="$route.path.startsWith('/empleados') ? 'nav-link-active' : 'nav-link-inactive'"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
              Empleados
            </router-link>
          </template>

          <!-- ADMIN: Roles y Permisos -->
          <template v-if="authStore.hasModule('ROLES')">
            <div class="pt-2 mt-2 border-t border-white/10">
              <p class="px-3 py-1 text-xs font-semibold text-[#CBCBCB]/50 uppercase tracking-wide">Admin</p>
              <router-link
                to="/admin/roles"
                class="nav-link flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200"
                :class="$route.path.startsWith('/admin/roles') ? 'nav-link-active' : 'nav-link-inactive'"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                Roles
              </router-link>
<router-link
                to="/admin/permisos"
                class="nav-link flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200"
                :class="$route.path.startsWith('/admin/permisos') ? 'nav-link-active' : 'nav-link-inactive'"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
                Permisos
              </router-link>
            </div>
          </template>
        </nav>
      </aside>

      <div class="flex-1 flex flex-col">
        <!-- Header -->
        <header class="header-glass h-16 flex items-center justify-between px-6 relative z-50">
          <div></div>
          <div class="flex items-center gap-4">
            <span class="text-sm text-[#CBCBCB]">{{ authStore.nombreCompleto }}</span>
            <div class="dropdown dropdown-end">
              <div tabindex="0" role="button" class="btn btn-ghost btn-circle avatar">
                <div class="w-10 rounded-full bg-gradient-to-br from-[#0D7377] to-[#4A4A4A] flex items-center justify-center shadow-md">
                  <span class="text-[#FFFFE3] font-bold text-sm">
                    {{ authStore.nombreCompleto.charAt(0).toUpperCase() }}
                  </span>
                </div>
              </div>
              <ul tabindex="0" class="menu menu-sm dropdown-content mt-3 z-50 p-2 shadow-lg bg-[#2A2A2A] border border-white/10 rounded-xl w-52">
                <li>
                  <router-link to="/mi-perfil" class="text-[#CBCBCB] hover:bg-white/10 hover:text-[#FFFFE3]">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Mi Perfil
                  </router-link>
                </li>
                <li>
                  <a @click="handleLogout" class="text-[#CBCBCB] hover:bg-red-500/20 hover:text-red-400">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Cerrar sesión
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </header>

        <!-- Main content -->
        <main class="flex-1 p-6 overflow-auto">
          <RouterView />
        </main>
      </div>
    </div>
  </div>
</template>

<style scoped>
.bg-layout {
  background: linear-gradient(-45deg, #0a1a1a, #0d2020, #0D7377, #0a1a1a);
  background-size: 400% 400%;
  animation: gradient-shift 15s ease infinite;
  min-height: 100vh;
}

.sidebar-glass {
  background: rgba(42, 42, 42, 0.85);
  backdrop-filter: blur(20px);
  border-right: 1px solid rgba(203, 203, 203, 0.1);
  box-shadow: -4px 0 24px rgba(0, 0, 0, 0.3);
}

.header-glass {
  background: rgba(42, 42, 42, 0.75);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid rgba(203, 203, 203, 0.1);
  border-left: 1px solid rgba(203, 203, 203, 0.1);
}

.nav-link {
  color: #CBCBCB;
  border-left: 3px solid transparent;
}

.nav-link:hover {
  background: rgba(13, 115, 119, 0.15);
  color: #FFFFE3;
  border-left-color: rgba(13, 115, 119, 0.3);
}

.nav-link-active {
  background: rgba(13, 115, 119, 0.2);
  color: #FFFFE3;
  border-left-color: #0D7377;
  font-weight: 600;
}

.nav-link-inactive {
  color: #CBCBCB;
}

@keyframes gradient-shift {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}
</style>

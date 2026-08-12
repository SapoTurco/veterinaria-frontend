<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { mascotasApi } from '@/api/mascotasApi'
import type { Mascota } from '@/types/mascota'

const router = useRouter()
const mascotas = ref<Mascota[]>([])
const loading = ref(true)
const error = ref('')

onMounted(async () => {
  try {
    const res = await mascotasApi.getMisMascotas()
    mascotas.value = (res.data || []).filter((m: any) => m.estado === true)
  } catch (e: any) {
    error.value = e.response?.data?.message || 'No se pudieron cargar las mascotas'
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-3xl font-extrabold text-[#FFFFE3]">Mis Mascotas</h1>
    </div>

    <div v-if="loading" class="flex justify-center py-12">
      <span class="loading loading-spinner loading-lg text-primary"></span>
    </div>

    <div v-else-if="error" class="card bg-base-100 shadow-md">
      <div class="card-body text-center py-12">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 mx-auto text-error/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
        <h3 class="text-lg font-medium mt-4">Algo salió mal</h3>
        <p class="text-base-content/50 mt-2">{{ error }}</p>
      </div>
    </div>

    <div v-else-if="mascotas.length === 0" class="card bg-base-100 shadow-md">
      <div class="card-body text-center py-12">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 mx-auto text-base-content/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
        </svg>
        <h3 class="text-lg font-medium mt-4">No tienes mascotas registradas</h3>
        <p class="text-base-content/50 mt-2">Agrega tu mascota para comenzar</p>
      </div>
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div
        v-for="mascota in mascotas"
        :key="mascota.idMascota"
        class="card bg-base-100 shadow-md cursor-pointer hover:shadow-lg transition-shadow"
        @click="router.push(`/mascotas/${mascota.idMascota}`)"
      >
        <div class="card-body">
          <div class="flex items-center gap-3">
            <div class="avatar placeholder">
              <div class="bg-primary/20 text-primary rounded-full w-12 flex items-center justify-center">
                <span class="text-lg font-bold leading-none">{{ mascota.nombre.charAt(0) }}</span>
              </div>
            </div>
            <div>
              <h3 class="font-bold text-lg">{{ mascota.nombre }}</h3>
              <p class="text-sm text-base-content/60">{{ mascota.especie }} - {{ mascota.raza }}</p>
            </div>
          </div>
          <div class="divider my-1"></div>
          <div class="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span class="text-base-content/50">Sexo:</span>
              <span class="ml-1">{{ mascota.sexo }}</span>
            </div>
            <div>
              <span class="text-base-content/50">Peso:</span>
              <span class="ml-1">{{ mascota.peso }} kg</span>
            </div>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

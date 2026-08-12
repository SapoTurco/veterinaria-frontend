<script setup lang="ts">
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { citasApi } from '@/api/citasApi'
import { vincularFacturaDeCita } from '@/utils/facturaCita'

const router = useRouter()
const route = useRoute()

const idCita = Number(route.params.id)
const loading = ref(false)
const error = ref('')
const success = ref(false)

const form = ref({
  detalles: '',
  observaciones: '',
})

async function handleSubmit() {
  loading.value = true
  error.value = ''
  try {
    await citasApi.registrarEstetica({
      idCita,
      detalles: form.value.detalles.trim() || undefined,
      observaciones: form.value.observaciones.trim() || undefined,
    })
    await vincularFacturaDeCita(idCita)
    success.value = true
    setTimeout(() => router.push('/citas'), 2000)
  } catch (e: any) {
    error.value = e.response?.data?.message || 'Error al registrar servicio estético'
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
        <h1 class="text-2xl sm:text-3xl font-extrabold text-[#FFFFE3]">Registrar Servicio Estético</h1>
        <p class="text-sm text-base-content/60">Documenta el servicio estético de la cita #{{ idCita }}</p>
      </div>
    </div>

    <div v-if="success" class="alert alert-success mb-4">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
      <span>Servicio estético registrado exitosamente. Redirigiendo...</span>
    </div>

    <div v-if="error && !success" class="alert alert-error mb-4">
      <span>{{ error }}</span>
    </div>

    <form v-if="!success" @submit.prevent="handleSubmit" class="space-y-3">
      <!-- Detalles del servicio -->
      <div class="bg-base-100 rounded-xl p-5 space-y-3">
        <h4 class="text-sm font-semibold text-base-content/70 uppercase tracking-wide flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" /></svg>
          Detalles del servicio
        </h4>
        <div class="form-control">
          <label class="label py-0"><span class="label-text font-medium text-sm">Descripción del servicio</span></label>
          <textarea v-model="form.detalles" class="textarea textarea-bordered textarea-sm w-full" rows="4" placeholder="Describe el servicio estético realizado (baño, corte de pelo, manicura, limpieza de oídos, etc.)..."></textarea>
        </div>
      </div>

      <!-- Observaciones -->
      <div class="bg-base-100 rounded-xl p-5 space-y-3">
        <h4 class="text-sm font-semibold text-base-content/70 uppercase tracking-wide flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
          Observaciones
        </h4>
        <div class="form-control">
          <label class="label py-0"><span class="label-text font-medium text-sm">Notas adicionales</span></label>
          <textarea v-model="form.observaciones" class="textarea textarea-bordered textarea-sm w-full" rows="3" placeholder="Notas sobre el comportamiento de la mascota, recomendaciones, etc."></textarea>
        </div>
      </div>

      <!-- Acciones -->
      <div class="flex justify-end gap-3 pt-2">
        <button type="button" class="btn btn-ghost" @click="router.back()">Cancelar</button>
        <button type="submit" class="btn btn-primary gap-2" :disabled="loading">
          <span v-if="loading" class="loading loading-spinner loading-sm"></span>
          <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg>
          Registrar Servicio
        </button>
      </div>
    </form>
  </div>
</template>

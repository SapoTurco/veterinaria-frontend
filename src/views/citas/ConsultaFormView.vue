<script setup lang="ts">
import { ref, computed } from 'vue'
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
  peso: null as number | null,
  temperatura: null as number | null,
  síntomas: '',
  diagnosticoGeneral: '',
  tratamientoIndicado: '',
  observaciones: '',
})

const pesoError = computed(() => {
  const peso = form.value.peso
  if (peso === null) return ''
  return Number.isFinite(peso) && peso >= 0.01 && peso <= 500
    ? ''
    : 'El peso debe estar entre 0.01 y 500 kg'
})

const temperaturaError = computed(() => {
  const temperatura = form.value.temperatura
  if (temperatura === null) return ''
  return Number.isFinite(temperatura) && temperatura >= 30 && temperatura <= 45
    ? ''
    : 'La temperatura debe estar entre 30 y 45 °C'
})

async function handleSubmit() {
  if (!form.value.síntomas.trim()) {
    error.value = 'Los síntomas son obligatorios'
    return
  }
  if (pesoError.value || temperaturaError.value) {
    return
  }
  loading.value = true
  error.value = ''
  try {
    await citasApi.registrarConsulta({
      idCita,
      peso: form.value.peso ?? undefined,
      temperatura: form.value.temperatura ?? undefined,
      sintomas: form.value.síntomas.trim(),
      diagnosticoGeneral: form.value.diagnosticoGeneral.trim() || undefined,
      tratamientoIndicado: form.value.tratamientoIndicado.trim() || undefined,
      observaciones: form.value.observaciones.trim() || undefined,
    })
    await vincularFacturaDeCita(idCita)
    success.value = true
    setTimeout(() => router.push('/citas'), 2000)
  } catch (e: any) {
    error.value = e.response?.data?.message || 'Error al registrar consulta'
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
        <h1 class="text-2xl sm:text-3xl font-extrabold text-[#FFFFE3]">Registrar Consulta Medica</h1>
        <p class="text-sm text-base-content/60">Completa la información clínica de la cita #{{ idCita }}</p>
      </div>
    </div>

    <div v-if="success" class="alert alert-success mb-4">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
      <span>Consulta registrada exitosamente. Redirigiendo...</span>
    </div>

    <div v-if="error && !success" class="alert alert-error mb-4">
      <span>{{ error }}</span>
    </div>

    <form v-if="!success" @submit.prevent="handleSubmit" class="space-y-3">
      <!-- Signos vitales -->
      <div class="bg-base-100 rounded-xl p-5 space-y-3">
        <h4 class="text-sm font-semibold text-base-content/70 uppercase tracking-wide flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
          Signos vitales
        </h4>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div class="form-control">
            <label class="label py-0"><span class="label-text font-medium text-sm">Peso (kg)</span></label>
            <input type="number" v-model.number="form.peso" class="input input-bordered input-sm w-full" step="0.01" placeholder="Ej: 5.2" />
            <label v-if="pesoError" class="label py-0">
              <span class="label-text-alt text-error text-xs">{{ pesoError }}</span>
            </label>
          </div>
          <div class="form-control">
            <label class="label py-0"><span class="label-text font-medium text-sm">Temperatura (C)</span></label>
            <input type="number" v-model.number="form.temperatura" class="input input-bordered input-sm w-full" step="0.1" placeholder="Ej: 38.5" />
            <label v-if="temperaturaError" class="label py-0">
              <span class="label-text-alt text-error text-xs">{{ temperaturaError }}</span>
            </label>
          </div>
        </div>
      </div>

      <!-- Evaluación clínica -->
      <div class="bg-base-100 rounded-xl p-5 space-y-3">
        <h4 class="text-sm font-semibold text-base-content/70 uppercase tracking-wide flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
          Evaluación clínica
        </h4>
        <div class="form-control">
          <label class="label py-0"><span class="label-text font-medium text-sm">Síntomas <span class="text-error">*</span></span></label>
          <textarea v-model="form.síntomas" class="textarea textarea-bordered textarea-sm w-full" rows="3" required placeholder="Descripcion de los síntomas observados..."></textarea>
        </div>
        <div class="form-control">
          <label class="label py-0"><span class="label-text font-medium text-sm">Diagnóstico General</span></label>
          <textarea v-model="form.diagnosticoGeneral" class="textarea textarea-bordered textarea-sm w-full" rows="2" placeholder="Diagnóstico preliminary..."></textarea>
        </div>
      </div>

      <!-- Tratamiento -->
      <div class="bg-base-100 rounded-xl p-5 space-y-3">
        <h4 class="text-sm font-semibold text-base-content/70 uppercase tracking-wide flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
          Tratamiento
        </h4>
        <div class="form-control">
          <label class="label py-0"><span class="label-text font-medium text-sm">Tratamiento Indicado</span></label>
          <textarea v-model="form.tratamientoIndicado" class="textarea textarea-bordered textarea-sm w-full" rows="2" placeholder="Tratamiento recetado..."></textarea>
        </div>
        <div class="form-control">
          <label class="label py-0"><span class="label-text font-medium text-sm">Observaciones</span></label>
          <textarea v-model="form.observaciones" class="textarea textarea-bordered textarea-sm w-full" rows="2" placeholder="Notas adicionales..."></textarea>
        </div>
      </div>

      <!-- Acciones -->
      <div class="flex justify-end gap-3 pt-2">
        <button type="button" class="btn btn-ghost" @click="router.back()">Cancelar</button>
        <button type="submit" class="btn btn-primary gap-2" :disabled="loading">
          <span v-if="loading" class="loading loading-spinner loading-sm"></span>
          <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg>
          Registrar Consulta
        </button>
      </div>
    </form>
  </div>
</template>

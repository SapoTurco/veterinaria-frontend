<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'

const router = useRouter()
const authStore = useAuthStore()

const step = ref(1)
const totalSteps = 3

const form = ref({
  tipoDocumento: 'CC',
  numeroDocumento: '',
  primerNombre: '',
  segundoNombre: '',
  primerApellido: '',
  segundoApellido: '',
  telefono: '',
  direccion: '',
  email: '',
  password: '',
  confirmPassword: '',
})
const loading = ref(false)
const error = ref('')
const showPassword = ref(false)
const focusedField = ref('')

const stepErrors = ref<Record<number, string>>({})

function validateStep(stepNum: number): boolean {
  stepErrors.value[stepNum] = ''
  if (stepNum === 1) {
    if (!form.value.primerNombre.trim()) {
      stepErrors.value[1] = 'El primer nombre es obligatorio'
      return false
    }
    if (!form.value.primerApellido.trim()) {
      stepErrors.value[1] = 'El primer apellido es obligatorio'
      return false
    }
    return true
  }
  if (stepNum === 2) {
    if (!form.value.numeroDocumento.trim()) {
      stepErrors.value[2] = 'El número de documento es obligatorio'
      return false
    }
    if (!form.value.email.trim()) {
      stepErrors.value[2] = 'El correo electrónico es obligatorio'
      return false
    }
    return true
  }
  return true
}

function nextStep() {
  if (validateStep(step.value) && step.value < totalSteps) step.value++
}

function prevStep() {
  if (step.value > 1) step.value--
}

async function handleRegister() {
  if (form.value.password !== form.value.confirmPassword) {
    error.value = 'Las contraseñas no coinciden'
    return
  }

  loading.value = true
  error.value = ''
  try {
    const data: any = {
      tipoDocumento: form.value.tipoDocumento,
      numeroDocumento: form.value.numeroDocumento,
      primerNombre: form.value.primerNombre,
      primerApellido: form.value.primerApellido,
      email: form.value.email,
      password: form.value.password,
    }
    if (form.value.segundoNombre) data.segundoNombre = form.value.segundoNombre
    if (form.value.segundoApellido) data.segundoApellido = form.value.segundoApellido
    if (form.value.telefono) data.telefono = form.value.telefono
    if (form.value.direccion) data.direccion = form.value.direccion
    await authStore.register(data)
    router.push('/login')
  } catch (e: any) {
    error.value = e.response?.data?.message || 'Error al registrarse'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div>
    <!-- Title -->
    <div class="text-center mb-6 form-field">
      <h2 class="text-xl sm:text-2xl font-extrabold text-[#FFFFE3]">Crear tu cuenta</h2>
      <p class="text-sm text-[#CBCBCB] mt-2">Únete a nuestra comunidad de mascotas</p>
    </div>

    <!-- Step indicator -->
    <div class="flex justify-center gap-2 mb-6 form-field">
      <div
        v-for="s in totalSteps"
        :key="s"
        class="step-dot h-2 rounded-full transition-all duration-500"
        :class="s <= step ? 'bg-[#1A8A8E] w-8' : 'bg-[#4A4A4A] w-2'"
      ></div>
    </div>

    <div v-if="stepErrors[step]" class="text-center mb-2">
      <span class="text-xs text-red-400">{{ stepErrors[step] }}</span>
    </div>

    <!-- Error -->
    <Transition name="shake">
      <div v-if="error" class="alert alert-error mb-4">
        <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-5 w-5" fill="none" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span class="text-sm">{{ error }}</span>
      </div>
    </Transition>

    <form @submit.prevent="handleRegister">
      <div class="steps-container">
        <!-- Step 1: Personal Info -->
        <div class="step-content" :class="{ active: step === 1 }">
          <div class="text-center mb-4">
            <span class="badge badge-outline gap-1 border-[#4A4A4A] bg-[#353535]/50 text-[#CBCBCB]">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Datos personales
            </span>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div class="form-control">
              <label class="label"><span class="label-text font-semibold text-xs text-[#CBCBCB]">Primer nombre *</span></label>
              <input v-model="form.primerNombre" type="text" placeholder="Primer nombre" class="input input-bordered input-sm w-full input-animated" required />
            </div>
            <div class="form-control">
              <label class="label"><span class="label-text font-semibold text-xs text-[#CBCBCB]">Segundo nombre</span></label>
              <input v-model="form.segundoNombre" type="text" placeholder="Segundo nombre" class="input input-bordered input-sm w-full input-animated" />
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div class="form-control">
              <label class="label"><span class="label-text font-semibold text-xs text-[#CBCBCB]">Primer apellido *</span></label>
              <input v-model="form.primerApellido" type="text" placeholder="Primer apellido" class="input input-bordered input-sm w-full input-animated" required />
            </div>
            <div class="form-control">
              <label class="label"><span class="label-text font-semibold text-xs text-[#CBCBCB]">Segundo apellido</span></label>
              <input v-model="form.segundoApellido" type="text" placeholder="Segundo apellido" class="input input-bordered input-sm w-full input-animated" />
            </div>
          </div>

          <div class="form-control">
            <label class="label"><span class="label-text font-semibold text-xs text-[#CBCBCB]">Teléfono</span></label>
            <input v-model="form.telefono" type="tel" placeholder="Número de telefono" class="input input-bordered input-sm w-full input-animated" />
          </div>

          <div class="form-control">
            <label class="label"><span class="label-text font-semibold text-xs text-[#CBCBCB]">Dirección</span></label>
            <input v-model="form.direccion" type="text" placeholder="Dirección de residencia" class="input input-bordered input-sm w-full input-animated" />
          </div>

          <div class="step-buttons">
            <button type="button" class="btn w-full h-11 btn-ripple rounded-xl font-bold text-sm bg-[#0D7377] hover:bg-[#1A8A8E] border-none text-white" @click="nextStep">
              Siguiente
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>

        <!-- Step 2: Document & Email -->
        <div class="step-content" :class="{ active: step === 2 }">
          <div class="text-center mb-4">
            <span class="badge badge-outline gap-1 border-[#4A4A4A] bg-[#353535]/50 text-[#CBCBCB]">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Documento y contacto
            </span>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div class="form-control">
              <label class="label"><span class="label-text font-semibold text-xs text-[#CBCBCB]">Tipo documento *</span></label>
              <select v-model="form.tipoDocumento" class="select select-bordered select-sm w-full input-animated">
                <option value="CC">Cédula de Ciudadanía</option>
                <option value="CE">Cédula de Extranjería</option>
                <option value="PASAPORTE">Pasaporte</option>
              </select>
            </div>
            <div class="form-control">
              <label class="label"><span class="label-text font-semibold text-xs text-[#CBCBCB]">Número *</span></label>
              <input v-model="form.numeroDocumento" type="text" placeholder="Número de documento" class="input input-bordered input-sm w-full input-animated" required />
            </div>
          </div>

          <div class="form-control">
            <label class="label"><span class="label-text font-semibold text-xs text-[#CBCBCB]">Correo electrónico *</span></label>
            <div class="relative">
              <input v-model="form.email" type="email" placeholder="Correo electrónico" class="input input-bordered input-sm w-full pl-11 input-animated" required />
              <div class="absolute left-3 top-1/2 -translate-y-1/2 text-[#9a9a9a]">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
          </div>

          <div class="step-buttons flex gap-3">
            <button type="button" class="btn btn-outline flex-1 h-11 rounded-xl font-bold text-sm border-[#4A4A4A] text-[#CBCBCB] hover:bg-[#3a3a3a] hover:border-[#5a5a5a]" @click="prevStep">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
              </svg>
              Atrás
            </button>
            <button type="button" class="btn flex-1 h-11 btn-ripple rounded-xl font-bold text-sm bg-[#0D7377] hover:bg-[#1A8A8E] border-none text-white" @click="nextStep">
              Siguiente
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>

        <!-- Step 3: Password -->
        <div class="step-content" :class="{ active: step === 3 }">
          <div class="text-center mb-4">
            <span class="badge badge-outline gap-1 border-[#4A4A4A] bg-[#353535]/50 text-[#CBCBCB]">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              Crear contrasena
            </span>
          </div>

          <div class="form-control">
            <label class="label"><span class="label-text font-semibold text-xs text-[#CBCBCB]">Contraseña *</span></label>
            <div class="relative">
              <input
                v-model="form.password"
                :type="showPassword ? 'text' : 'password'"
                placeholder="Mínimo 8 caracteres"
                class="input input-bordered input-sm w-full pl-11 pr-11 input-animated"
                minlength="8"
                required
              />
              <div class="absolute left-3 top-1/2 -translate-y-1/2 text-[#9a9a9a]">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <button type="button" class="absolute right-3 top-1/2 -translate-y-1/2 text-[#9a9a9a] hover:text-[#1A8A8E] transition-colors" @click="showPassword = !showPassword">
                <svg v-if="!showPassword" xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                </svg>
              </button>
            </div>
          </div>

          <div class="form-control">
            <label class="label"><span class="label-text font-semibold text-xs text-[#CBCBCB]">Confirmar contraseña *</span></label>
            <div class="relative">
              <input
                v-model="form.confirmPassword"
                :type="showPassword ? 'text' : 'password'"
                placeholder="Repetir contraseña"
                class="input input-bordered input-sm w-full pl-11 pr-11 input-animated"
                required
              />
              <div class="absolute left-3 top-1/2 -translate-y-1/2 text-[#9a9a9a]">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <button type="button" class="absolute right-3 top-1/2 -translate-y-1/2 text-[#9a9a9a] hover:text-[#1A8A8E] transition-colors" @click="showPassword = !showPassword">
                <svg v-if="!showPassword" xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                </svg>
              </button>
            </div>
            <label v-if="form.confirmPassword && form.password !== form.confirmPassword" class="label">
              <span class="label-text-alt text-red-400 text-xs">Las contraseñas no coinciden</span>
            </label>
          </div>

          <div class="step-buttons flex gap-3">
            <button type="button" class="btn btn-outline flex-1 h-11 rounded-xl font-bold text-sm border-[#4A4A4A] text-[#CBCBCB] hover:bg-[#3a3a3a] hover:border-[#5a5a5a]" @click="prevStep">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
              </svg>
              Atrás
            </button>
            <button
              type="submit"
              class="btn flex-1 h-11 btn-ripple rounded-xl font-bold text-sm bg-[#0D7377] hover:bg-[#1A8A8E] border-none text-white"
              :disabled="loading || (form.password !== form.confirmPassword)"
            >
              <span v-if="loading" class="loading loading-spinner loading-sm"></span>
              <span v-else>Crear cuenta</span>
            </button>
          </div>
        </div>
      </div>
    </form>

    <!-- Login link -->
    <div class="text-center mt-6 form-field">
      <p class="text-sm text-[#CBCBCB]">
        Ya tienes una cuenta?
        <router-link to="/login" class="font-bold text-[#0D7377] hover:text-[#1A8A8E] ml-1">
          Inicia sesión
        </router-link>
      </p>
    </div>
  </div>
</template>

<style scoped>
.steps-container {
  display: grid;
  grid-template-areas: "content";
}

.step-content {
  grid-area: content;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  opacity: 0;
  visibility: hidden;
  pointer-events: none;
  transition: opacity 0.25s ease;
}

.step-content.active {
  opacity: 1;
  visibility: visible;
  pointer-events: auto;
}

.step-buttons {
  padding-top: 0.5rem;
}

.shake-enter-active {
  animation: shake 0.5s ease-in-out;
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
  20%, 40%, 60%, 80% { transform: translateX(4px); }
}
</style>

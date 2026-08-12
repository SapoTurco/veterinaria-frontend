<script setup lang="ts">
const props = defineProps<{
  show: boolean
  title?: string
  message: string
  confirmText?: string
  cancelText?: string
  variant?: 'primary' | 'error' | 'warning' | 'success'
}>()

const emit = defineEmits<{
  confirm: []
  cancel: []
}>()
</script>

<template>
  <dialog :class="{ modal: true, 'modal-open': show }">
    <div class="modal-box">
      <h3 class="font-bold text-lg">
        {{ title || 'Confirmar' }}
      </h3>
      <p class="py-4">{{ message }}</p>
      <div class="modal-action">
        <button class="btn" @click="emit('cancel')">
          {{ cancelText || 'Cancelar' }}
        </button>
        <button
          class="btn"
          :class="{
            'btn-primary': variant === 'primary' || !variant,
            'btn-error': variant === 'error',
            'btn-warning': variant === 'warning',
            'btn-success': variant === 'success',
          }"
          @click="emit('confirm')"
        >
          {{ confirmText || 'Confirmar' }}
        </button>
      </div>
    </div>
    <form method="dialog" class="modal-backdrop">
      <button @click="emit('cancel')">close</button>
    </form>
  </dialog>
</template>

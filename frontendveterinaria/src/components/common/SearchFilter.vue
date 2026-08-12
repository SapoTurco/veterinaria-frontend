<script setup lang="ts">
const props = defineProps<{
  modelValue: string
  placeholder?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
  search: []
}>()

function handleInput(e: Event) {
  const value = (e.target as HTMLInputElement).value
  emit('update:modelValue', value)
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter') {
    emit('search')
  }
}
</script>

<template>
  <div class="flex gap-2">
    <input
      type="text"
      :value="modelValue"
      :placeholder="placeholder || 'Buscar...'"
      class="input input-bordered flex-1"
      @input="handleInput"
      @keydown="handleKeydown"
    />
    <button class="btn btn-primary btn-square" @click="emit('search')">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    </button>
  </div>
</template>

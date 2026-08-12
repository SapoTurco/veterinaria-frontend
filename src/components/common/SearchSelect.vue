<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'

const props = defineProps<{
  modelValue: number | string
  options: { value: number | string; label: string; sublabel?: string }[]
  placeholder?: string
  required?: boolean
  disabled?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: number | string]
}>()

const searchText = ref('')
const isOpen = ref(false)
const inputRef = ref<HTMLInputElement | null>(null)
const dropdownRef = ref<HTMLDivElement | null>(null)

const selectedOption = computed(() => props.options.find(o => o.value === props.modelValue))

const filteredOptions = computed(() => {
  if (!searchText.value) return props.options
  const q = searchText.value.toLowerCase()
  return props.options.filter(o =>
    o.label.toLowerCase().includes(q) ||
    o.sublabel?.toLowerCase().includes(q)
  )
})

function toggleDropdown() {
  if (props.disabled) return
  isOpen.value = !isOpen.value
  searchText.value = ''
  if (isOpen.value) {
    setTimeout(() => inputRef.value?.focus(), 0)
  }
}

function select(value: number | string) {
  emit('update:modelValue', value)
  isOpen.value = false
  searchText.value = ''
}

function handleClickOutside(e: MouseEvent) {
  if (dropdownRef.value && !dropdownRef.value.contains(e.target as Node)) {
    isOpen.value = false
    searchText.value = ''
  }
}

onMounted(() => document.addEventListener('click', handleClickOutside))
onUnmounted(() => document.removeEventListener('click', handleClickOutside))
</script>

<template>
  <div ref="dropdownRef" class="relative">
    <!-- Display selected value -->
    <div
      class="flex items-center gap-2 input input-bordered input-sm w-full cursor-pointer pr-8 hover:border-[#0D7377] transition-colors"
      :class="{ 'border-[#0D7377]': isOpen }"
      @click="toggleDropdown"
    >
      <span v-if="selectedOption" class="truncate flex-1 text-sm">{{ selectedOption.label }}</span>
      <span v-else class="truncate flex-1 text-sm text-base-content/40">{{ placeholder || 'Seleccionar...' }}</span>
      <span v-if="selectedOption?.sublabel" class="text-xs text-base-content/50 truncate">{{ selectedOption.sublabel }}</span>
      <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-base-content/40 flex-shrink-0 transition-transform" :class="{ 'rotate-180': isOpen }" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" /></svg>
    </div>

    <!-- Dropdown -->
    <div
      v-if="isOpen"
      class="absolute z-50 mt-1 w-full rounded-lg shadow-xl border border-[#4A4A4A] overflow-hidden"
      style="background: rgba(30, 30, 30, 0.97);"
    >
      <!-- Search input -->
      <div class="p-2 border-b border-[#4A4A4A]">
        <input
          ref="inputRef"
          v-model="searchText"
          type="text"
          class="input input-bordered input-sm w-full"
          placeholder="Buscar..."
        />
      </div>

      <!-- Options list -->
      <div class="max-h-60 overflow-y-auto">
        <div v-if="filteredOptions.length === 0" class="p-3 text-sm text-[#CBCBCB]/60 text-center">
          No se encontraron resultados
        </div>
        <button
          v-for="option in filteredOptions"
          :key="option.value"
          type="button"
          class="w-full px-3 py-2.5 text-left text-sm flex items-center justify-between gap-2 transition-colors"
          :class="option.value === modelValue
            ? 'bg-[#0D7377]/20 text-[#FFFFE3] font-medium border-l-2 border-[#0D7377]'
            : 'text-[#CBCBCB] hover:bg-[#0D7377]/10 hover:text-[#FFFFE3] border-l-2 border-transparent'"
          @click="select(option.value)"
        >
          <div class="flex items-center gap-2 min-w-0">
            <svg v-if="option.value === modelValue" xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-[#0D7377] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg>
            <span class="truncate">{{ option.label }}</span>
          </div>
          <span v-if="option.sublabel" class="text-xs text-[#CBCBCB]/50 truncate flex-shrink-0">{{ option.sublabel }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

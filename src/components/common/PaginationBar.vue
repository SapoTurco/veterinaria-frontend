<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  page: number
  totalPages: number
  totalElements: number
  size: number
}>()

const emit = defineEmits<{
  'update:page': [page: number]
}>()

const pages = computed(() => {
  const result: (number | string)[] = []
  const total = props.totalPages
  const current = props.page

  if (total <= 7) {
    for (let i = 0; i < total; i++) result.push(i)
  } else {
    result.push(0)
    if (current > 3) result.push('...')
    for (
      let i = Math.max(1, current - 1);
      i <= Math.min(total - 2, current + 1);
      i++
    ) {
      result.push(i)
    }
    if (current < total - 4) result.push('...')
    result.push(total - 1)
  }
  return result
})

function goToPage(page: number) {
  if (page >= 0 && page < props.totalPages) {
    emit('update:page', page)
  }
}
</script>

<template>
  <div class="flex flex-col sm:flex-row items-center justify-between gap-3 mt-4 px-2">
    <div class="text-xs sm:text-sm text-base-content/60 text-center sm:text-left">
      Mostrando {{ page * size + 1 }} - {{ Math.min((page + 1) * size, totalElements) }}
      de {{ totalElements }} registros
    </div>
    <div class="join">
      <button
        class="join-item btn btn-sm"
        :disabled="page === 0"
        @click="goToPage(page - 1)"
      >
        «
      </button>
      <template v-for="(p, index) in pages" :key="index">
        <button
          v-if="typeof p === 'number'"
          class="join-item btn btn-sm"
          :class="{ 'btn-active': p === page }"
          @click="goToPage(p)"
        >
          {{ p + 1 }}
        </button>
        <span v-else class="join-item btn btn-sm btn-disabled">...</span>
      </template>
      <button
        class="join-item btn btn-sm"
        :disabled="page >= totalPages - 1"
        @click="goToPage(page + 1)"
      >
        »
      </button>
    </div>
  </div>
</template>

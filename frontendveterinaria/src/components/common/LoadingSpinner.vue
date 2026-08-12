<script setup lang="ts">
const props = defineProps<{
  show: boolean
  title?: string
}>()
</script>

<template>
  <div v-if="show" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
    <div class="bg-base-100 rounded-xl p-8 shadow-2xl text-center">
      <span class="loading loading-spinner loading-lg text-primary"></span>
      <p v-if="title" class="mt-4 text-base-content/70">{{ title }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, RouterView } from 'vue-router'
import AuthLayout from '@/layouts/AuthLayout.vue'

const route = useRoute()
const isAuthRoute = computed(() => route.meta.layout === 'auth')
</script>

<template>
  <AuthLayout v-if="isAuthRoute">
    <RouterView />
  </AuthLayout>
  <RouterView v-else />
</template>

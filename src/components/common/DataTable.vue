<script setup lang="ts" generic="T">
import { computed } from 'vue'

const props = defineProps<{
  columns: { key: string; label: string; sortable?: boolean }[]
  data: T[]
  loading?: boolean
  emptyMessage?: string
}>()

const emit = defineEmits<{
  sort: [field: string]
}>()

function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((acc, part) => acc?.[part], obj)
}
</script>

<template>
  <div class="overflow-x-auto">
    <table class="table table-zebra w-full">
      <thead>
        <tr>
          <th
            v-for="col in columns"
            :key="col.key"
            :class="{ 'cursor-pointer hover:bg-base-200': col.sortable }"
            @click="col.sortable && emit('sort', col.key)"
          >
            <div class="flex items-center gap-1">
              {{ col.label }}
              <svg
                v-if="col.sortable"
                xmlns="http://www.w3.org/2000/svg"
                class="h-4 w-4 opacity-50"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
              </svg>
            </div>
          </th>
          <th class="w-24">Acciones</th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="loading">
          <td :colspan="columns.length + 1" class="text-center py-8">
            <span class="loading loading-spinner loading-md text-primary"></span>
          </td>
        </tr>
        <tr v-else-if="data.length === 0">
          <td :colspan="columns.length + 1" class="text-center py-8 text-base-content/50">
            {{ emptyMessage || 'No hay datos disponibles' }}
          </td>
        </tr>
        <tr v-else v-for="(item, index) in data" :key="index">
          <td v-for="col in columns" :key="col.key">
            <slot :name="`cell-${col.key}`" :item="item" :value="getNestedValue(item, col.key)">
              {{ getNestedValue(item, col.key) }}
            </slot>
          </td>
          <td>
            <slot name="actions" :item="item" />
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

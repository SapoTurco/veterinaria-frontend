<script setup lang="ts" generic="T">
import { computed } from 'vue'

const props = defineProps<{
  columns: { key: string; label: string; sortable?: boolean }[]
  data: T[]
  loading?: boolean
  emptyMessage?: string
  dimInactive?: boolean
}>()

const emit = defineEmits<{
  sort: [field: string]
}>()

function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((acc, part) => acc?.[part], obj)
}

function isInactive(item: T): boolean {
  return (item as { estado?: boolean }).estado === false
}
</script>

<template>
  <!-- Desktop table -->
  <div class="overflow-x-auto hidden sm:block">
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
          <td
            v-for="col in columns"
            :key="col.key"
            :class="{ 'opacity-50 line-through': dimInactive && isInactive(item) }"
          >
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

  <!-- Mobile cards -->
  <div class="sm:hidden space-y-3">
    <div v-if="loading" class="flex justify-center py-8">
      <span class="loading loading-spinner loading-md text-primary"></span>
    </div>
    <div v-else-if="data.length === 0" class="text-center py-8 text-base-content/50">
      {{ emptyMessage || 'No hay datos disponibles' }}
    </div>
    <div
      v-else
      v-for="(item, index) in data"
      :key="index"
      class="bg-white/5 rounded-xl p-4 space-y-2"
    >
      <div
        v-for="(col, colIdx) in columns"
        :key="col.key"
        class="flex justify-between items-start gap-2"
        :class="{ 'opacity-50 line-through': dimInactive && isInactive(item) }"
      >
        <span class="text-xs text-base-content/50 uppercase shrink-0">{{ col.label }}</span>
        <span class="text-sm text-right">
          <slot :name="`cell-${col.key}`" :item="item" :value="getNestedValue(item, col.key)">
            {{ getNestedValue(item, col.key) }}
          </slot>
        </span>
      </div>
      <div class="pt-2 flex justify-end">
        <slot name="actions" :item="item" />
      </div>
    </div>
  </div>
</template>

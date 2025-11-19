<script setup lang="ts">
import { computed } from 'vue'
import type { SearchCriteria } from '../../types'

const fieldLabels: Record<string, string> = {
  fieldNumber: '欄位編號',
  fieldName: '欄位名稱',
  fileCode: '檔案代碼',
  fileName: '檔案名稱',
  dataType: '型態',
  length: '長度',
  fieldDescription: '欄位說明',
  remark: 'Remark',
}

// Props
interface Props {
  criteria: SearchCriteria
}

const props = defineProps<Props>()

// Emits
const emit = defineEmits<{
  removeCondition: [field: string, condition: string]
  clearAll: []
}>()

const filterTags = computed(() => {
  const tags: Array<{
    field: string
    fieldLabel: string
    condition: string
    key: string
  }> = []

  for (const [field, conditions] of Object.entries(props.criteria)) {
    if (conditions && conditions.length > 0) {
      for (const condition of conditions) {
        tags.push({
          field,
          fieldLabel: fieldLabels[field] || field,
          condition,
          key: `${field}-${condition}`,
        })
      }
    }
  }

  return tags
})

const hasFilters = computed(() => filterTags.value.length > 0)

function removeCondition(field: string, condition: string) {
  emit('removeCondition', field, condition)
}

function clearAllFilters() {
  emit('clearAll')
}
</script>

<template>
  <div
    v-if="hasFilters"
    class="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700 transition-colors duration-200"
  >
    <div class="flex items-center justify-between mb-3">
      <div class="flex items-center gap-2">
        <span class="text-sm font-medium text-gray-700 dark:text-gray-300"> 目前搜尋條件 </span>
        <span
          class="inline-flex items-center justify-center px-2 py-0.5 text-xs font-semibold rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300"
        >
          {{ filterTags.length }}
        </span>
      </div>

      <button
        @click="clearAllFilters"
        class="text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 font-medium transition-colors duration-200 flex items-center gap-1"
        title="清除所有條件"
      >
        <span class="text-base">✕</span>
        <span>清除全部</span>
      </button>
    </div>

    <div class="flex flex-wrap gap-2">
      <div
        v-for="tag in filterTags"
        :key="tag.key"
        class="inline-flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-full shadow-sm hover:shadow transition-all duration-200 group"
      >
        <span class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
          {{ tag.fieldLabel }}
        </span>

        <span class="text-gray-300 dark:text-gray-600">|</span>

        <span class="text-sm font-medium text-gray-900 dark:text-white">
          {{ tag.condition }}
        </span>

        <button
          @click="removeCondition(tag.field, tag.condition)"
          class="ml-1 p-0.5 rounded-full text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-200"
          :title="`移除條件: ${tag.condition}`"
        >
          <svg
            class="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
    </div>

    <div class="mt-3 text-xs text-gray-500 dark:text-gray-400">
      <span>💡 提示：點擊標籤上的 ✕ 可快速移除個別條件</span>
    </div>
  </div>
</template>

<style scoped>
.group:hover {
  transform: translateY(-1px);
}

button,
.group {
  transition-property: all;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 200ms;
}
</style>

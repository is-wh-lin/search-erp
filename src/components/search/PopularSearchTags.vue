<template>
  <div
    v-if="hasPopularSearches"
    class="bg-yellow-50 dark:bg-gray-800 rounded-lg p-4 border border-yellow-200 dark:border-gray-700"
  >
    <div class="flex items-center justify-between mb-3">
      <h3 class="text-sm font-medium text-gray-700 dark:text-gray-300">🔥 熱門搜尋</h3>
      <button
        @click="handleClearPopularSearches"
        class="text-xs text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 transition-colors"
        title="清除熱門搜尋統計"
      >
        清除統計
      </button>
    </div>

    <div class="flex flex-wrap gap-2">
      <button
        v-for="item in topPopularSearches"
        :key="`${item.field}-${item.term}`"
        @click="handleTagClick(item)"
        class="inline-flex items-center gap-2 px-3 py-2 rounded-full text-sm bg-white dark:bg-gray-700 border border-yellow-300 dark:border-yellow-600 text-gray-700 dark:text-gray-200 hover:bg-yellow-100 dark:hover:bg-yellow-900 hover:border-yellow-400 dark:hover:border-yellow-500 hover:shadow-md transition-all duration-200 cursor-pointer active:scale-95"
        :title="`在「${getFieldLabel(item.field)}」搜尋「${item.term}」（已搜尋 ${item.count} 次）`"
      >
        <span class="text-xs font-medium text-yellow-600 dark:text-yellow-400">{{
          getFieldLabel(item.field)
        }}</span>
        <span class="text-gray-400 dark:text-gray-500">:</span>
        <span class="font-medium">{{ item.term }}</span>
        <span
          class="text-xs px-2 py-1 rounded-full bg-yellow-500 dark:bg-yellow-600 text-white font-semibold"
          >{{ item.count }}</span
        >
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useSearchStore } from '../../stores/searchStore'
import { useConfirm } from '../../composables/useConfirm'
import type { PopularSearch, SearchCriteria } from '../../types'

const searchStore = useSearchStore()
const { confirm } = useConfirm()

// Computed
const topPopularSearches = computed(() => searchStore.topPopularSearches)
const hasPopularSearches = computed(() => searchStore.hasPopularSearches)

const fieldLabels: Record<keyof SearchCriteria, string> = {
  fieldNumber: '欄位編號',
  fieldName: '欄位名稱',
  fileCode: '檔案代碼',
  fileName: '檔案名稱',
  dataType: '型態',
  length: '長度',
  fieldDescription: '欄位說明',
  remark: 'Remark',
}

// Methods
function getFieldLabel(field: keyof SearchCriteria): string {
  return fieldLabels[field] || field
}

function handleTagClick(item: PopularSearch): void {
  searchStore.searchByPopularTag(item.term, item.field)
}

async function handleClearPopularSearches(): Promise<void> {
  const confirmed = await confirm({
    title: '清除熱門搜尋統計',
    message: '確定要清除所有熱門搜尋統計嗎？此操作無法復原。',
    confirmText: '清除',
    cancelText: '取消',
  })

  if (confirmed) {
    searchStore.clearPopularSearches()
  }
}
</script>

<style scoped>
/* Styles moved to template for Tailwind compatibility */
</style>

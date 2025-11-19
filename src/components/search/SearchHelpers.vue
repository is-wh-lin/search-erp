<script setup lang="ts">
import { computed } from 'vue'
import { useSearchStore } from '../../stores/searchStore'
import SearchHistory from './SearchHistory.vue'
import PopularSearchTags from './PopularSearchTags.vue'

const searchStore = useSearchStore()

const hasCriteria = computed(() => searchStore.hasCriteria)

const filledFieldsCount = computed(() => {
  return Object.values(searchStore.criteria).filter(
    (conditions) => conditions && conditions.length > 0
  ).length
})

function clearAll() {
  searchStore.clearCriteria()
}
</script>

<template>
  <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 transition-colors duration-200">
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
      <div class="flex-1">
        <h2 class="text-lg font-semibold text-gray-900 dark:text-white">搜尋輔助功能</h2>
      </div>

      <div class="flex items-center gap-3 shrink-0">
        <SearchHistory />

        <button
          v-if="hasCriteria"
          @click="clearAll"
          class="px-4 py-2 min-h-[44px] rounded-lg font-medium transition-all duration-200 flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white shadow-sm hover:shadow"
          title="清除所有搜尋條件"
        >
          <span class="text-lg">✕</span>
          <span class="hidden sm:inline">清除全部</span>
        </button>
      </div>
    </div>

    <div v-if="hasCriteria" class="mb-3 flex items-center gap-2 text-sm">
      <span class="text-gray-600 dark:text-gray-400">
        已設定 {{ filledFieldsCount }} 個搜尋欄位
      </span>
      <span
        v-if="searchStore.searching"
        class="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400"
      >
        <span
          class="inline-block w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"
        ></span>
        搜尋中...
      </span>
      <span v-else-if="searchStore.hasResults" class="text-green-600 dark:text-green-400">
        找到 {{ searchStore.resultCount.toLocaleString() }} 筆結果
      </span>
      <span v-else class="text-gray-500 dark:text-gray-400"> 查無資料 </span>
    </div>

    <div class="mt-3">
      <PopularSearchTags />
    </div>
  </div>
</template>

<style scoped>
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.animate-spin {
  animation: spin 1s linear infinite;
}
</style>

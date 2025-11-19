<script setup lang="ts">
import { computed } from 'vue'
import { useSearchStore } from '../../stores/searchStore'
import { useDataStore } from '../../stores/dataStore'
import type { FieldRecord } from '../../types'
import VirtualScroller from './VirtualScroller.vue'

const searchStore = useSearchStore()

const dataStore = useDataStore()

const hasSearchCriteria = computed(() => searchStore.hasCriteria)

const results = computed(() => {
  if (hasSearchCriteria.value) {
    return searchStore.results
  }

  return dataStore.records
})

const resultCount = computed(() => results.value.length)
const hasResults = computed(() => results.value.length > 0)
const searching = computed(() => searchStore.searching)
const dataLoading = computed(() => dataStore.loading)
const dataLoaded = computed(() => dataStore.hasData)

const VIRTUAL_SCROLL_THRESHOLD = 100
const CARD_HEIGHT = 280

const useVirtualScroll = computed(() => resultCount.value > VIRTUAL_SCROLL_THRESHOLD)

function getFieldValue(record: FieldRecord, key: string): string {
  return record[key as keyof FieldRecord] || '-'
}
</script>

<template>
  <div class="bg-white dark:bg-gray-800 rounded-lg shadow transition-colors duration-200">
    <div class="px-4 py-4 border-b border-gray-200 dark:border-gray-700">
      <div class="flex flex-col xs:flex-row xs:items-center xs:justify-between gap-2">
        <h2 class="text-lg font-semibold text-gray-900 dark:text-white">搜尋結果</h2>
        <div v-if="hasResults" class="text-sm font-medium text-gray-600 dark:text-gray-400">
          共
          <span class="text-blue-600 dark:text-blue-400 font-bold">{{
            resultCount.toLocaleString()
          }}</span>
          筆記錄
        </div>
      </div>
    </div>

    <div v-if="dataLoading" class="flex items-center justify-center py-12">
      <div class="relative w-10 h-10">
        <div
          class="absolute inset-0 border-4 border-gray-200 dark:border-gray-700 rounded-full"
        ></div>
        <div
          class="absolute inset-0 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"
        ></div>
      </div>
      <p class="ml-3 text-sm text-gray-600 dark:text-gray-400">載入資料中...</p>
    </div>

    <div v-else-if="searching" class="flex items-center justify-center py-12">
      <div class="relative w-10 h-10">
        <div
          class="absolute inset-0 border-4 border-gray-200 dark:border-gray-700 rounded-full"
        ></div>
        <div
          class="absolute inset-0 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"
        ></div>
      </div>
      <p class="ml-3 text-sm text-gray-600 dark:text-gray-400">搜尋中...</p>
    </div>

    <div
      v-else-if="hasSearchCriteria && !hasResults"
      class="flex flex-col items-center justify-center py-12"
    >
      <div class="text-5xl mb-3">🔍</div>
      <h3 class="text-base font-medium text-gray-900 dark:text-white mb-2">查無資料</h3>
      <p class="text-xs text-gray-500 dark:text-gray-400 text-center px-4">請調整搜尋條件後重試</p>
    </div>

    <div v-else-if="dataLoaded && hasResults && useVirtualScroll" class="virtual-scroll-wrapper">
      <VirtualScroller
        :items="results"
        :item-height="CARD_HEIGHT"
        :threshold="VIRTUAL_SCROLL_THRESHOLD"
        class="virtual-scroll-container"
      >
        <template #default="{ item: record, index }">
          <div
            class="p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-150 border-b border-gray-200 dark:border-gray-700"
          >
            <div class="flex items-start justify-between mb-3">
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2 mb-1">
                  <span class="text-lg">🔢</span>
                  <h3 class="text-sm font-semibold text-gray-900 dark:text-white truncate">
                    {{ getFieldValue(record, 'fieldNumber') }}
                  </h3>
                </div>
                <p class="text-sm text-gray-700 dark:text-gray-300 font-medium">
                  {{ getFieldValue(record, 'fieldName') }}
                </p>
              </div>
              <div
                class="ml-2 px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs font-medium rounded"
              >
                #{{ index + 1 }}
              </div>
            </div>

            <div class="grid grid-cols-2 gap-2 mb-3">
              <div class="flex items-start gap-2">
                <span class="text-base shrink-0">📁</span>
                <div class="min-w-0 flex-1">
                  <p class="text-xs text-gray-500 dark:text-gray-400">檔案代碼</p>
                  <p class="text-sm text-gray-900 dark:text-white font-medium truncate">
                    {{ getFieldValue(record, 'fileCode') }}
                  </p>
                </div>
              </div>
              <div class="flex items-start gap-2">
                <span class="text-base shrink-0">📄</span>
                <div class="min-w-0 flex-1">
                  <p class="text-xs text-gray-500 dark:text-gray-400">檔案名稱</p>
                  <p class="text-sm text-gray-900 dark:text-white font-medium truncate">
                    {{ getFieldValue(record, 'fileName') }}
                  </p>
                </div>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-2 mb-3">
              <div class="flex items-start gap-2">
                <span class="text-base shrink-0">🔤</span>
                <div class="min-w-0 flex-1">
                  <p class="text-xs text-gray-500 dark:text-gray-400">型態</p>
                  <p class="text-sm text-gray-900 dark:text-white font-medium">
                    {{ getFieldValue(record, 'dataType') }}
                  </p>
                </div>
              </div>
              <div class="flex items-start gap-2">
                <span class="text-base shrink-0">📏</span>
                <div class="min-w-0 flex-1">
                  <p class="text-xs text-gray-500 dark:text-gray-400">長度</p>
                  <p class="text-sm text-gray-900 dark:text-white font-medium">
                    {{ getFieldValue(record, 'length') }}
                  </p>
                </div>
              </div>
            </div>

            <div v-if="getFieldValue(record, 'fieldDescription') !== '-'" class="mb-2">
              <div class="flex items-start gap-2">
                <span class="text-base shrink-0">💬</span>
                <div class="min-w-0 flex-1">
                  <p class="text-xs text-gray-500 dark:text-gray-400 mb-1">欄位說明</p>
                  <p class="text-sm text-gray-700 dark:text-gray-300 wrap-break-word line-clamp-2">
                    {{ getFieldValue(record, 'fieldDescription') }}
                  </p>
                </div>
              </div>
            </div>

            <!-- Remark -->
            <div v-if="getFieldValue(record, 'remark') !== '-'" class="mb-0">
              <div class="flex items-start gap-2">
                <span class="text-base shrink-0">📌</span>
                <div class="min-w-0 flex-1">
                  <p class="text-xs text-gray-500 dark:text-gray-400 mb-1">Remark</p>
                  <p class="text-sm text-gray-700 dark:text-gray-300 wrap-break-word line-clamp-2">
                    {{ getFieldValue(record, 'remark') }}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </template>
      </VirtualScroller>
    </div>

    <div v-else-if="dataLoaded && hasResults" class="divide-y divide-gray-200 dark:divide-gray-700">
      <div
        v-for="(record, index) in results"
        :key="record.id"
        class="p-4 min-h-[44px] hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-150"
      >
        <div class="flex items-start justify-between mb-3">
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 mb-1">
              <span class="text-lg">🔢</span>
              <h3 class="text-sm font-semibold text-gray-900 dark:text-white truncate">
                {{ getFieldValue(record, 'fieldNumber') }}
              </h3>
            </div>
            <p class="text-sm text-gray-700 dark:text-gray-300 font-medium">
              {{ getFieldValue(record, 'fieldName') }}
            </p>
          </div>
          <div
            class="ml-2 px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs font-medium rounded"
          >
            #{{ index + 1 }}
          </div>
        </div>

        <div class="grid grid-cols-2 gap-2 mb-3">
          <div class="flex items-start gap-2">
            <span class="text-base shrink-0">📁</span>
            <div class="min-w-0 flex-1">
              <p class="text-xs text-gray-500 dark:text-gray-400">檔案代碼</p>
              <p class="text-sm text-gray-900 dark:text-white font-medium truncate">
                {{ getFieldValue(record, 'fileCode') }}
              </p>
            </div>
          </div>
          <div class="flex items-start gap-2">
            <span class="text-base shrink-0">📄</span>
            <div class="min-w-0 flex-1">
              <p class="text-xs text-gray-500 dark:text-gray-400">檔案名稱</p>
              <p class="text-sm text-gray-900 dark:text-white font-medium truncate">
                {{ getFieldValue(record, 'fileName') }}
              </p>
            </div>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-2 mb-3">
          <div class="flex items-start gap-2">
            <span class="text-base shrink-0">🔤</span>
            <div class="min-w-0 flex-1">
              <p class="text-xs text-gray-500 dark:text-gray-400">型態</p>
              <p class="text-sm text-gray-900 dark:text-white font-medium">
                {{ getFieldValue(record, 'dataType') }}
              </p>
            </div>
          </div>
          <div class="flex items-start gap-2">
            <span class="text-base shrink-0">📏</span>
            <div class="min-w-0 flex-1">
              <p class="text-xs text-gray-500 dark:text-gray-400">長度</p>
              <p class="text-sm text-gray-900 dark:text-white font-medium">
                {{ getFieldValue(record, 'length') }}
              </p>
            </div>
          </div>
        </div>

        <div v-if="getFieldValue(record, 'fieldDescription') !== '-'" class="mb-2">
          <div class="flex items-start gap-2">
            <span class="text-base shrink-0">💬</span>
            <div class="min-w-0 flex-1">
              <p class="text-xs text-gray-500 dark:text-gray-400 mb-1">欄位說明</p>
              <p class="text-sm text-gray-700 dark:text-gray-300 wrap-break-word">
                {{ getFieldValue(record, 'fieldDescription') }}
              </p>
            </div>
          </div>
        </div>

        <!-- Remark -->
        <div v-if="getFieldValue(record, 'remark') !== '-'" class="mb-0">
          <div class="flex items-start gap-2">
            <span class="text-base shrink-0">📌</span>
            <div class="min-w-0 flex-1">
              <p class="text-xs text-gray-500 dark:text-gray-400 mb-1">Remark</p>
              <p class="text-sm text-gray-700 dark:text-gray-300 wrap-break-word">
                {{ getFieldValue(record, 'remark') }}
              </p>
            </div>
          </div>
        </div>
      </div>
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

.wrap-break-word {
  word-wrap: break-word;
  overflow-wrap: break-word;
}

.truncate {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

@media (max-width: 767px) {
  .p-4 {
    min-height: 44px;
  }
}

.virtual-scroll-wrapper {
  max-height: 600px;
  overflow: hidden;
}

.virtual-scroll-container {
  height: 600px;
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>

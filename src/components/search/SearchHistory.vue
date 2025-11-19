<template>
  <div class="relative">
    <button
      @click="toggleDropdown"
      :disabled="!hasHistory"
      class="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-800 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-700"
      :title="hasHistory ? '查看搜尋歷史' : '無搜尋歷史'"
    >
      <svg
        class="w-5 h-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
        ></path>
      </svg>
      <span>搜尋歷史</span>
      <span
        v-if="hasHistory"
        class="px-2 py-0.5 text-xs font-semibold text-white bg-blue-500 rounded-full"
      >
        {{ historyCount }}
      </span>
    </button>

    <Transition
      enter-active-class="transition-opacity duration-150 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition-opacity duration-150 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div v-if="isOpen" class="fixed inset-0 z-40" @click="closeDropdown"></div>
    </Transition>

    <Transition
      enter-active-class="transition-all duration-150 ease-out"
      enter-from-class="opacity-0 scale-95 -translate-y-2"
      enter-to-class="opacity-100 scale-100 translate-y-0"
      leave-active-class="transition-all duration-150 ease-in"
      leave-from-class="opacity-100 scale-100 translate-y-0"
      leave-to-class="opacity-0 scale-95 -translate-y-2"
    >
      <div
        v-if="isOpen"
        class="absolute right-0 z-50 mt-2 w-96 bg-white rounded-lg shadow-xl border border-gray-200 dark:bg-gray-800 dark:border-gray-700"
        @click.stop
      >
        <div
          class="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700"
        >
          <h3 class="text-sm font-semibold text-gray-900 dark:text-gray-100">搜尋歷史</h3>
          <button
            v-if="hasHistory"
            @click="handleClearAll"
            class="text-xs text-red-600 hover:text-red-700 font-medium dark:text-red-400 dark:hover:text-red-300"
          >
            清除全部
          </button>
        </div>

        <div class="max-h-96 overflow-y-auto custom-scrollbar">
          <div v-if="!hasHistory" class="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
            <svg
              class="w-12 h-12 mx-auto mb-2 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              ></path>
            </svg>
            <p class="text-sm">尚無搜尋歷史</p>
          </div>

          <div v-else class="py-2">
            <div
              v-for="item in recentHistory"
              :key="item.id"
              class="group px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer border-b border-gray-100 dark:border-gray-700 last:border-b-0"
            >
              <div class="flex items-start justify-between gap-2">
                <div @click="handleLoadHistory(item.id)" class="flex-1 min-w-0">
                  <div class="flex items-center gap-2 mb-1">
                    <span class="text-xs text-gray-500 dark:text-gray-400">
                      {{ formatTimestamp(item.timestamp) }}
                    </span>
                    <span class="text-xs text-blue-600 dark:text-blue-400">
                      {{ item.resultCount }} 筆結果
                    </span>
                  </div>
                  <div class="space-y-1">
                    <div v-for="(value, key) in item.criteria" :key="key" class="text-sm">
                      <span class="font-medium text-gray-700 dark:text-gray-300">
                        {{ getFieldLabel(key) }}:
                      </span>
                      <span class="ml-1 text-gray-600 dark:text-gray-400">
                        {{ formatCriteriaValue(value) }}
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  @click.stop="handleDeleteHistory(item.id)"
                  class="shrink-0 p-1 text-gray-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity dark:hover:text-red-400"
                  title="刪除此記錄"
                >
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    ></path>
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useSearchStore } from '../../stores/searchStore'
import { useConfirm } from '../../composables/useConfirm'

const searchStore = useSearchStore()
const { confirm } = useConfirm()

// State
const isOpen = ref(false)

// Computed
const hasHistory = computed(() => searchStore.hasHistory)
const recentHistory = computed(() => searchStore.recentHistory)
const historyCount = computed(() => searchStore.history.length)

// Methods
function toggleDropdown() {
  if (hasHistory.value) {
    isOpen.value = !isOpen.value
  }
}

function closeDropdown() {
  isOpen.value = false
}

function handleLoadHistory(historyId: string) {
  searchStore.loadHistoryItem(historyId)
  closeDropdown()
}

function handleDeleteHistory(historyId: string) {
  searchStore.deleteHistoryItem(historyId)
}

async function handleClearAll() {
  const confirmed = await confirm({
    title: '清除搜尋歷史',
    message: '確定要清除所有搜尋歷史嗎？此操作無法復原。',
    confirmText: '清除',
    cancelText: '取消',
  })

  if (confirmed) {
    searchStore.clearHistory()
    closeDropdown()
  }
}

function formatTimestamp(timestamp: number): string {
  const date = new Date(timestamp)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) {
    return '剛剛'
  } else if (diffMins < 60) {
    return `${diffMins} 分鐘前`
  } else if (diffHours < 24) {
    return `${diffHours} 小時前`
  } else if (diffDays < 7) {
    return `${diffDays} 天前`
  } else {
    return date.toLocaleDateString('zh-TW', {
      month: 'numeric',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }
}

function getFieldLabel(key: string): string {
  const labels: Record<string, string> = {
    fieldNumber: '欄位編號',
    fieldName: '欄位名稱',
    fileCode: '檔案代碼',
    fileName: '檔案名稱',
    dataType: '型態',
    length: '長度',
    fieldDescription: '欄位說明',
    remark: 'Remark',
  }
  return labels[key] || key
}

function formatCriteriaValue(value: string[] | undefined): string {
  if (!value || value.length === 0) {
    return ''
  }
  return value.join(', ')
}

function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape' && isOpen.value) {
    closeDropdown()
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
})
</script>

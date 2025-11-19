<script setup lang="ts">
import { computed } from 'vue'
import { useSettingsStore, AVAILABLE_COLUMNS } from '../../stores/settingsStore'

// Settings Store
const settingsStore = useSettingsStore()

const columnLabels: Record<string, string> = {
  fieldNumber: '欄位編號',
  fieldName: '欄位名稱',
  fileCode: '檔案代碼',
  fileName: '檔案名稱',
  dataType: '型態',
  length: '長度',
  fieldDescription: '欄位說明',
  remark: 'Remark',
}

const visibleColumns = computed(() => settingsStore.settings.visibleColumns)

const isAllSelected = computed(() => visibleColumns.value.length === AVAILABLE_COLUMNS.length)

const isPartiallySelected = computed(
  () => visibleColumns.value.length > 0 && visibleColumns.value.length < AVAILABLE_COLUMNS.length
)

function isColumnVisible(column: string): boolean {
  return settingsStore.isColumnVisible(column)
}

function handleToggleColumn(column: string): void {
  settingsStore.toggleColumn(column)
}

function handleToggleAll(): void {
  if (isAllSelected.value) {
    const firstColumn = AVAILABLE_COLUMNS[0]
    if (firstColumn) {
      settingsStore.setVisibleColumns([firstColumn])
    }
  } else {
    settingsStore.setVisibleColumns([...AVAILABLE_COLUMNS])
  }
}

function isLastVisibleColumn(column: string): boolean {
  return visibleColumns.value.length === 1 && isColumnVisible(column)
}
</script>

<template>
  <section>
    <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">欄位顯示</h3>

    <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">
      選擇要在結果表格中顯示的欄位（至少需保留一個欄位）
    </p>

    <div
      class="mb-4 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700"
    >
      <label class="flex items-center gap-3 cursor-pointer">
        <div class="relative">
          <input
            type="checkbox"
            :checked="isAllSelected"
            :indeterminate="isPartiallySelected"
            @change="handleToggleAll"
            class="w-5 h-5 text-blue-600 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500 dark:focus:ring-blue-600 focus:ring-2 cursor-pointer"
          />
          <svg
            v-if="isPartiallySelected && !isAllSelected"
            class="absolute inset-0 w-5 h-5 text-blue-600 pointer-events-none"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 12h14" />
          </svg>
        </div>
        <div class="flex-1">
          <div class="font-medium text-gray-900 dark:text-white">
            {{ isAllSelected ? '取消全選' : '全選' }}
          </div>
          <div class="text-xs text-gray-500 dark:text-gray-400">
            已選取 {{ visibleColumns.length }} / {{ AVAILABLE_COLUMNS.length }} 個欄位
          </div>
        </div>
      </label>
    </div>

    <div class="space-y-2">
      <div
        v-for="column in AVAILABLE_COLUMNS"
        :key="column"
        :class="[
          'p-3 rounded-lg border transition-all duration-200',
          isColumnVisible(column)
            ? 'border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20'
            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600',
        ]"
      >
        <label class="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            :checked="isColumnVisible(column)"
            :disabled="isLastVisibleColumn(column)"
            @change="handleToggleColumn(column)"
            :class="[
              'w-4 h-4 text-blue-600 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500 dark:focus:ring-blue-600 focus:ring-2',
              isLastVisibleColumn(column) ? 'cursor-not-allowed opacity-50' : 'cursor-pointer',
            ]"
          />
          <div class="flex-1">
            <div
              :class="[
                'font-medium',
                isColumnVisible(column)
                  ? 'text-blue-600 dark:text-blue-400'
                  : 'text-gray-900 dark:text-white',
              ]"
            >
              {{ columnLabels[column] }}
            </div>
            <div
              v-if="isLastVisibleColumn(column)"
              class="text-xs text-amber-600 dark:text-amber-400 mt-1"
            >
              ⚠️ 至少需保留一個欄位
            </div>
          </div>
          <div v-if="isColumnVisible(column)" class="text-blue-600 dark:text-blue-400">
            <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fill-rule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clip-rule="evenodd"
              />
            </svg>
          </div>
        </label>
      </div>
    </div>

    <div
      class="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800"
    >
      <div class="flex items-start gap-2">
        <svg
          class="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            fill-rule="evenodd"
            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
            clip-rule="evenodd"
          />
        </svg>
        <div class="text-xs text-blue-700 dark:text-blue-300">
          <p class="font-medium mb-1">提示</p>
          <p>選擇的欄位會立即套用到搜尋結果表格中，設定會自動儲存。</p>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
input[type='checkbox']:indeterminate {
  background-color: #3b82f6;
  border-color: #3b82f6;
}
</style>

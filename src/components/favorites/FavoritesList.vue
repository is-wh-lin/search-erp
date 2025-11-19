<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useFavoritesStore } from '../../stores/favoritesStore'
import { useSettingsStore } from '../../stores/settingsStore'
import { useToast } from '../../composables/useToast'
import { useConfirm } from '../../composables/useConfirm'
import { useDebounce } from '../../composables/useDebounce'
import type { FieldRecord } from '../../types'
import FavoriteButton from './FavoriteButton.vue'

// Props
interface Props {
  viewMode?: 'table' | 'card'
}

withDefaults(defineProps<Props>(), {
  viewMode: 'table',
})

const favoritesStore = useFavoritesStore()
const settingsStore = useSettingsStore()

const { success, error: showError } = useToast()

const { confirm } = useConfirm()

const tableSearchCriteria = ref<Record<string, string>>({
  fieldNumber: '',
  fieldName: '',
  fileCode: '',
  fileName: '',
  dataType: '',
  length: '',
  fieldDescription: '',
  remark: '',
})

const localSortField = ref<string | null>(null)
const localSortOrder = ref<'asc' | 'desc'>('asc')

const defaultColumnWidths: Record<string, number> = {
  fieldNumber: 120,
  fieldName: 160,
  fileCode: 120,
  fileName: 200,
  dataType: 80,
  length: 80,
  fieldDescription: 240,
  remark: 240,
}

const columnWidths = ref<Record<string, number>>({ ...defaultColumnWidths })

const resizingColumn = ref<string | null>(null)
const resizeStartX = ref(0)
const resizeStartWidth = ref(0)

const draggingColumn = ref<string | null>(null)
const dragOverColumn = ref<string | null>(null)

const selectedIds = ref<Set<string>>(new Set())

const hasFavorites = computed(() => favoritesStore.hasFavorites)
const favoritesCount = computed(() => favoritesStore.favoritesCount)
const sortField = computed(() => localSortField.value)
const sortOrder = computed(() => localSortOrder.value)

const hasSearchCriteria = computed(() => {
  return Object.values(tableSearchCriteria.value).some((val) => val.trim().length > 0)
})

const filteredFavorites = computed(() => {
  if (!hasSearchCriteria.value) {
    return favoritesStore.favorites
  }

  return favoritesStore.favorites.filter((record) => {
    return Object.entries(tableSearchCriteria.value).every(([key, searchValue]) => {
      if (!searchValue.trim()) return true

      const recordValue = String(record[key as keyof FieldRecord] || '').toLowerCase()
      const searchTerms = searchValue
        .split(/[\s,]+/)
        .map((term) => term.trim().toLowerCase())
        .filter((term) => term.length > 0)

      return searchTerms.some((term) => recordValue.includes(term))
    })
  })
})

const favorites = computed(() => {
  if (!localSortField.value) {
    return filteredFavorites.value
  }

  const sorted = [...filteredFavorites.value]
  sorted.sort((a, b) => {
    const aValue = String(a[localSortField.value as keyof FieldRecord] || '')
    const bValue = String(b[localSortField.value as keyof FieldRecord] || '')

    const aNum = parseFloat(aValue)
    const bNum = parseFloat(bValue)

    if (!isNaN(aNum) && !isNaN(bNum)) {
      return localSortOrder.value === 'asc' ? aNum - bNum : bNum - aNum
    }

    const comparison = aValue.localeCompare(bValue, 'zh-TW')
    return localSortOrder.value === 'asc' ? comparison : -comparison
  })

  return sorted
})

const allColumns = [
  { key: 'fieldNumber', label: '欄位編號' },
  { key: 'fieldName', label: '欄位名稱' },
  { key: 'fileCode', label: '檔案代碼' },
  { key: 'fileName', label: '檔案名稱' },
  { key: 'dataType', label: '型態' },
  { key: 'length', label: '長度' },
  { key: 'fieldDescription', label: '欄位說明' },
  { key: 'remark', label: 'Remark' },
]

const columns = computed(() => {
  const orderedColumnKeys = settingsStore.getOrderedVisibleColumns()
  return orderedColumnKeys
    .map((key) => allColumns.find((col) => col.key === key))
    .filter((col): col is { key: string; label: string } => col !== undefined)
})

const selectedCount = computed(() => selectedIds.value.size)
const hasSelection = computed(() => selectedIds.value.size > 0)
const isAllSelected = computed(() => {
  if (favorites.value.length === 0) return false
  return favorites.value.every((record) => selectedIds.value.has(record.id))
})
const isPartiallySelected = computed(() => {
  if (favorites.value.length === 0) return false
  const selectedInPage = favorites.value.filter((record) => selectedIds.value.has(record.id)).length
  return selectedInPage > 0 && selectedInPage < favorites.value.length
})

async function handleClearAll(): Promise<void> {
  const confirmed = await confirm({
    title: '清除最愛記錄',
    message: '確定要清除所有最愛記錄嗎？此操作無法復原。',
    confirmText: '清除',
    cancelText: '取消',
  })

  if (confirmed) {
    try {
      favoritesStore.clearFavorites()
      success('已清除所有最愛')
    } catch (err) {
      console.error('清除最愛失敗:', err)
      showError('操作失敗，請稍後再試')
    }
  }
}

function getFieldValue(record: FieldRecord, key: string): string {
  return record[key as keyof FieldRecord] || '-'
}

function handleSort(field: string): void {
  if (localSortField.value === field) {
    if (localSortOrder.value === 'asc') {
      localSortOrder.value = 'desc'
    } else {
      localSortField.value = null
      localSortOrder.value = 'asc'
    }
  } else {
    localSortField.value = field
    localSortOrder.value = 'asc'
  }
}

function performTableSearch(): void {}

const debouncedTableSearch = useDebounce(performTableSearch, 500)

function handleTableSearch(): void {
  debouncedTableSearch()
}

function clearTableSearch(): void {
  Object.keys(tableSearchCriteria.value).forEach((key) => {
    tableSearchCriteria.value[key] = ''
  })
}

function clearSingleSearch(columnKey: string): void {
  tableSearchCriteria.value[columnKey] = ''
  handleTableSearch()
}

const selectAllCheckbox = ref<HTMLInputElement | null>(null)

watch(isPartiallySelected, (value) => {
  if (selectAllCheckbox.value) {
    selectAllCheckbox.value.indeterminate = value
  }
})

function getColumnWidthStyle(columnKey: string): Record<string, string> {
  const width = columnWidths.value[columnKey] ?? defaultColumnWidths[columnKey] ?? 120
  return {
    width: `${width}px`,
    minWidth: `${width}px`,
    maxWidth: `${width}px`,
  }
}

function startResize(columnKey: string, event: MouseEvent): void {
  resizingColumn.value = columnKey
  resizeStartX.value = event.clientX
  resizeStartWidth.value = columnWidths.value[columnKey] ?? defaultColumnWidths[columnKey] ?? 120

  document.addEventListener('mousemove', handleResize)
  document.addEventListener('mouseup', stopResize)

  event.preventDefault()
}

function handleResize(event: MouseEvent): void {
  if (!resizingColumn.value) return

  const diff = event.clientX - resizeStartX.value
  const newWidth = Math.max(50, resizeStartWidth.value + diff)

  columnWidths.value[resizingColumn.value] = newWidth
}

function stopResize(): void {
  resizingColumn.value = null
  document.removeEventListener('mousemove', handleResize)
  document.removeEventListener('mouseup', stopResize)
}

function resetColumnWidth(columnKey: string): void {
  columnWidths.value[columnKey] = defaultColumnWidths[columnKey] ?? 120
}

function handleDragStart(columnKey: string, event: DragEvent): void {
  draggingColumn.value = columnKey
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/plain', columnKey)
  }
}

function handleDragOver(columnKey: string, event: DragEvent): void {
  event.preventDefault()
  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = 'move'
  }
  dragOverColumn.value = columnKey
}

function handleDragLeave(): void {
  dragOverColumn.value = null
}

function handleDrop(targetColumnKey: string, event: DragEvent): void {
  event.preventDefault()

  const sourceColumnKey = draggingColumn.value
  if (!sourceColumnKey || sourceColumnKey === targetColumnKey) {
    draggingColumn.value = null
    dragOverColumn.value = null
    return
  }

  const currentOrder = settingsStore.getOrderedVisibleColumns()
  const newOrder = [...currentOrder]

  const sourceIndex = newOrder.indexOf(sourceColumnKey)
  const targetIndex = newOrder.indexOf(targetColumnKey)

  if (sourceIndex === -1 || targetIndex === -1) {
    draggingColumn.value = null
    dragOverColumn.value = null
    return
  }

  newOrder.splice(sourceIndex, 1)
  newOrder.splice(targetIndex, 0, sourceColumnKey)

  settingsStore.updateColumnOrder(newOrder)

  draggingColumn.value = null
  dragOverColumn.value = null
}

function handleDragEnd(): void {
  draggingColumn.value = null
  dragOverColumn.value = null
}

function handleToggleSelection(id: string): void {
  if (selectedIds.value.has(id)) {
    selectedIds.value.delete(id)
  } else {
    selectedIds.value.add(id)
  }
}

function handleToggleSelectAll(): void {
  if (isAllSelected.value) {
    selectedIds.value.clear()
  } else {
    favorites.value.forEach((record) => {
      selectedIds.value.add(record.id)
    })
  }
}

function isSelected(id: string): boolean {
  return selectedIds.value.has(id)
}

function getSelectedRecords(): FieldRecord[] {
  return favorites.value.filter((record) => selectedIds.value.has(record.id))
}

async function handleBatchCopy(): Promise<void> {
  if (!hasSelection.value) return

  try {
    const selectedRecords = getSelectedRecords()

    const visibleColumns = columns.value

    const headers = visibleColumns.map((col) => col.label).join('\t')

    const rows = selectedRecords.map((record) => {
      return visibleColumns
        .map((col) => {
          const value = getFieldValue(record, col.key)

          if (value.includes('\t') || value.includes('\n')) {
            return `"${value.replace(/"/g, '""')}"`
          }
          return value
        })
        .join('\t')
    })

    const tableContent = [headers, ...rows].join('\n')

    await navigator.clipboard.writeText(tableContent)

    success(`已複製 ${selectedRecords.length} 筆記錄到剪貼簿！`)
  } catch (err) {
    console.error('批次複製失敗:', err)
    showError('複製失敗，請確認瀏覽器支援剪貼簿功能')
  }
}

async function handleBatchRemove(): Promise<void> {
  if (!hasSelection.value) return

  const confirmed = await confirm({
    title: '批次移除最愛',
    message: `確定要移除 ${selectedCount.value} 筆最愛記錄嗎？`,
    confirmText: '移除',
    cancelText: '取消',
  })

  if (confirmed) {
    try {
      const selectedRecords = getSelectedRecords()
      selectedRecords.forEach((record) => {
        favoritesStore.removeFavorite(record.id)
      })
      selectedIds.value.clear()
      success(`已移除 ${selectedRecords.length} 筆最愛記錄`)
    } catch (err) {
      console.error('批次移除失敗:', err)
      showError('操作失敗，請稍後再試')
    }
  }
}
</script>

<template>
  <div class="bg-white dark:bg-gray-800 rounded-lg shadow transition-colors duration-200">
    <div class="px-4 sm:px-6 py-4 border-b border-gray-200 dark:border-gray-700">
      <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div class="flex flex-col sm:flex-row sm:items-center gap-3">
          <div class="flex items-center gap-2">
            <span class="text-xl">⭐</span>
            <h2 class="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">我的最愛</h2>
          </div>
          <div v-if="hasFavorites" class="text-sm font-medium text-gray-600 dark:text-gray-400">
            共
            <span class="text-yellow-600 dark:text-yellow-400 font-bold">{{
              favoritesCount.toLocaleString()
            }}</span>
            筆
          </div>

          <div v-if="hasSelection" class="text-sm font-medium text-purple-600 dark:text-purple-400">
            已選取
            <span class="font-bold">{{ selectedCount.toLocaleString() }}</span>
            筆
          </div>
        </div>

        <div class="flex flex-col sm:flex-row gap-2">
          <div v-if="hasSelection" class="flex flex-wrap gap-2">
            <button
              @click="handleBatchCopy"
              class="inline-flex items-center justify-center gap-2 px-3 sm:px-4 py-2 min-h-[44px] text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              <svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
              <span class="whitespace-nowrap">批次複製</span>
            </button>

            <button
              @click="handleBatchRemove"
              class="inline-flex items-center justify-center gap-2 px-3 sm:px-4 py-2 min-h-[44px] text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
            >
              <svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
              <span class="whitespace-nowrap">批次移除</span>
            </button>
          </div>

          <button
            v-if="hasFavorites"
            @click="handleClearAll"
            class="px-3 sm:px-4 py-2 min-h-[44px] text-sm font-medium text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors duration-200"
            title="清除所有最愛"
          >
            清除全部
          </button>
        </div>
      </div>
    </div>

    <div v-if="!hasFavorites" class="flex flex-col items-center justify-center py-16">
      <div class="text-6xl mb-4">⭐</div>
      <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">尚無最愛記錄</h3>
      <p class="text-sm text-gray-500 dark:text-gray-400 text-center px-4 max-w-md">
        在搜尋結果中點擊星號圖示，即可將記錄加入最愛清單
      </p>
    </div>

    <div v-else-if="viewMode === 'table'" class="flex flex-col max-h-[calc(100vh-280px)]">
      <div class="overflow-x-auto overflow-y-auto">
        <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead class="bg-gray-50 dark:bg-gray-900 sticky top-0 z-20">
            <tr class="bg-gray-50 dark:bg-gray-900">
              <th scope="col" class="px-4 py-3 w-16">
                <div class="flex items-center justify-center min-h-[44px] min-w-[44px]">
                  <input
                    ref="selectAllCheckbox"
                    type="checkbox"
                    :checked="isAllSelected"
                    @change="handleToggleSelectAll"
                    class="w-5 h-5 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600 cursor-pointer"
                    :title="isAllSelected ? '取消全選' : '全選'"
                  />
                </div>
              </th>

              <th scope="col" class="px-4 py-3 w-20 text-center">
                <span
                  class="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider"
                >
                  最愛
                </span>
              </th>
              <th
                v-for="column in columns"
                :key="column.key"
                scope="col"
                draggable="true"
                @dragstart="handleDragStart(column.key, $event)"
                @dragover="handleDragOver(column.key, $event)"
                @dragleave="handleDragLeave"
                @drop="handleDrop(column.key, $event)"
                @dragend="handleDragEnd"
                class="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider select-none relative transition-all duration-200"
                :class="{
                  'bg-blue-100 dark:bg-blue-900': dragOverColumn === column.key,
                  'opacity-50': draggingColumn === column.key,
                  'cursor-grab hover:bg-gray-100 dark:hover:bg-gray-800':
                    !resizingColumn && !draggingColumn,
                  'cursor-grabbing': draggingColumn === column.key,
                }"
                :style="getColumnWidthStyle(column.key)"
              >
                <div
                  class="flex items-center gap-2 whitespace-nowrap cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700 rounded px-2 py-1 -mx-2 -my-1 transition-colors"
                  @click="handleSort(column.key)"
                  :title="`點擊排序 ${column.label}`"
                >
                  <span>{{ column.label }}</span>

                  <span class="inline-flex flex-col" v-if="sortField === column.key">
                    <svg
                      v-if="sortOrder === 'asc'"
                      class="w-4 h-4 text-blue-600 dark:text-blue-400"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z"
                      />
                    </svg>
                    <svg
                      v-else
                      class="w-4 h-4 text-blue-600 dark:text-blue-400"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        d="M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 12.586V5a1 1 0 012 0v7.586l2.293-2.293a1 1 0 011.414 0z"
                      />
                    </svg>
                  </span>

                  <span v-else class="inline-flex flex-col opacity-30">
                    <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z"
                      />
                    </svg>
                  </span>
                </div>

                <div
                  class="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-blue-500 hover:w-1.5 transition-all group z-10"
                  @mousedown.stop="startResize(column.key, $event)"
                  @dblclick.stop="resetColumnWidth(column.key)"
                  :title="`拖曳調整${column.label}寬度，雙擊復原預設寬度`"
                >
                  <div
                    class="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-8 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <svg class="w-2 h-4 text-blue-500" fill="currentColor" viewBox="0 0 8 16">
                      <circle cx="2" cy="4" r="1" />
                      <circle cx="6" cy="4" r="1" />
                      <circle cx="2" cy="8" r="1" />
                      <circle cx="6" cy="8" r="1" />
                      <circle cx="2" cy="12" r="1" />
                      <circle cx="6" cy="12" r="1" />
                    </svg>
                  </div>
                </div>
              </th>
            </tr>

            <tr class="bg-blue-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
              <th :colspan="columns.length + 2" class="px-4 py-2">
                <div class="flex items-center gap-2 text-xs text-blue-700 dark:text-blue-300">
                  <svg class="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fill-rule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                      clip-rule="evenodd"
                    />
                  </svg>
                  <span>提示：可輸入多個條件，用空格或逗號分隔</span>
                </div>
              </th>
            </tr>

            <tr class="bg-blue-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
              <th scope="col" class="px-2 py-2 w-16">
                <button
                  @click="clearTableSearch"
                  class="flex items-center justify-center w-full min-h-[36px] text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 transition-colors"
                  title="清除所有搜尋條件"
                  aria-label="清除所有搜尋條件"
                >
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </th>

              <th scope="col" class="px-2 py-2 w-20"></th>

              <th
                v-for="column in columns"
                :key="`search-${column.key}`"
                scope="col"
                class="px-2 py-2"
                :style="getColumnWidthStyle(column.key)"
              >
                <div class="relative">
                  <div
                    class="absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 dark:text-gray-500"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                  </div>
                  <input
                    v-model="tableSearchCriteria[column.key]"
                    @input="handleTableSearch"
                    type="text"
                    placeholder=""
                    :title="`可輸入多個條件，用空格或逗號分隔`"
                    class="w-full pl-8 pr-7 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    :aria-label="`搜尋${column.label}，可用空格或逗號分隔多個條件`"
                  />

                  <button
                    v-if="tableSearchCriteria[column.key]"
                    @click="clearSingleSearch(column.key)"
                    class="absolute right-1 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors"
                    :title="`清除${column.label}搜尋`"
                    :aria-label="`清除${column.label}搜尋`"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
              </th>
            </tr>
          </thead>

          <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            <tr
              v-for="(record, index) in favorites"
              :key="record.id"
              class="hover:bg-blue-100 dark:hover:bg-blue-800/40 transition-colors duration-150"
              :class="
                index % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-blue-50 dark:bg-slate-700'
              "
            >
              <td class="px-4 py-3 w-16">
                <div class="flex items-center justify-center min-h-[44px] min-w-[44px]">
                  <input
                    type="checkbox"
                    :checked="isSelected(record.id)"
                    @change="handleToggleSelection(record.id)"
                    class="w-5 h-5 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600 cursor-pointer"
                  />
                </div>
              </td>

              <td class="px-4 py-3 w-20 text-center">
                <FavoriteButton :record="record" size="small" />
              </td>
              <td
                v-for="column in columns"
                :key="`data-${column.key}`"
                class="px-4 py-3 text-sm text-gray-900 dark:text-white"
                :style="getColumnWidthStyle(column.key)"
              >
                <div class="truncate" :title="getFieldValue(record, column.key)">
                  {{ getFieldValue(record, column.key) }}
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div v-else-if="viewMode === 'card'" class="divide-y divide-gray-200 dark:divide-gray-700">
      <div
        v-for="(record, index) in favorites"
        :key="record.id"
        class="p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-150"
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
          <div class="flex items-center gap-2 ml-2">
            <div
              class="px-2 py-1 bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 text-xs font-medium rounded"
            >
              #{{ index + 1 }}
            </div>
            <FavoriteButton :record="record" size="small" />
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
.wrap-break-word {
  word-wrap: break-word;
  overflow-wrap: break-word;
}

.truncate {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.select-none {
  user-select: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
}

thead.sticky {
  position: sticky;
  top: 0;
  z-index: 10;
}

.cursor-grab {
  cursor: grab;
}

.cursor-grabbing {
  cursor: grabbing;
}

@media (max-width: 767px) {
  .p-4 {
    min-height: 44px;
  }
}
</style>

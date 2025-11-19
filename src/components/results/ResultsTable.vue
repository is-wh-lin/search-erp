<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useSearchStore } from '../../stores/searchStore'
import { useSettingsStore } from '../../stores/settingsStore'
import { useDataStore } from '../../stores/dataStore'
import { exportService } from '../../services/exportService'
import { useToast } from '../../composables/useToast'
import { useDebounce } from '../../composables/useDebounce'
import type { FieldRecord } from '../../types'
import VirtualScroller from './VirtualScroller.vue'
import ResultsPagination from './ResultsPagination.vue'
import FavoriteButton from '../favorites/FavoriteButton.vue'
import BatchOperations from './BatchOperations.vue'
import { useFavoritesStore } from '../../stores/favoritesStore'
import { errorHandler, ErrorType } from '../../utils/errorHandler'

const searchStore = useSearchStore()

const settingsStore = useSettingsStore()

const favoritesStore = useFavoritesStore()

const dataStore = useDataStore()

const { success, error, info } = useToast()

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

const hasSearchCriteria = computed(() => {
  return Object.values(tableSearchCriteria.value).some((val) => val.trim().length > 0)
})

const rawResults = computed(() => {
  if (hasSearchCriteria.value) {
    return searchStore.results
  }

  return dataStore.records
})

const resultCount = computed(() => rawResults.value.length)
const hasResults = computed(() => rawResults.value.length > 0)
const searching = computed(() => searchStore.searching)
const dataLoading = computed(() => dataStore.loading)
const dataLoaded = computed(() => dataStore.hasData)
const selectedIds = computed(() => searchStore.selectedIds)
const selectedCount = computed(() => searchStore.selectedCount)
const hasSelection = computed(() => searchStore.hasSelection)
const isAllSelected = computed(() => {
  const recordsToCheck = useVirtualScroll.value ? results.value : displayResults.value
  if (recordsToCheck.length === 0) return false
  return recordsToCheck.every((record) => selectedIds.value.has(record.id))
})
const isPartiallySelected = computed(() => {
  const recordsToCheck = useVirtualScroll.value ? results.value : displayResults.value
  if (recordsToCheck.length === 0) return false
  const selectedInPage = recordsToCheck.filter((record) => selectedIds.value.has(record.id)).length
  return selectedInPage > 0 && selectedInPage < recordsToCheck.length
})
const sortField = computed(() => localSortField.value)
const sortOrder = computed(() => localSortOrder.value)

const results = computed(() => {
  if (!localSortField.value) {
    return rawResults.value
  }

  const sorted = [...rawResults.value]
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

const VIRTUAL_SCROLL_THRESHOLD = 999999
const TABLE_ROW_HEIGHT = 48

const useVirtualScroll = computed(() => resultCount.value > VIRTUAL_SCROLL_THRESHOLD)

const currentPage = ref(1)
const itemsPerPage = ref(100)

const usePagination = computed(() => !useVirtualScroll.value && resultCount.value > 10)

const totalPages = computed(() => {
  if (!usePagination.value) return 1
  return Math.ceil(resultCount.value / itemsPerPage.value)
})

const paginatedResults = computed(() => {
  if (!usePagination.value) {
    return results.value
  }
  const start = (currentPage.value - 1) * itemsPerPage.value
  const end = start + itemsPerPage.value
  return results.value.slice(start, end)
})

const displayResults = computed(() => {
  if (useVirtualScroll.value) {
    return results.value
  }
  return paginatedResults.value
})

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

const resizingColumn = ref<string | null>(null)
const resizeStartX = ref(0)
const resizeStartWidth = ref(0)

const draggingColumn = ref<string | null>(null)
const dragOverColumn = ref<string | null>(null)

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

function getColumnWidthStyle(columnKey: string): string {
  const width = columnWidths.value[columnKey] ?? defaultColumnWidths[columnKey] ?? 120
  return `width: ${width}px; min-width: ${width}px; max-width: ${width}px;`
}

const selectAllCheckbox = ref<HTMLInputElement | null>(null)

function handleToggleSelection(id: string): void {
  if (selectedIds.value.has(id)) {
    selectedIds.value.delete(id)
  } else {
    selectedIds.value.add(id)
  }
}

function clearSelection(): void {
  selectedIds.value.clear()
}

function handleToggleSelectAll(): void {
  if (isAllSelected.value) {
    clearSelection()
  } else {
    const recordsToSelect = useVirtualScroll.value ? results.value : displayResults.value

    const MAX_SELECTION = 1000
    if (recordsToSelect.length > MAX_SELECTION) {
      error(`一次最多只能選取 ${MAX_SELECTION} 筆記錄，請使用搜尋功能縮小範圍`, { duration: 5000 })
      return
    }

    recordsToSelect.forEach((record) => {
      selectedIds.value.add(record.id)
    })
  }
}

function isSelected(id: string): boolean {
  return selectedIds.value.has(id)
}

watch(isPartiallySelected, (value) => {
  if (selectAllCheckbox.value) {
    selectAllCheckbox.value.indeterminate = value
  }
})

function getFieldValue(record: FieldRecord, key: string): string {
  return record[key as keyof FieldRecord] || ''
}

watch(
  () => searchStore.results,
  () => {
    currentPage.value = 1
    localSortField.value = null
    localSortOrder.value = 'asc'
  }
)

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

const isExporting = ref(false)

async function handleExportCSV(): Promise<void> {
  if (!hasResults.value || isExporting.value) {
    return
  }

  isExporting.value = true

  try {
    exportService.exportToCSV(results.value)
    success('CSV 檔案匯出成功！')
  } catch (err) {
    const appError = errorHandler.handleError(err, ErrorType.EXPORT)
    console.error('CSV 匯出失敗:', appError)
    error(appError.userMessage, { duration: 5000 })
  } finally {
    isExporting.value = false
  }
}

async function handleExportExcel(): Promise<void> {
  if (!hasResults.value || isExporting.value) {
    return
  }

  isExporting.value = true

  try {
    exportService.exportToExcel(results.value)
    success('Excel 檔案匯出成功！')
  } catch (err) {
    const appError = errorHandler.handleError(err, ErrorType.EXPORT)
    console.error('Excel 匯出失敗:', appError)
    error(appError.userMessage, { duration: 5000 })
  } finally {
    isExporting.value = false
  }
}

async function handleExportSelectedCSV(): Promise<void> {
  if (!hasSelection.value || isExporting.value) {
    return
  }

  isExporting.value = true

  try {
    const selectedRecords = getSelectedRecords()
    exportService.exportToCSV(selectedRecords)
    success(`已匯出 ${selectedRecords.length} 筆選取的記錄為 CSV！`)
  } catch (err) {
    const appError = errorHandler.handleError(err, ErrorType.EXPORT)
    console.error('CSV 匯出失敗:', appError)
    error(appError.userMessage, { duration: 5000 })
  } finally {
    isExporting.value = false
  }
}

async function handleExportSelectedExcel(): Promise<void> {
  if (!hasSelection.value || isExporting.value) {
    return
  }

  isExporting.value = true

  try {
    const selectedRecords = getSelectedRecords()
    exportService.exportToExcel(selectedRecords)
    success(`已匯出 ${selectedRecords.length} 筆選取的記錄為 Excel！`)
  } catch (err) {
    const appError = errorHandler.handleError(err, ErrorType.EXPORT)
    console.error('Excel 匯出失敗:', appError)
    error(appError.userMessage, { duration: 5000 })
  } finally {
    isExporting.value = false
  }
}

function getSelectedRecords(): FieldRecord[] {
  return rawResults.value.filter((record) => selectedIds.value.has(record.id))
}

async function handleBatchCopy(): Promise<void> {
  if (!hasSelection.value) {
    return
  }

  try {
    const selectedRecords = getSelectedRecords()

    const visibleColumnKeys = settingsStore.settings.visibleColumns
    const visibleColumns = allColumns.filter((col) => visibleColumnKeys.includes(col.key))

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
    error('複製失敗，請確認瀏覽器支援剪貼簿功能')
  }
}

function handleBatchAddToFavorites(): void {
  if (!hasSelection.value) {
    return
  }

  try {
    const selectedRecords = getSelectedRecords()
    const addedCount = favoritesStore.batchAddFavorites(selectedRecords)

    if (addedCount === 0) {
      info('所有選取的記錄都已在最愛清單中')
    } else if (addedCount === selectedRecords.length) {
      success(`已將 ${addedCount} 筆記錄加入最愛！`)
    } else {
      success(
        `已將 ${addedCount} 筆記錄加入最愛（${selectedRecords.length - addedCount} 筆已存在）`
      )
    }
  } catch (err) {
    console.error('批次加入最愛失敗:', err)
    error('加入最愛失敗，請稍後再試')
  }
}

function parseMultipleConditions(input: string): string[] {
  if (!input || !input.trim()) {
    return []
  }

  return input
    .split(/[\s,]+/)
    .map((term) => term.trim())
    .filter((term) => term.length > 0)
}

function performTableSearch(): void {
  const newCriteria: Record<string, string[]> = {}

  Object.entries(tableSearchCriteria.value).forEach(([key, val]) => {
    const conditions = parseMultipleConditions(val)
    if (conditions.length > 0) {
      newCriteria[key] = conditions
    }
  })

  searchStore.search(newCriteria)
}

const debouncedTableSearch = useDebounce(performTableSearch, 500)

function handleTableSearch(): void {
  debouncedTableSearch()
}

function clearTableSearch(): void {
  Object.keys(tableSearchCriteria.value).forEach((key) => {
    tableSearchCriteria.value[key] = ''
  })
  searchStore.clearCriteria()

  clearSelection()
}

function clearSingleSearch(columnKey: string): void {
  tableSearchCriteria.value[columnKey] = ''
  handleTableSearch()
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

  info('欄位順序已更新')
}

function handleDragEnd(): void {
  draggingColumn.value = null
  dragOverColumn.value = null
}
</script>

<template>
  <div class="bg-white dark:bg-gray-800 rounded-lg shadow transition-colors duration-200">
    <div class="px-4 sm:px-6 py-4 border-b border-gray-200 dark:border-gray-700">
      <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div class="flex flex-col sm:flex-row sm:items-center gap-3">
          <h2 class="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">搜尋結果</h2>

          <div v-if="hasResults" class="text-sm font-medium text-gray-600 dark:text-gray-400">
            共
            <span class="text-blue-600 dark:text-blue-400 font-bold">{{
              resultCount.toLocaleString()
            }}</span>
            筆記錄<span v-if="usePagination">，{{ totalPages }} 頁</span>
          </div>

          <div v-if="hasSelection" class="text-sm font-medium text-purple-600 dark:text-purple-400">
            已選取
            <span class="font-bold">{{ selectedCount.toLocaleString() }}</span>
            筆
          </div>
        </div>

        <div class="flex flex-col sm:flex-row gap-2">
          <div v-if="hasResults" class="flex flex-wrap gap-2">
            <button
              @click="handleExportCSV"
              :disabled="!hasResults || isExporting"
              class="inline-flex items-center justify-center gap-2 px-3 sm:px-4 py-2 min-h-[44px] text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
              :class="{ 'opacity-50': isExporting }"
            >
              <svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <span class="whitespace-nowrap">{{ isExporting ? '匯出中...' : 'CSV' }}</span>
            </button>

            <button
              @click="handleExportExcel"
              :disabled="!hasResults || isExporting"
              class="inline-flex items-center justify-center gap-2 px-3 sm:px-4 py-2 min-h-[44px] text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              :class="{ 'opacity-50': isExporting }"
            >
              <svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <span class="whitespace-nowrap">{{ isExporting ? '匯出中...' : 'Excel' }}</span>
            </button>
          </div>

          <div v-if="hasSelection" class="flex flex-wrap gap-2">
            <button
              @click="handleExportSelectedCSV"
              :disabled="!hasSelection || isExporting"
              class="inline-flex items-center justify-center gap-2 px-3 sm:px-4 py-2 min-h-[44px] text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
              :class="{ 'opacity-50': isExporting }"
            >
              <svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span class="whitespace-nowrap">{{ isExporting ? '匯出中...' : '已選 CSV' }}</span>
            </button>

            <button
              @click="handleExportSelectedExcel"
              :disabled="!hasSelection || isExporting"
              class="inline-flex items-center justify-center gap-2 px-3 sm:px-4 py-2 min-h-[44px] text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              :class="{ 'opacity-50': isExporting }"
            >
              <svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span class="whitespace-nowrap">{{ isExporting ? '匯出中...' : '已選 Excel' }}</span>
            </button>

            <BatchOperations
              :selected-records="getSelectedRecords()"
              :disabled="!hasSelection"
              @copy="handleBatchCopy"
              @add-to-favorites="handleBatchAddToFavorites"
            />
          </div>
        </div>
      </div>
    </div>

    <div v-if="dataLoading" class="flex items-center justify-center py-12">
      <div class="relative w-12 h-12">
        <div
          class="absolute inset-0 border-4 border-gray-200 dark:border-gray-700 rounded-full"
        ></div>
        <div
          class="absolute inset-0 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"
        ></div>
      </div>
      <p class="ml-4 text-gray-600 dark:text-gray-400">載入資料中...</p>
    </div>

    <div v-else-if="dataLoaded" class="flex flex-col max-h-[calc(100vh-280px)]">
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

          <tbody
            v-if="useVirtualScroll"
            class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700"
          >
            <tr v-if="searching">
              <td :colspan="columns.length + 2" class="px-4 py-12">
                <div class="flex items-center justify-center">
                  <div class="relative w-10 h-10">
                    <div
                      class="absolute inset-0 border-4 border-gray-200 dark:border-gray-700 rounded-full"
                    ></div>
                    <div
                      class="absolute inset-0 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"
                    ></div>
                  </div>
                  <p class="ml-4 text-gray-600 dark:text-gray-400">搜尋中...</p>
                </div>
              </td>
            </tr>

            <tr v-else-if="hasSearchCriteria && !hasResults">
              <td :colspan="columns.length + 2" class="px-4 py-16">
                <div class="flex flex-col items-center justify-center">
                  <div class="text-6xl mb-4">🔍</div>
                  <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">查無資料</h3>
                  <p class="text-sm text-gray-500 dark:text-gray-400">請調整搜尋條件後重試</p>
                </div>
              </td>
            </tr>

            <tr v-else>
              <td :colspan="columns.length + 2" class="p-0">
                <VirtualScroller
                  :items="results"
                  :item-height="TABLE_ROW_HEIGHT"
                  :threshold="VIRTUAL_SCROLL_THRESHOLD"
                  class="virtual-scroll-container"
                >
                  <template #default="{ item: record, index }">
                    <div
                      class="flex hover:bg-blue-100 dark:hover:bg-blue-800/40 transition-colors duration-150 border-b border-gray-200 dark:border-gray-700"
                      :class="
                        index % 2 === 0
                          ? 'bg-white dark:bg-gray-800'
                          : 'bg-blue-50 dark:bg-slate-700'
                      "
                    >
                      <div class="px-4 py-3 flex items-center justify-center">
                        <div class="flex items-center justify-center min-h-[44px] min-w-[44px]">
                          <input
                            type="checkbox"
                            :checked="isSelected(record.id)"
                            @change="handleToggleSelection(record.id)"
                            class="w-5 h-5 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600 cursor-pointer"
                          />
                        </div>
                      </div>

                      <div class="px-4 py-3 flex items-center justify-center">
                        <FavoriteButton :record="record" size="small" />
                      </div>
                      <div
                        v-for="column in columns"
                        :key="column.key"
                        class="px-4 py-3 text-sm text-gray-900 dark:text-gray-100"
                        :style="getColumnWidthStyle(column.key)"
                      >
                        <div class="truncate" :title="getFieldValue(record, column.key)">
                          {{ getFieldValue(record, column.key) }}
                        </div>
                      </div>
                    </div>
                  </template>
                </VirtualScroller>
              </td>
            </tr>
          </tbody>

          <tbody
            v-if="!useVirtualScroll"
            class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700"
          >
            <tr v-if="searching">
              <td :colspan="columns.length + 2" class="px-4 py-12">
                <div class="flex items-center justify-center">
                  <div class="relative w-10 h-10">
                    <div
                      class="absolute inset-0 border-4 border-gray-200 dark:border-gray-700 rounded-full"
                    ></div>
                    <div
                      class="absolute inset-0 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"
                    ></div>
                  </div>
                  <p class="ml-4 text-gray-600 dark:text-gray-400">搜尋中...</p>
                </div>
              </td>
            </tr>

            <tr v-else-if="hasSearchCriteria && !hasResults">
              <td :colspan="columns.length + 2" class="px-4 py-16">
                <div class="flex flex-col items-center justify-center">
                  <div class="text-6xl mb-4">🔍</div>
                  <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">查無資料</h3>
                  <p class="text-sm text-gray-500 dark:text-gray-400">請調整搜尋條件後重試</p>
                </div>
              </td>
            </tr>

            <tr
              v-else
              v-for="(record, index) in displayResults"
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
                :key="column.key"
                class="px-4 py-3 text-sm text-gray-900 dark:text-gray-100"
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

    <ResultsPagination
      v-if="usePagination"
      :current-page="currentPage"
      :total-items="resultCount"
      :items-per-page="itemsPerPage"
      @update:current-page="currentPage = $event"
      @update:items-per-page="itemsPerPage = $event"
    />
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

table {
  border-collapse: separate;
  border-spacing: 0;
}

.overflow-x-auto {
  -webkit-overflow-scrolling: touch;
}

.truncate {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.virtual-scroll-container {
  max-height: 600px;
  overflow-y: auto;
}

thead.sticky {
  position: sticky;
  top: 0;
  z-index: 10;
}

.select-none {
  user-select: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
}

.cursor-grab {
  cursor: grab;
}

.cursor-grabbing {
  cursor: grabbing;
}
</style>

import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import type { UserSettings } from '../types'
import { cacheService } from '../services/cacheService'

const SETTINGS_CACHE_KEY = 'erp-query-settings'

const DEFAULT_SETTINGS: UserSettings = {
  theme: 'light',
  fontSize: 'medium',
  visibleColumns: [
    'fieldNumber',
    'fieldName',
    'fileCode',
    'fileName',
    'dataType',
    'length',
    'fieldDescription',
    'remark',
  ],
  searchHistoryEnabled: true,
}

export const AVAILABLE_COLUMNS = [
  'fieldNumber',
  'fieldName',
  'fileCode',
  'fileName',
  'dataType',
  'length',
  'fieldDescription',
  'remark',
]

export const useSettingsStore = defineStore('settings', () => {
  const settings = ref<UserSettings>({ ...DEFAULT_SETTINGS })
  const isLoading = ref(false)

  function loadSettings(): void {
    isLoading.value = true

    try {
      const savedSettings = cacheService.loadFromLocalStorage<UserSettings>(SETTINGS_CACHE_KEY)

      if (savedSettings) {
        settings.value = {
          ...DEFAULT_SETTINGS,
          ...savedSettings,

          visibleColumns:
            savedSettings.visibleColumns && savedSettings.visibleColumns.length > 0
              ? savedSettings.visibleColumns
              : DEFAULT_SETTINGS.visibleColumns,
        }
      }
    } catch (error) {
      console.error('載入設定失敗:', error)

      settings.value = { ...DEFAULT_SETTINGS }
    } finally {
      isLoading.value = false
    }
  }

  function saveSettings(): boolean {
    try {
      const success = cacheService.saveToLocalStorage(SETTINGS_CACHE_KEY, settings.value)

      if (!success) {
        console.error('儲存設定失敗：LocalStorage 可能已滿')
        return false
      }

      return true
    } catch (error) {
      console.error('儲存設定時發生錯誤:', error)
      return false
    }
  }

  function updateTheme(theme: 'light' | 'dark'): void {
    settings.value.theme = theme

    if (typeof document !== 'undefined') {
      if (theme === 'dark') {
        document.documentElement.classList.add('dark')
      } else {
        document.documentElement.classList.remove('dark')
      }
    }

    saveSettings()
  }

  function updateFontSize(fontSize: 'small' | 'medium' | 'large'): void {
    settings.value.fontSize = fontSize
    saveSettings()

    if (typeof document !== 'undefined') {
      document.documentElement.classList.remove('text-sm', 'text-base', 'text-lg')

      switch (fontSize) {
        case 'small':
          document.documentElement.classList.add('text-sm')
          break
        case 'large':
          document.documentElement.classList.add('text-lg')
          break
        default:
          document.documentElement.classList.add('text-base')
      }
    }
  }

  function toggleColumn(column: string): void {
    const index = settings.value.visibleColumns.indexOf(column)

    if (index > -1) {
      if (settings.value.visibleColumns.length > 1) {
        settings.value.visibleColumns.splice(index, 1)
        saveSettings()
      } else {
        console.warn('至少需要保留一個可見欄位')
      }
    } else {
      if (AVAILABLE_COLUMNS.includes(column)) {
        settings.value.visibleColumns.push(column)
        saveSettings()
      } else {
        console.warn(`無效的欄位名稱: ${column}`)
      }
    }
  }

  function setVisibleColumns(columns: string[]): void {
    const validColumns = columns.filter((col) => AVAILABLE_COLUMNS.includes(col))

    if (validColumns.length === 0) {
      console.warn('至少需要一個可見欄位，使用預設欄位')
      const defaultColumn = DEFAULT_SETTINGS.visibleColumns[0]
      settings.value.visibleColumns = defaultColumn ? [defaultColumn] : ['fieldNumber']
    } else {
      settings.value.visibleColumns = validColumns
    }

    saveSettings()
  }

  function updateSearchHistoryEnabled(enabled: boolean): void {
    settings.value.searchHistoryEnabled = enabled
    saveSettings()
  }

  function resetSettings(): void {
    settings.value = { ...DEFAULT_SETTINGS }
    saveSettings()

    updateTheme(DEFAULT_SETTINGS.theme)
    updateFontSize(DEFAULT_SETTINGS.fontSize)
  }

  function isColumnVisible(column: string): boolean {
    return settings.value.visibleColumns.includes(column)
  }

  function updateColumnOrder(newOrder: string[]): void {
    const validColumns = newOrder.filter((col) => AVAILABLE_COLUMNS.includes(col))

    if (validColumns.length > 0) {
      settings.value.columnOrder = validColumns
      saveSettings()
    }
  }

  function getOrderedVisibleColumns(): string[] {
    const visibleCols = settings.value.visibleColumns
    const order = settings.value.columnOrder

    if (!order || order.length === 0) {
      return visibleCols
    }

    const ordered = order.filter((col) => visibleCols.includes(col))

    const remaining = visibleCols.filter((col) => !order.includes(col))

    return [...ordered, ...remaining]
  }

  loadSettings()

  if (typeof document !== 'undefined') {
    document.documentElement.classList.remove('dark')
    if (settings.value.theme === 'dark') {
      document.documentElement.classList.add('dark')
    }

    document.documentElement.classList.remove('text-sm', 'text-base', 'text-lg')
    switch (settings.value.fontSize) {
      case 'small':
        document.documentElement.classList.add('text-sm')
        break
      case 'large':
        document.documentElement.classList.add('text-lg')
        break
      default:
        document.documentElement.classList.add('text-base')
    }
  }

  watch(settings, () => {}, { deep: true })

  return {
    settings,
    isLoading,

    loadSettings,
    saveSettings,
    updateTheme,
    updateFontSize,
    toggleColumn,
    setVisibleColumns,
    updateSearchHistoryEnabled,
    updateColumnOrder,
    resetSettings,

    isColumnVisible,
    getOrderedVisibleColumns,
  }
})

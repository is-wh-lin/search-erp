import { defineStore } from 'pinia'
import { ref, computed, shallowRef } from 'vue'
import type {
  FieldRecord,
  SearchCriteria,
  SearchHistory,
  PopularSearch,
  SearchTemplate,
} from '../types'
import { searchEngine } from '../services/searchEngine'
import { useDataStore } from './dataStore'
import { cacheService } from '../services/cacheService'
import { errorHandler, ErrorType } from '../utils/errorHandler'
import { useToast } from '../composables/useToast'

const HISTORY_STORAGE_KEY = 'erp-search-history'
const POPULAR_SEARCHES_STORAGE_KEY = 'erp-popular-searches'
const TEMPLATES_STORAGE_KEY = 'erp-search-templates'
const MAX_HISTORY_ITEMS = 20
const MAX_POPULAR_SEARCHES = 10
const MAX_TEMPLATES = 10

export const useSearchStore = defineStore('search', () => {
  const criteria = ref<SearchCriteria>({})
  const results = shallowRef<FieldRecord[]>([])
  const searching = ref(false)
  const history = ref<SearchHistory[]>([])
  const popularSearches = ref<PopularSearch[]>([])
  const templates = ref<SearchTemplate[]>([])
  const selectedIds = ref<Set<string>>(new Set())
  const searchError = ref<string | null>(null)
  const sortField = ref<string | null>(null)
  const sortOrder = ref<'asc' | 'desc'>('asc')

  const toast = useToast()

  const loadedHistory = cacheService.loadFromLocalStorage<SearchHistory[]>(HISTORY_STORAGE_KEY)
  if (loadedHistory) {
    history.value = loadedHistory
  }

  const loadedPopularSearches = cacheService.loadFromLocalStorage<PopularSearch[]>(
    POPULAR_SEARCHES_STORAGE_KEY
  )
  if (loadedPopularSearches) {
    popularSearches.value = loadedPopularSearches
  }

  const loadedTemplates = cacheService.loadFromLocalStorage<SearchTemplate[]>(TEMPLATES_STORAGE_KEY)
  if (loadedTemplates) {
    templates.value = loadedTemplates
  }

  async function search(searchCriteria?: SearchCriteria): Promise<void> {
    searching.value = true
    searchError.value = null

    try {
      if (searchCriteria) {
        criteria.value = searchCriteria
      }

      const dataStore = useDataStore()

      if (!dataStore.hasData) {
        results.value = []
        clearSelection()

        if (dataStore.loading) {
          toast.info('資料載入中，請稍候...', { duration: 3000 })
        } else {
          toast.warning('請先載入資料', { duration: 3000 })
        }
        return
      }

      results.value = searchEngine.search(criteria.value, dataStore.records)

      clearSelection()

      if (hasCriteria.value) {
        saveHistory()
        updatePopularSearches()
      }
    } catch (error) {
      const appError = errorHandler.handleError(error, ErrorType.SEARCH)
      searchError.value = appError.userMessage

      toast.error(appError.userMessage, { duration: 5000 })

      results.value = []
    } finally {
      searching.value = false
    }
  }

  function clearCriteria(): void {
    criteria.value = {}
    results.value = []
  }

  function saveHistory(): void {
    const hasValidCriteria = Object.values(criteria.value).some(
      (conditions) => conditions && conditions.length > 0
    )

    if (!hasValidCriteria) {
      return
    }

    const historyItem: SearchHistory = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      criteria: JSON.parse(JSON.stringify(criteria.value)),
      timestamp: Date.now(),
      resultCount: results.value.length,
    }

    const existingIndex = history.value.findIndex((item) => {
      return JSON.stringify(item.criteria) === JSON.stringify(historyItem.criteria)
    })

    if (existingIndex !== -1) {
      history.value.splice(existingIndex, 1)
    }

    history.value.unshift(historyItem)

    if (history.value.length > MAX_HISTORY_ITEMS) {
      history.value = history.value.slice(0, MAX_HISTORY_ITEMS)
    }

    cacheService.saveToLocalStorage(HISTORY_STORAGE_KEY, history.value)
  }

  function loadHistoryItem(historyId: string): void {
    const historyItem = history.value.find((item) => item.id === historyId)
    if (historyItem) {
      criteria.value = JSON.parse(JSON.stringify(historyItem.criteria))
      search()
    }
  }

  function deleteHistoryItem(historyId: string): void {
    const index = history.value.findIndex((item) => item.id === historyId)
    if (index !== -1) {
      history.value.splice(index, 1)
      cacheService.saveToLocalStorage(HISTORY_STORAGE_KEY, history.value)
    }
  }

  function clearHistory(): void {
    history.value = []
    cacheService.removeFromLocalStorage(HISTORY_STORAGE_KEY)
  }

  function updatePopularSearches(): void {
    Object.entries(criteria.value).forEach(([field, terms]) => {
      if (!terms || terms.length === 0) return

      terms.forEach((term) => {
        const trimmedTerm = term.trim()
        if (!trimmedTerm) return

        const existingIndex = popularSearches.value.findIndex(
          (item) => item.term === trimmedTerm && item.field === field
        )

        if (existingIndex !== -1) {
          const existing = popularSearches.value[existingIndex]
          if (existing) {
            existing.count++
            existing.lastSearched = Date.now()
          }
        } else {
          popularSearches.value.push({
            term: trimmedTerm,
            field: field as keyof SearchCriteria,
            count: 1,
            lastSearched: Date.now(),
          })
        }
      })
    })

    cacheService.saveToLocalStorage(POPULAR_SEARCHES_STORAGE_KEY, popularSearches.value)
  }

  function searchByPopularTag(term: string, field: keyof SearchCriteria): void {
    criteria.value = {}

    criteria.value[field] = [term]

    search()
  }

  function clearPopularSearches(): void {
    popularSearches.value = []
    cacheService.removeFromLocalStorage(POPULAR_SEARCHES_STORAGE_KEY)
  }

  function saveTemplate(name: string): boolean {
    const trimmedName = name.trim()
    if (!trimmedName) {
      toast.warning('請輸入樣板名稱', { duration: 3000 })
      return false
    }

    const hasValidCriteria = Object.values(criteria.value).some(
      (conditions) => conditions && conditions.length > 0
    )

    if (!hasValidCriteria) {
      toast.warning('請先設定搜尋條件', { duration: 3000 })
      return false
    }

    if (templates.value.length >= MAX_TEMPLATES) {
      toast.warning(`最多只能儲存 ${MAX_TEMPLATES} 個樣板`, { duration: 3000 })
      return false
    }

    const existingIndex = templates.value.findIndex((item) => item.name === trimmedName)
    if (existingIndex !== -1) {
      toast.warning('樣板名稱已存在', { duration: 3000 })
      return false
    }

    const template: SearchTemplate = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: trimmedName,
      criteria: JSON.parse(JSON.stringify(criteria.value)),
      createdAt: Date.now(),
    }

    templates.value.push(template)

    const saved = cacheService.saveToLocalStorage(TEMPLATES_STORAGE_KEY, templates.value)

    if (saved) {
      toast.success('樣板已儲存', { duration: 3000 })
    } else {
      toast.error('儲存樣板失敗，儲存空間可能已滿', { duration: 5000 })
    }

    return saved
  }

  function loadTemplate(templateId: string): void {
    const template = templates.value.find((item) => item.id === templateId)
    if (template) {
      criteria.value = JSON.parse(JSON.stringify(template.criteria))
      search()
    }
  }

  function deleteTemplate(templateId: string): void {
    const index = templates.value.findIndex((item) => item.id === templateId)
    if (index !== -1) {
      templates.value.splice(index, 1)
      cacheService.saveToLocalStorage(TEMPLATES_STORAGE_KEY, templates.value)
    }
  }

  function renameTemplate(templateId: string, newName: string): boolean {
    const trimmedName = newName.trim()
    if (!trimmedName) {
      return false
    }

    const existingIndex = templates.value.findIndex(
      (item) => item.name === trimmedName && item.id !== templateId
    )
    if (existingIndex !== -1) {
      return false
    }

    const index = templates.value.findIndex((item) => item.id === templateId)
    if (index !== -1) {
      const template = templates.value[index]
      if (template) {
        template.name = trimmedName
        cacheService.saveToLocalStorage(TEMPLATES_STORAGE_KEY, templates.value)
        return true
      }
    }

    return false
  }

  function clearTemplates(): void {
    templates.value = []
    cacheService.removeFromLocalStorage(TEMPLATES_STORAGE_KEY)
  }

  function toggleSelection(id: string): void {
    if (selectedIds.value.has(id)) {
      selectedIds.value.delete(id)
    } else {
      selectedIds.value.add(id)
    }
  }

  function toggleSelectAll(selectAll: boolean): void {
    if (selectAll) {
      results.value.forEach((record) => {
        selectedIds.value.add(record.id)
      })
    } else {
      selectedIds.value.clear()
    }
  }

  function clearSelection(): void {
    selectedIds.value.clear()
  }

  function getSelectedRecords(): FieldRecord[] {
    return results.value.filter((record) => selectedIds.value.has(record.id))
  }

  function setSorting(field: string): void {
    if (sortField.value === field) {
      sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
    } else {
      sortField.value = field
      sortOrder.value = 'asc'
    }
  }

  function clearSorting(): void {
    sortField.value = null
    sortOrder.value = 'asc'
  }

  const filteredResults = computed(() => {
    if (!sortField.value) {
      return results.value
    }

    const sorted = [...results.value]

    sorted.sort((a, b) => {
      const aValue = String(a[sortField.value as keyof FieldRecord] || '')
      const bValue = String(b[sortField.value as keyof FieldRecord] || '')

      const aNum = parseFloat(aValue)
      const bNum = parseFloat(bValue)

      if (!isNaN(aNum) && !isNaN(bNum)) {
        return sortOrder.value === 'asc' ? aNum - bNum : bNum - aNum
      }

      const comparison = aValue.localeCompare(bValue, 'zh-TW')
      return sortOrder.value === 'asc' ? comparison : -comparison
    })

    return sorted
  })

  const resultCount = computed(() => results.value.length)

  const hasCriteria = computed(() => {
    return Object.values(criteria.value).some((conditions) => conditions && conditions.length > 0)
  })

  const hasResults = computed(() => results.value.length > 0)

  const recentHistory = computed(() => {
    return history.value.slice(0, MAX_HISTORY_ITEMS)
  })

  const hasHistory = computed(() => history.value.length > 0)

  const topPopularSearches = computed(() => {
    return [...popularSearches.value]
      .sort((a, b) => {
        if (b.count !== a.count) {
          return b.count - a.count
        }

        return b.lastSearched - a.lastSearched
      })
      .slice(0, MAX_POPULAR_SEARCHES)
  })

  const hasPopularSearches = computed(() => popularSearches.value.length > 0)

  const allTemplates = computed(() => {
    return templates.value.slice(0, MAX_TEMPLATES)
  })

  const hasTemplates = computed(() => templates.value.length > 0)

  const isTemplatesLimitReached = computed(() => templates.value.length >= MAX_TEMPLATES)

  const selectedCount = computed(() => selectedIds.value.size)

  const hasSelection = computed(() => selectedIds.value.size > 0)

  const isAllSelected = computed(() => {
    return results.value.length > 0 && selectedIds.value.size === results.value.length
  })

  const isPartiallySelected = computed(() => {
    return selectedIds.value.size > 0 && selectedIds.value.size < results.value.length
  })

  return {
    criteria,
    results,
    searching,
    history,
    popularSearches,
    templates,
    selectedIds,
    sortField,
    sortOrder,

    search,
    clearCriteria,
    saveHistory,
    loadHistoryItem,
    deleteHistoryItem,
    clearHistory,
    updatePopularSearches,
    searchByPopularTag,
    clearPopularSearches,
    saveTemplate,
    loadTemplate,
    deleteTemplate,
    renameTemplate,
    clearTemplates,
    toggleSelection,
    toggleSelectAll,
    clearSelection,
    getSelectedRecords,
    setSorting,
    clearSorting,

    filteredResults,
    resultCount,
    hasCriteria,
    hasResults,
    recentHistory,
    hasHistory,
    topPopularSearches,
    hasPopularSearches,
    allTemplates,
    hasTemplates,
    isTemplatesLimitReached,
    selectedCount,
    hasSelection,
    isAllSelected,
    isPartiallySelected,
  }
})

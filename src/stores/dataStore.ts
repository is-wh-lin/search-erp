import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { FieldRecord } from '../types'
import { dataLoader } from '../services/dataLoader'
import { cacheService } from '../services/cacheService'
import { searchIndexService } from '../services/searchIndex'
import { errorHandler, ErrorType } from '../utils/errorHandler'
import { useToast } from '../composables/useToast'

const CACHE_KEY = 'erp-data-cache'
const CACHE_EXPIRY = 7 * 24 * 60 * 60 * 1000

export const useDataStore = defineStore('data', () => {
  const records = ref<FieldRecord[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const loadProgress = ref(0)
  const isUsingCache = ref(false)
  const retryCount = ref(0)
  const maxRetries = 3

  const toast = useToast()

  async function loadData(forceRefresh: boolean = false): Promise<void> {
    loading.value = true
    error.value = null
    loadProgress.value = 0
    isUsingCache.value = false

    try {
      if (!forceRefresh && !navigator.onLine) {
        const cachedData = await loadFromCache()
        if (cachedData) {
          records.value = cachedData
          loadProgress.value = 100
          isUsingCache.value = true
          loading.value = false
          return
        }
      }

      const loadedRecords = await dataLoader.loadAllFiles((progress) => {
        loadProgress.value = progress.percentage
      })

      records.value = loadedRecords
      loadProgress.value = 100

      searchIndexService.buildIndex(loadedRecords)

      await saveToCache(loadedRecords)
    } catch (err) {
      const appError = errorHandler.handleError(err, ErrorType.DATA_LOAD)

      const cachedData = await loadFromCache()
      if (cachedData) {
        records.value = cachedData
        loadProgress.value = 100
        isUsingCache.value = true
        error.value = '無法載入最新資料，使用快取資料'

        searchIndexService.buildIndex(cachedData)

        toast.warning('無法載入最新資料，目前顯示快取資料', {
          duration: 5000,
        })
      } else {
        error.value = appError.userMessage

        if (appError.canRetry && retryCount.value < maxRetries) {
          toast.error(appError.userMessage, {
            duration: 0,
            action: {
              label: '重試',
              onClick: () => {
                retryCount.value++
                loadData(forceRefresh)
              },
            },
          })
        } else {
          toast.error(appError.userMessage, { duration: 5000 })
        }

        throw err
      }
    } finally {
      loading.value = false
    }
  }

  async function loadFromCache(): Promise<FieldRecord[] | null> {
    try {
      const cachedData = await cacheService.loadFromIndexedDB<FieldRecord[]>(CACHE_KEY)
      if (cachedData && Array.isArray(cachedData) && cachedData.length > 0) {
        console.log('從 IndexedDB 快取載入資料')
        return cachedData
      }

      const localData = cacheService.loadFromLocalStorage<FieldRecord[]>(CACHE_KEY)
      if (localData && Array.isArray(localData) && localData.length > 0) {
        console.log('從 LocalStorage 快取載入資料')
        return localData
      }

      return null
    } catch (err) {
      console.error('從快取載入資料失敗:', err)
      return null
    }
  }

  async function saveToCache(data: FieldRecord[]): Promise<void> {
    try {
      await cacheService.saveToIndexedDB(CACHE_KEY, data, {
        expiresIn: CACHE_EXPIRY,
      })
      console.log('資料已儲存至 IndexedDB 快取')
    } catch (err) {
      console.error('儲存資料至快取失敗:', err)
    }
  }

  async function syncData(): Promise<void> {
    if (!navigator.onLine) {
      console.log('目前離線，無法同步資料')
      return
    }

    try {
      await loadData(true)
      console.log('資料同步完成')
    } catch (err) {
      console.error('資料同步失敗:', err)
    }
  }

  function clearData(): void {
    records.value = []
    error.value = null
    loadProgress.value = 0
  }

  function clearError(): void {
    error.value = null
    retryCount.value = 0
  }

  const getRecordById = computed(() => {
    return (id: string): FieldRecord | undefined => {
      return records.value.find((record) => record.id === id)
    }
  })

  const totalRecords = computed(() => records.value.length)

  const hasData = computed(() => records.value.length > 0)

  return {
    records,
    loading,
    error,
    loadProgress,
    isUsingCache,

    loadData,
    clearData,
    clearError,
    syncData,

    getRecordById,
    totalRecords,
    hasData,
  }
})

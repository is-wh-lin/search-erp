import { errorHandler, ErrorType } from '../utils/errorHandler'

const DB_NAME = 'erp-query-system'
const DB_VERSION = 1
const STORE_NAME = 'cache'

export interface CacheOptions {
  expiresIn?: number
}

export interface CacheEntry<T = any> {
  data: T
  timestamp: number
  expiresAt?: number
}

class CacheService {
  private db: IDBDatabase | null = null
  private dbInitPromise: Promise<IDBDatabase> | null = null

  private async initDB(): Promise<IDBDatabase> {
    if (this.db) {
      return this.db
    }

    if (this.dbInitPromise) {
      return this.dbInitPromise
    }

    this.dbInitPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION)

      request.onerror = () => {
        reject(new Error('無法開啟 IndexedDB'))
      }

      request.onsuccess = () => {
        this.db = request.result
        resolve(request.result)
      }

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result

        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME)
        }
      }
    })

    return this.dbInitPromise
  }

  private isLocalStorageAvailable(): boolean {
    try {
      const test = '__localStorage_test__'
      localStorage.setItem(test, test)
      localStorage.removeItem(test)
      return true
    } catch (e) {
      return false
    }
  }

  private checkLocalStorageCapacity(): { used: number; available: boolean } {
    if (!this.isLocalStorageAvailable()) {
      return { used: 0, available: false }
    }

    let used = 0
    for (const key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        used += localStorage[key].length + key.length
      }
    }

    const maxSize = 5 * 1024 * 1024
    return {
      used,
      available: used < maxSize * 0.9,
    }
  }

  saveToLocalStorage<T>(key: string, data: T, options?: CacheOptions): boolean {
    if (!this.isLocalStorageAvailable()) {
      console.warn('LocalStorage 不可用')
      return false
    }

    try {
      const capacity = this.checkLocalStorageCapacity()
      if (!capacity.available) {
        console.warn('LocalStorage 容量不足')
        return false
      }

      const entry: CacheEntry<T> = {
        data,
        timestamp: Date.now(),
      }

      if (options?.expiresIn) {
        entry.expiresAt = Date.now() + options.expiresIn
      }

      localStorage.setItem(key, JSON.stringify(entry))
      return true
    } catch (error) {
      const appError = errorHandler.handleError(error, ErrorType.STORAGE)
      console.error('儲存至 LocalStorage 失敗:', appError.userMessage)

      if (errorHandler.isQuotaExceededError(error)) {
        console.warn('LocalStorage 容量已滿，建議清除部分資料')
      }
      return false
    }
  }

  loadFromLocalStorage<T>(key: string): T | null {
    if (!this.isLocalStorageAvailable()) {
      return null
    }

    try {
      const item = localStorage.getItem(key)
      if (!item) {
        return null
      }

      const entry: CacheEntry<T> = JSON.parse(item)

      if (entry.expiresAt && Date.now() > entry.expiresAt) {
        localStorage.removeItem(key)
        return null
      }

      return entry.data
    } catch (error) {
      const appError = errorHandler.handleError(error, ErrorType.STORAGE)
      console.error('從 LocalStorage 載入失敗:', appError.userMessage)
      return null
    }
  }

  removeFromLocalStorage(key: string): void {
    if (!this.isLocalStorageAvailable()) {
      return
    }

    try {
      localStorage.removeItem(key)
    } catch (error) {
      console.error('從 LocalStorage 移除失敗:', error)
    }
  }

  async saveToIndexedDB<T>(key: string, data: T, options?: CacheOptions): Promise<boolean> {
    try {
      const db = await this.initDB()

      const entry: CacheEntry<T> = {
        data,
        timestamp: Date.now(),
      }

      if (options?.expiresIn) {
        entry.expiresAt = Date.now() + options.expiresIn
      }

      return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readwrite')
        const store = transaction.objectStore(STORE_NAME)
        const request = store.put(entry, key)

        request.onsuccess = () => resolve(true)
        request.onerror = () => {
          const appError = errorHandler.handleError(
            new Error('儲存至 IndexedDB 失敗'),
            ErrorType.STORAGE
          )
          console.error(appError.userMessage)
          reject(false)
        }
      })
    } catch (error) {
      const appError = errorHandler.handleError(error, ErrorType.STORAGE)
      console.error('IndexedDB 操作失敗:', appError.userMessage)
      return false
    }
  }

  async loadFromIndexedDB<T>(key: string): Promise<T | null> {
    try {
      const db = await this.initDB()

      return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readonly')
        const store = transaction.objectStore(STORE_NAME)
        const request = store.get(key)

        request.onsuccess = () => {
          const entry: CacheEntry<T> | undefined = request.result

          if (!entry) {
            resolve(null)
            return
          }

          if (entry.expiresAt && Date.now() > entry.expiresAt) {
            this.removeFromIndexedDB(key)
            resolve(null)
            return
          }

          resolve(entry.data)
        }

        request.onerror = () => {
          console.error('從 IndexedDB 載入失敗')
          reject(null)
        }
      })
    } catch (error) {
      console.error('IndexedDB 操作失敗:', error)
      return null
    }
  }

  async removeFromIndexedDB(key: string): Promise<boolean> {
    try {
      const db = await this.initDB()

      return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readwrite')
        const store = transaction.objectStore(STORE_NAME)
        const request = store.delete(key)

        request.onsuccess = () => resolve(true)
        request.onerror = () => {
          console.error('從 IndexedDB 移除失敗')
          reject(false)
        }
      })
    } catch (error) {
      console.error('IndexedDB 操作失敗:', error)
      return false
    }
  }

  clearLocalStorage(prefix?: string): void {
    if (!this.isLocalStorageAvailable()) {
      return
    }

    try {
      if (prefix) {
        const keysToRemove: string[] = []
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i)
          if (key && key.startsWith(prefix)) {
            keysToRemove.push(key)
          }
        }
        keysToRemove.forEach((key) => localStorage.removeItem(key))
      } else {
        localStorage.clear()
      }
    } catch (error) {
      console.error('清除 LocalStorage 失敗:', error)
    }
  }

  async clearIndexedDB(): Promise<boolean> {
    try {
      const db = await this.initDB()

      return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readwrite')
        const store = transaction.objectStore(STORE_NAME)
        const request = store.clear()

        request.onsuccess = () => resolve(true)
        request.onerror = () => {
          console.error('清除 IndexedDB 失敗')
          reject(false)
        }
      })
    } catch (error) {
      console.error('IndexedDB 操作失敗:', error)
      return false
    }
  }

  async clearAllCache(prefix?: string): Promise<void> {
    this.clearLocalStorage(prefix)
    if (!prefix) {
      await this.clearIndexedDB()
    }
  }

  getLocalStorageInfo(): { used: number; usedMB: number; available: boolean } {
    const capacity = this.checkLocalStorageCapacity()
    return {
      used: capacity.used,
      usedMB: Number((capacity.used / (1024 * 1024)).toFixed(2)),
      available: capacity.available,
    }
  }

  async getIndexedDBInfo(): Promise<{ usage?: number; quota?: number } | null> {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      try {
        const estimate = await navigator.storage.estimate()
        return {
          usage: estimate.usage,
          quota: estimate.quota,
        }
      } catch (error) {
        console.error('無法取得 IndexedDB 使用情況:', error)
        return null
      }
    }
    return null
  }
}

export const cacheService = new CacheService()
export default cacheService

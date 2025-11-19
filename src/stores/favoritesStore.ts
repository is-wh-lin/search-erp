import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { FieldRecord } from '../types'
import { cacheService } from '../services/cacheService'

const FAVORITES_STORAGE_KEY = 'erp-favorites'

export const useFavoritesStore = defineStore('favorites', () => {
  const favorites = ref<FieldRecord[]>([])

  const loadedFavorites = cacheService.loadFromLocalStorage<FieldRecord[]>(FAVORITES_STORAGE_KEY)
  if (loadedFavorites) {
    favorites.value = loadedFavorites
  }

  function saveFavorites(): boolean {
    try {
      const success = cacheService.saveToLocalStorage(FAVORITES_STORAGE_KEY, favorites.value)

      if (!success) {
        console.error('儲存最愛清單失敗：LocalStorage 可能已滿')
        return false
      }

      return true
    } catch (error) {
      console.error('儲存最愛清單時發生錯誤:', error)
      return false
    }
  }

  function addFavorite(record: FieldRecord): boolean {
    const exists = favorites.value.some((fav) => fav.id === record.id)

    if (exists) {
      console.warn('記錄已在最愛清單中')
      return false
    }

    favorites.value.push(record)

    return saveFavorites()
  }

  function removeFavorite(id: string): boolean {
    const index = favorites.value.findIndex((fav) => fav.id === id)

    if (index === -1) {
      console.warn('記錄不在最愛清單中')
      return false
    }

    favorites.value.splice(index, 1)

    return saveFavorites()
  }

  function toggleFavorite(record: FieldRecord): boolean {
    const exists = favorites.value.some((fav) => fav.id === record.id)

    if (exists) {
      removeFavorite(record.id)
      return false
    } else {
      addFavorite(record)
      return true
    }
  }

  function batchAddFavorites(records: FieldRecord[]): number {
    let addedCount = 0

    records.forEach((record) => {
      const exists = favorites.value.some((fav) => fav.id === record.id)

      if (!exists) {
        favorites.value.push(record)
        addedCount++
      }
    })

    if (addedCount > 0) {
      saveFavorites()
    }

    return addedCount
  }

  function clearFavorites(): void {
    favorites.value = []
    cacheService.removeFromLocalStorage(FAVORITES_STORAGE_KEY)
  }

  const isFavorite = computed(() => {
    return (id: string): boolean => {
      return favorites.value.some((fav) => fav.id === id)
    }
  })

  const favoritesCount = computed(() => favorites.value.length)

  const hasFavorites = computed(() => favorites.value.length > 0)

  return {
    favorites,

    addFavorite,
    removeFavorite,
    toggleFavorite,
    batchAddFavorites,
    clearFavorites,

    isFavorite,
    favoritesCount,
    hasFavorites,
  }
})

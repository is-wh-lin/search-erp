<script setup lang="ts">
import { ref, onMounted, watch, defineAsyncComponent } from 'vue'
import { useDataStore } from './stores/dataStore'
import { useFavoritesStore } from './stores/favoritesStore'
import { useSettingsStore } from './stores/settingsStore'
import { useGestures } from './composables/useGestures'
import { useToast } from './composables/useToast'
import { useOnlineStatus } from './composables/useOnlineStatus'
import { useConfirm } from './composables/useConfirm'
import ToastContainer from './components/common/ToastContainer.vue'
import ThemeToggle from './components/settings/ThemeToggle.vue'
import OfflineIndicator from './components/common/OfflineIndicator.vue'
import ConfirmDialog from './components/common/ConfirmDialog.vue'

const SearchHelpers = defineAsyncComponent(() => import('./components/search/SearchHelpers.vue'))
const ResultsTable = defineAsyncComponent(() => import('./components/results/ResultsTable.vue'))
const ResultsCard = defineAsyncComponent(() => import('./components/results/ResultsCard.vue'))
const FavoritesList = defineAsyncComponent(() => import('./components/favorites/FavoritesList.vue'))
const SettingsPanel = defineAsyncComponent(() => import('./components/settings/SettingsPanel.vue'))
const SkipToContent = defineAsyncComponent(() => import('./components/common/SkipToContent.vue'))

const isMobile = ref(false)

type TabType = 'search' | 'favorites'
const activeTab = ref<TabType>('search')

const favoritesStore = useFavoritesStore()
const settingsStore = useSettingsStore()
const { success, info } = useToast()

const { isOnline } = useOnlineStatus()

const { state: confirmState, handleConfirm: onConfirm, handleCancel: onCancel } = useConfirm()

const mainContainerRef = ref<HTMLElement | null>(null)

function checkMobile() {
  isMobile.value = window.innerWidth < 768
}

function switchTab(tab: TabType) {
  activeTab.value = tab
}

async function handlePullToRefresh() {
  await loadInitialData()
  success('資料已重新整理')
}

function handleSwipeLeft() {
  if (activeTab.value === 'search') {
    switchTab('favorites')
  }
}

function handleSwipeRight() {
  if (activeTab.value === 'favorites') {
    switchTab('search')
  }
}

function handlePinchZoom(scale: number) {
  if (scale < 0.8) {
    settingsStore.updateFontSize('small')
  } else if (scale > 1.2) {
    settingsStore.updateFontSize('large')
  } else {
    settingsStore.updateFontSize('medium')
  }
}

const { isRefreshing, isPulling, pullDistance } = useGestures(
  mainContainerRef,
  {
    onPullToRefresh: handlePullToRefresh,
    onSwipeLeft: handleSwipeLeft,
    onSwipeRight: handleSwipeRight,
    onPinchZoom: handlePinchZoom,
  },
  {
    enableVisualFeedback: true,
  }
)

watch(isOnline, async (newValue, oldValue) => {
  if (!oldValue && newValue) {
    info('正在同步資料...')
    try {
      await dataStore.syncData()
      success('資料同步完成')
    } catch (err) {
      console.error('資料同步失敗:', err)
    }
  }
})

onMounted(() => {
  checkMobile()
  window.addEventListener('resize', checkMobile)

  loadInitialData()
})

const dataStore = useDataStore()

async function loadInitialData() {
  try {
    await dataStore.loadData()
  } catch (err) {
    console.error('載入資料失敗:', err)
  }
}

function retryLoad() {
  dataStore.clearError()
  loadInitialData()
}
</script>

<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300 ease-in-out">
    <SkipToContent />

    <header
      class="bg-white dark:bg-gray-800 shadow-md transition-colors duration-300 ease-in-out"
      role="banner"
    >
      <div class="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h1 class="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">
            鼎新 ERP 檔案與欄位查詢系統
          </h1>

          <div class="shrink-0">
            <ThemeToggle />
          </div>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main
      id="main-content"
      ref="mainContainerRef"
      class="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-6 relative min-h-[calc(100vh-280px)]"
      role="main"
      tabindex="-1"
    >
      <div
        v-if="isPulling || isRefreshing"
        class="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-full transition-transform duration-300 ease-out"
        :style="{ transform: `translate(-50%, ${Math.min(pullDistance * 0.5, 40) - 100}%)` }"
      >
        <div class="bg-white dark:bg-gray-800 rounded-full shadow-lg p-3">
          <div
            v-if="isRefreshing"
            class="w-6 h-6 border-3 border-blue-500 border-t-transparent rounded-full animate-spin"
          ></div>
          <div v-else class="text-2xl">↓</div>
        </div>
      </div>

      <div v-if="dataStore.loading" class="flex flex-col items-center justify-center min-h-[400px]">
        <div class="relative w-16 h-16 mb-4">
          <div
            class="absolute inset-0 border-4 border-gray-200 dark:border-gray-700 rounded-full"
          ></div>
          <div
            class="absolute inset-0 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"
          ></div>
        </div>
        <p class="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">
          {{ isOnline ? '載入資料中...' : '從快取載入資料...' }}
        </p>
        <div class="w-64 bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
          <div
            class="bg-blue-500 h-full transition-all duration-300 ease-out"
            :style="{ width: `${dataStore.loadProgress}%` }"
          ></div>
        </div>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-2">{{ dataStore.loadProgress }}%</p>
      </div>

      <div v-else-if="dataStore.error" class="max-w-2xl mx-auto">
        <div
          class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6"
        >
          <div class="flex items-start">
            <div class="shrink-0">
              <span class="text-2xl">⚠️</span>
            </div>
            <div class="ml-3 flex-1">
              <h3 class="text-lg font-medium text-red-800 dark:text-red-200 mb-2">
                載入資料時發生錯誤
              </h3>
              <p class="text-sm text-red-700 dark:text-red-300 mb-4">
                {{ dataStore.error }}
              </p>
              <button
                @click="retryLoad"
                class="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors duration-200 font-medium"
              >
                重試
              </button>
            </div>
          </div>
        </div>
      </div>

      <div v-else-if="dataStore.hasData" class="space-y-6">
        <div
          v-if="dataStore.isUsingCache"
          class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4"
          role="alert"
          aria-live="polite"
        >
          <div class="flex items-start gap-3">
            <span class="text-xl" aria-hidden="true">ℹ️</span>
            <div class="flex-1">
              <p class="text-sm text-blue-800 dark:text-blue-200">
                目前使用快取資料。{{
                  isOnline ? '資料可能不是最新版本。' : '離線模式下無法更新資料。'
                }}
              </p>
            </div>
          </div>
        </div>

        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
          <div class="border-b border-gray-200 dark:border-gray-700">
            <nav class="flex -mb-px" aria-label="Tabs">
              <button
                id="search-tab"
                @click="switchTab('search')"
                :class="[
                  'flex-1 py-3 px-2 min-h-[44px] text-center border-b-2 font-medium text-sm sm:text-base transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2',
                  activeTab === 'search'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300',
                ]"
                role="tab"
                :aria-selected="activeTab === 'search'"
                :aria-controls="'results-section'"
                :tabindex="activeTab === 'search' ? 0 : -1"
              >
                <span class="flex items-center justify-center gap-2">
                  <span class="text-lg sm:text-xl" aria-hidden="true">🔍</span>
                  <span class="hidden xs:inline">搜尋結果</span>
                  <span class="xs:hidden">搜尋</span>
                </span>
              </button>

              <button
                id="favorites-tab"
                @click="switchTab('favorites')"
                :class="[
                  'flex-1 py-3 px-2 min-h-[44px] text-center border-b-2 font-medium text-sm sm:text-base transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2',
                  activeTab === 'favorites'
                    ? 'border-yellow-500 text-yellow-600 dark:text-yellow-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300',
                ]"
                role="tab"
                :aria-selected="activeTab === 'favorites'"
                :aria-controls="'favorites-section'"
                :tabindex="activeTab === 'favorites' ? 0 : -1"
              >
                <span class="flex items-center justify-center gap-2">
                  <span class="text-lg sm:text-xl" aria-hidden="true">⭐</span>
                  <span class="hidden xs:inline">我的最愛</span>
                  <span class="xs:hidden">最愛</span>
                  <span
                    v-if="favoritesStore.favoritesCount > 0"
                    class="inline-flex items-center justify-center min-w-[20px] px-2 py-0.5 text-xs font-bold leading-none text-white bg-yellow-500 rounded-full"
                    :aria-label="`${favoritesStore.favoritesCount} 個最愛項目`"
                  >
                    {{ favoritesStore.favoritesCount }}
                  </span>
                </span>
              </button>
            </nav>
          </div>
        </div>

        <section
          id="results-section"
          v-show="activeTab === 'search'"
          role="tabpanel"
          aria-labelledby="search-tab"
          class="animate-fade-in"
        >
          <div v-if="!isMobile" class="mb-4">
            <ResultsTable />
          </div>

          <div v-else class="mb-4">
            <ResultsCard />
          </div>

          <section id="search-helpers" aria-label="搜尋輔助功能">
            <SearchHelpers />
          </section>
        </section>

        <section
          v-show="activeTab === 'favorites'"
          role="tabpanel"
          aria-labelledby="favorites-tab"
          class="animate-fade-in"
        >
          <div v-if="!isMobile">
            <FavoritesList view-mode="table" />
          </div>

          <div v-else>
            <FavoritesList view-mode="card" />
          </div>
        </section>
      </div>
    </main>

    <!-- Footer -->
    <footer
      class="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 mt-12 transition-colors duration-300 ease-in-out"
      role="contentinfo"
    >
      <div class="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <p class="text-center text-sm text-gray-500 dark:text-gray-400">
          鼎新 ERP 檔案與欄位查詢系統 © {{ new Date().getFullYear() }}
        </p>
      </div>
    </footer>

    <ToastContainer />

    <SettingsPanel />

    <OfflineIndicator />

    <ConfirmDialog
      v-model:is-open="confirmState.isOpen"
      :title="confirmState.title"
      :message="confirmState.message"
      :confirm-text="confirmState.confirmText"
      :cancel-text="confirmState.cancelText"
      @confirm="onConfirm"
      @cancel="onCancel"
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
</style>

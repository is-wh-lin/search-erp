<script setup lang="ts">
import { ref, computed } from 'vue'
import { useSettingsStore } from '../../stores/settingsStore'
import { useConfirm } from '../../composables/useConfirm'
import ColumnSelector from './ColumnSelector.vue'

// Settings Store
const settingsStore = useSettingsStore()

const { confirm } = useConfirm()

const isOpen = ref(false)

function openPanel() {
  isOpen.value = true
}

function closePanel() {
  isOpen.value = false
}

function togglePanel() {
  isOpen.value = !isOpen.value
}

const themeOptions = [
  { value: 'light', label: '淺色', icon: '☀️' },
  { value: 'dark', label: '深色', icon: '🌙' },
] as const

const fontSizeOptions = [
  { value: 'small', label: '小', description: '較小的文字' },
  { value: 'medium', label: '中', description: '標準文字' },
  { value: 'large', label: '大', description: '較大的文字' },
] as const

const currentTheme = computed(() => settingsStore.settings.theme)

const currentFontSize = computed(() => settingsStore.settings.fontSize)

function handleThemeChange(theme: 'light' | 'dark') {
  settingsStore.updateTheme(theme)
}

function handleFontSizeChange(fontSize: 'small' | 'medium' | 'large') {
  settingsStore.updateFontSize(fontSize)
}

async function handleReset() {
  const confirmed = await confirm({
    title: '重設設定',
    message: '確定要重設所有設定為預設值嗎？此操作無法復原。',
    confirmText: '重設',
    cancelText: '取消',
  })

  if (confirmed) {
    settingsStore.resetSettings()
  }
}

defineExpose({
  openPanel,
  closePanel,
  togglePanel,
})
</script>

<template>
  <div>
    <button
      @click="togglePanel"
      class="fixed bottom-6 right-6 z-40 w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center group"
      aria-label="開啟設定"
      title="設定"
    >
      <svg
        class="w-6 h-6 transition-transform duration-200 group-hover:rotate-90"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
        />
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
        />
      </svg>
    </button>

    <Transition name="fade">
      <div
        v-if="isOpen"
        class="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity duration-300"
        @click="closePanel"
      ></div>
    </Transition>

    <Transition name="slide">
      <div
        v-if="isOpen"
        class="fixed top-0 right-0 h-full w-full sm:w-96 bg-white dark:bg-gray-800 shadow-2xl z-50 overflow-y-auto transition-transform duration-300"
      >
        <div
          class="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between z-10"
        >
          <h2 class="text-xl font-bold text-gray-900 dark:text-white">設定</h2>
          <button
            @click="closePanel"
            class="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
            aria-label="關閉設定"
          >
            <svg
              class="w-6 h-6 text-gray-500 dark:text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div class="px-6 py-6 space-y-8">
          <section>
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">外觀主題</h3>
            <div class="grid grid-cols-2 gap-3">
              <button
                v-for="option in themeOptions"
                :key="option.value"
                @click="handleThemeChange(option.value)"
                :class="[
                  'flex flex-col items-center justify-center p-4 rounded-lg border-2 transition-all duration-200',
                  currentTheme === option.value
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600',
                ]"
                :aria-label="`切換至${option.label}模式`"
              >
                <span class="text-3xl mb-2">{{ option.icon }}</span>
                <span
                  :class="[
                    'text-sm font-medium',
                    currentTheme === option.value
                      ? 'text-blue-600 dark:text-blue-400'
                      : 'text-gray-700 dark:text-gray-300',
                  ]"
                >
                  {{ option.label }}
                </span>
                <span
                  v-if="currentTheme === option.value"
                  class="mt-1 text-xs text-blue-600 dark:text-blue-400"
                >
                  ✓ 已選取
                </span>
              </button>
            </div>
          </section>

          <section>
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">字體大小</h3>
            <div class="space-y-2">
              <button
                v-for="option in fontSizeOptions"
                :key="option.value"
                @click="handleFontSizeChange(option.value)"
                :class="[
                  'w-full flex items-center justify-between p-4 rounded-lg border-2 transition-all duration-200',
                  currentFontSize === option.value
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600',
                ]"
                :aria-label="`設定字體大小為${option.label}`"
              >
                <div class="flex items-center gap-3">
                  <div
                    :class="[
                      'w-5 h-5 rounded-full border-2 flex items-center justify-center',
                      currentFontSize === option.value
                        ? 'border-blue-500 bg-blue-500'
                        : 'border-gray-300 dark:border-gray-600',
                    ]"
                  >
                    <div
                      v-if="currentFontSize === option.value"
                      class="w-2 h-2 bg-white rounded-full"
                    ></div>
                  </div>
                  <div class="text-left">
                    <div
                      :class="[
                        'font-medium',
                        currentFontSize === option.value
                          ? 'text-blue-600 dark:text-blue-400'
                          : 'text-gray-900 dark:text-white',
                      ]"
                    >
                      {{ option.label }}
                    </div>
                    <div class="text-xs text-gray-500 dark:text-gray-400">
                      {{ option.description }}
                    </div>
                  </div>
                </div>
                <span
                  :class="[
                    'font-bold',
                    option.value === 'small' && 'text-sm',
                    option.value === 'medium' && 'text-base',
                    option.value === 'large' && 'text-lg',
                    currentFontSize === option.value
                      ? 'text-blue-600 dark:text-blue-400'
                      : 'text-gray-400 dark:text-gray-500',
                  ]"
                >
                  Aa
                </span>
              </button>
            </div>
          </section>

          <ColumnSelector />

          <section>
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">其他</h3>
            <div class="space-y-3">
              <div
                class="flex items-center justify-between p-4 rounded-lg border border-gray-200 dark:border-gray-700"
              >
                <div>
                  <div class="font-medium text-gray-900 dark:text-white">搜尋歷史</div>
                  <div class="text-xs text-gray-500 dark:text-gray-400">記錄最近的搜尋條件</div>
                </div>
                <button
                  @click="
                    settingsStore.updateSearchHistoryEnabled(
                      !settingsStore.settings.searchHistoryEnabled
                    )
                  "
                  :class="[
                    'relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200',
                    settingsStore.settings.searchHistoryEnabled
                      ? 'bg-blue-600'
                      : 'bg-gray-300 dark:bg-gray-600',
                  ]"
                  role="switch"
                  :aria-checked="settingsStore.settings.searchHistoryEnabled"
                >
                  <span
                    :class="[
                      'inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200',
                      settingsStore.settings.searchHistoryEnabled
                        ? 'translate-x-6'
                        : 'translate-x-1',
                    ]"
                  />
                </button>
              </div>

              <button
                @click="handleReset"
                class="w-full p-4 rounded-lg border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors duration-200 font-medium"
              >
                重設為預設值
              </button>
            </div>
          </section>

          <section class="pt-4 border-t border-gray-200 dark:border-gray-700">
            <div class="text-xs text-gray-500 dark:text-gray-400 space-y-1">
              <p>設定會自動儲存至瀏覽器</p>
              <p>版本：1.0.0</p>
            </div>
          </section>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-enter-active,
.slide-leave-active {
  transition: transform 0.3s ease;
}

.slide-enter-from,
.slide-leave-to {
  transform: translateX(100%);
}
</style>

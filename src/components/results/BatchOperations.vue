<script setup lang="ts">
import { ref, computed } from 'vue'
import type { FieldRecord } from '../../types'

interface Props {
  selectedRecords: FieldRecord[]
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
})

const emit = defineEmits<{
  copy: []
  addToFavorites: []
}>()

const isOpen = ref(false)

const selectedCount = computed(() => props.selectedRecords.length)

function toggleDropdown(): void {
  if (!props.disabled) {
    isOpen.value = !isOpen.value
  }
}

function closeDropdown(): void {
  isOpen.value = false
}

function handleCopy(): void {
  emit('copy')
  closeDropdown()
}

function handleAddToFavorites(): void {
  emit('addToFavorites')
  closeDropdown()
}
</script>

<template>
  <div class="relative inline-block text-left">
    <button
      @click="toggleDropdown"
      :disabled="disabled"
      class="inline-flex items-center justify-center gap-2 px-3 sm:px-4 py-2 min-h-[44px] text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 disabled:bg-gray-400 disabled:cursor-not-allowed rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
      :class="{ 'opacity-50': disabled }"
      :title="disabled ? '請先選取記錄' : '批次操作'"
    >
      <svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M4 6h16M4 12h16M4 18h16"
        />
      </svg>
      <span class="whitespace-nowrap">批次操作</span>
      <span v-if="!disabled" class="text-xs bg-orange-500 px-2 py-0.5 rounded-full min-w-[20px]">
        {{ selectedCount }}
      </span>
      <svg
        class="w-4 h-4 shrink-0 transition-transform duration-200"
        :class="{ 'rotate-180': isOpen }"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
      </svg>
    </button>

    <Transition
      enter-active-class="transition ease-out duration-100"
      enter-from-class="transform opacity-0 scale-95"
      enter-to-class="transform opacity-100 scale-100"
      leave-active-class="transition ease-in duration-75"
      leave-from-class="transform opacity-100 scale-100"
      leave-to-class="transform opacity-0 scale-95"
    >
      <div
        v-if="isOpen && !disabled"
        class="absolute right-0 z-50 mt-2 w-56 origin-top-right rounded-lg bg-white dark:bg-gray-800 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none"
      >
        <div class="py-1" role="menu" aria-orientation="vertical">
          <button
            @click="handleCopy"
            class="group flex w-full items-center gap-3 px-4 py-3 min-h-[44px] text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-150"
            role="menuitem"
          >
            <svg
              class="w-5 h-5 shrink-0 text-gray-500 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
              />
            </svg>
            <div class="flex-1 text-left">
              <div class="font-medium">批次複製</div>
              <div class="text-xs text-gray-500 dark:text-gray-400">複製為表格格式</div>
            </div>
          </button>

          <div class="border-t border-gray-200 dark:border-gray-700 my-1"></div>

          <button
            @click="handleAddToFavorites"
            class="group flex w-full items-center gap-3 px-4 py-3 min-h-[44px] text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-150"
            role="menuitem"
          >
            <svg
              class="w-5 h-5 shrink-0 text-gray-500 dark:text-gray-400 group-hover:text-yellow-500 dark:group-hover:text-yellow-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
              />
            </svg>
            <div class="flex-1 text-left">
              <div class="font-medium">批次加入最愛</div>
              <div class="text-xs text-gray-500 dark:text-gray-400">將選取項目加入最愛</div>
            </div>
          </button>
        </div>
      </div>
    </Transition>

    <div v-if="isOpen" @click="closeDropdown" class="fixed inset-0 z-0" aria-hidden="true"></div>
  </div>
</template>

<style scoped>
.rotate-180 {
  transform: rotate(180deg);
}
</style>

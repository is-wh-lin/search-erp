<script setup lang="ts">
import { computed } from 'vue'

// Props
interface Props {
  currentPage: number
  totalItems: number
  itemsPerPage: number
  maxVisiblePages?: number
}

const props = withDefaults(defineProps<Props>(), {
  maxVisiblePages: 7,
})

// Emits
interface Emits {
  (e: 'update:currentPage', page: number): void
  (e: 'update:itemsPerPage', perPage: number): void
}

const emit = defineEmits<Emits>()

const perPageOptions = [10, 25, 50, 100, 200]

const totalPages = computed(() => Math.ceil(props.totalItems / props.itemsPerPage))

const hasPrevious = computed(() => props.currentPage > 1)

const hasNext = computed(() => props.currentPage < totalPages.value)

const visiblePages = computed(() => {
  const pages: (number | string)[] = []
  const total = totalPages.value
  const current = props.currentPage
  const maxVisible = props.maxVisiblePages

  if (total <= maxVisible) {
    for (let i = 1; i <= total; i++) {
      pages.push(i)
    }
  } else {
    pages.push(1)

    let startPage = Math.max(2, current - Math.floor((maxVisible - 3) / 2))
    let endPage = Math.min(total - 1, startPage + maxVisible - 4)

    if (endPage - startPage < maxVisible - 4) {
      startPage = Math.max(2, endPage - maxVisible + 4)
    }

    if (startPage > 2) {
      pages.push('...')
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i)
    }

    if (endPage < total - 1) {
      pages.push('...')
    }

    pages.push(total)
  }

  return pages
})

const displayRange = computed(() => {
  const start = (props.currentPage - 1) * props.itemsPerPage + 1
  const end = Math.min(props.currentPage * props.itemsPerPage, props.totalItems)
  return { start, end }
})

function goToPage(page: number | string): void {
  if (typeof page === 'string') return
  if (page < 1 || page > totalPages.value) return
  if (page === props.currentPage) return
  emit('update:currentPage', page)
}

function goToPrevious(): void {
  if (hasPrevious.value) {
    emit('update:currentPage', props.currentPage - 1)
  }
}

function goToNext(): void {
  if (hasNext.value) {
    emit('update:currentPage', props.currentPage + 1)
  }
}

function changeItemsPerPage(event: Event): void {
  const target = event.target as HTMLSelectElement
  const newPerPage = parseInt(target.value, 10)
  emit('update:itemsPerPage', newPerPage)

  emit('update:currentPage', 1)
}
</script>

<template>
  <div
    class="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700"
  >
    <div class="text-sm text-gray-700 dark:text-gray-300">
      顯示第
      <span class="font-semibold text-gray-900 dark:text-white">{{
        displayRange.start.toLocaleString()
      }}</span>
      至
      <span class="font-semibold text-gray-900 dark:text-white">{{
        displayRange.end.toLocaleString()
      }}</span>
      筆，共
      <span class="font-semibold text-gray-900 dark:text-white">{{
        totalItems.toLocaleString()
      }}</span>
      筆記錄
    </div>

    <nav class="flex items-center gap-1" aria-label="分頁導航">
      <button
        type="button"
        :disabled="!hasPrevious"
        @click="goToPrevious"
        class="px-3 py-2 text-sm font-medium rounded-md transition-colors duration-150"
        :class="
          hasPrevious
            ? 'text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 border border-gray-300 dark:border-gray-600'
            : 'text-gray-400 dark:text-gray-600 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 cursor-not-allowed'
        "
        aria-label="上一頁"
      >
        <svg
          class="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M15 19l-7-7 7-7"
          />
        </svg>
      </button>

      <template v-for="page in visiblePages" :key="page">
        <span
          v-if="page === '...'"
          class="px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          ...
        </span>

        <button
          v-else
          type="button"
          @click="goToPage(page)"
          class="px-4 py-2 text-sm font-medium rounded-md transition-colors duration-150"
          :class="
            page === currentPage
              ? 'text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600'
              : 'text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 border border-gray-300 dark:border-gray-600'
          "
          :aria-label="`第 ${page} 頁`"
          :aria-current="page === currentPage ? 'page' : undefined"
        >
          {{ page }}
        </button>
      </template>

      <button
        type="button"
        :disabled="!hasNext"
        @click="goToNext"
        class="px-3 py-2 text-sm font-medium rounded-md transition-colors duration-150"
        :class="
          hasNext
            ? 'text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 border border-gray-300 dark:border-gray-600'
            : 'text-gray-400 dark:text-gray-600 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 cursor-not-allowed'
        "
        aria-label="下一頁"
      >
        <svg
          class="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </nav>

    <div class="flex items-center gap-2">
      <label
        for="items-per-page"
        class="text-sm text-gray-700 dark:text-gray-300 whitespace-nowrap"
      >
        每頁顯示
      </label>
      <select
        id="items-per-page"
        :value="itemsPerPage"
        @change="changeItemsPerPage"
        class="px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-colors duration-150"
      >
        <option v-for="option in perPageOptions" :key="option" :value="option">
          {{ option }} 筆
        </option>
      </select>
    </div>
  </div>
</template>

<style scoped>
button {
  min-width: 44px;
  min-height: 44px;
}

select {
  cursor: pointer;
}

select:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

@media (max-width: 640px) {
  nav {
    flex-wrap: wrap;
  }
}
</style>

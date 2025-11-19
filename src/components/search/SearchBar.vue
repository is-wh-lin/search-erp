<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useSearchStore } from '../../stores/searchStore'
import { useDebounce } from '../../composables/useDebounce'
import type { SearchCriteria } from '../../types'
import SearchFilters from './SearchFilters.vue'
import SearchHistory from './SearchHistory.vue'
import PopularSearchTags from './PopularSearchTags.vue'

const searchStore = useSearchStore()

const searchFields = ref({
  fieldNumber: '',
  fieldName: '',
  fileCode: '',
  fileName: '',
  dataType: '',
  length: '',
  fieldDescription: '',
  remark: '',
})

const fieldConfigs = [
  {
    key: 'fieldNumber',
    label: '欄位編號',
    placeholder: '輸入欄位編號，可用空格或逗號分隔多個條件',
  },
  {
    key: 'fieldName',
    label: '欄位名稱',
    placeholder: '輸入欄位名稱，可用空格或逗號分隔多個條件',
  },
  {
    key: 'fileCode',
    label: '檔案代碼',
    placeholder: '例如：「ACPTB,ACTLA」或「ACPTB ACTLA」，可用空格或逗號分隔',
  },
  {
    key: 'fileName',
    label: '檔案名稱',
    placeholder: '輸入檔案名稱，可用空格或逗號分隔多個條件',
  },
  {
    key: 'dataType',
    label: '型態',
    placeholder: '輸入資料型態，可用空格或逗號分隔多個條件',
  },
  {
    key: 'length',
    label: '長度',
    placeholder: '輸入長度，可用空格或逗號分隔多個條件',
  },
  {
    key: 'fieldDescription',
    label: '欄位說明',
    placeholder: '輸入欄位說明，可用空格或逗號分隔多個條件',
  },
  {
    key: 'remark',
    label: 'Remark',
    placeholder: '輸入備註，可用空格或逗號分隔多個條件',
  },
]

function parseMultipleConditions(input: string): string[] {
  if (!input || !input.trim()) {
    return []
  }

  return input
    .split(/[\s,]+/)
    .map((term) => term.trim())
    .filter((term) => term.length > 0)
}

async function performSearch() {
  const criteria: SearchCriteria = {}

  for (const [key, value] of Object.entries(searchFields.value)) {
    const conditions = parseMultipleConditions(value)
    if (conditions.length > 0) {
      criteria[key as keyof SearchCriteria] = conditions
    }
  }

  await searchStore.search(criteria)
}

const debouncedSearch = useDebounce(performSearch, 300)

function handleInput() {
  debouncedSearch()
}

function clearAll() {
  for (const key in searchFields.value) {
    searchFields.value[key as keyof typeof searchFields.value] = ''
  }

  searchStore.clearCriteria()
}

function clearField(fieldKey: string) {
  searchFields.value[fieldKey as keyof typeof searchFields.value] = ''
  handleInput()
}

const hasAnyInput = computed(() => {
  return Object.values(searchFields.value).some((value) => value.trim().length > 0)
})

const filledFieldsCount = computed(() => {
  return Object.values(searchFields.value).filter((value) => value.trim().length > 0).length
})

function removeCondition(field: string, condition: string) {
  const currentValue = searchFields.value[field as keyof typeof searchFields.value]

  const conditions = parseMultipleConditions(currentValue)

  const updatedConditions = conditions.filter((c) => c !== condition)

  searchFields.value[field as keyof typeof searchFields.value] = updatedConditions.join(', ')

  handleInput()
}

const currentCriteria = computed(() => {
  const criteria: SearchCriteria = {}

  for (const [key, value] of Object.entries(searchFields.value)) {
    const conditions = parseMultipleConditions(value)
    if (conditions.length > 0) {
      criteria[key as keyof SearchCriteria] = conditions
    }
  }

  return criteria
})

watch(
  () => searchStore.criteria,
  (newCriteria) => {
    for (const key in searchFields.value) {
      searchFields.value[key as keyof typeof searchFields.value] = ''
    }

    for (const [key, conditions] of Object.entries(newCriteria)) {
      if (conditions && conditions.length > 0) {
        searchFields.value[key as keyof typeof searchFields.value] = conditions.join(', ')
      }
    }
  },
  { deep: true }
)
</script>

<template>
  <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 transition-colors duration-200">
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
      <div class="flex-1">
        <h2 class="text-xl font-semibold text-gray-900 dark:text-white">搜尋欄位</h2>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
          提示：可在同一欄位中使用空格或逗號分隔多個搜尋條件
        </p>
      </div>

      <div class="flex items-center gap-3 shrink-0">
        <SearchHistory />

        <button
          @click="clearAll"
          :disabled="!hasAnyInput"
          class="px-4 py-3 min-h-[44px] rounded-lg font-medium transition-all duration-200 flex items-center gap-2"
          :class="
            hasAnyInput
              ? 'bg-red-500 hover:bg-red-600 text-white shadow-sm hover:shadow'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
          "
          title="清除所有搜尋條件"
        >
          <span class="text-lg">✕</span>
          <span class="hidden sm:inline">清除全部</span>
        </button>
      </div>
    </div>

    <div v-if="filledFieldsCount > 0" class="mb-4 flex items-center gap-2 text-sm">
      <span class="text-gray-600 dark:text-gray-400">
        已填寫 {{ filledFieldsCount }} 個搜尋欄位
      </span>
      <span
        v-if="searchStore.searching"
        class="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400"
      >
        <span
          class="inline-block w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"
        ></span>
        搜尋中...
      </span>
      <span v-else-if="searchStore.hasResults" class="text-green-600 dark:text-green-400">
        找到 {{ searchStore.resultCount.toLocaleString() }} 筆結果
      </span>
      <span v-else-if="searchStore.hasCriteria" class="text-gray-500 dark:text-gray-400">
        查無資料
      </span>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <div v-for="config in fieldConfigs" :key="config.key" class="flex flex-col">
        <label
          :for="config.key"
          class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
        >
          {{ config.label }}
        </label>

        <div class="relative">
          <input
            :id="config.key"
            v-model="searchFields[config.key as keyof typeof searchFields]"
            type="text"
            :placeholder="config.placeholder"
            @input="handleInput"
            class="w-full px-4 py-3 pr-12 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 transition-colors duration-200 min-h-[44px] text-base"
          />

          <button
            v-if="searchFields[config.key as keyof typeof searchFields]"
            @click="clearField(config.key)"
            class="absolute right-1 top-1/2 -translate-y-1/2 p-2 min-w-[44px] min-h-[44px] flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600"
            :title="`清除${config.label}`"
          >
            <span class="text-lg">✕</span>
          </button>
        </div>
      </div>
    </div>

    <div v-if="hasAnyInput" class="mt-4">
      <SearchFilters
        :criteria="currentCriteria"
        @remove-condition="removeCondition"
        @clear-all="clearAll"
      />
    </div>

    <div class="mt-4">
      <PopularSearchTags />
    </div>

    <div
      class="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg"
    >
      <div class="flex items-start gap-2">
        <span class="text-blue-600 dark:text-blue-400 text-lg shrink-0">ℹ️</span>
        <div class="text-sm text-blue-800 dark:text-blue-300">
          <p class="font-medium mb-1">搜尋說明：</p>
          <ul class="list-disc list-inside space-y-1 text-blue-700 dark:text-blue-400">
            <li>在同一欄位輸入多個條件時，使用空格或逗號分隔（例如：ACPTB ACTLA）</li>
            <li>同一欄位的多個條件為「或」關係（符合任一條件即可）</li>
            <li>不同欄位的條件為「且」關係（必須同時符合）</li>
            <li>搜尋不區分大小寫，支援部分匹配</li>
          </ul>
        </div>
      </div>
    </div>
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

input:focus {
  outline: none;
}

input,
button {
  transition-property: all;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 200ms;
}
</style>

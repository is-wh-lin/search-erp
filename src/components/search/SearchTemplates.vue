<template>
  <div class="search-templates">
    <div class="flex items-center justify-between mb-3">
      <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-300">搜尋樣板</h3>
      <button
        v-if="searchStore.hasCriteria && !searchStore.isTemplatesLimitReached"
        @click="showSaveDialog = true"
        class="text-xs px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
        title="儲存當前搜尋條件為樣板"
      >
        儲存樣板
      </button>
    </div>

    <div v-if="searchStore.hasTemplates" class="space-y-2">
      <div
        v-for="template in searchStore.allTemplates"
        :key="template.id"
        class="template-item p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-md transition-shadow"
      >
        <div class="flex items-start justify-between">
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 mb-1">
              <button
                @click="loadTemplate(template.id)"
                class="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline text-left truncate"
                :title="`載入樣板: ${template.name}`"
              >
                {{ template.name }}
              </button>
            </div>

            <div class="text-xs text-gray-500 dark:text-gray-400">
              <span>{{ formatDate(template.createdAt) }}</span>
              <span class="mx-1">•</span>
              <span>{{ getCriteriaCount(template.criteria) }} 個條件</span>
            </div>

            <div class="mt-2 flex flex-wrap gap-1">
              <span
                v-for="(preview, index) in getCriteriaPreview(template.criteria)"
                :key="index"
                class="inline-block px-2 py-0.5 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded"
              >
                {{ preview }}
              </span>
            </div>
          </div>

          <div class="flex items-center gap-1 ml-2">
            <button
              @click="startRename(template)"
              class="p-1.5 text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors"
              title="重新命名"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
            </button>
            <button
              @click="confirmDelete(template)"
              class="p-1.5 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 transition-colors"
              title="刪除"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="text-center py-8 text-gray-500 dark:text-gray-400 text-sm">
      <svg
        class="w-12 h-12 mx-auto mb-2 text-gray-300 dark:text-gray-600"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"
        />
      </svg>
      <p>尚無儲存的搜尋樣板</p>
      <p class="text-xs mt-1">執行搜尋後可儲存為樣板</p>
    </div>

    <div
      v-if="searchStore.isTemplatesLimitReached"
      class="mt-3 text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 p-2 rounded"
    >
      已達到最大樣板數量（10 個），請刪除部分樣板後再新增
    </div>

    <Teleport to="body">
      <div
        v-if="showSaveDialog"
        class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
        @click.self="closeSaveDialog"
      >
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md mx-4">
          <h3 class="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">儲存搜尋樣板</h3>

          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              樣板名稱
            </label>
            <input
              ref="templateNameInput"
              v-model="templateName"
              type="text"
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100"
              placeholder="輸入樣板名稱"
              maxlength="50"
              @keyup.enter="saveNewTemplate"
              @keyup.esc="closeSaveDialog"
            />
            <p v-if="saveError" class="mt-1 text-xs text-red-600 dark:text-red-400">
              {{ saveError }}
            </p>
          </div>

          <div class="flex justify-end gap-2">
            <button
              @click="closeSaveDialog"
              class="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              取消
            </button>
            <button
              @click="saveNewTemplate"
              class="px-4 py-2 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              :disabled="!templateName.trim()"
            >
              儲存
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <Teleport to="body">
      <div
        v-if="showRenameDialog"
        class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
        @click.self="closeRenameDialog"
      >
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md mx-4">
          <h3 class="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">重新命名樣板</h3>

          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              新名稱
            </label>
            <input
              ref="renameInput"
              v-model="newTemplateName"
              type="text"
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100"
              placeholder="輸入新名稱"
              maxlength="50"
              @keyup.enter="saveRename"
              @keyup.esc="closeRenameDialog"
            />
            <p v-if="renameError" class="mt-1 text-xs text-red-600 dark:text-red-400">
              {{ renameError }}
            </p>
          </div>

          <div class="flex justify-end gap-2">
            <button
              @click="closeRenameDialog"
              class="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              取消
            </button>
            <button
              @click="saveRename"
              class="px-4 py-2 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              :disabled="!newTemplateName.trim()"
            >
              儲存
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <Teleport to="body">
      <div
        v-if="showDeleteDialog"
        class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
        @click.self="closeDeleteDialog"
      >
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md mx-4">
          <h3 class="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">確認刪除</h3>

          <p class="text-sm text-gray-600 dark:text-gray-400 mb-6">
            確定要刪除樣板「{{ templateToDelete?.name }}」嗎？此操作無法復原。
          </p>

          <div class="flex justify-end gap-2">
            <button
              @click="closeDeleteDialog"
              class="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              取消
            </button>
            <button
              @click="executeDelete"
              class="px-4 py-2 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
            >
              刪除
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick } from 'vue'
import { useSearchStore } from '../../stores/searchStore'
import type { SearchTemplate, SearchCriteria } from '../../types'

const searchStore = useSearchStore()

const showSaveDialog = ref(false)
const templateName = ref('')
const saveError = ref('')
const templateNameInput = ref<HTMLInputElement | null>(null)

const showRenameDialog = ref(false)
const templateToRename = ref<SearchTemplate | null>(null)
const newTemplateName = ref('')
const renameError = ref('')
const renameInput = ref<HTMLInputElement | null>(null)

const showDeleteDialog = ref(false)
const templateToDelete = ref<SearchTemplate | null>(null)

const fieldLabels: Record<keyof SearchCriteria, string> = {
  fieldNumber: '欄位編號',
  fieldName: '欄位名稱',
  fileCode: '檔案代碼',
  fileName: '檔案名稱',
  dataType: '型態',
  length: '長度',
  fieldDescription: '欄位說明',
  remark: 'Remark',
}

function loadTemplate(templateId: string): void {
  searchStore.loadTemplate(templateId)
}

function closeSaveDialog(): void {
  showSaveDialog.value = false
  templateName.value = ''
  saveError.value = ''
}

function saveNewTemplate(): void {
  if (!templateName.value.trim()) {
    saveError.value = '請輸入樣板名稱'
    return
  }

  const success = searchStore.saveTemplate(templateName.value)

  if (success) {
    closeSaveDialog()
  } else {
    if (searchStore.isTemplatesLimitReached) {
      saveError.value = '已達到最大樣板數量（10 個）'
    } else {
      saveError.value = '樣板名稱已存在或搜尋條件無效'
    }
  }
}

async function startRename(template: SearchTemplate): Promise<void> {
  templateToRename.value = template
  newTemplateName.value = template.name
  showRenameDialog.value = true
  renameError.value = ''
  await nextTick()
  renameInput.value?.focus()
}

function closeRenameDialog(): void {
  showRenameDialog.value = false
  templateToRename.value = null
  newTemplateName.value = ''
  renameError.value = ''
}

function saveRename(): void {
  if (!newTemplateName.value.trim()) {
    renameError.value = '請輸入新名稱'
    return
  }

  if (!templateToRename.value) {
    return
  }

  const success = searchStore.renameTemplate(templateToRename.value.id, newTemplateName.value)

  if (success) {
    closeRenameDialog()
  } else {
    renameError.value = '樣板名稱已存在'
  }
}

function confirmDelete(template: SearchTemplate): void {
  templateToDelete.value = template
  showDeleteDialog.value = true
}

function closeDeleteDialog(): void {
  showDeleteDialog.value = false
  templateToDelete.value = null
}

function executeDelete(): void {
  if (templateToDelete.value) {
    searchStore.deleteTemplate(templateToDelete.value.id)
    closeDeleteDialog()
  }
}

function formatDate(timestamp: number): string {
  const date = new Date(timestamp)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) {
    return '剛才'
  } else if (diffMins < 60) {
    return `${diffMins} 分鐘前`
  } else if (diffHours < 24) {
    return `${diffHours} 小時前`
  } else if (diffDays < 7) {
    return `${diffDays} 天前`
  } else {
    return date.toLocaleDateString('zh-TW', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    })
  }
}

function getCriteriaCount(criteria: SearchCriteria): number {
  return Object.values(criteria).reduce((count, terms) => {
    return count + (terms?.length || 0)
  }, 0)
}

function getCriteriaPreview(criteria: SearchCriteria): string[] {
  const previews: string[] = []

  Object.entries(criteria).forEach(([field, terms]) => {
    if (terms && terms.length > 0) {
      const fieldLabel = fieldLabels[field as keyof SearchCriteria]
      const termsPreview = terms.slice(0, 2).join(', ')
      const moreCount = terms.length > 2 ? ` +${terms.length - 2}` : ''
      previews.push(`${fieldLabel}: ${termsPreview}${moreCount}`)
    }
  })

  return previews.slice(0, 3)
}
</script>

<style scoped>
.search-templates {
  width: 100%;
}

.template-item {
  transition: all 0.2s;
}

.template-item:hover {
  border-color: rgb(147 197 253);
}

.dark .template-item:hover {
  border-color: rgb(37 99 235);
}
</style>

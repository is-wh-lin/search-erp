<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition-opacity duration-200 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition-opacity duration-150 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="isOpen"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
        @click.self="handleCancel"
      >
        <Transition
          enter-active-class="transition-all duration-200 ease-out"
          enter-from-class="opacity-0 scale-95"
          enter-to-class="opacity-100 scale-100"
          leave-active-class="transition-all duration-150 ease-in"
          leave-from-class="opacity-100 scale-100"
          leave-to-class="opacity-0 scale-95"
        >
          <div
            v-if="isOpen"
            class="w-full max-w-md rounded-lg bg-white shadow-xl dark:bg-gray-800"
            role="alertdialog"
            aria-modal="true"
            :aria-labelledby="titleId"
            :aria-describedby="messageId"
          >
            <!-- Header -->
            <div class="border-b border-gray-200 px-6 py-4 dark:border-gray-700">
              <h2 :id="titleId" class="text-lg font-semibold text-gray-900 dark:text-white">
                {{ title }}
              </h2>
            </div>

            <!-- Content -->
            <div class="px-6 py-4">
              <p :id="messageId" class="text-gray-700 dark:text-gray-300">
                {{ message }}
              </p>
            </div>

            <!-- Actions -->
            <div
              class="flex justify-end gap-3 border-t border-gray-200 px-6 py-4 dark:border-gray-700"
            >
              <button
                ref="cancelButtonRef"
                type="button"
                class="min-h-[44px] min-w-[80px] rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                @click="handleCancel"
              >
                {{ cancelText }}
              </button>
              <button
                type="button"
                class="min-h-[44px] min-w-[80px] rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:bg-red-700 dark:hover:bg-red-800"
                @click="handleConfirm"
              >
                {{ confirmText }}
              </button>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'

interface Props {
  isOpen: boolean
  title?: string
  message: string
  confirmText?: string
  cancelText?: string
}

const props = withDefaults(defineProps<Props>(), {
  title: '確認操作',
  confirmText: '確定',
  cancelText: '取消',
})

interface Emits {
  (e: 'confirm'): void
  (e: 'cancel'): void
  (e: 'update:isOpen', value: boolean): void
}

const emit = defineEmits<Emits>()

const cancelButtonRef = ref<HTMLButtonElement>()
const titleId = `confirm-dialog-title-${Math.random().toString(36).substring(2, 11)}`
const messageId = `confirm-dialog-message-${Math.random().toString(36).substring(2, 11)}`

// Focus management
watch(
  () => props.isOpen,
  async (isOpen) => {
    if (isOpen) {
      await nextTick()
      cancelButtonRef.value?.focus()

      // Prevent body scroll while preserving scrollbar space
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth
      document.body.style.overflow = 'hidden'
      if (scrollbarWidth > 0) {
        document.body.style.paddingRight = `${scrollbarWidth}px`
      }
    } else {
      // Restore body scroll
      document.body.style.overflow = ''
      document.body.style.paddingRight = ''
    }
  }
)

function handleConfirm() {
  emit('confirm')
  emit('update:isOpen', false)
}

function handleCancel() {
  emit('cancel')
  emit('update:isOpen', false)
}

// Keyboard handling
function handleKeydown(event: KeyboardEvent) {
  if (!props.isOpen) return

  if (event.key === 'Escape') {
    handleCancel()
  }
}

// Add keyboard listener
if (typeof window !== 'undefined') {
  window.addEventListener('keydown', handleKeydown)
}
</script>

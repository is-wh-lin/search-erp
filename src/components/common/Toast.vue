<script setup lang="ts">
import { computed } from 'vue'

export interface ToastAction {
  label: string
  onClick: () => void
}

export interface ToastProps {
  message: string
  type?: 'success' | 'error' | 'info' | 'warning'
  duration?: number
  action?: ToastAction
}

const props = withDefaults(defineProps<ToastProps>(), {
  type: 'info',
  duration: 3000,
})

const emit = defineEmits<{
  close: []
}>()

const toastClasses = computed(() => {
  const baseClasses = 'flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg'

  switch (props.type) {
    case 'success':
      return `${baseClasses} bg-green-500 text-white`
    case 'error':
      return `${baseClasses} bg-red-500 text-white`
    case 'warning':
      return `${baseClasses} bg-yellow-500 text-white`
    default:
      return `${baseClasses} bg-blue-500 text-white`
  }
})

const icon = computed(() => {
  switch (props.type) {
    case 'success':
      return '✓'
    case 'error':
      return '✕'
    case 'warning':
      return '⚠'
    default:
      return 'ℹ'
  }
})

const handleActionClick = () => {
  if (props.action) {
    props.action.onClick()
    emit('close')
  }
}
</script>

<template>
  <div :class="toastClasses" role="alert">
    <span class="text-xl font-bold">{{ icon }}</span>
    <p class="flex-1 text-sm font-medium">{{ message }}</p>

    <!-- Action button if provided -->
    <button
      v-if="action"
      @click="handleActionClick"
      class="px-3 py-1 text-sm font-semibold bg-white/20 hover:bg-white/30 rounded transition-colors"
      :aria-label="action.label"
    >
      {{ action.label }}
    </button>

    <!-- Close button -->
    <button
      @click="emit('close')"
      class="text-white hover:text-gray-200 transition-colors"
      aria-label="關閉"
    >
      <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
        <path
          fill-rule="evenodd"
          d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
          clip-rule="evenodd"
        />
      </svg>
    </button>
  </div>
</template>

<script setup lang="ts">
export interface ErrorMessageProps {
  title?: string
  message: string
  type?: 'error' | 'warning' | 'info'
  showRetry?: boolean
  fullscreen?: boolean
}

const props = withDefaults(defineProps<ErrorMessageProps>(), {
  title: '發生錯誤',
  type: 'error',
  showRetry: false,
  fullscreen: false,
})

const emit = defineEmits<{
  retry: []
}>()

const typeStyles = {
  error: {
    container: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
    icon: 'text-red-500 dark:text-red-400',
    title: 'text-red-800 dark:text-red-300',
    message: 'text-red-700 dark:text-red-400',
    button: 'bg-red-500 hover:bg-red-600 text-white',
  },
  warning: {
    container: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800',
    icon: 'text-yellow-500 dark:text-yellow-400',
    title: 'text-yellow-800 dark:text-yellow-300',
    message: 'text-yellow-700 dark:text-yellow-400',
    button: 'bg-yellow-500 hover:bg-yellow-600 text-white',
  },
  info: {
    container: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
    icon: 'text-blue-500 dark:text-blue-400',
    title: 'text-blue-800 dark:text-blue-300',
    message: 'text-blue-700 dark:text-blue-400',
    button: 'bg-blue-500 hover:bg-blue-600 text-white',
  },
}

const currentStyles = typeStyles[props.type]

const containerClasses = props.fullscreen
  ? 'fixed inset-0 flex items-center justify-center bg-white/80 dark:bg-gray-900/80 z-50 p-4'
  : ''

const icon = {
  error: '✕',
  warning: '⚠',
  info: 'ℹ',
}
</script>

<template>
  <div :class="containerClasses">
    <div
      :class="[currentStyles.container, 'border rounded-lg p-6 max-w-md w-full']"
      role="alert"
      aria-live="assertive"
    >
      <!-- Icon and Title -->
      <div class="flex items-start gap-3 mb-3">
        <span :class="[currentStyles.icon, 'text-2xl font-bold shrink-0']">
          {{ icon[type] }}
        </span>
        <div class="flex-1">
          <h3 :class="[currentStyles.title, 'text-lg font-semibold mb-1']">
            {{ title }}
          </h3>
          <p :class="[currentStyles.message, 'text-sm']">
            {{ message }}
          </p>
        </div>
      </div>

      <!-- Retry Button -->
      <div v-if="showRetry" class="mt-4 flex justify-end">
        <button
          @click="emit('retry')"
          :class="[
            currentStyles.button,
            'px-4 py-2 rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2',
          ]"
        >
          重試
        </button>
      </div>

      <!-- Slot for custom actions -->
      <div v-if="$slots.actions" class="mt-4">
        <slot name="actions"></slot>
      </div>
    </div>
  </div>
</template>

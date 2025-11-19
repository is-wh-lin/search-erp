<script setup lang="ts">
export interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large'
  message?: string
  fullscreen?: boolean
}

const props = withDefaults(defineProps<LoadingSpinnerProps>(), {
  size: 'medium',
  fullscreen: false,
})

const sizeClasses = {
  small: 'w-6 h-6 border-2',
  medium: 'w-12 h-12 border-3',
  large: 'w-16 h-16 border-4',
}

const containerClasses = props.fullscreen
  ? 'fixed inset-0 flex flex-col items-center justify-center bg-white/80 dark:bg-gray-900/80 z-50'
  : 'flex flex-col items-center justify-center gap-3'
</script>

<template>
  <div :class="containerClasses" role="status" aria-live="polite">
    <!-- Spinner -->
    <div
      :class="[sizeClasses[size], 'border-blue-500 border-t-transparent rounded-full animate-spin']"
      aria-hidden="true"
    ></div>

    <!-- Loading message -->
    <p v-if="message" class="text-sm text-gray-600 dark:text-gray-300 font-medium">
      {{ message }}
    </p>

    <!-- Screen reader text -->
    <span class="sr-only">載入中...</span>
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

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}
</style>

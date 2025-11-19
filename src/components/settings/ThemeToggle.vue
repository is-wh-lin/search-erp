<script setup lang="ts">
import { computed } from 'vue'
import { useSettingsStore } from '../../stores/settingsStore'

// Settings Store
const settingsStore = useSettingsStore()

const currentTheme = computed(() => settingsStore.settings.theme)

const themeIcon = computed(() => (currentTheme.value === 'light' ? '🌙' : '☀️'))

const themeLabel = computed(() => (currentTheme.value === 'light' ? '深色模式' : '淺色模式'))

function toggleTheme() {
  const newTheme = currentTheme.value === 'light' ? 'dark' : 'light'
  settingsStore.updateTheme(newTheme)
}
</script>

<template>
  <button
    @click="toggleTheme"
    class="theme-toggle-button flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-300 ease-in-out group"
    :aria-label="themeLabel"
    :title="themeLabel"
  >
    <span
      class="theme-icon text-xl inline-block transition-transform duration-500 ease-in-out group-hover:rotate-180 group-hover:scale-110"
    >
      {{ themeIcon }}
    </span>

    <span
      class="hidden sm:inline text-sm font-medium text-gray-700 dark:text-gray-200 transition-colors duration-300"
    >
      {{ themeLabel }}
    </span>
  </button>
</template>

<style scoped>
.theme-toggle-button {
  position: relative;
  overflow: hidden;
}

.theme-toggle-button::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  border-radius: 50%;
  background: rgba(59, 130, 246, 0.3);
  transform: translate(-50%, -50%);
  transition:
    width 0.6s,
    height 0.6s;
}

.theme-toggle-button:active::before {
  width: 300px;
  height: 300px;
}

.theme-icon {
  display: inline-block;
  transform-origin: center;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: scale(0.8);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.theme-icon {
  animation: fadeIn 0.3s ease-in-out;
}

.theme-toggle-button:hover {
  box-shadow:
    0 4px 6px -1px rgba(0, 0, 0, 0.1),
    0 2px 4px -1px rgba(0, 0, 0, 0.06);
}

.dark .theme-toggle-button:hover {
  box-shadow:
    0 4px 6px -1px rgba(0, 0, 0, 0.3),
    0 2px 4px -1px rgba(0, 0, 0, 0.2);
}

.theme-toggle-button:focus {
  outline: 2px solid #3b82f6;
  outline-offset: 2px;
}

.theme-toggle-button:focus:not(:focus-visible) {
  outline: none;
}

:root {
  transition:
    background-color 0.3s ease-in-out,
    color 0.3s ease-in-out;
}
</style>

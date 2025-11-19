<script setup lang="ts">
import { ref, watch } from 'vue'
import { useOnlineStatus } from '../../composables/useOnlineStatus'

const { isOnline } = useOnlineStatus()
const showReconnectedMessage = ref(false)
const wasOffline = ref(!isOnline.value)

watch(isOnline, (newValue, oldValue) => {
  if (!oldValue && newValue) {
    showReconnectedMessage.value = true
    wasOffline.value = false

    setTimeout(() => {
      showReconnectedMessage.value = false
    }, 3000)
  } else if (oldValue && !newValue) {
    wasOffline.value = true
    showReconnectedMessage.value = false
  }
})
</script>

<template>
  <Transition name="slide-down">
    <div
      v-if="!isOnline"
      class="fixed top-0 left-0 right-0 z-50 bg-orange-500 text-white px-4 py-3 shadow-lg"
      role="alert"
      aria-live="assertive"
    >
      <div class="max-w-7xl mx-auto flex items-center justify-center gap-3">
        <span class="text-xl">📡</span>
        <span class="font-medium">目前處於離線狀態</span>
        <span class="text-sm opacity-90">- 使用快取資料</span>
      </div>
    </div>
  </Transition>

  <Transition name="slide-down">
    <div
      v-if="showReconnectedMessage"
      class="fixed top-0 left-0 right-0 z-50 bg-green-500 text-white px-4 py-3 shadow-lg"
      role="alert"
      aria-live="polite"
    >
      <div class="max-w-7xl mx-auto flex items-center justify-center gap-3">
        <span class="text-xl">✅</span>
        <span class="font-medium">已重新連線</span>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.slide-down-enter-active,
.slide-down-leave-active {
  transition:
    transform 0.3s ease-out,
    opacity 0.3s ease-out;
}

.slide-down-enter-from {
  transform: translateY(-100%);
  opacity: 0;
}

.slide-down-leave-to {
  transform: translateY(-100%);
  opacity: 0;
}
</style>

<template>
  <div v-if="show" class="splash-screen">
    <div class="splash-content">
      <img src="/icons/icon.svg" alt="ERP查詢系統" class="splash-icon" />
      <h1 class="splash-title">鼎新ERP查詢系統</h1>
      <div class="splash-loader">
        <div class="loader-bar"></div>
      </div>
      <p class="splash-text">載入中...</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

const show = ref(true)

defineExpose({
  hide: () => {
    show.value = false
  },
})

// Auto-hide after 2 seconds as fallback
onMounted(() => {
  setTimeout(() => {
    show.value = false
  }, 2000)
})
</script>

<style scoped>
.splash-screen {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  animation: fadeOut 0.5s ease-out 1.5s forwards;
}

.splash-content {
  text-align: center;
  color: white;
  animation: slideUp 0.6s ease-out;
}

.splash-icon {
  width: 120px;
  height: 120px;
  margin-bottom: 24px;
  animation: scaleIn 0.5s ease-out;
  filter: drop-shadow(0 10px 20px rgba(0, 0, 0, 0.2));
}

.splash-title {
  font-size: 28px;
  font-weight: 700;
  margin-bottom: 32px;
  letter-spacing: 1px;
}

.splash-loader {
  width: 200px;
  height: 4px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 2px;
  margin: 0 auto 16px;
  overflow: hidden;
}

.loader-bar {
  height: 100%;
  background: white;
  border-radius: 2px;
  animation: loading 1.5s ease-in-out infinite;
}

.splash-text {
  font-size: 14px;
  opacity: 0.9;
  margin-top: 8px;
}

@keyframes fadeOut {
  to {
    opacity: 0;
    visibility: hidden;
  }
}

@keyframes slideUp {
  from {
    transform: translateY(30px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

@keyframes scaleIn {
  from {
    transform: scale(0.8);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}

@keyframes loading {
  0% {
    transform: translateX(-100%);
  }
  50% {
    transform: translateX(0);
  }
  100% {
    transform: translateX(100%);
  }
}

/* Mobile optimization */
@media (max-width: 768px) {
  .splash-icon {
    width: 96px;
    height: 96px;
  }

  .splash-title {
    font-size: 24px;
  }

  .splash-loader {
    width: 160px;
  }
}
</style>

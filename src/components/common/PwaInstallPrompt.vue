<template>
  <div v-if="showPrompt" class="pwa-install-prompt">
    <div class="prompt-content">
      <button @click="dismiss" class="close-btn" aria-label="關閉">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>

      <div class="prompt-icon">
        <img src="/icons/icon.svg" alt="App Icon" />
      </div>

      <div class="prompt-text">
        <h3>安裝應用程式</h3>
        <p>將ERP查詢系統加入主畫面，享受更快速的存取體驗</p>
      </div>

      <div class="prompt-actions">
        <button @click="dismiss" class="btn-secondary">稍後再說</button>
        <button @click="install" class="btn-primary">立即安裝</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

const showPrompt = ref(false)
let deferredPrompt: any = null

onMounted(() => {
  // Listen for the beforeinstallprompt event
  window.addEventListener('beforeinstallprompt', (e) => {
    // Prevent the mini-infobar from appearing on mobile
    e.preventDefault()
    // Stash the event so it can be triggered later
    deferredPrompt = e

    // Check if user has dismissed the prompt before
    const dismissed = localStorage.getItem('pwa-install-dismissed')
    const dismissedTime = dismissed ? parseInt(dismissed) : 0
    const daysSinceDismissed = (Date.now() - dismissedTime) / (1000 * 60 * 60 * 24)

    // Show prompt if not dismissed or dismissed more than 7 days ago
    if (!dismissed || daysSinceDismissed > 7) {
      // Show prompt after 3 seconds
      setTimeout(() => {
        showPrompt.value = true
      }, 3000)
    }
  })

  // Listen for successful installation
  window.addEventListener('appinstalled', () => {
    showPrompt.value = false
    deferredPrompt = null
  })
})

const install = async () => {
  if (!deferredPrompt) {
    return
  }

  // Show the install prompt
  deferredPrompt.prompt()

  // Wait for the user to respond to the prompt
  const { outcome } = await deferredPrompt.userChoice

  if (outcome === 'accepted') {
    console.log('User accepted the install prompt')
  }

  // Clear the deferredPrompt
  deferredPrompt = null
  showPrompt.value = false
}

const dismiss = () => {
  showPrompt.value = false
  localStorage.setItem('pwa-install-dismissed', Date.now().toString())
}
</script>

<style scoped>
.pwa-install-prompt {
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 1000;
  animation: slideUp 0.3s ease-out;
  max-width: 90%;
  width: 400px;
}

.prompt-content {
  background: white;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
  position: relative;
}

.close-btn {
  position: absolute;
  top: 12px;
  right: 12px;
  background: none;
  border: none;
  color: #6b7280;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  transition: all 0.2s;
}

.close-btn:hover {
  background: #f3f4f6;
  color: #374151;
}

.prompt-icon {
  width: 64px;
  height: 64px;
  margin: 0 auto 16px;
}

.prompt-icon img {
  width: 100%;
  height: 100%;
  border-radius: 12px;
}

.prompt-text {
  text-align: center;
  margin-bottom: 20px;
}

.prompt-text h3 {
  font-size: 18px;
  font-weight: 600;
  color: #111827;
  margin-bottom: 8px;
}

.prompt-text p {
  font-size: 14px;
  color: #6b7280;
  line-height: 1.5;
}

.prompt-actions {
  display: flex;
  gap: 12px;
}

.btn-secondary,
.btn-primary {
  flex: 1;
  padding: 12px 20px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
}

.btn-secondary {
  background: #f3f4f6;
  color: #374151;
}

.btn-secondary:hover {
  background: #e5e7eb;
}

.btn-primary {
  background: #3b82f6;
  color: white;
}

.btn-primary:hover {
  background: #2563eb;
}

@keyframes slideUp {
  from {
    transform: translateX(-50%) translateY(100px);
    opacity: 0;
  }
  to {
    transform: translateX(-50%) translateY(0);
    opacity: 1;
  }
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
  .prompt-content {
    background: #1f2937;
  }

  .prompt-text h3 {
    color: #f9fafb;
  }

  .prompt-text p {
    color: #9ca3af;
  }

  .btn-secondary {
    background: #374151;
    color: #d1d5db;
  }

  .btn-secondary:hover {
    background: #4b5563;
  }

  .close-btn {
    color: #9ca3af;
  }

  .close-btn:hover {
    background: #374151;
    color: #d1d5db;
  }
}

/* Mobile adjustments */
@media (max-width: 768px) {
  .pwa-install-prompt {
    bottom: 10px;
    width: calc(100% - 20px);
  }

  .prompt-content {
    padding: 16px;
  }

  .prompt-icon {
    width: 56px;
    height: 56px;
  }

  .prompt-text h3 {
    font-size: 16px;
  }

  .prompt-text p {
    font-size: 13px;
  }

  .btn-secondary,
  .btn-primary {
    padding: 10px 16px;
    font-size: 13px;
  }
}
</style>

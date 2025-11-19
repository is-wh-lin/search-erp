import { ref } from 'vue'

export interface ToastAction {
  label: string
  onClick: () => void
}

export interface Toast {
  id: string
  message: string
  type: 'success' | 'error' | 'info' | 'warning'
  duration: number
  action?: ToastAction
}

export interface ToastOptions {
  duration?: number
  action?: ToastAction
}

const toasts = ref<Toast[]>([])

export function useToast() {
  function showToast(
    message: string,
    type: 'success' | 'error' | 'info' | 'warning' = 'info',
    options: ToastOptions = {}
  ): void {
    const { duration = 3000, action } = options
    const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    const toast: Toast = {
      id,
      message,
      type,
      duration,
      action,
    }

    toasts.value.push(toast)

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id)
      }, duration)
    }
  }

  function removeToast(id: string): void {
    const index = toasts.value.findIndex((toast) => toast.id === id)
    if (index !== -1) {
      toasts.value.splice(index, 1)
    }
  }

  function success(message: string, options?: ToastOptions): void {
    showToast(message, 'success', options)
  }

  function error(message: string, options?: ToastOptions): void {
    showToast(message, 'error', options)
  }

  function warning(message: string, options?: ToastOptions): void {
    showToast(message, 'warning', options)
  }

  function info(message: string, options?: ToastOptions): void {
    showToast(message, 'info', options)
  }

  function clearAll(): void {
    toasts.value = []
  }

  return {
    toasts,
    showToast,
    removeToast,
    success,
    error,
    warning,
    info,
    clearAll,
  }
}

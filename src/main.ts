import { createApp } from 'vue'
import { createPinia } from 'pinia'
import './style.css'
import App from './App.vue'
import { registerServiceWorkerWithToast } from './registerServiceWorker'
import { errorHandler, ErrorType } from './utils/errorHandler'
import { useToast } from './composables/useToast'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)

app.config.errorHandler = (err, _instance, info) => {
  const appError = errorHandler.handleError(err, ErrorType.UNKNOWN)

  console.error('Vue Error:', {
    error: appError,
    info,
  })

  const toast = useToast()
  toast.error(appError.userMessage, {
    duration: 5000,
  })
}

if (import.meta.env.DEV) {
  app.config.warnHandler = (msg, _instance, trace) => {
    console.warn('Vue Warning:', msg, trace)
  }
}

window.addEventListener('unhandledrejection', (event) => {
  const appError = errorHandler.handleError(event.reason, ErrorType.UNKNOWN)
  console.error('Unhandled Promise Rejection:', appError)

  const toast = useToast()
  toast.error(appError.userMessage, {
    duration: 5000,
  })

  event.preventDefault()
})

window.addEventListener('error', (event) => {
  const appError = errorHandler.handleError(event.error, ErrorType.UNKNOWN)
  console.error('Global Error:', appError)

  const toast = useToast()
  toast.error(appError.userMessage, {
    duration: 5000,
  })
})

app.mount('#app')

if (import.meta.env.PROD) {
  registerServiceWorkerWithToast()
}

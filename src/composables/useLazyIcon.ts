import { ref, onMounted, type Ref } from 'vue'

export function useLazyIcon(
  _iconName: string,
  options: IntersectionObserverInit = {}
): {
  iconRef: Ref<HTMLElement | null>
  isLoaded: Ref<boolean>
  isVisible: Ref<boolean>
} {
  const iconRef = ref<HTMLElement | null>(null)
  const isLoaded = ref(false)
  const isVisible = ref(false)

  onMounted(() => {
    if (!iconRef.value) return

    const observerOptions: IntersectionObserverInit = {
      root: null,
      rootMargin: '50px',
      threshold: 0.01,
      ...options,
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && !isLoaded.value) {
          isVisible.value = true
          isLoaded.value = true

          observer.unobserve(entry.target)
        }
      })
    }, observerOptions)

    observer.observe(iconRef.value)

    return () => {
      if (iconRef.value) {
        observer.unobserve(iconRef.value)
      }
    }
  })

  return {
    iconRef,
    isLoaded,
    isVisible,
  }
}

export function useLazyImage(
  imageSrc: string,
  placeholderSrc: string = '',
  options: IntersectionObserverInit = {}
): {
  imageRef: Ref<HTMLImageElement | null>
  currentSrc: Ref<string>
  isLoaded: Ref<boolean>
  isLoading: Ref<boolean>
  error: Ref<Error | null>
} {
  const imageRef = ref<HTMLImageElement | null>(null)
  const currentSrc = ref(placeholderSrc)
  const isLoaded = ref(false)
  const isLoading = ref(false)
  const error = ref<Error | null>(null)

  onMounted(() => {
    if (!imageRef.value) return

    const observerOptions: IntersectionObserverInit = {
      root: null,
      rootMargin: '50px',
      threshold: 0.01,
      ...options,
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && !isLoaded.value && !isLoading.value) {
          loadImage()
          observer.unobserve(entry.target)
        }
      })
    }, observerOptions)

    observer.observe(imageRef.value)

    function loadImage() {
      isLoading.value = true
      error.value = null

      const img = new Image()

      img.onload = () => {
        currentSrc.value = imageSrc
        isLoaded.value = true
        isLoading.value = false
      }

      img.onerror = (err) => {
        error.value = new Error('圖片載入失敗')
        isLoading.value = false
        console.error('圖片載入失敗:', imageSrc, err)
      }

      img.src = imageSrc
    }

    return () => {
      if (imageRef.value) {
        observer.unobserve(imageRef.value)
      }
    }
  })

  return {
    imageRef,
    currentSrc,
    isLoaded,
    isLoading,
    error,
  }
}

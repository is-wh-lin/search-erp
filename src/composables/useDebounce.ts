import { ref } from 'vue'

export function useDebounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number = 300
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null

  return (...args: Parameters<T>) => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId)
    }

    timeoutId = setTimeout(() => {
      fn(...args)
      timeoutId = null
    }, delay)
  }
}

export function useDebouncedRef<T extends (...args: any[]) => any>(fn: T, delay: number = 300) {
  const isPending = ref(false)
  let timeoutId: ReturnType<typeof setTimeout> | null = null

  const debouncedFn = (...args: Parameters<T>) => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId)
    }

    isPending.value = true

    timeoutId = setTimeout(() => {
      fn(...args)
      isPending.value = false
      timeoutId = null
    }, delay)
  }

  const cancel = () => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId)
      timeoutId = null
      isPending.value = false
    }
  }

  const flush = (...args: Parameters<T>) => {
    cancel()
    fn(...args)
  }

  return {
    debouncedFn,
    isPending,
    cancel,
    flush,
  }
}

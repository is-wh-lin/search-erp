export function deepEqual(obj1: any, obj2: any): boolean {
  if (obj1 === obj2) return true

  if (obj1 == null || obj2 == null) return false

  if (typeof obj1 !== typeof obj2) return false

  if (Array.isArray(obj1) && Array.isArray(obj2)) {
    if (obj1.length !== obj2.length) return false
    return obj1.every((item, index) => deepEqual(item, obj2[index]))
  }

  if (obj1 instanceof Set && obj2 instanceof Set) {
    if (obj1.size !== obj2.size) return false
    const arr1 = Array.from(obj1)
    const arr2 = Array.from(obj2)
    return arr1.every((item) => arr2.includes(item))
  }

  if (obj1 instanceof Map && obj2 instanceof Map) {
    if (obj1.size !== obj2.size) return false
    for (const [key, value] of obj1) {
      if (!obj2.has(key) || !deepEqual(value, obj2.get(key))) {
        return false
      }
    }
    return true
  }

  if (obj1 instanceof Date && obj2 instanceof Date) {
    return obj1.getTime() === obj2.getTime()
  }

  if (typeof obj1 === 'object' && typeof obj2 === 'object') {
    const keys1 = Object.keys(obj1)
    const keys2 = Object.keys(obj2)

    if (keys1.length !== keys2.length) return false

    return keys1.every((key) => deepEqual(obj1[key], obj2[key]))
  }

  return false
}

export function shallowEqual(obj1: any, obj2: any): boolean {
  if (obj1 === obj2) return true

  if (obj1 == null || obj2 == null) return false

  if (typeof obj1 !== 'object' || typeof obj2 !== 'object') {
    return obj1 === obj2
  }

  const keys1 = Object.keys(obj1)
  const keys2 = Object.keys(obj2)

  if (keys1.length !== keys2.length) return false

  return keys1.every((key) => obj1[key] === obj2[key])
}

export function memoize<T extends (...args: any[]) => any>(
  fn: T,
  options: {
    maxSize?: number
    keyGenerator?: (...args: Parameters<T>) => string
  } = {}
): T {
  const cache = new Map<string, ReturnType<T>>()
  const { maxSize = 100, keyGenerator = (...args) => JSON.stringify(args) } = options

  return ((...args: Parameters<T>): ReturnType<T> => {
    const key = keyGenerator(...args)

    if (cache.has(key)) {
      return cache.get(key)!
    }

    const result = fn(...args)

    cache.set(key, result)

    if (cache.size > maxSize) {
      const firstKey = cache.keys().next().value
      if (firstKey !== undefined) {
        cache.delete(firstKey)
      }
    }

    return result
  }) as T
}

export function throttle<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let lastCall = 0
  let timeoutId: number | null = null

  return (...args: Parameters<T>) => {
    const now = Date.now()

    if (now - lastCall >= delay) {
      lastCall = now
      fn(...args)
    } else {
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
      timeoutId = setTimeout(
        () => {
          lastCall = Date.now()
          fn(...args)
        },
        delay - (now - lastCall)
      ) as unknown as number
    }
  }
}

export class BatchUpdater {
  private pending = new Set<() => void>()
  private rafId: number | null = null

  add(fn: () => void): void {
    this.pending.add(fn)
    this.scheduleFlush()
  }

  private scheduleFlush(): void {
    if (this.rafId !== null) return

    this.rafId = requestAnimationFrame(() => {
      this.flush()
    })
  }

  private flush(): void {
    const updates = Array.from(this.pending)
    this.pending.clear()
    this.rafId = null

    updates.forEach((fn) => {
      try {
        fn()
      } catch (error) {
        console.error('批次更新執行失敗:', error)
      }
    })
  }

  cancel(): void {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId)
      this.rafId = null
    }
    this.pending.clear()
  }
}

export function createBatchUpdater(): BatchUpdater {
  return new BatchUpdater()
}

export function calculateVisibleRange(
  scrollTop: number,
  containerHeight: number,
  itemHeight: number,
  totalItems: number,
  overscan: number = 3
): {
  startIndex: number
  endIndex: number
  offsetY: number
} {
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan)
  const visibleCount = Math.ceil(containerHeight / itemHeight)
  const endIndex = Math.min(totalItems - 1, startIndex + visibleCount + overscan * 2)
  const offsetY = startIndex * itemHeight

  return {
    startIndex,
    endIndex,
    offsetY,
  }
}

export function isElementInViewport(element: HTMLElement): boolean {
  const rect = element.getBoundingClientRect()
  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth)
  )
}

export function requestIdleCallback(
  callback: () => void,
  options: { timeout?: number } = {}
): number {
  if ('requestIdleCallback' in window) {
    return window.requestIdleCallback(callback, options)
  }

  return setTimeout(callback, 1) as unknown as number
}

export function cancelIdleCallback(id: number): void {
  if ('cancelIdleCallback' in window) {
    window.cancelIdleCallback(id)
  } else {
    clearTimeout(id)
  }
}

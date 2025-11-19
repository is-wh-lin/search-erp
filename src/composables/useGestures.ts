import { ref, onMounted, onUnmounted, type Ref } from 'vue'

export type GestureType = 'pullToRefresh' | 'swipe' | 'longPress' | 'pinchZoom'

export type SwipeDirection = 'left' | 'right' | 'up' | 'down'

export interface GestureCallbacks {
  onPullToRefresh?: () => void | Promise<void>
  onSwipeLeft?: () => void
  onSwipeRight?: () => void
  onSwipeUp?: () => void
  onSwipeDown?: () => void
  onLongPress?: (x: number, y: number) => void
  onPinchZoom?: (scale: number) => void
}

export interface GestureOptions {
  pullToRefreshThreshold?: number

  swipeThreshold?: number

  longPressDelay?: number

  pinchZoomThreshold?: number

  enableVisualFeedback?: boolean
}

const DEFAULT_OPTIONS: Required<GestureOptions> = {
  pullToRefreshThreshold: 80,
  swipeThreshold: 50,
  longPressDelay: 500,
  pinchZoomThreshold: 0.1,
  enableVisualFeedback: true,
}

export function useGestures(
  elementRef: Ref<HTMLElement | null>,
  callbacks: GestureCallbacks = {},
  options: GestureOptions = {}
) {
  const config = { ...DEFAULT_OPTIONS, ...options }

  const isRefreshing = ref(false)
  const pullDistance = ref(0)
  const isPulling = ref(false)
  const isLongPressing = ref(false)
  const currentScale = ref(1)

  let touchStartX = 0
  let touchStartY = 0
  let touchStartTime = 0
  let longPressTimer: ReturnType<typeof setTimeout> | null = null
  let initialPinchDistance = 0
  let lastPinchScale = 1

  function getDistance(touch1: Touch, touch2: Touch): number {
    const dx = touch1.clientX - touch2.clientX
    const dy = touch1.clientY - touch2.clientY
    return Math.sqrt(dx * dx + dy * dy)
  }

  function showVisualFeedback(type: GestureType, data?: any) {
    if (!config.enableVisualFeedback) return

    const element = elementRef.value
    if (!element) return

    switch (type) {
      case 'pullToRefresh':
        element.style.transform = `translateY(${Math.min(pullDistance.value, config.pullToRefreshThreshold)}px)`
        element.style.transition = isPulling.value ? 'none' : 'transform 0.3s ease'
        break

      case 'swipe':
        element.style.transition = 'transform 0.2s ease'
        element.style.transform = `translateX(${data === 'left' ? '-10px' : data === 'right' ? '10px' : '0'})`
        setTimeout(() => {
          element.style.transform = 'translateX(0)'
        }, 200)
        break

      case 'longPress':
        element.style.transition = 'transform 0.2s ease'
        element.style.transform = 'scale(0.95)'
        setTimeout(() => {
          element.style.transform = 'scale(1)'
        }, 200)
        break

      case 'pinchZoom':
        element.style.transition = 'transform 0.1s ease'
        break
    }
  }

  function clearVisualFeedback() {
    const element = elementRef.value
    if (!element) return

    element.style.transform = ''
    element.style.transition = ''
  }

  function handleTouchStart(event: TouchEvent) {
    const touch = event.touches[0]
    if (!touch) return

    touchStartX = touch.clientX
    touchStartY = touch.clientY
    touchStartTime = Date.now()

    if (event.touches.length === 2) {
      const touch1 = event.touches[0]
      const touch2 = event.touches[1]
      if (touch1 && touch2) {
        initialPinchDistance = getDistance(touch1, touch2)
        lastPinchScale = currentScale.value
        clearLongPressTimer()
        return
      }
    }

    if (callbacks.onLongPress) {
      longPressTimer = setTimeout(() => {
        isLongPressing.value = true
        showVisualFeedback('longPress')
        callbacks.onLongPress?.(touchStartX, touchStartY)
      }, config.longPressDelay)
    }
  }

  function handleTouchMove(event: TouchEvent) {
    if (event.touches.length === 2 && callbacks.onPinchZoom) {
      const touch1 = event.touches[0]
      const touch2 = event.touches[1]
      if (touch1 && touch2) {
        event.preventDefault()
        const currentDistance = getDistance(touch1, touch2)
        const scale = currentDistance / initialPinchDistance
        const newScale = lastPinchScale * scale

        const clampedScale = Math.max(0.5, Math.min(2, newScale))

        if (Math.abs(clampedScale - currentScale.value) > config.pinchZoomThreshold) {
          currentScale.value = clampedScale
          showVisualFeedback('pinchZoom')
          callbacks.onPinchZoom?.(clampedScale)
        }
      }
      return
    }

    const touch = event.touches[0]
    if (!touch) return

    const deltaX = touch.clientX - touchStartX
    const deltaY = touch.clientY - touchStartY

    if (Math.abs(deltaX) > 10 || Math.abs(deltaY) > 10) {
      clearLongPressTimer()
      isLongPressing.value = false
    }

    if (callbacks.onPullToRefresh && !isRefreshing.value && deltaY > 0 && window.scrollY === 0) {
      event.preventDefault()
      isPulling.value = true
      pullDistance.value = Math.min(deltaY * 0.5, config.pullToRefreshThreshold * 1.5)
      showVisualFeedback('pullToRefresh')
    }
  }

  function handleTouchEnd(event: TouchEvent) {
    clearLongPressTimer()

    if (event.touches.length === 0 && initialPinchDistance > 0) {
      initialPinchDistance = 0
      return
    }

    const touch = event.changedTouches[0]
    if (!touch) return

    const deltaX = touch.clientX - touchStartX
    const deltaY = touch.clientY - touchStartY
    const deltaTime = Date.now() - touchStartTime

    if (isPulling.value && pullDistance.value >= config.pullToRefreshThreshold) {
      isRefreshing.value = true
      const result = callbacks.onPullToRefresh?.()

      if (result instanceof Promise) {
        result.finally(() => {
          isRefreshing.value = false
          isPulling.value = false
          pullDistance.value = 0
          clearVisualFeedback()
        })
      } else {
        setTimeout(() => {
          isRefreshing.value = false
          isPulling.value = false
          pullDistance.value = 0
          clearVisualFeedback()
        }, 500)
      }
    } else {
      isPulling.value = false
      pullDistance.value = 0
      clearVisualFeedback()
    }

    if (deltaTime < 300 && !isLongPressing.value) {
      const absX = Math.abs(deltaX)
      const absY = Math.abs(deltaY)

      if (absX > config.swipeThreshold && absX > absY) {
        if (deltaX > 0) {
          showVisualFeedback('swipe', 'right')
          callbacks.onSwipeRight?.()
        } else {
          showVisualFeedback('swipe', 'left')
          callbacks.onSwipeLeft?.()
        }
      } else if (absY > config.swipeThreshold && absY > absX) {
        if (deltaY > 0) {
          callbacks.onSwipeDown?.()
        } else {
          callbacks.onSwipeUp?.()
        }
      }
    }

    isLongPressing.value = false
  }

  function clearLongPressTimer() {
    if (longPressTimer) {
      clearTimeout(longPressTimer)
      longPressTimer = null
    }
  }

  function bindEvents() {
    const element = elementRef.value
    if (!element) return

    element.addEventListener('touchstart', handleTouchStart, { passive: false })
    element.addEventListener('touchmove', handleTouchMove, { passive: false })
    element.addEventListener('touchend', handleTouchEnd, { passive: false })
    element.addEventListener('touchcancel', handleTouchEnd, { passive: false })
  }

  function unbindEvents() {
    const element = elementRef.value
    if (!element) return

    element.removeEventListener('touchstart', handleTouchStart)
    element.removeEventListener('touchmove', handleTouchMove)
    element.removeEventListener('touchend', handleTouchEnd)
    element.removeEventListener('touchcancel', handleTouchEnd)
  }

  function triggerRefresh() {
    if (callbacks.onPullToRefresh && !isRefreshing.value) {
      isRefreshing.value = true
      const result = callbacks.onPullToRefresh()

      if (result instanceof Promise) {
        result.finally(() => {
          isRefreshing.value = false
        })
      } else {
        setTimeout(() => {
          isRefreshing.value = false
        }, 500)
      }
    }
  }

  function resetZoom() {
    currentScale.value = 1
    lastPinchScale = 1
    if (callbacks.onPinchZoom) {
      callbacks.onPinchZoom(1)
    }
  }

  onMounted(() => {
    bindEvents()
  })

  onUnmounted(() => {
    unbindEvents()
    clearLongPressTimer()
  })

  return {
    isRefreshing,
    pullDistance,
    isPulling,
    isLongPressing,
    currentScale,

    triggerRefresh,
    resetZoom,
    bindEvents,
    unbindEvents,
  }
}

export function usePullToRefresh(
  elementRef: Ref<HTMLElement | null>,
  onRefresh: () => void | Promise<void>,
  options?: GestureOptions
) {
  return useGestures(elementRef, { onPullToRefresh: onRefresh }, options)
}

export function useSwipe(
  elementRef: Ref<HTMLElement | null>,
  callbacks: {
    onSwipeLeft?: () => void
    onSwipeRight?: () => void
    onSwipeUp?: () => void
    onSwipeDown?: () => void
  },
  options?: GestureOptions
) {
  return useGestures(elementRef, callbacks, options)
}

export function useLongPress(
  elementRef: Ref<HTMLElement | null>,
  onLongPress: (x: number, y: number) => void,
  options?: GestureOptions
) {
  return useGestures(elementRef, { onLongPress }, options)
}

export function usePinchZoom(
  elementRef: Ref<HTMLElement | null>,
  onPinchZoom: (scale: number) => void,
  options?: GestureOptions
) {
  return useGestures(elementRef, { onPinchZoom }, options)
}

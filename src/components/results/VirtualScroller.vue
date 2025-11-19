<script setup lang="ts" generic="T">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { throttle } from '../../utils/renderOptimization'

// Props
interface VirtualScrollerProps {
  items: T[]
  itemHeight?: number
  bufferSize?: number
  threshold?: number
}

const props = withDefaults(defineProps<VirtualScrollerProps>(), {
  itemHeight: 80,
  bufferSize: 5,
  threshold: 100,
})

// Emits
const emit = defineEmits<{
  scroll: [scrollTop: number]
}>()

// Refs
const containerRef = ref<HTMLElement | null>(null)
const scrollTop = ref(0)
const containerHeight = ref(0)
const rafId = ref<number | null>(null)

const isVirtualScrollEnabled = computed(() => {
  return props.items.length > props.threshold
})

const startIndex = computed(() => {
  if (!isVirtualScrollEnabled.value) return 0

  const index = Math.floor(scrollTop.value / props.itemHeight) - props.bufferSize
  return Math.max(0, index)
})

const endIndex = computed(() => {
  if (!isVirtualScrollEnabled.value) return props.items.length

  const visibleCount = Math.ceil(containerHeight.value / props.itemHeight)
  const index = startIndex.value + visibleCount + props.bufferSize * 2
  return Math.min(props.items.length, index)
})

const visibleItems = computed(() => {
  if (!isVirtualScrollEnabled.value) {
    return props.items.map((item, index) => ({
      item,
      index,
      offsetTop: 0,
    }))
  }

  return props.items.slice(startIndex.value, endIndex.value).map((item, i) => ({
    item,
    index: startIndex.value + i,
    offsetTop: (startIndex.value + i) * props.itemHeight,
  }))
})

const totalHeight = computed(() => {
  if (!isVirtualScrollEnabled.value) return 'auto'
  return `${props.items.length * props.itemHeight}px`
})

const offsetY = computed(() => {
  if (!isVirtualScrollEnabled.value) return 0
  return startIndex.value * props.itemHeight
})

function handleScroll(event: Event): void {
  const target = event.target as HTMLElement

  if (rafId.value !== null) {
    cancelAnimationFrame(rafId.value)
  }

  rafId.value = requestAnimationFrame(() => {
    scrollTop.value = target.scrollTop
    emit('scroll', scrollTop.value)
    rafId.value = null
  })
}

const throttledHandleScroll = throttle(handleScroll, 16) // ~60fps

function updateContainerHeight(): void {
  if (containerRef.value) {
    containerHeight.value = containerRef.value.clientHeight
  }
}

function scrollToIndex(index: number): void {
  if (!containerRef.value) return

  const targetScrollTop = index * props.itemHeight
  containerRef.value.scrollTop = targetScrollTop
}

function scrollToTop(): void {
  scrollToIndex(0)
}

onMounted(() => {
  updateContainerHeight()

  window.addEventListener('resize', updateContainerHeight)
})

onUnmounted(() => {
  window.removeEventListener('resize', updateContainerHeight)

  if (rafId.value !== null) {
    cancelAnimationFrame(rafId.value)
  }
})

watch(
  () => props.items.length,
  () => {
    scrollTop.value = 0
    if (containerRef.value) {
      containerRef.value.scrollTop = 0
    }
  }
)

defineExpose({
  scrollToIndex,
  scrollToTop,
})
</script>

<template>
  <div ref="containerRef" class="virtual-scroller" @scroll="throttledHandleScroll">
    <div class="virtual-scroller-spacer" :style="{ height: totalHeight }">
      <div
        class="virtual-scroller-content"
        :style="{
          transform: `translateY(${offsetY}px)`,
        }"
      >
        <div
          v-for="{ item, index } in visibleItems"
          :key="index"
          class="virtual-scroller-item"
          :style="{
            height: isVirtualScrollEnabled ? `${itemHeight}px` : 'auto',
          }"
        >
          <slot :item="item" :index="index" />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.virtual-scroller {
  overflow-y: auto;
  overflow-x: hidden;
  height: 100%;
  width: 100%;
  position: relative;
}

.virtual-scroller-spacer {
  position: relative;
  width: 100%;
}

.virtual-scroller-content {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  will-change: transform;
}

.virtual-scroller-item {
  width: 100%;
  overflow: hidden;
}

.virtual-scroller {
  -webkit-overflow-scrolling: touch;
}
</style>

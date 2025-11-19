<script setup lang="ts">
import { computed } from 'vue'
import { useFavoritesStore } from '../../stores/favoritesStore'
import { useToast } from '../../composables/useToast'
import type { FieldRecord } from '../../types'

// Props
interface Props {
  record: FieldRecord
  size?: 'small' | 'medium' | 'large'
}

const props = withDefaults(defineProps<Props>(), {
  size: 'medium',
})

const favoritesStore = useFavoritesStore()

const { success, error } = useToast()

const isFavorite = computed(() => favoritesStore.isFavorite(props.record.id))

const sizeClasses = computed(() => {
  switch (props.size) {
    case 'small':
      return 'w-4 h-4'
    case 'large':
      return 'w-7 h-7'
    case 'medium':
    default:
      return 'w-5 h-5'
  }
})

const buttonSizeClasses = computed(() => {
  switch (props.size) {
    case 'small':
      return 'p-2 min-h-[44px] min-w-[44px]'
    case 'large':
      return 'p-3 min-h-[44px] min-w-[44px]'
    case 'medium':
    default:
      return 'p-2 min-h-[44px] min-w-[44px]'
  }
})

function handleToggleFavorite(): void {
  try {
    const isNowFavorite = favoritesStore.toggleFavorite(props.record)

    if (isNowFavorite) {
      success('已加入最愛')
    } else {
      success('已從最愛移除')
    }
  } catch (err) {
    console.error('切換最愛狀態失敗:', err)
    error('操作失敗，請稍後再試')
  }
}
</script>

<template>
  <button
    @click.stop="handleToggleFavorite"
    :class="[
      buttonSizeClasses,
      'inline-flex items-center justify-center rounded-lg transition-all duration-200',
      'focus:outline-none focus:ring-2 focus:ring-offset-2',
      isFavorite
        ? 'text-yellow-500 hover:text-yellow-600 focus:ring-yellow-500 hover:bg-yellow-50 dark:hover:bg-yellow-900/20'
        : 'text-gray-400 hover:text-yellow-500 focus:ring-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700',
    ]"
    :title="isFavorite ? '從最愛移除' : '加入最愛'"
    :aria-label="isFavorite ? '從最愛移除' : '加入最愛'"
  >
    <svg
      v-if="isFavorite"
      :class="[sizeClasses, 'fill-current']"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
      />
    </svg>

    <svg
      v-else
      :class="[sizeClasses, 'stroke-current']"
      fill="none"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="2"
        d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
      />
    </svg>
  </button>
</template>

<style scoped>
button {
  transform-origin: center;
}

button:active {
  transform: scale(0.9);
}

svg {
  transition: all 0.2s ease-in-out;
}

button:hover svg {
  transform: scale(1.1);
}
</style>

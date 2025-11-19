<script setup lang="ts">
interface SkipLink {
  id: string
  label: string
  target: string
}

const skipLinks: SkipLink[] = [
  { id: 'skip-to-main', label: '跳到主要內容', target: '#main-content' },
  { id: 'skip-to-search', label: '跳到搜尋區域', target: '#search-section' },
  { id: 'skip-to-results', label: '跳到搜尋結果', target: '#results-section' },
]

function handleSkip(target: string) {
  const element = document.querySelector(target)
  if (element) {
    element.scrollIntoView({ behavior: 'smooth', block: 'start' })

    if (element instanceof HTMLElement) {
      element.focus()
    }
  }
}
</script>

<template>
  <div class="skip-links" role="navigation" aria-label="快速導航">
    <a
      v-for="link in skipLinks"
      :key="link.id"
      :href="link.target"
      class="skip-link"
      @click.prevent="handleSkip(link.target)"
    >
      {{ link.label }}
    </a>
  </div>
</template>

<style scoped>
.skip-links {
  position: relative;
  z-index: 100;
}

.skip-link {
  position: absolute;
  top: -100px;
  left: 0;
  background: #2563eb;
  color: white;
  padding: 0.75rem 1.5rem;
  text-decoration: none;
  font-weight: 500;
  border-radius: 0 0 0.5rem 0;
  transition: top 0.3s ease-in-out;
  z-index: 100;
}

.skip-link:focus {
  top: 0;
  outline: 2px solid white;
  outline-offset: 2px;
}

.skip-link:hover {
  background: #1d4ed8;
}
</style>

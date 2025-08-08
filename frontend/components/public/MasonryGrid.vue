<!-- components/public/MasonryGrid.vue -->
<script setup lang="ts">
// ===== DEBUG: 開始載入 MasonryGrid.vue =====
import { computed, onMounted, onUnmounted, ref } from 'vue'
import LoadingSpinner from '~/components/common/LoadingSpinner.vue'
import ContentCard from '~/components/public/ContentCard.vue'

const props = withDefaults(defineProps<Props>(), {
  loading: false,
})

const emit = defineEmits<{
  loadMore: []
}>()

console.log('🔍 [MasonryGrid.vue] Script setup 開始執行')

console.log('🔍 [MasonryGrid.vue] 所有 imports 完成')

const { $gsap } = useNuxtApp()

console.log('🔍 [MasonryGrid.vue] NuxtApp 初始化完成')
console.log('🔍 [MasonryGrid.vue] $gsap 存在:', !!$gsap)

// ===== Props 定義 =====
console.log('🔍 [MasonryGrid.vue] 開始定義 Props')

interface Props {
  items: Array<any>
  loading?: boolean
}

console.log('🔍 [MasonryGrid.vue] Props 接收:', {
  itemsLength: props.items?.length || 0,
  loading: props.loading,
})

// ===== Emits 定義 =====
console.log('🔍 [MasonryGrid.vue] 開始定義 Emits')

console.log('🔍 [MasonryGrid.vue] Emits 定義完成')

// ===== 響應式狀態 =====
console.log('🔍 [MasonryGrid.vue] 開始定義響應式狀態')

const masonryContainer = ref()
const gridContainer = ref()
const sentinel = ref<HTMLElement>()
const modalContent = ref()
const activeFilter = ref('all')
const selectedItem = ref(null)
const loadingMore = ref(false)

console.log('🔍 [MasonryGrid.vue] 響應式狀態定義完成')

// ===== 篩選器選項 =====
console.log('🔍 [MasonryGrid.vue] 開始定義篩選器選項')

const filters = [
  { label: '全部', value: 'all' },
  { label: '文章', value: 'article' },
  { label: '照片', value: 'photo' },
  { label: '影片', value: 'video' },
]

console.log('🔍 [MasonryGrid.vue] 篩選器選項:', filters)

// ===== 計算屬性 =====
console.log('🔍 [MasonryGrid.vue] 開始定義計算屬性')

const filteredItems = computed(() => {
  console.log('🔍 [MasonryGrid.vue] filteredItems computed 執行')
  console.log('🔍 [MasonryGrid.vue] activeFilter:', activeFilter.value)
  console.log(
    '🔍 [MasonryGrid.vue] props.items 長度:',
    props.items?.length || 0,
  )

  if (activeFilter.value === 'all') {
    console.log('🔍 [MasonryGrid.vue] 顯示全部項目')
    return props.items
  }

  const filtered = props.items.filter(
    item => item.type === activeFilter.value,
  )
  console.log('🔍 [MasonryGrid.vue] 篩選後項目數:', filtered.length)
  return filtered
})

console.log('🔍 [MasonryGrid.vue] 計算屬性定義完成')

// ===== 動畫方法 =====
console.log('🔍 [MasonryGrid.vue] 開始定義動畫方法')

function beforeEnter(el: HTMLElement) {
  console.log('🔍 [MasonryGrid.vue] beforeEnter 被呼叫')
  el.style.opacity = '0'
  el.style.transform = 'scale(0.8) translateY(30px)'
}

function enter(el: HTMLElement, done: () => void) {
  console.log('🔍 [MasonryGrid.vue] enter 被呼叫')
  const index = Number.parseInt(el.dataset.index || '0')

  if (process.client && el) {
    setTimeout(() => {
      if (el) {
        el.style.transition = 'opacity 0.6s ease-out'
        el.style.opacity = '1'
      }
      done()
    }, index * 50)
  }
  else {
    console.log('⚠️ [MasonryGrid.vue] 不在 client 端，使用預設動畫')
    if (el) {
      el.style.opacity = '1'
    }
    done()
  }
}

function leave(el: HTMLElement, done: () => void) {
  console.log('🔍 [MasonryGrid.vue] leave 被呼叫')

  if (process.client && el) {
    el.style.transition = 'opacity 0.4s ease-in'
    el.style.opacity = '0'
    setTimeout(done, 400)
  }
  else {
    console.log('⚠️ [MasonryGrid.vue] 不在 client 端，使用預設動畫')
    if (el) {
      el.style.opacity = '0'
    }
    done()
  }
}

console.log('🔍 [MasonryGrid.vue] 動畫方法定義完成')

// ===== 事件處理方法 =====
console.log('🔍 [MasonryGrid.vue] 開始定義事件處理方法')

// 處理項目點擊
function handleItemClick(item: any) {
  console.log('🔍 [MasonryGrid.vue] handleItemClick 被呼叫')
  console.log('🔍 [MasonryGrid.vue] 點擊項目:', {
    type: item.type,
    id: item.id,
    title: item.title,
  })

  selectedItem.value = item

  // 模態框出現動畫
  nextTick(() => {
    if (modalContent.value && process.client) {
      console.log('🔍 [MasonryGrid.vue] 開始模態框出現動畫')
      if (modalContent.value) {
        modalContent.value.style.transition = 'opacity 0.4s ease-out'
        modalContent.value.style.opacity = '1'
      }
    }
    else {
      console.log(
        '⚠️ [MasonryGrid.vue] 模態框動畫跳過（不在 client 端或元素不存在）',
      )
    }
  })
}

// 關閉模態框
function closeModal() {
  console.log('🔍 [MasonryGrid.vue] closeModal 被呼叫')

  if (modalContent.value && process.client) {
    console.log('🔍 [MasonryGrid.vue] 開始模態框關閉動畫')
    if (modalContent.value) {
      modalContent.value.style.transition = 'opacity 0.3s ease-in'
      modalContent.value.style.opacity = '0'
      setTimeout(() => {
        selectedItem.value = null
        console.log('🔍 [MasonryGrid.vue] 模態框關閉完成')
      }, 300)
    }
  }
  else {
    console.log('⚠️ [MasonryGrid.vue] 模態框關閉動畫跳過')
    selectedItem.value = null
  }
}

// 獲取模態框組件
function getModalComponent(type: string) {
  console.log('🔍 [MasonryGrid.vue] getModalComponent 被呼叫，type:', type)

  switch (type) {
    case 'article':
      return 'ArticleDetail'
    case 'photo':
      return 'PhotoDetail'
    case 'video':
      return 'VideoDetail'
    default:
      console.warn('⚠️ [MasonryGrid.vue] 未知的項目類型:', type)
      return 'div'
  }
}

console.log('🔍 [MasonryGrid.vue] 事件處理方法定義完成')

// ===== 生命週期 =====
console.log('🔍 [MasonryGrid.vue] 開始設定生命週期')

onMounted(() => {
  console.log('🔍 [MasonryGrid.vue] onMounted 開始執行')

  // 設置無限滾動
  if (sentinel.value && process.client) {
    console.log('🔍 [MasonryGrid.vue] 設置無限滾動觀察器')

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !loadingMore.value && !props.loading) {
            console.log('🔍 [MasonryGrid.vue] 觸發載入更多')
            loadingMore.value = true
            emit('loadMore')

            // 重置載入狀態
            setTimeout(() => {
              loadingMore.value = false
            }, 1000)
          }
        })
      },
      { threshold: 0.1 },
    )

    observer.observe(sentinel.value)

    // 保存觀察器引用以便清理
    const currentObserver = observer

    onUnmounted(() => {
      console.log('🔍 [MasonryGrid.vue] 清理無限滾動觀察器')
      currentObserver.disconnect()
    })
  }
  else {
    console.log(
      '⚠️ [MasonryGrid.vue] 無限滾動設置跳過（sentinel 不存在或不在 client 端）',
    )
  }

  console.log('🔍 [MasonryGrid.vue] onMounted 執行完成')
})

console.log('🔍 [MasonryGrid.vue] 生命週期設定完成')
console.log('🔍 [MasonryGrid.vue] Script setup 執行完成')
</script>

<template>
  <div ref="masonryContainer" class="relative">
    <!-- 篩選器 -->
    <div
      class="sticky top-0 z-20 bg-black/90 backdrop-blur-md border-b border-gray-800 mb-8 -mx-4 px-4 py-4"
    >
      <div class="flex flex-wrap gap-3 justify-center">
        <button
          v-for="filter in filters"
          :key="filter.value"
          class="px-6 py-2 rounded-full text-sm font-medium transition-all transform" :class="[
            activeFilter === filter.value
              ? 'bg-blue-500 text-white scale-105 shadow-lg shadow-blue-500/25'
              : 'bg-gray-900 text-gray-400 hover:bg-gray-800 hover:text-white hover:scale-105',
          ]"
          @click="activeFilter = filter.value"
        >
          {{ filter.label }}
        </button>
      </div>
    </div>

    <!-- Masonry 網格 -->
    <div ref="gridContainer" class="masonry-grid">
      <TransitionGroup
        name="masonry"
        @before-enter="beforeEnter"
        @enter="enter"
        @leave="leave"
      >
        <div
          v-for="(item, index) in filteredItems"
          :key="`${item.type}-${item.id}`"
          :data-index="index"
          class="masonry-item"
        >
          <ContentCard
            :type="item.type"
            :item="item"
            @click="handleItemClick(item)"
          />
        </div>
      </TransitionGroup>
    </div>

    <!-- 載入更多觸發器 -->
    <div ref="sentinel" class="h-20 flex items-center justify-center">
      <LoadingSpinner v-if="loadingMore" />
    </div>

    <!-- 載入狀態覆蓋層 -->
    <Transition name="fade">
      <div
        v-if="loading"
        class="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center"
      >
        <div class="text-center">
          <LoadingSpinner class="w-16 h-16 mb-4" />
          <p class="text-xl text-gray-300">
            載入中...
          </p>
        </div>
      </div>
    </Transition>

    <!-- 詳情模態框 -->
    <Teleport to="body">
      <Transition name="modal">
        <div
          v-if="selectedItem"
          class="fixed inset-0 bg-black/90 backdrop-blur-md z-50 overflow-y-auto"
        >
          <div class="min-h-screen flex items-center justify-center p-4">
            <div
              ref="modalContent"
              class="bg-gray-900 rounded-xl max-w-4xl w-full overflow-hidden"
            >
              <!-- 關閉按鈕 -->
              <button
                class="absolute top-4 right-4 text-gray-400 hover:text-white z-10"
                @click="closeModal"
              >
                <svg
                  class="w-8 h-8"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>

              <!-- 內容展示 -->
              <component
                :is="getModalComponent(selectedItem.type)"
                :item="selectedItem"
                @close="closeModal"
              />
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
/* Masonry 動畫 */
.masonry-enter-active {
  transition: none;
}

.masonry-leave-active {
  position: absolute;
  transition: none;
}

.masonry-move {
  transition: transform 0.6s ease;
}

/* 模態框動畫 */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

/* 淡入動畫 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* 卡片懸停效果 */
.masonry-item {
  transition: transform 0.3s ease;
}

.masonry-item:hover {
  z-index: 10;
}
</style>

<!-- components/common/PerformanceWidget.vue - 性能監控組件 -->
<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { performanceMonitor } from '~/utils/performance-monitor'

interface Props {
  showDetails?: boolean
  autoReport?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  showDetails: false,
  autoReport: true
})

const metrics = ref<Partial<any>>({})
const isVisible = ref(false)
const reportInterval = ref<NodeJS.Timeout | null>(null)

onMounted(() => {
  if (process.client && props.autoReport) {
    // 延遲獲取指標，確保頁面完全載入
    setTimeout(() => {
      metrics.value = performanceMonitor.getMetrics()
      performanceMonitor.reportMetrics()
    }, 3000)

    // 定期更新指標
    reportInterval.value = setInterval(() => {
      metrics.value = performanceMonitor.getMetrics()
    }, 10000)
  }
})

onUnmounted(() => {
  if (reportInterval.value) {
    clearInterval(reportInterval.value)
  }
})

const formatTime = (ms: number) => {
  if (ms < 1000) return `${Math.round(ms)}ms`
  return `${(ms / 1000).toFixed(2)}s`
}

const getPerformanceGrade = (metric: string, value: number) => {
  switch (metric) {
    case 'loadTime':
      if (value < 2000) return 'A'
      if (value < 3000) return 'B'
      if (value < 5000) return 'C'
      return 'D'
    case 'firstContentfulPaint':
      if (value < 1500) return 'A'
      if (value < 2500) return 'B'
      if (value < 4000) return 'C'
      return 'D'
    case 'largestContentfulPaint':
      if (value < 2500) return 'A'
      if (value < 4000) return 'B'
      if (value < 6000) return 'C'
      return 'D'
    case 'cumulativeLayoutShift':
      if (value < 0.1) return 'A'
      if (value < 0.25) return 'B'
      return 'C'
    default:
      return 'A'
  }
}

const getGradeColor = (grade: string) => {
  switch (grade) {
    case 'A': return 'text-green-500'
    case 'B': return 'text-yellow-500'
    case 'C': return 'text-orange-500'
    case 'D': return 'text-red-500'
    default: return 'text-gray-500'
  }
}
</script>

<template>
  <div v-if="showDetails" class="fixed bottom-4 right-4 z-50">
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 max-w-sm">
      <div class="flex items-center justify-between mb-3">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
          性能監控
        </h3>
        <button
          @click="isVisible = !isVisible"
          class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      <div v-if="isVisible" class="space-y-3">
        <div v-if="metrics.loadTime" class="flex justify-between items-center">
          <span class="text-sm text-gray-600 dark:text-gray-300">載入時間</span>
          <span :class="getGradeColor(getPerformanceGrade('loadTime', metrics.loadTime))">
            {{ formatTime(metrics.loadTime) }}
            <span class="text-xs">({{ getPerformanceGrade('loadTime', metrics.loadTime) }})</span>
          </span>
        </div>

        <div v-if="metrics.firstContentfulPaint" class="flex justify-between items-center">
          <span class="text-sm text-gray-600 dark:text-gray-300">首次內容繪製</span>
          <span :class="getGradeColor(getPerformanceGrade('firstContentfulPaint', metrics.firstContentfulPaint))">
            {{ formatTime(metrics.firstContentfulPaint) }}
            <span class="text-xs">({{ getPerformanceGrade('firstContentfulPaint', metrics.firstContentfulPaint) }})</span>
          </span>
        </div>

        <div v-if="metrics.largestContentfulPaint" class="flex justify-between items-center">
          <span class="text-sm text-gray-600 dark:text-gray-300">最大內容繪製</span>
          <span :class="getGradeColor(getPerformanceGrade('largestContentfulPaint', metrics.largestContentfulPaint))">
            {{ formatTime(metrics.largestContentfulPaint) }}
            <span class="text-xs">({{ getPerformanceGrade('largestContentfulPaint', metrics.largestContentfulPaint) }})</span>
          </span>
        </div>

        <div v-if="metrics.cumulativeLayoutShift !== undefined" class="flex justify-between items-center">
          <span class="text-sm text-gray-600 dark:text-gray-300">累積佈局偏移</span>
          <span :class="getGradeColor(getPerformanceGrade('cumulativeLayoutShift', metrics.cumulativeLayoutShift))">
            {{ metrics.cumulativeLayoutShift.toFixed(3) }}
            <span class="text-xs">({{ getPerformanceGrade('cumulativeLayoutShift', metrics.cumulativeLayoutShift) }})</span>
          </span>
        </div>

        <div v-if="metrics.firstInputDelay" class="flex justify-between items-center">
          <span class="text-sm text-gray-600 dark:text-gray-300">首次輸入延遲</span>
          <span :class="getGradeColor(getPerformanceGrade('firstInputDelay', metrics.firstInputDelay))">
            {{ formatTime(metrics.firstInputDelay) }}
            <span class="text-xs">({{ getPerformanceGrade('firstInputDelay', metrics.firstInputDelay) }})</span>
          </span>
        </div>

        <div class="pt-2 border-t border-gray-200 dark:border-gray-600">
          <p class="text-xs text-gray-500 dark:text-gray-400">
            基於 Core Web Vitals 指標
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 響應式調整 */
@media (max-width: 640px) {
  .fixed {
    bottom: 1rem;
    right: 1rem;
    left: 1rem;
  }
  
  .max-w-sm {
    max-width: none;
  }
}
</style>



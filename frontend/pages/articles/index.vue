<script setup lang="ts">
import { onMounted, ref } from 'vue'
import ArticleSkeleton from '~/components/common/ArticleSkeleton.vue'
import ArticleCard from '~/components/public/ArticleCard.vue'
import { logger } from '~/utils/logger'

const articles = ref([])
const pending = ref(true)
const api = useApi()

onMounted(async () => {
  try {
    logger.log('[articles/index.vue] 開始載入公開文章列表')
    const res = await api.getPublicArticles()
    logger.log('[articles/index.vue] 公開文章列表載入成功', { count: res.data?.length || 0 })
    articles.value = res.data || []
  } catch (error) {
    logger.error('[articles/index.vue] 公開文章列表載入失敗', error)
  } finally {
    pending.value = false
  }
})
</script>

<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
    <div class="max-w-6xl mx-auto px-1 sm:px-4">
      <h1 class="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-6 sm:mb-8">
        文章列表
      </h1>
      
      <ArticleSkeleton v-if="pending" />
      <div v-else-if="articles.length === 0" class="text-center py-12">
        <p class="text-gray-500 dark:text-gray-400">暫無文章</p>
      </div>
      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
        <ArticleCard 
          v-for="article in articles" 
          :key="article.id" 
          :item="article" 
        />
      </div>
    </div>
  </div>
</template>

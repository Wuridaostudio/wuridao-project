<template>
  <div>
    <ArticleSkeleton v-if="pending" />
    <div v-else>
      <!-- 這裡放文章列表內容 -->
      <div v-for="article in articles" :key="article.id">
        <!-- 文章卡片元件或簡易顯示 -->
        <div>{{ article.title }}</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import ArticleSkeleton from '~/components/common/ArticleSkeleton.vue'

const articles = ref([])
const pending = ref(true)

onMounted(async () => {
  try {
    // 請替換為實際 API
    const res = await $fetch('/api/articles')
    articles.value = res
  } finally {
    pending.value = false
  }
})
</script>

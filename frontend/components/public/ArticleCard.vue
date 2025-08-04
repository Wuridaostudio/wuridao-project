<template>
  <article class="card article-card">
    <!-- 這邊放 article 的標記 -->
    <h3>{{ item.title }}</h3>
    <div v-html="sanitizeHtml(stripHtml(item.excerpt))" class="text-gray-600 dark:text-gray-400 line-clamp-3"></div>
  </article>
</template>
<script setup lang="ts">
const props = defineProps<{ item: any }>();
function stripHtml(html: string) {
  if (!html) return '';
  const div = document.createElement('div');
  div.innerHTML = html;
  return div.textContent || div.innerText || '';
}

const sanitizeHtml = (html: string) => {
  // 簡單的 HTML 清理，移除危險標籤
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
    .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '');
};
</script>

<script setup lang="ts">
import type { Photo } from '~/types'

defineProps<{ photo: Photo }>()

// 從 publicId 中提取簡單的 ID
function getSimpleId(id: string | number) {
  if (typeof id === 'string' && id.includes('/')) {
    // 如果是 publicId 格式，取最後一部分
    return id.split('/').pop()
  }
  return id
}
</script>

<template>
  <router-link :to="`/media/${getSimpleId(photo.id)}`" class="block group">
    <div class="relative">
      <img
        :src="photo.url"
        :alt="photo.description"
        class="w-full h-48 object-cover rounded-lg group-hover:opacity-80 transition"
      >
      <div v-if="photo.tags?.length" class="flex gap-1 mt-1 flex-wrap">
        <span
          v-for="tag in photo.tags"
          :key="tag.id"
          class="bg-gray-200 text-gray-700 text-xs px-2 py-0.5 rounded"
        >
          {{ tag.name }}
        </span>
      </div>
      <p v-if="photo.description" class="mt-2 text-sm text-gray-600 truncate">
        {{ photo.description }}
      </p>
    </div>
  </router-link>
</template>

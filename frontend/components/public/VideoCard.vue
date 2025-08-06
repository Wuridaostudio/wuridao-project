<template>
  <router-link :to="`/media/${getSimpleId(video.id)}`" class="block group">
    <div class="relative">
      <video
        :src="video.url"
        class="w-full h-48 object-cover rounded-lg group-hover:opacity-80 transition"
        muted
        loop
        preload="metadata"
      />
      <div v-if="video.tags?.length" class="flex gap-1 mt-1 flex-wrap">
        <span
          v-for="tag in video.tags"
          :key="tag.id"
          class="bg-gray-200 text-gray-700 text-xs px-2 py-0.5 rounded"
        >
          {{ tag.name }}
        </span>
      </div>
      <p v-if="video.description" class="mt-2 text-sm text-gray-600 truncate">
        {{ video.description }}
      </p>
    </div>
  </router-link>
</template>

<script setup lang="ts">
import type { Video } from "~/types";

defineProps<{ video: Video }>();

// 從 publicId 中提取簡單的 ID
const getSimpleId = (id: string | number) => {
  if (typeof id === 'string' && id.includes('/')) {
    // 如果是 publicId 格式，取最後一部分
    return id.split('/').pop();
  }
  return id;
};
</script>

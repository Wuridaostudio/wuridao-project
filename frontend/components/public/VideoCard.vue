<template>
  <router-link :to="`/videos/${video.id}`" class="block group">
    <div class="relative">
      <video
        :src="video.url"
        controls
        class="w-full h-48 object-cover rounded-lg group-hover:opacity-80 transition mb-2"
      />
      <div v-if="video.tags?.length" class="flex gap-1 mb-2 flex-wrap">
        <span
          v-for="tag in video.tags"
          :key="tag.id"
          class="bg-gray-200 text-gray-700 text-xs px-2 py-0.5 rounded"
        >
          {{ tag.name }}
        </span>
      </div>
      <p v-if="video.description" class="text-sm text-gray-600 mb-2">
        {{ video.description }}
      </p>
    </div>
  </router-link>
</template>

<script setup lang="ts">
import type { Video } from "~/types";

defineProps<{ video: Video }>();
</script>

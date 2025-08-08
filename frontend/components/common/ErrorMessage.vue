<!-- components/common/ErrorMessage.vue -->
<script setup lang="ts">
defineProps<{ messages: string[] }>()
</script>

<template>
  <div v-if="messages && messages.length" class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
    <p class="font-medium">
      錯誤
    </p>
    <ul>
      <li v-for="msg in messages" :key="msg" class="text-sm">
        {{ msg }}
      </li>
    </ul>
  </div>
</template>

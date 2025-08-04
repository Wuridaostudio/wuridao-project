<template>
  <div class="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 px-4 animate-pulse">
    <div v-for="i in 8" :key="i" class="bg-gray-800 rounded-xl p-4 flex flex-col items-center">
      <div class="h-32 w-full bg-gray-700 rounded mb-4"></div>
      <div class="h-4 w-3/4 bg-gray-700 rounded mb-2"></div>
      <div class="h-4 w-1/2 bg-gray-700 rounded"></div>
    </div>
  </div>
</template> 
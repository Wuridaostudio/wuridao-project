<template>
  <div
    class="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 px-4 animate-pulse"
  >
    <!-- 主內容骨架 -->
    <article class="md:col-span-3">
      <!-- Hero 圖片骨架 -->
      <div
        class="relative h-[40vh] overflow-hidden rounded-xl mb-8 bg-gray-800"
      >
        <div
          class="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent"
        ></div>
      </div>
      <!-- 標題骨架 -->
      <div class="h-10 bg-gray-700 rounded w-2/3 mb-4"></div>
      <!-- 作者/日期骨架 -->
      <div class="flex gap-4 mb-2">
        <div class="h-4 w-24 bg-gray-700 rounded"></div>
        <div class="h-4 w-16 bg-gray-700 rounded"></div>
      </div>
      <div class="border-b border-gray-700 mb-4"></div>
      <!-- 內文段落骨架 -->
      <div class="space-y-4 mb-12">
        <div class="h-4 bg-gray-700 rounded w-full"></div>
        <div class="h-4 bg-gray-700 rounded w-5/6"></div>
        <div class="h-4 bg-gray-700 rounded w-4/6"></div>
        <div class="h-4 bg-gray-700 rounded w-3/4"></div>
        <div class="h-4 bg-gray-700 rounded w-2/3"></div>
      </div>
      <!-- 分享按鈕骨架 -->
      <div class="flex gap-4 mt-12 pt-8 border-t border-gray-800">
        <div class="h-10 w-24 bg-gray-700 rounded"></div>
        <div class="h-10 w-24 bg-gray-700 rounded"></div>
        <div class="h-10 w-24 bg-gray-700 rounded"></div>
      </div>
      <!-- 相關文章骨架 -->
      <div class="mt-16">
        <div class="h-8 w-32 bg-gray-700 rounded mb-8"></div>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div v-for="i in 3" :key="i" class="card bg-gray-800 rounded-lg p-4">
            <div class="h-32 bg-gray-700 rounded mb-4"></div>
            <div class="h-4 w-3/4 bg-gray-700 rounded mb-2"></div>
            <div class="h-4 w-2/3 bg-gray-700 rounded"></div>
          </div>
        </div>
      </div>
    </article>
    <!-- 側邊欄骨架 -->
    <aside class="md:col-span-1 space-y-6">
      <div class="bg-gray-800 rounded-xl p-6 mb-6 shadow">
        <div class="h-6 w-20 bg-gray-700 rounded mb-4"></div>
        <div class="flex flex-wrap gap-2">
          <div
            v-for="i in 4"
            :key="i"
            class="h-6 w-16 bg-gray-700 rounded-full"
          ></div>
        </div>
      </div>
      <div class="bg-gray-800 rounded-xl p-6 shadow">
        <div class="h-6 w-20 bg-gray-700 rounded mb-4"></div>
        <div class="flex flex-wrap gap-2">
          <div
            v-for="i in 6"
            :key="i"
            class="h-6 w-12 bg-gray-700 rounded-full"
          ></div>
        </div>
      </div>
    </aside>
  </div>
</template>
 
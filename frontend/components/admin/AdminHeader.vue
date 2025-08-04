<!-- components/admin/AdminHeader.vue -->
<template>
  <header class="bg-white shadow-sm border-b">
    <div class="px-6 py-4 flex justify-between items-center">
      <h1 class="text-2xl font-bold text-gray-800">WURIDAO 管理後台</h1>
      <button @click="$emit('logout')" class="btn-secondary">登出</button>
    </div>
  </header>
</template>

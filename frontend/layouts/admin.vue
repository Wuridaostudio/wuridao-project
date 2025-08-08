<!-- layouts/admin.vue -->
<script setup lang="ts">
const authStore = useAuthStore()

async function handleLogout() {
  console.log('[AdminLayout] 執行登出')
  await authStore.logout()
}
</script>

<template>
  <div class="admin-layout">
    <aside class="admin-sidebar">
      <nav class="p-4">
        <ul class="space-y-2">
          <li>
            <NuxtLink to="/admin" class="sidebar-link">
              儀表板
            </NuxtLink>
          </li>
          <li>
            <NuxtLink to="/admin/editarticles" class="sidebar-link">
              文章管理
            </NuxtLink>
          </li>
          <li>
            <NuxtLink to="/admin/editphotos" class="sidebar-link">
              照片管理
            </NuxtLink>
          </li>
          <li>
            <NuxtLink to="/admin/editvideos" class="sidebar-link">
              影片管理
            </NuxtLink>
          </li>
          <li>
            <NuxtLink to="/admin/editcategories" class="sidebar-link">
              分類管理
            </NuxtLink>
          </li>
          <li>
            <NuxtLink to="/admin/edittags" class="sidebar-link">
              標籤管理
            </NuxtLink>
          </li>
          <li>
            <NuxtLink to="/admin/seo" class="sidebar-link">
              SEO/AEO/GEO 優化
            </NuxtLink>
          </li>
          <li>
            <NuxtLink to="/admin/change-password" class="sidebar-link">
              修改密碼
            </NuxtLink>
          </li>
        </ul>
      </nav>
    </aside>

    <div class="admin-main-container">
      <header class="admin-header">
        <div class="flex items-center">
          <h1 class="text-xl font-bold text-gray-800">
            WURIDAO 管理後台
          </h1>
        </div>
        <button class="btn-secondary" @click="handleLogout">
          登出
        </button>
      </header>
      <main class="admin-main">
        <slot />
      </main>
    </div>
  </div>
</template>

<style scoped>
.admin-layout {
  display: flex;
  min-height: 100vh;
}
.admin-main-container {
  flex: 1;
  margin-left: 220px; /* 與 sidebar 寬度一致 */
  display: flex;
  flex-direction: column;
}
.admin-header {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  padding: 1rem;
  background: #fff;
  border-bottom: 1px solid #e2e8f0;
  position: sticky;
  top: 0;
  z-index: 10;
}
.admin-main {
  flex: 1;
  background: #f8fafc;
  padding: 2rem;
}
.btn-primary {
  @apply bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors;
}
.btn-secondary {
  @apply bg-gray-700 text-white px-4 py-2 rounded-lg hover:bg-black transition-colors;
}
</style>

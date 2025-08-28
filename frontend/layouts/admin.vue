<!-- layouts/admin.vue -->
<script setup lang="ts">
import { logger } from '~/utils/logger'

const authStore = useAuthStore()

async function handleLogout() {
  logger.log('[AdminLayout] 執行登出')
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

.admin-sidebar {
  width: 220px;
  background: #18181b;
  color: #fff;
  min-height: 100vh;
  position: fixed;
  top: 0;
  left: 0;
  z-index: 20;
  font-weight: bold;
}

.sidebar-link {
  color: #fff;
  font-weight: bold;
  padding: 12px 32px;
  display: block;
  border-radius: 0 24px 24px 0;
  transition:
    background 0.15s,
    color 0.15s;
  background: transparent;
  margin-left: 4px;
  text-align: center; /* 文字置中 */
}

.sidebar-link.router-link-active {
  background: #2563eb;
  color: #fff;
}

.sidebar-link:hover {
  background: #222;
  color: #fff;
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

<!-- 更新 components/admin/AdminSidebar.vue 加入 SEO 管理連結 -->
<script setup lang="ts">
// 簡化的組件，移除複雜的調試信息
</script>

<template>
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
</template>

<style scoped>
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
}
.sidebar-link.router-link-active {
  background: #2563eb;
  color: #fff;
}
.sidebar-link:hover {
  background: #222;
  color: #fff;
}
</style>

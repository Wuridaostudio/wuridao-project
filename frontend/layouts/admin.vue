<!-- layouts/admin.vue -->
<template>
  <div class="admin-layout">
    <AdminSidebar />
    <div class="admin-main-container">
      <header class="admin-header">
        <div class="flex items-center">
          <!-- You can add a logo or title here if you want -->
        </div>
        <button @click="handleLogout" class="btn-secondary">登出</button>
      </header>
      <main class="admin-main">
        <slot />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import AdminSidebar from "~/components/admin/AdminSidebar.vue";

const authStore = useAuthStore();

const handleLogout = async () => {
  await authStore.logoutUser();
  // Redirect to login page after logout
  const router = useRouter();
  router.push("/admin/login");
};
</script>

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

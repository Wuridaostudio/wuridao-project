<!-- pages/admin/login.vue -->
<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-100">
    <div class="max-w-md w-full">
      <div class="bg-white rounded-lg shadow-lg p-8">
        <h1 class="text-2xl font-bold text-center mb-8">管理員登入</h1>

        <form @submit.prevent="handleLogin" class="space-y-6">
          <div>
            <label
              for="username"
              class="block text-sm font-medium text-gray-700 mb-2"
            >
              帳號
            </label>
            <input
              id="username"
              v-model="credentials.username"
              type="email"
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="admin@wuridao.com"
            />
          </div>

          <div>
            <label
              for="password"
              class="block text-sm font-medium text-gray-700 mb-2"
            >
              密碼
            </label>
            <input
              id="password"
              v-model="credentials.password"
              type="password"
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="請輸入密碼"
            />
          </div>

          <ErrorMessage v-if="authStore.error" :messages="[authStore.error]" />

          <button
            type="submit"
            :disabled="authStore.loading"
            class="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span v-if="!authStore.loading">登入</span>
            <LoadingSpinner v-else />
          </button>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: false,
  middleware: "auth",
});

import ErrorMessage from "~/components/common/ErrorMessage.vue";
import LoadingSpinner from "~/components/common/LoadingSpinner.vue";

const authStore = useAuthStore();
const router = useRouter();

const credentials = reactive({
  username: "",
  password: "",
});

const handleLogin = async () => {
  try {
    const result = await authStore.login(credentials);
    
    if (result && result.access_token) {
      await navigateTo("/admin");
    }
  } catch (error) {
    console.error('[LOGIN PAGE] ❌ Login failed:', error);
    // 錯誤已由 store 處理
  }
};
</script>

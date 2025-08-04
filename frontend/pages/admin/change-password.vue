<!-- pages/admin/change-password.vue -->
<template>
  <div class="max-w-md">
    <h1 class="text-3xl font-bold mb-8">修改密碼</h1>

    <div class="card">
      <form @submit.prevent="handleChangePassword" class="space-y-6">
        <div>
          <label
            for="currentPassword"
            class="block text-sm font-medium text-gray-700 mb-2"
          >
            目前密碼
          </label>
          <input
            id="currentPassword"
            v-model="passwordData.currentPassword"
            type="password"
            required
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div>
          <label
            for="newPassword"
            class="block text-sm font-medium text-gray-700 mb-2"
          >
            新密碼
          </label>
          <input
            id="newPassword"
            v-model="passwordData.newPassword"
            type="password"
            required
            minlength="8"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div>
          <label
            for="confirmPassword"
            class="block text-sm font-medium text-gray-700 mb-2"
          >
            確認新密碼
          </label>
          <input
            id="confirmPassword"
            v-model="confirmPassword"
            type="password"
            required
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <ErrorMessage v-if="error" :message="error" />

        <div
          v-if="success"
          class="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg"
        >
          密碼已成功更新！
        </div>

        <button
          type="submit"
          :disabled="loading"
          class="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span v-if="!loading">更新密碼</span>
          <LoadingSpinner v-else />
        </button>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import LoadingSpinner from "~/components/common/LoadingSpinner.vue";

definePageMeta({
  layout: "admin",
  middleware: "auth",
});

const authStore = useAuthStore();

const passwordData = reactive({
  currentPassword: "",
  newPassword: "",
});
const confirmPassword = ref("");
const loading = ref(false);
const error = ref<string | null>(null);
const success = ref(false);

const handleChangePassword = async () => {
  error.value = null;
  success.value = false;

  if (passwordData.newPassword !== confirmPassword.value) {
    error.value = "新密碼與確認密碼不符";
    return;
  }

  if (passwordData.newPassword.length < 8) {
    error.value = "新密碼至少需要 8 個字元";
    return;
  }

  loading.value = true;

  try {
    await authStore.updatePassword(passwordData);
    success.value = true;

    // Clear form
    passwordData.currentPassword = "";
    passwordData.newPassword = "";
    confirmPassword.value = "";
  } catch (e: any) {
    error.value = e.data?.message || "密碼更新失敗";
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
label {
  color: #fff;
  font-weight: bold;
}
.card {
  background: linear-gradient(135deg, #18181c 0%, #32323a 100%);
}
</style>

<!-- pages/admin/edittags.vue -->
<template>
  <div>
    <div class="flex justify-between items-center mb-8">
      <h1 class="text-3xl font-bold">標籤管理</h1>
      <button @click="showCreateModal = true" class="btn-primary">
        新增標籤
      </button>
    </div>

    <div v-if="loading" class="flex justify-center py-12">
      <LoadingSpinner />
    </div>

    <div v-else-if="tags.length === 0" class="text-center py-12">
      <p class="text-gray-500">暫無標籤</p>
    </div>

    <div v-else class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      <div
        v-for="tag in tags"
        :key="tag.id"
        class="card flex justify-between items-center"
      >
        <span>{{ tag.name }}</span>
        <button
          @click="deleteTag(tag)"
          class="text-red-600 hover:text-red-800 text-sm"
        >
          刪除
        </button>
      </div>
    </div>

    <!-- Create Modal -->
    <div
      v-if="showCreateModal"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
    >
      <div class="bg-white rounded-lg max-w-md w-full">
        <div class="p-6">
          <h2 class="text-2xl font-bold mb-6">新增標籤</h2>

          <form @submit.prevent="createTag" class="space-y-4">
            <div>
              <label for="tag-name" class="block text-sm font-medium text-gray-700 mb-2">
                標籤名稱
              </label>
              <input
                id="tag-name"
                v-model="newTagName"
                type="text"
                required
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary placeholder-black text-black"
                placeholder="輸入標籤名稱"
              />
            </div>

            <ErrorMessage v-if="error" :messages="[error]" />

            <div class="flex gap-4">
              <button
                type="submit"
                :disabled="saving"
                class="btn-primary flex-1"
              >
                {{ saving ? "建立中..." : "建立" }}
              </button>
              <button
                type="button"
                @click="cancelCreate"
                class="btn-secondary flex-1"
              >
                取消
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import ErrorMessage from "~/components/common/ErrorMessage.vue";
import LoadingSpinner from "~/components/common/LoadingSpinner.vue";
import { storeToRefs } from "pinia";
import { useTagsStore } from "~/stores/tags";

definePageMeta({
  layout: "admin",
  middleware: "auth",
});

const tagsStore = useTagsStore();
const { loading, error, tags } = storeToRefs(tagsStore);

const showCreateModal = ref(false);
const newTagName = ref("");
const saving = ref(false);

function toHalfWidth(str: string) {
  return str.replace(/[\uFF01-\uFF5E]/g, ch =>
    String.fromCharCode(ch.charCodeAt(0) - 0xFEE0)
  ).replace(/\u3000/g, ' ');
}

const createTag = async () => {
  let name = newTagName.value.trim();
  name = toHalfWidth(name);
  if (!name) return;
  if (!/^[a-zA-Z0-9\u4e00-\u9fa5_\- ]+$/.test(name)) {
    error.value = "僅允許半形字母、數字、中文、空格、_、-";
    return;
  }
  if (name.length < 2 || name.length > 30) {
    error.value = "標籤名稱需 2~30 字";
    return;
  }
  saving.value = true;
  try {
    await tagsStore.createTag({ name }); // 修正：傳物件而非字串
    cancelCreate();
  } catch (err) {
    // error.value 已由 store 設定
  } finally {
    saving.value = false;
  }
};

const cancelCreate = () => {
  showCreateModal.value = false;
  newTagName.value = "";
};

const deleteTag = async (tag: Tag) => {
  if (confirm(`確定要刪除標籤「${tag.name}」嗎？`)) {
    try {
      await tagsStore.deleteTag(tag.id);
      console.log("[EditTags] 刪除標籤成功", tag.id);
    } catch (err) {
      console.error("[EditTags] 刪除標籤失敗", err);
    }
  }
};

onMounted(async () => {
  await tagsStore.fetchTags();
});
</script>

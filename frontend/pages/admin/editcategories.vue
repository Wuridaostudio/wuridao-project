<!-- pages/admin/editcategories.vue -->
<template>
  <div>
    <div class="flex justify-between items-center mb-8">
      <h1 class="text-3xl font-bold">分類管理</h1>
      <button @click="showCreateModal = true" class="btn-primary">
        新增分類
      </button>
    </div>

    <!-- Category Type Tabs -->
    <div class="mb-6 border-b bg-black text-white rounded-t-lg">
      <nav class="-mb-px flex space-x-8">
        <button
          v-for="type in categoryTypes"
          :key="type.value"
          @click="selectedType = type.value"
          :class="[
            'py-2 px-4 border-b-2 font-medium text-sm transition-all',
            selectedType === type.value
              ? 'border-white text-white bg-black'
              : 'border-transparent text-white bg-transparent hover:bg-gray-800 hover:text-white',
          ]"
        >
          {{ type.label }}
        </button>
      </nav>
    </div>

    <div v-if="fetchLoading" class="flex justify-center py-12">
      <LoadingSpinner />
    </div>

    <div v-else-if="filteredCategories.length === 0" class="text-center py-12">
      <p class="text-gray-500">暫無{{ currentTypeLabel }}分類</p>
    </div>

    <div v-else class="space-y-3">
      <div
        v-for="category in filteredCategories"
        :key="category.id"
        class="card flex justify-between items-center"
      >
        <div>
          <h3 class="font-medium">{{ category.name }}</h3>
          <p class="text-sm text-gray-500">
            類型：{{ getCategoryTypeLabel(category.type) }}
            <span v-if="category.articleCount">｜文章：{{ category.articleCount }}</span>
            <span v-if="category.photoCount">｜照片：{{ category.photoCount }}</span>
            <span v-if="category.videoCount">｜影片：{{ category.videoCount }}</span>
          </p>
        </div>
        <button
          @click="deleteCategory(category)"
          :disabled="category.articleCount > 0 || category.photoCount > 0 || category.videoCount > 0"
          :title="category.articleCount > 0
            ? '分類中尚有文章，無法刪除'
            : category.photoCount > 0
              ? '分類中尚有照片，無法刪除'
              : category.videoCount > 0
                ? '分類中尚有影片，無法刪除'
                : '刪除分類'"
          class="text-red-600 hover:text-red-800 disabled:bg-gray-400 disabled:cursor-not-allowed"
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
          <h2 class="text-2xl font-bold mb-6">新增分類</h2>

          <form @submit.prevent="createCategory" class="space-y-4">
            <div>
              <label for="category-name" class="block text-sm font-medium text-gray-700 mb-2">
                分類名稱
              </label>
              <input
                id="category-name"
                v-model="newCategory.name"
                type="text"
                required
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-black"
                placeholder="輸入分類名稱"
                @focus="console.log('input focus')"
                @input="console.log('input event', $event.target.value)"
              />
            </div>

            <div>
              <label for="category-type" class="block text-sm font-medium text-gray-700 mb-2">
                分類類型
              </label>
              <select
                id="category-type"
                v-model="newCategory.type"
                required
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-black"
              >
                <option value="">請選擇類型</option>
                <option
                  v-for="type in categoryTypes"
                  :key="type.value"
                  :value="type.value"
                >
                  {{ type.label }}
                </option>
              </select>
            </div>

            <ErrorMessage v-if="createError" :message="createError" />

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
import LoadingSpinner from "~/components/common/LoadingSpinner.vue";
import ErrorMessage from "~/components/common/ErrorMessage.vue";
import { storeToRefs } from "pinia";

definePageMeta({
  layout: "admin",
  middleware: "auth",
});

const categoriesStore = useCategoriesStore();
const { fetchLoading, createError, categories } = storeToRefs(categoriesStore);

const categoryTypes = [
  { label: "文章", value: "article" },
  { label: "照片", value: "photo" },
  { label: "影片", value: "video" },
];

const selectedType = ref("all");
const showCreateModal = ref(false);
const newCategory = reactive({
  name: "",
  type: "" as "article" | "photo" | "video" | "",
});
const saving = ref(false);

const filteredCategories = computed(() => {
  if (selectedType.value === "all") {
    return categories.value;
  }
  return categories.value.filter((c) => c.type === selectedType.value);
});

const currentTypeLabel = computed(() => {
  const type = categoryTypes.find((t) => t.value === selectedType.value);
  return type?.label || "全部";
});

const getCategoryTypeLabel = (type: string) => {
  const found = categoryTypes.find((t) => t.value === type);
  return found?.label || type;
};

const createCategory = async () => {
  console.log("[EditCategories] 新增分類開始", newCategory);
  if (!newCategory.name.trim() || !newCategory.type) return;
  saving.value = true;
  try {
    await categoriesStore.createCategory({
      name: newCategory.name.trim(),
      type: newCategory.type as "article" | "photo" | "video",
    });
    console.log("[EditCategories] 新增分類成功");
    cancelCreate();
  } catch (error) {
    console.error("[EditCategories] 新增分類失敗", error);
  } finally {
    saving.value = false;
    console.log("[EditCategories] saving 狀態重設");
  }
};

const cancelCreate = () => {
  console.log("cancelCreate called");
  showCreateModal.value = false;
  newCategory.name = "";
  newCategory.type = "";
};

const deleteCategory = async (category: Category) => {
  if (confirm(`確定要刪除分類「${category.name}」嗎？`)) {
    try {
      await categoriesStore.deleteCategory(category.id);
      console.log("[EditCategories] 刪除分類成功", category.id);
      // 添加成功提示
      const { success } = useToast();
      success(`分類「${category.name}」已刪除`);
    } catch (error) {
      console.error("[EditCategories] 刪除分類失敗", error);
      // 添加錯誤提示
      const { error: showError } = useToast();
      showError(error instanceof Error ? error.message : "刪除分類失敗");
    }
  }
};

onMounted(async () => {
  console.log("editcategories.vue mounted");
  await categoriesStore.fetchCategories();
  console.log("Categories fetched:", categoriesStore.categories);
});
</script>

import { describe, it, expect, vi } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";
import EditPhotos from "../editphotos.vue";

// Mock store
vi.mock("@/stores/media", () => ({
  useMediaStore: () => ({
    loading: false,
    photos: [],
    uploadPhoto: vi.fn().mockResolvedValue(undefined),
    fetchPhotos: vi.fn().mockResolvedValue(undefined),
    deletePhoto: vi.fn().mockResolvedValue(undefined),
  }),
}));
vi.mock("@/stores/categories", () => ({
  useCategoriesStore: () => ({
    categories: [{ id: 1, name: "分類A", type: "photo" }],
    fetchCategories: vi.fn().mockResolvedValue(undefined),
  }),
}));
vi.mock("@/stores/tags", () => ({
  useTagsStore: () => ({
    tags: [{ id: 1, name: "標籤A" }],
    fetchTags: vi.fn().mockResolvedValue(undefined),
  }),
}));

describe("EditPhotos.vue", () => {
  it("should open upload modal when button clicked", async () => {
    const wrapper = mount(EditPhotos);
    expect(wrapper.find('div[role="dialog"]').exists()).toBe(false);
    await wrapper.find("button.btn-primary").trigger("click");
    expect(wrapper.html()).toContain("上傳照片");
  });

  it("should show error if upload without file", async () => {
    const wrapper = mount(EditPhotos);
    await wrapper.find("button.btn-primary").trigger("click");
    await wrapper.find('button[type="submit"]').trigger("click");
    expect(wrapper.html()).toContain("請先選擇檔案再上傳");
  });

  it("should call uploadPhoto when file selected and confirmed", async () => {
    const wrapper = mount(EditPhotos);
    await wrapper.find("button.btn-primary").trigger("click");
    // 模擬選擇檔案
    await wrapper.setData({
      selectedFile: new File(["a"], "test.png", { type: "image/png" }),
    });
    await wrapper.find('button[type="submit"]').trigger("click");
    await flushPromises();
    // 斷言 store 方法被呼叫
    const store = require("@/stores/media").useMediaStore();
    expect(store.uploadPhoto).toHaveBeenCalled();
  });
});

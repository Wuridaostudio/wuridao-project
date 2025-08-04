import { describe, it, expect, vi, beforeEach } from "vitest";
import { mount } from "@vue/test-utils";
import MediaUploader from "../MediaUploader.vue";

// Mock composables
vi.mock("~/composables/useFileValidation", () => ({
  useFileValidation: () => ({
    validateImageFile: vi.fn().mockResolvedValue(null),
    validateVideoFile: vi.fn().mockResolvedValue(null),
  }),
}));

vi.mock("~/composables/useUpload", () => ({
  useUpload: () => ({
    isOnline: { value: true },
  }),
}));

function createFile(name = "test.png", size = 1000, type = "image/png") {
  const file = new File(["a".repeat(size)], name, { type });
  return file;
}

describe("MediaUploader.vue", () => {
  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();
  });

  it("should render and allow file selection", async () => {
    const wrapper = mount(MediaUploader, {
      props: { type: "image" },
    });
    const input = wrapper.find('input[type="file"]');
    const file = createFile();
    await input.setValue(file);
    expect(wrapper.vm.selectedFile).toBeTruthy();
  });

  it("should emit upload event when file is selected", async () => {
    const wrapper = mount(MediaUploader, {
      props: { type: "image" },
    });
    const input = wrapper.find('input[type="file"]');
    const file = createFile();
    await input.setValue(file);
    expect(wrapper.emitted("upload")).toBeTruthy();
    expect(wrapper.emitted("upload")![0]).toEqual([file]);
  });

  it("should handle drag and drop", async () => {
    const wrapper = mount(MediaUploader, {
      props: { type: "image" },
    });
    const file = createFile();
    const dataTransfer = {
      files: [file],
      types: ["Files"],
      getData: vi.fn(),
    };
    await wrapper.trigger("drop", { dataTransfer });
    expect(wrapper.vm.selectedFile).toBeTruthy();
  });

  it("should reject files with invalid characters in filename", async () => {
    const wrapper = mount(MediaUploader, {
      props: { type: "image" },
    });
    const input = wrapper.find('input[type="file"]');
    const file = createFile("test@#$%.png"); // 包含特殊字符
    await input.setValue(file);
    expect(wrapper.vm.selectedFile).toBeFalsy();
    expect(wrapper.vm.errorMsg).toBe(
      "檔案名稱包含不支援的字符，請重新命名後再上傳",
    );
  });

  it("should accept files with Chinese characters in filename", async () => {
    const wrapper = mount(MediaUploader, {
      props: { type: "image" },
    });
    const input = wrapper.find('input[type="file"]');
    const file = createFile("測試圖片.png"); // 中文檔案名稱
    await input.setValue(file);
    expect(wrapper.vm.selectedFile).toBeTruthy();
    expect(wrapper.vm.errorMsg).toBeNull();
  });

  it("should accept files with spaces and hyphens in filename", async () => {
    const wrapper = mount(MediaUploader, {
      props: { type: "image" },
    });
    const input = wrapper.find('input[type="file"]');
    const file = createFile("test-image with spaces.jpg"); // 包含空格和連字符
    await input.setValue(file);
    expect(wrapper.vm.selectedFile).toBeTruthy();
    expect(wrapper.vm.errorMsg).toBeNull();
  });

  it("should show validation error when file validation fails", async () => {
    const { useFileValidation } = await import(
      "~/composables/useFileValidation"
    );
    const mockValidation = useFileValidation as any;
    mockValidation.validateImageFile.mockResolvedValue("檔案太大");

    const wrapper = mount(MediaUploader, {
      props: { type: "image" },
    });
    const input = wrapper.find('input[type="file"]');
    const file = createFile("test.png");
    await input.setValue(file);

    // Wait for async validation
    await wrapper.vm.$nextTick();
    expect(wrapper.vm.validationError).toBe("檔案太大");
    expect(wrapper.vm.selectedFile).toBeFalsy();
  });

  it("should show offline indicator when network is offline", async () => {
    const { useUpload } = await import("~/composables/useUpload");
    const mockUpload = useUpload as any;
    mockUpload.isOnline.value = false;

    const wrapper = mount(MediaUploader, {
      props: { type: "image" },
    });

    expect(wrapper.find(".bg-red-500").exists()).toBe(true);
    expect(wrapper.text()).toContain("離線");
  });

  it("should disable upload when offline", async () => {
    const { useUpload } = await import("~/composables/useUpload");
    const mockUpload = useUpload as any;
    mockUpload.isOnline.value = false;

    const wrapper = mount(MediaUploader, {
      props: { type: "image" },
    });

    const input = wrapper.find('input[type="file"]');
    expect(input.attributes("disabled")).toBeDefined();

    const button = wrapper.find("button");
    expect(button.attributes("disabled")).toBeDefined();
  });

  it("should expose methods for parent components", () => {
    const wrapper = mount(MediaUploader, {
      props: { type: "image" },
    });

    expect(wrapper.vm.setUploadProgress).toBeDefined();
    expect(wrapper.vm.setUploading).toBeDefined();
    expect(wrapper.vm.setError).toBeDefined();
    expect(wrapper.vm.clearFile).toBeDefined();
  });

  it("should handle file preview errors", async () => {
    const wrapper = mount(MediaUploader, {
      props: { type: "image" },
    });

    // Mock FileReader to simulate error
    const originalFileReader = global.FileReader;
    global.FileReader = vi.fn().mockImplementation(() => ({
      readAsDataURL: vi.fn(),
      onerror: null,
      onload: null,
    })) as any;

    const input = wrapper.find('input[type="file"]');
    const file = createFile();
    await input.setValue(file);

    // Simulate FileReader error
    const fileReader = global.FileReader as any;
    fileReader.mock.results[0].value.onerror();

    expect(wrapper.vm.errorMsg).toBe("無法預覽檔案");

    // Restore original FileReader
    global.FileReader = originalFileReader;
  });

  it("should format file size correctly", () => {
    const wrapper = mount(MediaUploader, {
      props: { type: "image" },
    });

    // Test bytes
    wrapper.vm.selectedFile = createFile("test.txt", 500);
    expect(wrapper.vm.formattedSize).toBe("500 bytes");

    // Test KB
    wrapper.vm.selectedFile = createFile("test.txt", 2048);
    expect(wrapper.vm.formattedSize).toBe("2.00 KB");

    // Test MB
    wrapper.vm.selectedFile = createFile("test.txt", 2 * 1024 * 1024);
    expect(wrapper.vm.formattedSize).toBe("2.00 MB");
  });
});

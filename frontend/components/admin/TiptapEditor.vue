<template>
  <ErrorBoundary>
    <div class="tiptap-editor-wrapper">
      <client-only>
        <div v-if="editor">
          <div class="tiptap-editor" ref="editorContainerRef">
            <!-- 增強工具列 -->
            <div class="toolbar">
              <!-- 文字格式 -->
              <div class="toolbar-group">
                <button
                  type="button"
                  @click="editor.chain().focus().toggleBold().run()"
                  :class="{ active: editor.isActive('bold') }"
                  title="粗體 (Ctrl+B)"
                >
                  <b>B</b>
                </button>
                <button
                  type="button"
                  @click="editor.chain().focus().toggleItalic().run()"
                  :class="{ active: editor.isActive('italic') }"
                  title="斜體 (Ctrl+I)"
                >
                  <i>I</i>
                </button>
                <button
                  type="button"
                  @click="editor.chain().focus().toggleUnderline().run()"
                  :class="{ active: editor.isActive('underline') }"
                  title="底線 (Ctrl+U)"
                >
                  <u>U</u>
                </button>
                <button
                  type="button"
                  @click="editor.chain().focus().toggleStrike().run()"
                  :class="{ active: editor.isActive('strike') }"
                  title="刪除線"
                >
                  <s>S</s>
                </button>
              </div>

              <!-- 標題格式 -->
              <div class="toolbar-group">
                <button
                  type="button"
                  @click="editor.chain().focus().toggleHeading({ level: 1 }).run()"
                  :class="{ active: editor.isActive('heading', { level: 1 }) }"
                  title="標題 1"
                >
                  H1
                </button>
                <button
                  type="button"
                  @click="editor.chain().focus().toggleHeading({ level: 2 }).run()"
                  :class="{ active: editor.isActive('heading', { level: 2 }) }"
                  title="標題 2"
                >
                  H2
                </button>
                <button
                  type="button"
                  @click="editor.chain().focus().toggleHeading({ level: 3 }).run()"
                  :class="{ active: editor.isActive('heading', { level: 3 }) }"
                  title="標題 3"
                >
                  H3
                </button>
              </div>

              <!-- 列表 -->
              <div class="toolbar-group">
                <button
                  type="button"
                  @click="editor.chain().focus().toggleBulletList().run()"
                  :class="{ active: editor.isActive('bulletList') }"
                  title="項目符號列表"
                >
                  • List
                </button>
                <button
                  type="button"
                  @click="editor.chain().focus().toggleOrderedList().run()"
                  :class="{ active: editor.isActive('orderedList') }"
                  title="編號列表"
                >
                  1. List
                </button>
              </div>

              <!-- 區塊元素 -->
              <div class="toolbar-group">
                <button
                  type="button"
                  @click="editor.chain().focus().toggleBlockquote().run()"
                  :class="{ active: editor.isActive('blockquote') }"
                  title="引用區塊"
                >
                  ❝
                </button>
                <button
                  type="button"
                  @click="editor.chain().focus().toggleCodeBlock().run()"
                  :class="{ active: editor.isActive('codeBlock') }"
                  title="程式碼區塊"
                >
                  Code
                </button>
                <button
                  type="button"
                  @click="editor.chain().focus().setHorizontalRule().run()"
                  title="分隔線"
                >
                  ─
                </button>
              </div>

              <!-- 對齊 -->
              <div class="toolbar-group">
                <button
                  type="button"
                  @click="editor.chain().focus().setTextAlign('left').run()"
                  :class="{ active: editor.isActive({ textAlign: 'left' }) }"
                  title="靠左對齊"
                >
                  ←
                </button>
                <button
                  type="button"
                  @click="editor.chain().focus().setTextAlign('center').run()"
                  :class="{ active: editor.isActive({ textAlign: 'center' }) }"
                  title="置中對齊"
                >
                  ↔
                </button>
                <button
                  type="button"
                  @click="editor.chain().focus().setTextAlign('right').run()"
                  :class="{ active: editor.isActive({ textAlign: 'right' }) }"
                  title="靠右對齊"
                >
                  →
                </button>
                <button
                  type="button"
                  @click="editor.chain().focus().setTextAlign('justify').run()"
                  :class="{ active: editor.isActive({ textAlign: 'justify' }) }"
                  title="兩端對齊"
                >
                  ⇔
                </button>
              </div>

              <!-- 顏色 -->
              <div class="toolbar-group">
                <button
                  type="button"
                  @click="(event) => openColorPicker('color', event)"
                  title="文字顏色"
                >
                  A 色
                </button>
                <button
                  type="button"
                  @click="(event) => openColorPicker('highlight', event)"
                  title="螢光筆"
                >
                  螢光
                </button>
              </div>

              <!-- 媒體 -->
              <div class="toolbar-group">
                <button type="button" @click="triggerImageUpload" title="插入圖片">
                  🖼️ 圖片
                </button>
                <button type="button" @click="insertImageByUrl" title="插入圖片網址">
                 🌐 圖片網址
                </button>
                <button type="button" @click="insertTable" title="插入表格">
                  📊 表格
                </button>
                <button type="button" @click="setLink" title="插入連結">
                  🔗 連結
                </button>
              </div>

              <!-- 編輯操作 -->
              <div class="toolbar-group">
                <button type="button" @click="editor.chain().focus().undo().run()" title="復原 (Ctrl+Z)">
                  ↺
                </button>
                <button type="button" @click="editor.chain().focus().redo().run()" title="重做 (Ctrl+Y)">
                  ↻
                </button>
              </div>

              <input
                ref="fileInput"
                type="file"
                accept="image/*"
                class="hidden"
                @change="onImageSelected"
              />
            </div>

            <!-- 編輯器內容區域 -->
            <div class="editor-content-wrapper">
              <EditorContent :editor="editor" class="tiptap-content prose" />
              
              <!-- 拖放提示 -->
              <div
                v-if="showDropZone"
                class="drop-zone-overlay"
                @drop="handleDrop"
                @dragover.prevent
                @dragenter.prevent
                @dragleave="hideDropZone"
              >
                <div class="drop-zone-content">
                  <div class="drop-zone-icon">📁</div>
                  <div class="drop-zone-text">拖放圖片到這裡</div>
                </div>
              </div>
            </div>

            <!-- 顏色選擇器彈窗 -->
            <div
              v-if="showColorPicker"
              class="color-picker-popover"
              :style="{
                top: colorPickerPosition.top + 'px',
                left: colorPickerPosition.left + 'px',
              }"
            >
              <input type="color" v-model="colorValue" @change="applyColor" />
              <button type="button" @click="closeColorPicker">取消</button>
            </div>

            <!-- 連結輸入彈窗 -->
            <div v-if="showLinkDialog" class="link-dialog">
              <div class="link-dialog-content">
                <h3>插入連結</h3>
                <input
                  v-model="linkUrl"
                  type="url"
                  placeholder="請輸入網址"
                  class="link-input"
                />
                <input
                  v-model="linkText"
                  type="text"
                  placeholder="連結文字 (可選)"
                  class="link-input"
                />
                <div class="link-dialog-buttons">
                  <button @click="insertLink" class="btn-primary">插入</button>
                  <button @click="closeLinkDialog" class="btn-secondary">取消</button>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div v-else class="text-gray-400 text-center py-8">編輯器初始化中...</div>
      </client-only>
    </div>
  </ErrorBoundary>
</template>

<script setup lang="ts">
import { ref, onBeforeUnmount, watch } from "vue";
import { Editor, EditorContent } from "@tiptap/vue-3";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Table from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import Link from "@tiptap/extension-link";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import Color from "@tiptap/extension-color";
import Highlight from "@tiptap/extension-highlight";
import TextStyle from "@tiptap/extension-text-style";
import { useUpload } from "~/composables/useUpload";
import ErrorBoundary from '~/components/common/ErrorBoundary.vue'

const props = defineProps<{ modelValue: string }>();
const emit = defineEmits(["update:modelValue"]);

const fileInput = ref<HTMLInputElement | null>(null);
const { uploadToCloudinary } = useUpload();

const editor = ref<Editor | null>(null);
const showColorPicker = ref(false);
const colorTarget = ref<"color" | "highlight" | null>(null);
const colorValue = ref("#ff0000");
const colorPickerPosition = ref({ top: 0, left: 0 });
const editorContainerRef = ref<HTMLElement | null>(null);

// 新增狀態
const showDropZone = ref(false);
const showLinkDialog = ref(false);
const linkUrl = ref("");
const linkText = ref("");

if (typeof window !== "undefined") {
  editor.value = new Editor({
    extensions: [
      StarterKit,
      TextStyle,
      Image,
      Table.configure({ resizable: true }),
      TableRow,
      TableCell,
      TableHeader,
      Link,
      Underline,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Color,
      Highlight,
    ],
    content: props.modelValue || "<p></p>",
    onUpdate({ editor }) {
      const content = editor.getHTML();
      emit("update:modelValue", content);
    },
    onCreate({ editor }) {
      // 確保初始內容正確載入
      if (props.modelValue && props.modelValue !== editor.getHTML()) {
        editor.commands.setContent(props.modelValue);
      }
    },
  });
}

// 雙向綁定外部 v-model
watch(
  () => props.modelValue,
  (val) => {
    if (editor.value && val !== editor.value.getHTML()) {
      editor.value.commands.setContent(val || "<p></p>");
    }
  },
  { immediate: true }
);

// 確保編輯器初始化後內容正確載入
watch(
  () => editor.value,
  (newEditor) => {
    if (newEditor && props.modelValue) {
      newEditor.commands.setContent(props.modelValue);
    }
  },
  { immediate: true }
);

// 添加自動儲存功能
let autoSaveTimer: NodeJS.Timeout | null = null;
const autoSave = () => {
  if (autoSaveTimer) {
    clearTimeout(autoSaveTimer);
  }
  autoSaveTimer = setTimeout(() => {
    if (editor.value) {
      const content = editor.value.getHTML();
      emit("update:modelValue", content);
    }
  }, 1000); // 1秒後自動儲存
};

// 移除重複的監聽器，onUpdate 已經在編輯器初始化時設定

// 拖放功能
const handleDrop = async (event: DragEvent) => {
  event.preventDefault();
  showDropZone.value = false;
  
  const files = event.dataTransfer?.files;
  if (files && files.length > 0) {
    const file = files[0];
    if (file.type.startsWith('image/')) {
      await uploadAndInsertImage(file);
    }
  }
};

const hideDropZone = () => {
  showDropZone.value = false;
};

// 表格功能
const insertTable = () => {
  editor.value?.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
};

// 連結功能
const setLink = () => {
  const url = window.prompt('請輸入網址:');
  if (url) {
    editor.value?.chain().focus().setLink({ href: url }).run();
  }
};

const insertLink = () => {
  if (linkUrl.value) {
    editor.value?.chain().focus().setLink({ 
      href: linkUrl.value,
      content: linkText.value || linkUrl.value 
    }).run();
  }
  closeLinkDialog();
};

const closeLinkDialog = () => {
  showLinkDialog.value = false;
  linkUrl.value = "";
  linkText.value = "";
};

function triggerImageUpload() {
  fileInput.value?.click();
}

async function onImageSelected(event: Event) {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (!file) return;
  try {
    const { url } = await uploadToCloudinary(file, "image");
    editor.value?.chain().focus().setImage({ src: url }).run();
  } catch (e) {
    alert("圖片上傳失敗");
  } finally {
    if (fileInput.value) fileInput.value.value = "";
  }
}

function openColorPicker(target: "color" | "highlight", event: MouseEvent) {
  colorTarget.value = target;
  colorValue.value = target === "color" ? "#ff0000" : "#ffff00";
  showColorPicker.value = true;
  const rect = (event.target as HTMLElement).getBoundingClientRect();
  const containerRect = editorContainerRef.value?.getBoundingClientRect();
  if (containerRect) {
    colorPickerPosition.value = {
      top: rect.bottom - containerRect.top + 4,
      left: rect.left - containerRect.left,
    };
  } else {
    colorPickerPosition.value = { top: rect.bottom + 4, left: rect.left };
  }
}

function applyColor() {
  if (colorTarget.value === "color") {
    editor.value?.chain().focus().setColor(colorValue.value).run();
  } else if (colorTarget.value === "highlight") {
    editor.value
      ?.chain()
      .focus()
      .setHighlight({ color: colorValue.value })
      .run();
  }
  showColorPicker.value = false;
}

function closeColorPicker() {
  showColorPicker.value = false;
}

function insertImage(url: string) {
  editor.value?.chain().focus().setImage({ src: url }).run();
}

function insertImageByUrl() {
  if (typeof window !== 'undefined') {
    const url = window.prompt('請輸入圖片網址');
    if (url) {
      insertImage(url);
    }
  }
}

defineExpose({ insertImage });

onBeforeUnmount(() => {
  editor.value?.destroy();
});
</script>

<style scoped>
.tiptap-editor-wrapper {
  @apply w-full;
}

.tiptap-editor {
  @apply border border-gray-300 rounded-lg overflow-hidden;
}

.toolbar {
  @apply flex flex-wrap gap-1 bg-gray-100 border-b border-gray-300;
}

.toolbar-group {
  @apply flex gap-1 border-r border-gray-300 pr-2 mr-2;
}

.toolbar-group:last-child {
  @apply border-r-0 pr-0 mr-0;
}

.toolbar button {
  @apply px-2 py-1 text-sm font-medium text-gray-700 border border-gray-300 rounded hover:bg-gray-50 transition-colors;
}

.toolbar button.active {
  @apply bg-blue-500 text-white border-blue-500;
}

.toolbar button:hover,
.toolbar button:focus {
  @apply bg-gray-200 text-gray-800;
}

.editor-content-wrapper {
  @apply relative;
}

.tiptap-content {
  @apply p-4 min-h-[300px] focus:outline-none;
}

.hidden {
  display: none;
}

.drop-zone-overlay {
  @apply absolute inset-0 bg-blue-500 bg-opacity-20 flex items-center justify-center z-10;
}

.drop-zone-content {
  @apply text-center text-blue-600;
}

.drop-zone-icon {
  @apply text-4xl mb-2;
}

.drop-zone-text {
  @apply text-lg font-medium;
}

.color-picker-popover {
  @apply absolute z-20 top-0 left-0 w-full h-full bg-white border border-gray-300 rounded-lg shadow-lg p-2;
}

.color-picker-popover input[type="color"] {
  @apply w-full h-full p-0 border-none rounded-md cursor-pointer;
}

.color-picker-popover button {
  @apply px-4 py-2 rounded-md text-sm font-medium text-gray-700 border border-gray-300 hover:bg-gray-200;
}

.link-dialog {
  @apply fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50;
}

.link-dialog-content {
  @apply bg-white rounded-lg p-6 w-96;
}

.link-dialog h3 {
  @apply text-lg font-semibold mb-4;
}

.link-input {
  @apply w-full border border-gray-300 rounded px-3 py-2 mb-4;
}

.link-dialog-buttons {
  @apply flex gap-2 justify-end;
}

.btn-primary {
  @apply px-4 py-2 rounded-md bg-blue-600 text-white font-medium hover:bg-blue-700;
}

.btn-secondary {
  @apply px-4 py-2 rounded-md text-gray-800 font-medium border border-gray-300 hover:bg-gray-300;
}
</style> 

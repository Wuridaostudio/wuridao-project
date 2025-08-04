<!-- layouts/default.vue -->
<template>
  <div class="min-h-screen bg-black text-white">
    <!-- 導航列 -->
    <header
      ref="navbar"
      :class="[
        'fixed top-0 left-0 right-0 z-40 transition-all duration-300',
        isScrolled
          ? 'bg-black/90 backdrop-blur-md shadow-lg'
          : 'bg-transparent',
      ]"
    >
      <nav class="flex justify-between items-center w-full px-8 h-20" aria-label="主選單">
        <!-- Logo -->
        <NuxtLink
          to="/"
          aria-label="WURIDAO 首頁"
          class="flex items-center gap-3 group"
          @click="handleHomeClick"
        >
          <div class="relative">
            <div
              class="absolute inset-0 bg-blue-500 blur-xl opacity-50 group-hover:opacity-100 transition-opacity"
            ></div>
            <svg
              class="relative w-14 h-14 text-blue-400"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z"
              />
            </svg>
          </div>
          <span class="text-2xl font-bold gradient-text">WURIDAO</span>
        </NuxtLink>

        <!-- Desktop Navigation -->
        <div class="hidden lg:flex items-center gap-16 text-base">
          <a
            v-for="link in navLinks"
            :key="link.path"
            href="#"
            class="nav-link"
            @click.prevent="() => handleNavClick(link.path, link.label)"
          >
            {{ link.label }}
          </a>
        </div>

        <!-- Mobile Menu Button -->
        <button
          @click="mobileMenuOpen = !mobileMenuOpen"
          class="lg:hidden text-white p-2"
          aria-label="開啟或關閉主選單"
          :aria-expanded="mobileMenuOpen"
        >
          <svg
            class="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              v-if="!mobileMenuOpen"
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M4 6h16M4 12h16M4 18h16"
            />
            <path
              v-else
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </nav>

      <!-- Mobile Menu -->
      <Transition name="mobile-menu">
        <div
          v-if="mobileMenuOpen"
          class="lg:hidden bg-gray-900 border-t border-gray-800"
        >
          <div class="container mx-auto px-4 py-4">
            <div class="flex flex-col gap-4">
              <a
                v-for="link in navLinks"
                :key="link.path"
                href="#"
                class="nav-link-mobile"
                @click.prevent="
                  () => {
                    handleNavClick(link.path, link.label);
                    mobileMenuOpen = false;
                  }
                "
              >
                {{ link.label }}
              </a>
            </div>
          </div>
        </div>
      </Transition>
    </header>

    <!-- Main Content -->
    <main class="pt-20">
      <slot />
    </main>

    <!-- 移除 <BackendStatus /> -->

    <!-- Footer -->
    <footer class="bg-gray-900 border-t border-gray-800 mt-20">
      <div class="container mx-auto px-4 py-12">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-8">
          <!-- 公司資訊 -->
          <div class="col-span-1 md:col-span-2">
            <div class="flex items-center gap-3 mb-4">
              <svg
                class="w-8 h-8 text-blue-400"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z"
                />
              </svg>
              <span class="text-xl font-bold">WURIDAO 智慧家</span>
            </div>
            <p class="text-gray-400 mb-4 max-w-md">
              革新您的智能生活體驗。我們提供最先進的智慧家居解決方案，讓您的生活更加便利、安全、節能。
            </p>
            <div class="flex gap-4">
              <a
                v-for="social in socialLinks"
                :key="social.name"
                :href="social.url"
                target="_blank"
                rel="noopener noreferrer"
                class="text-gray-400 hover:text-white transition-colors"
                :aria-label="social.name"
              >
                <component :is="social.icon" class="w-6 h-6" />
              </a>
            </div>
          </div>

          <!-- 快速連結 -->
          <div>
            <h3 class="font-semibold mb-4">快速連結</h3>
            <ul class="space-y-2">
              <li v-for="link in footerLinks" :key="link.path">
                <NuxtLink
                  v-if="link && link.path && link.label"
                  :to="link.path"
                  class="text-gray-400 hover:text-white transition-colors"
                >
                  {{ link.label }}
                </NuxtLink>
              </li>
            </ul>
          </div>

          <!-- 聯絡資訊 -->
          <div>
            <h3 class="font-semibold mb-4">聯絡我們</h3>
            <ul class="space-y-2 text-gray-400">
              <li class="flex items-center gap-2">
                <svg
                  class="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                台中市大墩七街112號
              </li>
              <li class="flex items-center gap-2">
                <svg
                  class="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
                wuridaostudio@gmail.com
              </li>
            </ul>
          </div>
        </div>

        <!-- 版權資訊 -->
        <div
          class="mt-12 pt-8 border-t border-gray-800 text-center text-gray-400 text-sm"
        >
          <p>&copy; {{ currentYear }} WURIDAO 智慧家. All rights reserved.</p>
        </div>
      </div>
    </footer>

    <!-- 回到頂部按鈕 -->
    <Transition name="fade">
      <button
        v-if="showScrollTop"
        @click="scrollToTop"
        class="fixed bottom-8 right-8 bg-blue-500 hover:bg-blue-600 text-white p-4 rounded-full shadow-lg transition-all transform hover:scale-110 z-30"
        aria-label="回到頂部"
      >
        <svg
          class="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M5 10l7-7m0 0l7 7m-7-7v18"
          />
        </svg>
      </button>
    </Transition>
  </div>
</template>

<script setup lang="ts">
// 導航連結 - 定義在最前面確保 SSR 可用
const navLinks: Array<{ path: string; label: string }> = [
  { path: "/", label: "首頁" },
  { path: "/articles/news", label: "最新消息" },
  { path: "/about", label: "關於我們" },
];

// 頁腳連結 - 定義在最前面確保 SSR 可用
const footerLinks: Array<{ path: string; label: string }> = [
  { path: "/", label: "首頁" },
  { path: "/articles/news", label: "最新消息" },
  { path: "/about", label: "關於我們" },
];

// 確保數組始終可用
if (!navLinks || !Array.isArray(navLinks)) {
  console.error("navLinks is not properly defined");
}
if (!footerLinks || !Array.isArray(footerLinks)) {
  console.error("footerLinks is not properly defined");
}

import FacebookIcon from "@/components/icons/FacebookIcon.vue";
import InstagramIcon from "@/components/icons/InstagramIcon.vue";
import YouTubeIcon from "@/components/icons/YouTubeIcon.vue";
// 移除 import BackendStatus from "@/components/common/BackendStatus.vue";
import { useRouter, useRoute } from "vue-router";
import { ref, onMounted, onUnmounted, watch } from "vue";
import { useNuxtApp } from "#app";

const { $gsap } = useNuxtApp();
const router = useRouter();
const route = useRoute();

// 狀態
const navbar = ref();
const isScrolled = ref(false);
const showScrollTop = ref(false);
const mobileMenuOpen = ref(false);
const currentYear = new Date().getFullYear();

// 計算屬性確保數組始終可用
// const safeNavLinks = computed(() => navLinks || [])
// const safeFooterLinks = computed(() => footerLinks || [])

console.log("navLinks:", navLinks);
console.log("footerLinks:", footerLinks);

// 社群連結
const socialLinks = [
  { name: "Facebook", url: "https://facebook.com/wuridao", icon: FacebookIcon },
  {
    name: "Instagram",
    url: "https://instagram.com/wuridao",
    icon: InstagramIcon,
  },
  { name: "YouTube", url: "https://youtube.com/wuridao", icon: YouTubeIcon },
];

// 滾動處理
const handleScroll = () => {
  if (process.client) {
    isScrolled.value = window.scrollY > 50;
    showScrollTop.value = window.scrollY > 300;
  }
};

const scrollToTop = () => {
  if (process.client) {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
};

const handleHomeClick = (e) => {
  if (route.path === "/") {
    e.preventDefault();
    router.replace("/");
  }
};

function handleNavClick(path: string, label: string) {
  console.log("[NavClick] 點擊連結:", label, "path:", path);
  if (route.path === path) {
    console.log("[NavClick] 已在該頁，不跳轉");
    return;
  }
  router
    .push(path)
    .then(() => {
      console.log(
        "[NavClick] router.push 完成，當前路由:",
        router.currentRoute.value.fullPath,
      );
    })
    .catch((err) => {
      console.error("[NavClick] router.push 發生錯誤:", err);
    });
}

watch(
  () => route.fullPath,
  () => {
    mobileMenuOpen.value = false;
  },
);

// 生命週期
onMounted(() => {
  if (process.client) {
    window.addEventListener("scroll", handleScroll);
  }

  // 導航列出現動畫
  if (navbar.value) {
    try {
      navbar.value.style.transition = 'opacity 1s ease-out';
      navbar.value.style.opacity = '1';
    } catch (error) {
      console.error("Animation error:", error);
    }
  }
});

onUnmounted(() => {
  if (process.client) {
    window.removeEventListener("scroll", handleScroll);
  }
});
</script>

<style scoped>
/* 導航連結樣式 */
.nav-link {
  @apply relative text-gray-300 hover:text-white transition-colors py-2;
}

.nav-link::after {
  content: "";
  @apply absolute bottom-0 left-0 w-0 h-0.5 bg-blue-400 transition-all duration-300;
}

.nav-link:hover::after,
.nav-link.router-link-active::after {
  @apply w-full;
}

.nav-link.router-link-active {
  @apply text-white;
}

/* 手機導航連結 */
.nav-link-mobile {
  @apply block py-2 text-gray-300 hover:text-white transition-colors;
}

.nav-link-mobile.router-link-active {
  @apply text-blue-400;
}

/* 手機選單動畫 */
.mobile-menu-enter-active,
.mobile-menu-leave-active {
  transition: all 0.3s ease;
}

.mobile-menu-enter-from {
  opacity: 0;
  transform: translateY(-10px);
}

.mobile-menu-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

/* 淡入動畫 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>

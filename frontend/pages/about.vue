<script setup lang="ts">
import TextType from '../components/common/TextType.vue'
</script>

<template>
  <section class="about-us-section py-12 md:py-20 bg-black min-h-[60vh]">
    <div class="max-w-2xl mx-auto px-4 md:px-6 lg:px-8">
      <TextType
        :text="[
          'WURIDAO智慧家',
          '專注於創新家居改善，\n結合現代科技與人性設計，\n為每個家庭帶來更安全、舒適、節能的智慧生活體驗。',
          '2020 開始使用AMAZON 智慧家庭',
          '2021 使用TUYA SMART+小米生態',
          '2022 將TUYA整合小度音箱',
          '2023 開始使用HomeKit+GOOGLE HOME',
          '截至2025年 規劃過超過100個智慧家庭系統\n落地超過50個家庭',
        ]"
        as="h1"
        :class-name="'text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold mb-4 sm:mb-6 md:mb-8 tracking-tight text-white leading-relaxed md:leading-loose max-w-full'"
        :typing-speed="75"
        :pause-duration="1500"
        :show-cursor="true"
        cursor-character="|"
      />
      <div class="border-t border-gray-700 my-6 md:my-8" />
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 text-center">
        <div class="px-2">
          <h2 class="text-lg md:text-xl font-semibold mb-2 text-white">
            緣起
          </h2>
          <p class="text-sm md:text-base text-gray-400 leading-relaxed">
            只是因為懶得動手
          </p>
        </div>
        <div class="px-2">
          <h2 class="text-lg md:text-xl font-semibold mb-2 text-white">
            願景
          </h2>
          <p class="text-sm md:text-base text-gray-400 leading-relaxed">
            傾聽客戶痛點一起解決的整合規畫
          </p>
        </div>
        <div class="px-2">
          <h2 class="text-lg md:text-xl font-semibold mb-2 text-white">
            核心價值
          </h2>
          <p class="text-sm md:text-base text-gray-400 leading-relaxed">
            隱私至上、專業、不受限品牌、裝潢3.0革命
          </p>
        </div>
      </div>
      <div class="border-t border-gray-700 my-6 md:my-8" />
      <p class="text-xs md:text-sm text-gray-500 text-center">
        &copy; 2025 WURIDAOSTUDIO — 保留所有權利。
      </p>
    </div>
  </section>
</template>

<style scoped>
.about-us-section :deep(.text-type-container) {
  line-height: 1.8;
  word-spacing: 0.15em;
  letter-spacing: 0.02em;
}

.about-us-section :deep(.text-type-container span) {
  white-space: pre-line;
  line-height: 2.0;
  display: block;
}

@media (max-width: 768px) {
  .about-us-section :deep(.text-type-container) {
    line-height: 1.6;
    word-spacing: 0.1em;
  }

  .about-us-section :deep(.text-type-container span) {
    line-height: 1.8;
  }
}
</style>

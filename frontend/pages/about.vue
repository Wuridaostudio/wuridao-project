 <script setup lang="ts">
import TextType from '~/components/common/TextType.vue'
</script>

<template>
  <section class="about-us-section py-20 bg-black min-h-[60vh]">
    <div class="max-w-2xl mx-auto px-4">
      <TextType
        :text="[
          'WURIDAO智慧家',
          '專注於創新家居改善，結合現代科技與人性設計，為每個家庭帶來更安全、舒適、節能的智慧生活體驗。',
          '2020 開始使用AMAZON 智慧家庭',
          '2021 使用TUYA SMART+小米生態',
          '2022 將TUYA整合小度音箱',
          '2023 開始使用HomeKit+GOOGLE HOME',
          '截至2025年 規劃過超過100個智慧家庭系統 落地超過50個家庭'
        ]"
        as="h1"
        className="text-5xl font-extrabold mb-8 tracking-tight text-white"
        :typingSpeed="75"
        :pauseDuration="1500"
        :showCursor="true"
        cursorCharacter="|"
      />
      <div class="border-t border-gray-700 my-8"></div>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
        <div>
          <h2 class="text-xl font-semibold mb-2 text-white">緣起</h2>
          <p class="text-gray-400">只是因為懶得動手</p>
        </div>
        <div>
          <h2 class="text-xl font-semibold mb-2 text-white">願景</h2>
          <p class="text-gray-400">傾聽客戶痛點一起解決的整合規畫</p>
        </div>
        <div>
          <h2 class="text-xl font-semibold mb-2 text-white">核心價值</h2>
          <p class="text-gray-400">隱私至上、專業、不受限品牌、裝潢3.0革命</p>
        </div>
      </div>
      <div class="border-t border-gray-700 my-8"></div>
      <p class="text-sm text-gray-500 text-center">
        &copy; 2025 WURIDAOSTUDIO — 保留所有權利。
      </p>
    </div>
  </section>
</template> 
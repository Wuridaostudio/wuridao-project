<script setup>
import { onMounted, ref } from 'vue'

const images = [
  'https://res.cloudinary.com/dg17dovan/image/upload/v1750927580/wuridao%E6%99%BA%E6%85%A7%E9%9C%80%E6%B1%82%E8%A1%A8_hmjgco.png',
  'https://res.cloudinary.com/dg17dovan/image/upload/v1750984379/20250626_1718_%E6%9D%B1%E6%96%B9%E9%9D%A2%E5%AD%94%E7%94%B7%E5%AD%90_remix_01jynrc0xef8wv8bdbpd03sq28_1_kmmyez.png',
]
const link = 'https://76a8vw1q07o.typeform.com/to/nERCiK95'
const currentIndex = ref(0)
const isTransitioning = ref(false)
const rippleCanvas = ref(null)
let intervalId = null

function playRipple(nextIndex) {
  const canvas = rippleCanvas.value
  if (!canvas)
    return
  const ctx = canvas.getContext('2d')
  const w = (canvas.width = canvas.offsetWidth)
  const h = (canvas.height = canvas.offsetHeight)
  let radius = 0
  const maxRadius = Math.sqrt(w * w + h * h)
  ctx.clearRect(0, 0, w, h)
  function draw() {
    ctx.clearRect(0, 0, w, h)
    ctx.save()
    ctx.beginPath()
    ctx.arc(w / 2, h / 2, radius, 0, 2 * Math.PI)
    ctx.closePath()
    ctx.fillStyle = 'rgba(0,0,0,0.35)'
    ctx.fill()
    ctx.restore()
    radius += maxRadius / 16
    if (radius < maxRadius) {
      requestAnimationFrame(draw)
    }
    else {
      isTransitioning.value = false
      currentIndex.value = nextIndex
      ctx.clearRect(0, 0, w, h)
    }
  }
  draw()
}

function startLoop() {
  intervalId = setInterval(() => {
    isTransitioning.value = true
    const next = (currentIndex.value + 1) % images.length
    playRipple(next)
  }, 4000)
}

onMounted(() => {
  setTimeout(() => {
    startLoop()
  }, 1800)
})
</script>

<template>
  <div
    class="w-full h-[80vh] flex flex-col md:flex-row items-stretch overflow-hidden bg-white relative"
  >
    <!-- 左側黑色區塊，內容置中 -->
    <div
      class="flex-1 bg-black flex flex-col justify-center items-center py-8 md:py-0"
    >
      <div
        class="text-2xl md:text-[2vw] font-bold text-white leading-tight mb-6 text-center"
      >
        線上填寫智慧需求表
      </div>
      <a :href="link" target="_blank" rel="noopener" class="shadow-btn">
        前往填寫
      </a>
    </div>
    <!-- 右側圖片區 -->
    <div
      class="relative w-full md:w-[55vw] min-w-0 h-64 md:h-full flex items-center justify-center"
    >
      <img
        v-for="(img, idx) in images"
        :key="img"
        :src="img"
        class="absolute inset-0 w-full h-full object-cover transition-opacity duration-1000"
        :class="{
          'opacity-100': currentIndex === idx && !isTransitioning,
          'opacity-0': currentIndex !== idx || isTransitioning,
        }"
      >
      <!-- 水波紋 canvas -->
      <canvas
        v-show="isTransitioning"
        ref="rippleCanvas"
        class="absolute inset-0 w-full h-full pointer-events-none"
      />
    </div>
  </div>
</template>

<style scoped>
a {
  position: relative;
  display: inline-block;
  padding: 15px 30px;
  border: 2.5px solid;
  border-radius: 1rem;
  border-image: linear-gradient(135deg, #ff256b 0%, #a445ff 50%, #00c6ff 100%) 1;
  box-shadow:
    0 0 32px 4px rgba(164, 69, 255, 0.25),
    0 0 48px 8px rgba(0, 198, 255, 0.18),
    0 0 0 2px rgba(255, 37, 107, 0.12);
  text-transform: uppercase;
  color: #fff;
  text-decoration: none;
  font-weight: 600;
  font-size: 20px;
  background: linear-gradient(
    135deg,
    rgba(20, 20, 20, 0.85),
    rgba(40, 40, 40, 0.6)
  );
  backdrop-filter: blur(6px);
  transition:
    color 0.3s,
    box-shadow 0.3s;
  text-align: center;
  margin: 0 auto;
}
a:hover {
  color: #a445ff;
  box-shadow:
    0 0 48px 12px rgba(164, 69, 255, 0.35),
    0 0 64px 16px rgba(0, 198, 255, 0.25);
}
a span {
  position: relative;
  z-index: 3;
  color: #fff;
  font-weight: bold;
}
button {
  background: none;
  border: none;
  padding: 0;
}
@media (max-width: 768px) {
  .text-2xl.md\:text-\[2vw\] {
    font-size: 1.25rem !important;
  }
}
.shadow-btn {
  display: inline-block;
  transition: all 0.5s;
  font-size: 17px;
  padding: 1ch 2ch;
  background-color: #888;
  color: #fff;
  cursor: pointer;
  border: none;
  border-radius: 2px;
  text-align: center;
  text-decoration: none;
  box-shadow:
    2px 2px 0px hsl(0, 0%, 90%),
    4px 4px 0px hsl(0, 0%, 80%),
    6px 6px 0px hsl(0, 0%, 70%),
    8px 8px 0px hsl(0, 0%, 60%),
    10px 10px 0px hsl(0, 0%, 50%),
    12px 12px 0px hsl(0, 0%, 40%),
    14px 14px 0px hsl(0, 0%, 30%),
    16px 16px 0px hsl(0, 0%, 20%),
    18px 18px 0px hsl(0, 0%, 10%);
}
.shadow-btn:hover {
  background-color: #444;
  color: #fff;
  box-shadow: none;
}
</style>

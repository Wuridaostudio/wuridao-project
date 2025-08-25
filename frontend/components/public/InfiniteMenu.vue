<script setup lang="ts">
import * as THREE from 'three'
import { onBeforeUnmount, onMounted, ref } from 'vue'
import LoadingSpinner from '~/components/common/LoadingSpinner.vue'

const props = defineProps({
  text: { type: String, default: 'WURIDAO' },
  fontFamily: { type: String, default: 'Figtree' },
  fontWeight: { type: String, default: '900' },
  noiseFactor: { type: Number, default: 0 },
  noiseScale: { type: Number, default: 0 },
  rgbPersistFactor: { type: Number, default: 0.98 },
  alphaPersistFactor: { type: Number, default: 0.95 },
  animateColor: { type: Boolean, default: false },
  startColor: { type: String, default: 'rgba(80,180,255,0.4)' },
  textColor: { type: String, default: 'rgba(80,180,255,0.4)' },
  backgroundColor: { type: [String, Number], default: 0x271E37 },
  colorCycleInterval: { type: Number, default: 3000 },
  supersample: { type: Number, default: 1 },
  // 手機優化：添加效能控制參數
  isMobile: { type: Boolean, default: false },
  enableComplexEffects: { type: Boolean, default: true },
})

const isClient
  = typeof window !== 'undefined' && typeof document !== 'undefined'

const containerRef = ref(null)
const loading = ref(true)
let renderer,
  scene,
  fluidScene,
  clock,
  cam,
  rt0,
  rt1,
  quad,
  quadMat,
  label,
  labelMat,
  texCanvas,
  ctx,
  ro,
  timer
let persistColor = [1, 1, 1]
let targetColor = [1, 1, 1]
const mouse = [0, 0]
const target = [0, 0]
let pointerMoveHandler = null
let animationActive = true
let isVisible = true
let intersectionObserver = null

function hexToRgb(hex) {
  if (hex.startsWith('rgba')) {
    // rgba 格式
    const m = hex.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/)
    if (m) {
      return [
        Number.parseInt(m[1]),
        Number.parseInt(m[2]),
        Number.parseInt(m[3]),
        m[4] ? Number.parseFloat(m[4]) : 1,
      ]
    }
  }
  let h = hex.replace('#', '')
  if (h.length === 3) {
    h = h
      .split('')
      .map(c => c + c)
      .join('')
  }
  const n = Number.parseInt(h, 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255, 1]
}

function loadFont(fam) {
  if ('fonts' in document)
    return document.fonts.load(`64px "${fam}"`)
  return Promise.resolve()
}

const BASE_VERT = `
varying vec2 v_uv;
void main(){gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);v_uv=uv;}`

const PERSIST_FRAG = `
uniform sampler2D sampler;
uniform float time;
uniform vec2 mousePos;
uniform float noiseFactor;
uniform float noiseScale;
uniform float rgbPersistFactor;
uniform float alphaPersistFactor;
varying vec2 v_uv;

void main() {
  vec2 uv = v_uv;
  vec2 mouse = mousePos;
  float t = time;
  
  // 簡單的流體效果
  vec2 p = uv * 2.0 - 1.0;
  float n = sin(p.x * noiseScale + t) * cos(p.y * noiseScale + t) * noiseFactor;
  
  vec2 flow = vec2(
    sin(p.x * 2.0 + t * 0.3) * 0.1,
    cos(p.y * 2.0 + t * 0.3) * 0.1
  );
  
  vec2 distortedUv = uv + flow + n * 0.1;
  vec4 color = texture2D(sampler, distortedUv);
  
  // 滑鼠互動效果
  float mouseDist = length(uv - mouse);
  color.rgb = mix(color.rgb, color.rgb * 1.2, exp(-mouseDist * 2.0));
  
  gl_FragColor = vec4(color.rgb * rgbPersistFactor, color.a * alphaPersistFactor);
}`

const TEXT_FRAG = `
uniform sampler2D sampler;
uniform vec4 color;
varying vec2 v_uv;
void main() {
  vec4 texColor = texture2D(sampler, v_uv);
  gl_FragColor = vec4(color.rgb, texColor.a * color.a);
}`

function drawTextToCanvas(text, fontFamily, fontWeight, color, supersample, renderer) {
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  const size = Math.min(renderer.domElement.width, renderer.domElement.height) * supersample
  canvas.width = size
  canvas.height = size
  ctx.scale(supersample, supersample)
  ctx.font = `${fontWeight} ${size / supersample}px "${fontFamily}"`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillStyle = color
  ctx.fillText(text, size / supersample / 2, size / supersample / 2)
  return canvas
}

function debounce(func, wait) {
  let timeout
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

function disposeAll() {
  if (renderer) {
    renderer.dispose()
  }
  if (rt0) {
    rt0.dispose()
  }
  if (rt1) {
    rt1.dispose()
  }
  if (quadMat) {
    quadMat.dispose()
  }
  if (labelMat) {
    labelMat.dispose()
  }
  if (quad && quad.geometry) {
    quad.geometry.dispose()
  }
  if (label && label.geometry) {
    label.geometry.dispose()
  }
}

onMounted(async () => {
  if (!isClient || !containerRef.value)
    return
    
  // 添加設備調試日誌
  console.log('[InfiniteMenu] 設備檢測:', {
    userAgent: navigator.userAgent,
    isIPhone: /iphone|ipad|ipod/i.test(navigator.userAgent.toLowerCase()),
    isMobile: props.isMobile,
    width: window.innerWidth,
    height: window.innerHeight,
    devicePixelRatio: window.devicePixelRatio
  })
    
  // 檢測設備類型
  const isMobileDevice = props.isMobile || window.innerWidth < 768 || /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
  
  // iPhone特殊配置
  const userAgent = navigator.userAgent.toLowerCase()
  const isIPhone = /iphone|ipad|ipod/i.test(userAgent)
  
  const w = containerRef.value.clientWidth
  const h = containerRef.value.clientHeight
  
  // 渲染設定
  const pixelRatio = isIPhone ? 1 : (isMobileDevice ? 1 : window.devicePixelRatio || 1)
  const antialias = isIPhone ? false : !isMobileDevice
  
  try {
    renderer = new THREE.WebGLRenderer({
      antialias: antialias,
      powerPreference: 'high-performance',
      alpha: isIPhone ? true : false,
      stencil: false,
      depth: false,
      preserveDrawingBuffer: isIPhone ? true : false,
    })
    
    renderer.setClearColor(new THREE.Color(props.backgroundColor), isIPhone ? 0 : 1)
    renderer.setPixelRatio(pixelRatio)
    
    // 解析度設定
    const scale = isIPhone ? 0.5 : (isMobileDevice ? 0.3 : 0.7)
    renderer.setSize(w * scale, h * scale)
    renderer.domElement.style.width = `${w}px`
    renderer.domElement.style.height = `${h}px`
    renderer.domElement.style.transform = `scale(${1/scale})`
    
    // iPhone特殊處理
    if (isIPhone) {
      renderer.domElement.style.position = 'absolute'
      renderer.domElement.style.top = '0'
      renderer.domElement.style.left = '0'
      renderer.domElement.style.zIndex = '1'
    }
    
    containerRef.value.appendChild(renderer.domElement)
    scene = new THREE.Scene()
    fluidScene = new THREE.Scene()
    clock = new THREE.Clock()
    cam = new THREE.OrthographicCamera(-w / 2, w / 2, h / 2, -h / 2, 0.1, 10)
    cam.position.z = 1
    rt0 = new THREE.WebGLRenderTarget(w, h)
    rt1 = rt0.clone()
    
    // 初始化顏色
    persistColor = hexToRgb(props.textColor || props.startColor).map(
      c => c / 255,
    )
    targetColor = [...persistColor]
    
    console.log('[InfiniteMenu] 創建著色器材質，顏色:', persistColor)
    
    // 創建著色器材質
    quadMat = new THREE.ShaderMaterial({
      uniforms: {
        sampler: { value: null },
        time: { value: 0 },
        mousePos: { value: new THREE.Vector2(-1, 1) },
        noiseFactor: { value: props.noiseFactor },
        noiseScale: { value: props.noiseScale },
        rgbPersistFactor: { value: props.rgbPersistFactor },
        alphaPersistFactor: { value: props.alphaPersistFactor },
      },
      vertexShader: BASE_VERT,
      fragmentShader: PERSIST_FRAG,
      transparent: true,
    })
    
    console.log('[InfiniteMenu] quadMat 創建成功')
    
    labelMat = new THREE.ShaderMaterial({
      uniforms: {
        sampler: { value: null },
        color: { value: new THREE.Vector4(...persistColor) },
      },
      vertexShader: BASE_VERT,
      fragmentShader: TEXT_FRAG,
      transparent: true,
    })
    
    console.log('[InfiniteMenu] labelMat 創建成功')
    
    quad = new THREE.Mesh(new THREE.PlaneGeometry(w, h), quadMat)
    fluidScene.add(quad)
    
    label = new THREE.Mesh(
      new THREE.PlaneGeometry(Math.min(w, h), Math.min(w, h)),
      labelMat,
    )
    scene.add(label)
    
    await loadFont(props.fontFamily)
    texCanvas = drawTextToCanvas(
      props.text,
      props.fontFamily,
      props.fontWeight,
      props.textColor,
      props.supersample,
      renderer,
    )
    labelMat.uniforms.sampler.value = new THREE.CanvasTexture(texCanvas)
    
  } catch (error) {
    console.error('[InfiniteMenu] WebGL初始化失敗:', error)
    loading.value = false
    return
  }
  
  // pointermove 事件
  pointerMoveHandler = (e) => {
    const r = containerRef.value.getBoundingClientRect()
    target[0] = ((e.clientX - r.left) / r.width) * 2 - 1
    target[1] = ((r.top + r.height - e.clientY) / r.height) * 2 - 1
  }
  containerRef.value.addEventListener('pointermove', pointerMoveHandler)
  // resize observer debounce
  ro = new window.ResizeObserver(
    debounce(() => {
      const newW = containerRef.value.clientWidth
      const newH = containerRef.value.clientHeight
      
      // 更新變數
      w = newW
      h = newH
      
      // 重新計算scale
      const newScale = isIPhone ? 0.5 : (isMobileDevice ? 0.3 : 0.7)
      
      // 更新renderer尺寸
      renderer.setSize(w * newScale, h * newScale)
      renderer.domElement.style.width = `${w}px`
      renderer.domElement.style.height = `${h}px`
      renderer.domElement.style.transform = `scale(${1/newScale})`
      
      // 更新相機
      cam.left = -w / 2
      cam.right = w / 2
      cam.top = h / 2
      cam.bottom = -h / 2
      cam.updateProjectionMatrix()
      
      // 更新幾何體
      if (quad && quad.geometry) {
        quad.geometry.dispose()
        quad.geometry = new THREE.PlaneGeometry(w, h)
      }
      
      // 更新渲染目標
      if (rt0) rt0.setSize(w, h)
      if (rt1) rt1.setSize(w, h)
      
      // 更新標籤幾何體
      if (label && label.geometry) {
        label.geometry.dispose()
        label.geometry = new THREE.PlaneGeometry(Math.min(w, h), Math.min(w, h))
      }
    }, 200),
  )
  ro.observe(containerRef.value)
  timer = setInterval(() => {
    if (!props.textColor) {
      targetColor = [Math.random(), Math.random(), Math.random()]
    }
  }, props.colorCycleInterval)
  // IntersectionObserver 控制動畫啟動
  intersectionObserver = new window.IntersectionObserver(
    (entries) => {
      isVisible = entries[0].isIntersecting
      if (isVisible && animationActive)
        animate()
    },
    { threshold: 0.01 },
  )
  intersectionObserver.observe(containerRef.value)
  // 動畫循環（iPhone優化：調整幀率）
  let lastTime = 0
  const targetFPS = isIPhone ? 30 : (isMobileDevice ? 15 : 30) // iPhone使用30fps
  const frameInterval = 1000 / targetFPS
  
  function animate(now) {
    if (!animationActive || !isVisible)
      return
    now = now || performance.now()
    if (now - lastTime > frameInterval) {
      const dt = clock.getDelta()
      
      // 添加調試信息
      if (Math.floor(now / 1000) % 5 === 0) {
        console.log('[InfiniteMenu] 動畫運行中:', {
          time: clock.getElapsedTime(),
          mouse: [mouse[0], mouse[1]],
          target: [target[0], target[1]],
          persistColor: persistColor
        })
      }
      
      // iPhone優化：簡化顏色動畫
      if (props.animateColor && !props.textColor && !isIPhone) {
        for (let i = 0; i < 3; i++)
          persistColor[i] += (targetColor[i] - persistColor[i]) * dt
      }
      
      const speed = dt * (isIPhone ? 3 : (isMobileDevice ? 1.5 : 5)) // iPhone適中的動畫速度
      mouse[0] += (target[0] - mouse[0]) * speed
      mouse[1] += (target[1] - mouse[1]) * speed
      
      quadMat.uniforms.mousePos.value.set(mouse[0], mouse[1])
      quadMat.uniforms.sampler.value = rt1.texture
      quadMat.uniforms.time.value = clock.getElapsedTime()
      
      // iPhone優化：適中的特效強度
      const noiseFactor = isIPhone ? props.noiseFactor * 0.5 : (isMobileDevice ? props.noiseFactor * 0.2 : props.noiseFactor)
      const noiseScale = isIPhone ? props.noiseScale * 0.5 : (isMobileDevice ? props.noiseScale * 0.2 : props.noiseScale)
      
      quadMat.uniforms.noiseFactor.value = noiseFactor
      quadMat.uniforms.noiseScale.value = noiseScale
      labelMat.uniforms.color.value.set(...persistColor)
      
      if (renderer) {
        renderer.autoClearColor = false
        renderer.setRenderTarget(rt0)
        renderer.clearColor()
        renderer.render(fluidScene, cam)
        renderer.render(scene, cam)
        renderer.setRenderTarget(null)
        renderer.render(fluidScene, cam)
        renderer.render(scene, cam)
      }
      [rt0, rt1] = [rt1, rt0]
      lastTime = now
    }
    if (animationActive && isVisible)
      requestAnimationFrame(animate)
  }
  animationActive = true
  isVisible = true
  console.log('[InfiniteMenu] 開始動畫循環')
  animate()
  
  // 頁面隱藏時暫停動畫
  document.addEventListener('visibilitychange', () => {
    animationActive = document.visibilityState === 'visible'
    console.log('[InfiniteMenu] 頁面可見性變化:', animationActive)
    if (animationActive)
      animate()
  })
  loading.value = false
})

onBeforeUnmount(() => {
  if (pointerMoveHandler && containerRef.value) {
    containerRef.value.removeEventListener('pointermove', pointerMoveHandler)
  }
  if (ro && containerRef.value) {
    ro.disconnect()
  }
  if (timer)
    clearInterval(timer)
  disposeAll()
  if (intersectionObserver && containerRef.value)
    intersectionObserver.disconnect()
})
</script>

<template>
  <div ref="containerRef" class="w-full h-full relative">
    <div
      v-if="loading"
      class="absolute inset-0 flex items-center justify-center bg-black/80 z-10"
    >
      <LoadingSpinner />
    </div>
    
    <!-- WebGL動畫版本 -->
    <div v-if="!loading" class="w-full h-full"></div>
  </div>
</template>

<style scoped>
/* 保留基本樣式 */
</style>

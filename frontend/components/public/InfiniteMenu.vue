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
const isLowPerformance = ref(false)
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

const SIMPLEX = `
vec3 mod289(vec3 x){return x-floor(x*(1./289.))*289.;}
vec4 mod289(vec4 x){return x-floor(x*(1./289.))*289.;}
vec4 permute(vec4 x){return mod289(((x*34.)+1.)*x);}
float snoise3(vec3 v){
  const vec2 C=vec2(1./6.,1./3.);
  const vec4 D=vec4(0.,.5,1.,2.);
  vec3 i=floor(v+dot(v,C.yyy));
  vec3 x0=v-i+dot(i,C.xxx);
  vec3 g=step(x0.yzx,x0.xyz);
  vec3 l=1.-g;
  vec3 i1=min(g.xyz,l.zxy);
  vec3 i2=max(g.xyz,l.zxy);
  vec3 x1=x0-i1+C.xxx;
  vec3 x2=x0-i2+C.yyy;
  vec3 x3=x0-D.yyy;
  i=mod289(i);
  vec4 p=permute(permute(permute(i.z+vec4(0.,i1.z,i2.z,1.))+i.y+vec4(0.,i1.y,i2.y,1.))+i.x+vec4(0.,i1.x,i2.x,1.));
  float n_=1./7.;
  vec3 ns=n_*D.wyz-D.xzx;
  vec4 j=p-49.*floor(p*ns.z*ns.z);
  vec4 x_=floor(j*ns.z);
  vec4 y_=floor(j-7.*x_);
  vec4 x=x_*ns.x+ns.yyyy;
  vec4 y=y_*ns.y+ns.xxxx;
  vec4 h=1.-abs(x)-abs(y);
  vec4 b0=vec4(x.xy,y.xy);
  vec4 b1=vec4(x.zw,y.zw);
  vec4 s0=floor(b0)*2.+1.;
  vec4 s1=floor(b1)*2.+1.;
  vec4 sh=-step(h,vec4(0.));
  vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy;
  vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
  vec3 p0=vec3(a0.xy,h.x);
  vec3 p1=vec3(a0.zw,h.y);
  vec3 p2=vec3(a1.xy,h.z);
  vec3 p3=vec3(a1.zw,h.w);
  vec4 norm=permute(permute(p.x+vec4(0.,p0.x,p1.x,p2.x))+p.y+vec4(0.,p0.y,p1.y,p2.y));
  norm=permute(norm+p.z+vec4(0.,p0.z,p1.z,p2.z));
  vec4 m=max(.5-vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)),0.);
  m=m*m;
  return 105.*dot(m*m,norm);
}`

const PERSIST_FRAG = `
uniform sampler2D sampler;
uniform float time;
uniform vec2 mousePos;
uniform float noiseFactor;
uniform float noiseScale;
uniform float rgbPersistFactor;
uniform float alphaPersistFactor;
varying vec2 v_uv;
${SIMPLEX}
void main(){
  vec2 uv=v_uv;
  vec2 mouse=mousePos;
  float t=time;
  vec2 p=uv*2.-1.;
  float noise=snoise3(vec3(p*noiseScale,t*0.5,0.))*noiseFactor;
  vec2 flow=vec2(snoise3(vec3(p*2.,t*0.3,0.)),snoise3(vec3(p*2.,t*0.3,100.)))*0.1;
  vec2 distortedUv=uv+flow+noise*0.1;
  vec4 color=texture2D(sampler,distortedUv);
  vec2 mouseFlow=normalize(uv-mouse)*0.1;
  color.rgb=mix(color.rgb,color.rgb*1.2,exp(-length(uv-mouse)*2.));
  gl_FragColor=vec4(color.rgb*rgbPersistFactor,color.a*alphaPersistFactor);
}`

const TEXT_FRAG = `
uniform sampler2D sampler;
uniform vec4 color;
varying vec2 v_uv;
void main(){
  vec4 texColor=texture2D(sampler,v_uv);
  gl_FragColor=vec4(color.rgb,texColor.a*color.a);
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
    
  // 手機優化：檢查是否為低性能設備
  const checkLowPerformanceDevice = () => {
    if (!process.client) return false
    
    // 檢查記憶體
    if ('memory' in performance) {
      const memory = (performance as any).memory
      if (memory.jsHeapSizeLimit < 100 * 1024 * 1024) { // 100MB
        return true
      }
    }
    
    // 檢查WebGL支援
    try {
      const canvas = document.createElement('canvas')
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl')
      if (!gl) return true
      
      const maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE)
      if (maxTextureSize < 2048) return true
    } catch (error) {
      return true
    }
    
    return false
  }
  
  // 如果是低性能設備，使用簡化版本
  if (checkLowPerformanceDevice()) {
    console.log('[InfiniteMenu] 檢測到低性能設備，使用簡化版本')
    isLowPerformance.value = true
    loading.value = false
    return
  }
    
  // 手機優化：檢測設備類型
  const isMobileDevice = props.isMobile || window.innerWidth < 768 || /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
  
  const w = containerRef.value.clientWidth
  const h = containerRef.value.clientHeight
  
  // 手機優化：大幅降低渲染品質以提高性能
  const pixelRatio = isMobileDevice ? 1 : window.devicePixelRatio || 1
  const antialias = false // 手機端完全關閉抗鋸齒
  
  renderer = new THREE.WebGLRenderer({
    antialias: antialias,
    powerPreference: 'high-performance',
    // 手機優化：減少記憶體使用
    alpha: false,
    stencil: false,
    depth: false,
  })
  
  renderer.setClearColor(new THREE.Color(props.backgroundColor), 1)
  renderer.setPixelRatio(pixelRatio)
  
  // 手機優化：大幅降低解析度以提高性能
  const scale = isMobileDevice ? 0.3 : 0.7
  renderer.setSize(w * scale, h * scale)
  renderer.domElement.style.width = `${w}px`
  renderer.domElement.style.height = `${h}px`
  renderer.domElement.style.transform = `scale(${1/scale})`
  
  containerRef.value.appendChild(renderer.domElement)
  scene = new THREE.Scene()
  fluidScene = new THREE.Scene()
  clock = new THREE.Clock()
  cam = new THREE.OrthographicCamera(-w / 2, w / 2, h / 2, -h / 2, 0.1, 10)
  cam.position.z = 1
  rt0 = new THREE.WebGLRenderTarget(w, h)
  rt1 = rt0.clone()
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
  quad = new THREE.Mesh(new THREE.PlaneGeometry(w, h), quadMat)
  fluidScene.add(quad)
  persistColor = hexToRgb(props.textColor || props.startColor).map(
    c => c / 255,
  )
  targetColor = [...persistColor]
  labelMat = new THREE.ShaderMaterial({
    uniforms: {
      sampler: { value: null },
      color: { value: new THREE.Vector4(...persistColor) },
    },
    vertexShader: BASE_VERT,
    fragmentShader: TEXT_FRAG,
    transparent: true,
  })
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
      w = containerRef.value.clientWidth
      h = containerRef.value.clientHeight
      renderer.setSize(w, h)
      cam.left = -w / 2
      cam.right = w / 2
      cam.top = h / 2
      cam.bottom = -h / 2
      cam.updateProjectionMatrix()
      quad.geometry.dispose()
      quad.geometry = new THREE.PlaneGeometry(w, h)
      rt0.setSize(w, h)
      rt1.setSize(w, h)
      label.geometry.dispose()
      label.geometry = new THREE.PlaneGeometry(Math.min(w, h), Math.min(w, h))
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
  // 動畫循環（手機優化：大幅降低幀率）
  let lastTime = 0
  const targetFPS = isMobileDevice ? 15 : 30 // 手機降低到 15fps
  const frameInterval = 1000 / targetFPS
  
  function animate(now) {
    if (!animationActive || !isVisible)
      return
    now = now || performance.now()
    if (now - lastTime > frameInterval) {
      const dt = clock.getDelta()
      
      // 手機優化：簡化顏色動畫
      if (props.animateColor && !props.textColor && !isMobileDevice) {
        for (let i = 0; i < 3; i++)
          persistColor[i] += (targetColor[i] - persistColor[i]) * dt
      }
      
      const speed = dt * (isMobileDevice ? 1.5 : 5) // 手機大幅降低動畫速度
      mouse[0] += (target[0] - mouse[0]) * speed
      mouse[1] += (target[1] - mouse[1]) * speed
      
      quadMat.uniforms.mousePos.value.set(mouse[0], mouse[1])
      quadMat.uniforms.sampler.value = rt1.texture
      quadMat.uniforms.time.value = clock.getElapsedTime()
      
      // 手機優化：大幅降低特效強度
      const noiseFactor = isMobileDevice ? props.noiseFactor * 0.2 : props.noiseFactor
      const noiseScale = isMobileDevice ? props.noiseScale * 0.2 : props.noiseScale
      
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
  animate()
  // 頁面隱藏時暫停動畫
  document.addEventListener('visibilitychange', () => {
    animationActive = document.visibilityState === 'visible'
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
    
    <!-- 低性能設備的簡化版本 -->
    <div
      v-if="!loading && isLowPerformance"
      class="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900"
    >
      <div class="text-center">
        <h1 class="text-4xl md:text-6xl lg:text-8xl font-bold text-blue-300 mb-4 animate-pulse">
          WURIDAO
        </h1>
        <p class="text-blue-200 text-lg md:text-xl opacity-80">
          智慧家庭解決方案
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped></style>

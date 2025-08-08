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
  float n_=1./7.; vec3 ns=n_*D.wyz-D.xzx;
  vec4 j=p-49.*floor(p*ns.z*ns.z);
  vec4 x_=floor(j*ns.z);
  vec4 y_=floor(j-7.*x_);
  vec4 x=x_*ns.x+ns.yyyy;
  vec4 y=y_*ns.x+ns.yyyy;
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
  vec4 norm=inversesqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
  p0*=norm.x; p1*=norm.y; p2*=norm.z; p3*=norm.w;
  vec4 m=max(.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.);
  m*=m;
  return 42.*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
}`

const PERSIST_FRAG = `
uniform sampler2D sampler;
uniform float time;
uniform vec2 mousePos;
uniform float noiseFactor,noiseScale,rgbPersistFactor,alphaPersistFactor;
varying vec2 v_uv;
${SIMPLEX}
void main(){
  float a=snoise3(vec3(v_uv*noiseFactor,time*.1))*noiseScale;
  float b=snoise3(vec3(v_uv*noiseFactor,time*.1+100.))*noiseScale;
  vec4 t=texture2D(sampler,v_uv+vec2(a,b)+mousePos*.005);
  gl_FragColor=vec4(t.xyz*rgbPersistFactor,alphaPersistFactor);
}`

const TEXT_FRAG = `
uniform sampler2D sampler;uniform vec3 color;varying vec2 v_uv;
void main(){
  vec4 t=texture2D(sampler,v_uv);
  float alpha=smoothstep(0.1,0.9,t.a);
  if(alpha<0.01)discard;
  gl_FragColor=vec4(color,alpha);
}`

function drawTextToCanvas(
  text,
  fontFamily,
  fontWeight,
  textColor,
  supersample,
  renderer,
) {
  const max = Math.min(renderer.capabilities.maxTextureSize, 4096)
  const pixelRatio = (window.devicePixelRatio || 1) * supersample
  const canvasSize = max * pixelRatio
  const texCanvas = document.createElement('canvas')
  texCanvas.width = canvasSize
  texCanvas.height = canvasSize
  const ctx = texCanvas.getContext('2d', { alpha: true, colorSpace: 'srgb' })
  ctx.setTransform(1, 0, 0, 1, 0, 0)
  ctx.scale(pixelRatio, pixelRatio)
  ctx.clearRect(0, 0, max, max)
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  ctx.shadowColor = 'rgba(255,255,255,0.3)'
  ctx.shadowBlur = 2
  // 更明顯的深到淺漸層
  const gradient = ctx.createLinearGradient(0, max * 0.5, max, max * 0.5)
  gradient.addColorStop(0, 'rgba(24,28,75,0.98)') // 深靛色
  gradient.addColorStop(0.5, 'rgba(46,49,146,0.7)') // 靛色
  gradient.addColorStop(1, 'rgba(174,239,255,0.5)') // 淺藍色
  ctx.fillStyle = gradient
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'

  const refSize = 500 * 0.8 // 字體縮小為 0.8 倍
  ctx.font = `${fontWeight} ${refSize}px 'Inter', 'Noto Sans TC', sans-serif`

  const cx = max / 2
  const cy = max / 2
  const offs = [
    [0, 0],
    [0.1, 0],
    [-0.1, 0],
    [0, 0.1],
    [0, -0.1],
    [0.1, 0.1],
    [-0.1, -0.1],
    [0.1, -0.1],
    [-0.1, 0.1],
  ]
  ctx.globalAlpha = 1 / offs.length
  offs.forEach(([dx, dy]) => ctx.fillText(text, cx + dx, cy + dy))
  ctx.globalAlpha = 1
  return texCanvas
}

function debounce(fn, delay) {
  let t
  return (...args) => {
    clearTimeout(t)
    t = setTimeout(() => fn(...args), delay)
  }
}

function disposeAll() {
  if (renderer) {
    renderer.dispose && renderer.dispose()
    renderer.forceContextLoss && renderer.forceContextLoss()
    renderer.domElement && renderer.domElement.remove()
    renderer = null
  }
  if (quad)
    quad.geometry.dispose()
  if (label)
    label.geometry.dispose()
  if (rt0)
    rt0.dispose()
  if (rt1)
    rt1.dispose()
  if (labelMat && labelMat.uniforms.sampler.value) {
    labelMat.uniforms.sampler.value.dispose
    && labelMat.uniforms.sampler.value.dispose()
  }
}

onMounted(async () => {
  if (!isClient || !containerRef.value)
    return
  let w = containerRef.value.clientWidth
  let h = containerRef.value.clientHeight
  renderer = new THREE.WebGLRenderer({
    antialias: false,
    powerPreference: 'high-performance',
  })
  renderer.setClearColor(new THREE.Color(props.backgroundColor), 1)
  renderer.setPixelRatio(window.devicePixelRatio || 1)
  renderer.setSize(w * 0.7, h * 0.7)
  renderer.domElement.style.width = `${w}px`
  renderer.domElement.style.height = `${h}px`
  renderer.domElement.style.transform = 'scale(1.43)'
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
  // 動畫循環（降幀率）
  let lastTime = 0
  function animate(now) {
    if (!animationActive || !isVisible)
      return
    now = now || performance.now()
    if (now - lastTime > 33) {
      // 30fps
      const dt = clock.getDelta()
      if (props.animateColor && !props.textColor) {
        for (let i = 0; i < 3; i++)
          persistColor[i] += (targetColor[i] - persistColor[i]) * dt
      }
      const speed = dt * 5
      mouse[0] += (target[0] - mouse[0]) * speed
      mouse[1] += (target[1] - mouse[1]) * speed
      quadMat.uniforms.mousePos.value.set(mouse[0], mouse[1])
      quadMat.uniforms.sampler.value = rt1.texture
      quadMat.uniforms.time.value = clock.getElapsedTime()
      quadMat.uniforms.noiseFactor.value = props.noiseFactor
      quadMat.uniforms.noiseScale.value = props.noiseScale
      labelMat.uniforms.color.value.set(...persistColor)
      renderer.autoClearColor = false
      renderer.setRenderTarget(rt0)
      renderer.clearColor()
      renderer.render(fluidScene, cam)
      renderer.render(scene, cam)
      renderer.setRenderTarget(null)
      renderer.render(fluidScene, cam)
      renderer.render(scene, cam);
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
  </div>
</template>

<style scoped></style>

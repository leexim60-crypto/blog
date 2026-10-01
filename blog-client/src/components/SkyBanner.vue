<template>
  <section
    ref="heroRef"
    class="hero"
    :style="bannerStyle"
    aria-labelledby="hero-title"
  >
    <!-- 星空画布（动画层） -->
    <canvas ref="skyCanvas" class="hero__canvas" aria-hidden="true"></canvas>

    <!-- 叠色层：压暗边缘，把视觉重心收回内容区 -->
    <div class="hero__veil" aria-hidden="true"></div>
    <!-- 胶片颗粒：消除大面积渐变的「塑料感」 -->
    <div class="hero__grain" aria-hidden="true"></div>
    <!-- 底部渐隐，让星空与下方内容无缝衔接 -->
    <div class="hero__seam" aria-hidden="true"></div>

    <div class="hero__inner shell" :style="parallaxStyle">
      <p class="hero__eyebrow eyebrow">
        Personal Observatory
        <span class="hero__live" aria-hidden="true"><i></i>LIVE</span>
      </p>

      <h1 id="hero-title" class="hero__title">
        <!-- 渐变必须画在「每个字自己」身上。
             如果渐变留在父元素、动画加在子 span 上，子 span 的 opacity/transform
             会创建合成层，父元素的 background-clip:text 无法穿透该层绘制，
             结果就是整个标题彻底看不见。 -->
        <span
          ref="titleLineRef"
          class="hero__title-line"
          aria-hidden="true"
          :style="{ '--line-w': lineWidth }"
        >
          <span
            v-for="(ch, i) in titleChars"
            :key="i"
            class="char-in gradient-chars"
            :style="{ '--i': i, '--x': charOffsets[i] || '0px' }"
          >{{ ch }}</span>
        </span>
        <span class="sr-only">{{ title }}</span>
      </h1>

      <p class="hero__desc">
        欢迎来到我的数字小宇宙。这里收录我部署上线的作品，
        也收留每一个不想被忘记的日子。
      </p>

      <div class="hero__actions">
        <button class="hero__cta btn-aurora" type="button" @click="$emit('openProjects')">
          <el-icon><Grid /></el-icon>
          查看我的项目
        </button>
        <router-link to="/diary" class="hero__cta hero__cta--ghost">
          <el-icon><Notebook /></el-icon>
          翻阅日记
        </router-link>
      </div>

      <!-- 一行随时刻变化的「现场读数」，让首屏是活的 -->
      <p class="hero__now">
        <span class="hero__now-dot" aria-hidden="true"></span>
        <span>{{ greeting }}</span>
        <span class="hero__now-sep" aria-hidden="true">/</span>
        <span class="num">{{ dateText }}</span>
        <span class="hero__now-sep" aria-hidden="true">/</span>
        <span class="num">{{ clockText }}</span>
      </p>
    </div>

    <button class="hero__scroll" type="button" aria-label="向下滚动" @click="scrollDown">
      <span class="hero__scroll-label">Scroll</span>
      <span class="hero__scroll-line" aria-hidden="true"><i></i></span>
    </button>
  </section>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'

defineEmits(['openProjects'])

const heroRef = ref(null)
const skyCanvas = ref(null)

const title = '陈Hello的博客'
const titleChars = computed(() => Array.from(title))

/* 逐字渐变的连续性：
   每个字都要画同一道渐变，且各自只显示属于自己的那一段。
   做法是量出整行宽度与每个字的左偏移，写进 --line-w / --x，
   再配合 background-size / background-position 把渐变「对齐」到整行上。 */
const titleLineRef = ref(null)
const charOffsets = ref([])
const lineWidth = ref('100%')

async function measureTitle() {
  const line = titleLineRef.value
  if (!line) return
  const spans = Array.from(line.querySelectorAll('.char-in'))
  if (!spans.length) return
  const lineRect = line.getBoundingClientRect()
  lineWidth.value = `${lineRect.width}px`
  charOffsets.value = spans.map((s) => `${s.offsetLeft}px`)
}

/* ------------------------------------------------------------------
 * 自定义横幅壁纸：由「每日一图」小组件写入 localStorage
 * ------------------------------------------------------------------ */
const BANNER_KEY = 'blog_banner_wallpaper'
const bannerWallpaper = ref('')

const bannerStyle = computed(() =>
  bannerWallpaper.value
    ? {
        backgroundImage: `linear-gradient(180deg, rgba(4,6,13,.34) 0%, rgba(4,6,13,.74) 60%, rgba(4,6,13,.96) 100%), url("${bannerWallpaper.value}")`,
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }
    : {}
)

function syncBannerWallpaper() {
  try {
    bannerWallpaper.value = localStorage.getItem(BANNER_KEY) || ''
  } catch {
    bannerWallpaper.value = ''
  }
}

/* ------------------------------------------------------------------
 * 现场读数：问候语 / 日期 / 时间
 * ------------------------------------------------------------------ */
const now = ref(new Date())
let clockTimer = null

const greeting = computed(() => {
  const h = now.value.getHours()
  if (h < 5) return '夜深了，星星还在'
  if (h < 9) return '早上好'
  if (h < 12) return '上午好'
  if (h < 14) return '中午好'
  if (h < 18) return '下午好'
  if (h < 22) return '晚上好'
  return '夜色正好'
})

const dateText = computed(() => {
  const d = now.value
  const w = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][d.getDay()]
  const p = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}.${p(d.getMonth() + 1)}.${p(d.getDate())} ${w}`
})

const clockText = computed(() => {
  const d = now.value
  const p = (n) => String(n).padStart(2, '0')
  return `${p(d.getHours())}:${p(d.getMinutes())}`
})

/* ------------------------------------------------------------------
 * 指针视差
 * 只写 CSS 变量 / transform，交给合成层，避免每帧触发布局
 * ------------------------------------------------------------------ */
const parallaxStyle = ref({ transform: 'translate3d(0,0,0)' })
const pointer = { x: 0, y: 0, tx: 0, ty: 0 }

function onPointerMove(e) {
  const el = heroRef.value
  if (!el || reducedMotion) return
  const rect = el.getBoundingClientRect()
  pointer.tx = ((e.clientX - rect.left) / rect.width - 0.5) * 2
  pointer.ty = ((e.clientY - rect.top) / rect.height - 0.5) * 2
}

function onPointerLeave() {
  pointer.tx = 0
  pointer.ty = 0
}

function scrollDown() {
  const next = heroRef.value?.nextElementSibling
  if (next) next.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'start' })
  else window.scrollBy({ top: window.innerHeight * 0.9, behavior: 'smooth' })
}

/* ==================================================================
 * Canvas 星空引擎
 * ------------------------------------------------------------------
 * 性能策略（决定首屏是否顺滑）：
 *  1. 静态背景（渐变 / 星云 / 月亮）只渲染一次到离屏 canvas，
 *     每帧 drawImage 贴回 —— 省掉每帧 5 次全屏渐变填充；
 *  2. 亮星发光用预渲染贴图，替代 shadowBlur
 *     （shadowBlur 是移动端最大的帧率杀手）；
 *  3. 离开视口 / 页面不可见时暂停 rAF，不空转耗电；
 *  4. 小屏降低 DPR 与星点数量。
 * ================================================================== */
let ctx = null
let bgLayer = null
let glowSprite = null
let canvasWidth = 0
let canvasHeight = 0
let stars = []
let meteors = []
let windParticles = []
let animationId = null
let resizeId = null
let lastTimestamp = 0
let nextMeteorAt = 0
let reducedMotion = false
let isVisible = true
const MOON_X = 0.78
const MOON_Y = 0.15

const easeSine = (t) => -(Math.cos(Math.PI * t) - 1) / 2
const smoothStep = (e0, e1, x) => {
  const t = Math.max(0, Math.min(1, (x - e0) / (e1 - e0)))
  return t * t * (3 - 2 * t)
}

/* 预渲染一张发光贴图，供所有亮星复用 */
function makeGlowSprite(size = 64) {
  const c = document.createElement('canvas')
  c.width = c.height = size
  const cc = c.getContext('2d')
  const half = size / 2
  const grad = cc.createRadialGradient(half, half, 0, half, half, half)
  grad.addColorStop(0, 'rgba(255,255,255,1)')
  grad.addColorStop(0.28, 'rgba(214,232,255,0.42)')
  grad.addColorStop(0.6, 'rgba(150,190,255,0.12)')
  grad.addColorStop(1, 'rgba(120,170,255,0)')
  cc.fillStyle = grad
  cc.fillRect(0, 0, size, size)
  return c
}

/* 静态背景：只在 resize 时重建一次 */
function buildBackdrop() {
  const w = canvasWidth
  const h = canvasHeight
  bgLayer = document.createElement('canvas')
  bgLayer.width = Math.max(1, Math.floor(w))
  bgLayer.height = Math.max(1, Math.floor(h))
  const g = bgLayer.getContext('2d')
  if (!g) return

  const gradient = g.createLinearGradient(0, 0, 0, h)
  gradient.addColorStop(0, '#03060e')
  gradient.addColorStop(0.3, '#040b18')
  gradient.addColorStop(0.62, '#061125')
  gradient.addColorStop(0.86, '#08162c')
  gradient.addColorStop(1, '#04060d')
  g.fillStyle = gradient
  g.fillRect(0, 0, w, h)

  const mx = w * MOON_X
  const my = h * MOON_Y

  // 月晕
  const moonGlow = g.createRadialGradient(mx, my, 0, mx, my, Math.max(w, h) * 0.7)
  moonGlow.addColorStop(0, 'rgba(160, 195, 255, 0.17)')
  moonGlow.addColorStop(0.15, 'rgba(130, 175, 240, 0.11)')
  moonGlow.addColorStop(0.4, 'rgba(80, 120, 200, 0.055)')
  moonGlow.addColorStop(0.7, 'rgba(40, 70, 140, 0.022)')
  moonGlow.addColorStop(1, 'rgba(4, 10, 28, 0)')
  g.fillStyle = moonGlow
  g.fillRect(0, 0, w, h)

  // 三团极光星云：蓝 / 暖 / 青，构成色彩层次
  const nebula = (cx, cy, radius, rgb, alpha) => {
    const n = g.createRadialGradient(cx, cy, 0, cx, cy, radius)
    n.addColorStop(0, `rgba(${rgb}, ${alpha})`)
    n.addColorStop(0.5, `rgba(${rgb}, ${alpha * 0.4})`)
    n.addColorStop(1, 'rgba(4, 10, 28, 0)')
    g.fillStyle = n
    g.fillRect(0, 0, w, h)
  }
  nebula(w * 0.2, h * 0.18, w * 0.42, '100, 130, 220', 0.03)
  nebula(w * 0.5, h * 0.98, w * 0.62, '140, 120, 90', 0.015)
  nebula(w * 0.34, h * 0.62, w * 0.52, '85, 187, 138', 0.011)

  // 月亮本体
  const moonSize = Math.min(w, h) * 0.026
  const halo = g.createRadialGradient(mx, my, moonSize * 0.5, mx, my, moonSize * 12)
  halo.addColorStop(0, 'rgba(200, 220, 255, 0.08)')
  halo.addColorStop(0.3, 'rgba(160, 190, 240, 0.04)')
  halo.addColorStop(0.6, 'rgba(120, 155, 220, 0.015)')
  halo.addColorStop(1, 'rgba(60, 90, 160, 0)')
  g.fillStyle = halo
  g.fillRect(0, 0, w, h)

  const body = g.createRadialGradient(mx - moonSize * 0.15, my - moonSize * 0.15, 0, mx, my, moonSize)
  body.addColorStop(0, 'rgba(245, 248, 255, 0.92)')
  body.addColorStop(0.5, 'rgba(225, 235, 250, 0.85)')
  body.addColorStop(0.85, 'rgba(200, 218, 245, 0.7)')
  body.addColorStop(1, 'rgba(180, 200, 235, 0.4)')
  g.beginPath()
  g.fillStyle = body
  g.arc(mx, my, moonSize, 0, Math.PI * 2)
  g.fill()

  // 环形山
  g.globalAlpha = 0.08
  g.fillStyle = 'rgba(120, 140, 180, 1)'
  g.beginPath()
  g.arc(mx - moonSize * 0.2, my + moonSize * 0.1, moonSize * 0.25, 0, Math.PI * 2)
  g.fill()
  g.beginPath()
  g.arc(mx + moonSize * 0.25, my - moonSize * 0.2, moonSize * 0.18, 0, Math.PI * 2)
  g.fill()
  g.globalAlpha = 1
}

function handleResize() {
  if (resizeId !== null) cancelAnimationFrame(resizeId)
  resizeId = requestAnimationFrame(() => {
    setupCanvas()
    lastTimestamp = 0
  })
}

function setupCanvas() {
  const canvas = skyCanvas.value
  if (!canvas) return

  const rect = canvas.getBoundingClientRect()
  const width = Math.max(1, Math.round(rect.width))
  const height = Math.max(1, Math.round(rect.height))
  const isSmall = width < 768
  // 上限 1.75：再高的 DPR 对星点视觉收益很小，但填充率成本翻倍
  const dpr = Math.min(window.devicePixelRatio || 1, isSmall ? 1.5 : 1.75)

  canvasWidth = width
  canvasHeight = height
  canvas.width = Math.floor(width * dpr)
  canvas.height = Math.floor(height * dpr)

  const context = canvas.getContext('2d', { alpha: false })
  if (!context) return
  context.setTransform(dpr, 0, 0, dpr, 0, 0)
  ctx = context

  buildBackdrop()
  createStars()
  createWindParticles()
  meteors = []
}

function createStars() {
  const area = canvasWidth * canvasHeight
  const isSmall = canvasWidth < 768
  const density = isSmall ? 4200 : 2900
  const max = isSmall ? 420 : 760
  const count = Math.min(max, Math.max(180, Math.round(area / density)))

  const starColors = [
    { r: 229, g: 239, b: 255 },
    { r: 255, g: 244, b: 230 },
    { r: 210, g: 230, b: 255 },
    { r: 255, g: 252, b: 240 },
    { r: 180, g: 210, b: 255 }
  ]

  stars = Array.from({ length: count }, () => {
    const bright = Math.random() > 0.9
    const color = starColors[Math.floor(Math.random() * starColors.length)]
    const layer = bright ? 2 : Math.random() < 0.35 ? 0 : 1
    const layerScale = [0.5, 1.0, 1.6][layer]
    return {
      x: Math.random() * canvasWidth,
      y: Math.random() * canvasHeight,
      radius: (bright ? 1.2 + Math.random() * 0.8 : 0.3 + Math.random() * 0.9) * layerScale,
      baseAlpha: bright ? 0.5 + Math.random() * 0.35 : [0.12, 0.22, 0.35][layer] + Math.random() * 0.2,
      twinkleSpeed: (0.0006 + Math.random() * 0.0018) / layerScale,
      twinkleSpeed2: 0.0003 + Math.random() * 0.001,
      twinkleOffset: Math.random() * Math.PI * 2,
      twinkleOffset2: Math.random() * Math.PI * 2,
      driftX: (Math.random() - 0.5) * 0.004 * layerScale,
      driftY: (Math.random() - 0.5) * 0.006 * layerScale,
      // 视差深度：越「近」的层跟随指针位移越大
      depth: layerScale,
      color,
      bright
    }
  })
}

function createWindParticles() {
  const count = Math.min(14, Math.max(6, Math.round(canvasWidth / 150)))
  windParticles = Array.from({ length: count }, () => ({
    x: Math.random() * canvasWidth,
    y: Math.random() * canvasHeight,
    vx: 0.15 + Math.random() * 0.35,
    vy: (Math.random() - 0.5) * 0.08,
    waveAmp: 8 + Math.random() * 20,
    waveFreq: 0.0004 + Math.random() * 0.0008,
    waveOffset: Math.random() * Math.PI * 2,
    length: 60 + Math.random() * 140,
    width: 0.4 + Math.random() * 0.8,
    baseAlpha: 0.015 + Math.random() * 0.035,
    life: Math.random() * 20000,
    ttl: 18000 + Math.random() * 12000
  }))
}

function scheduleNextMeteor(now) {
  nextMeteorAt = now + 1500 + Math.random() * 1600
}

function spawnMeteor() {
  const angle = (Math.PI / 180) * (22 + Math.random() * 16)
  meteors.push({
    x: canvasWidth * (Math.random() * 0.6 - 0.1),
    y: canvasHeight * (Math.random() * 0.28 - 0.08),
    angle,
    speed: 700 + Math.random() * 350,
    length: 100 + Math.random() * 180,
    width: 0.8 + Math.random() * 1.2,
    life: 0,
    ttl: 900 + Math.random() * 500
  })
}

function drawStars(timestamp, deltaMs) {
  // 指针视差：越亮的星位移越大，产生纵深
  const offX = pointer.x * 9
  const offY = pointer.y * 7

  for (const star of stars) {
    const t1 = Math.sin(timestamp * star.twinkleSpeed + star.twinkleOffset)
    const t2 = Math.sin(timestamp * star.twinkleSpeed2 + star.twinkleOffset2)
    const twinkle = easeSine((t1 * 0.7 + t2 * 0.3 + 1) / 2)
    const alpha = Math.min(0.95, star.baseAlpha + twinkle * 0.3)
    const { r, g, b } = star.color

    const x = star.x + offX * star.depth
    const y = star.y + offY * star.depth

    if (star.bright) {
      // 预渲染贴图代替 shadowBlur
      const size = star.radius * 13
      ctx.globalAlpha = alpha * 0.9
      ctx.drawImage(glowSprite, x - size / 2, y - size / 2, size, size)
      ctx.globalAlpha = 1

      // 十字星芒只在最亮时出现
      if (alpha > 0.6) {
        const spikeAlpha = (alpha - 0.6) * 1.1
        const spikeLen = star.radius * 3.6
        ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${(spikeAlpha * 0.3).toFixed(3)})`
        ctx.lineWidth = 0.4
        ctx.beginPath()
        ctx.moveTo(x - spikeLen, y)
        ctx.lineTo(x + spikeLen, y)
        ctx.stroke()
        ctx.beginPath()
        ctx.moveTo(x, y - spikeLen)
        ctx.lineTo(x, y + spikeLen)
        ctx.stroke()
      }

      // 星芯
      ctx.beginPath()
      ctx.fillStyle = `rgba(255, 255, 255, ${Math.min(1, alpha * 1.05).toFixed(3)})`
      ctx.arc(x, y, star.radius * 0.6, 0, Math.PI * 2)
      ctx.fill()
    } else {
      ctx.beginPath()
      ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha.toFixed(3)})`
      ctx.arc(x, y, star.radius, 0, Math.PI * 2)
      ctx.fill()
    }

    star.x += star.driftX * deltaMs
    star.y += star.driftY * deltaMs
    if (star.x < -4) star.x = canvasWidth + 4
    if (star.x > canvasWidth + 4) star.x = -4
    if (star.y < -4) star.y = canvasHeight + 4
    if (star.y > canvasHeight + 4) star.y = -4
  }
}

function drawWindParticles(timestamp, deltaMs) {
  ctx.save()
  ctx.lineCap = 'round'

  for (const p of windParticles) {
    p.life += deltaMs
    let lifeProgress = p.life / p.ttl
    if (lifeProgress >= 1) {
      p.x = -p.length
      p.y = Math.random() * canvasHeight
      p.life = 0
      p.ttl = 18000 + Math.random() * 12000
      p.baseAlpha = 0.015 + Math.random() * 0.035
      lifeProgress = 0
    }

    const fadeIn = smoothStep(0, 0.15, lifeProgress)
    const fadeOut = 1 - smoothStep(0.8, 1, lifeProgress)
    const opacity = p.baseAlpha * fadeIn * fadeOut
    if (opacity < 0.002) continue

    const wave = Math.sin(timestamp * p.waveFreq + p.waveOffset) * p.waveAmp
    const waveDelta = Math.cos(timestamp * p.waveFreq + p.waveOffset) * p.waveAmp * 0.001

    p.x += p.vx * deltaMs * 0.06
    p.y += (p.vy + waveDelta) * deltaMs * 0.03

    if (p.x > canvasWidth + p.length) {
      p.x = -p.length
      p.y = Math.random() * canvasHeight
    }

    const startX = p.x
    const startY = p.y + wave
    const endX = p.x + p.length
    const endY = p.y + wave + Math.sin(timestamp * p.waveFreq * 1.5 + p.waveOffset) * p.waveAmp * 0.4

    const trail = ctx.createLinearGradient(startX, startY, endX, endY)
    trail.addColorStop(0, 'rgba(180, 210, 255, 0)')
    trail.addColorStop(0.2, `rgba(190, 215, 255, ${(opacity * 0.6).toFixed(4)})`)
    trail.addColorStop(0.5, `rgba(200, 225, 255, ${opacity.toFixed(4)})`)
    trail.addColorStop(0.8, `rgba(190, 215, 255, ${(opacity * 0.6).toFixed(4)})`)
    trail.addColorStop(1, 'rgba(180, 210, 255, 0)')

    ctx.strokeStyle = trail
    ctx.lineWidth = p.width
    ctx.beginPath()
    ctx.moveTo(startX, startY)
    ctx.quadraticCurveTo((startX + endX) / 2, (startY + endY) / 2 + wave * 0.3, endX, endY)
    ctx.stroke()
  }
  ctx.restore()
}

function drawMeteors(deltaMs) {
  meteors = meteors.filter((meteor) => {
    meteor.life += deltaMs
    const progress = meteor.life / meteor.ttl
    if (progress >= 1) return false

    const step = deltaMs / 1000
    meteor.x += Math.cos(meteor.angle) * meteor.speed * step * 1.6
    meteor.y += Math.sin(meteor.angle) * meteor.speed * step * 1.6

    const t = 1 - progress
    const opacity = t * t * (3 - 2 * t)

    const headX = meteor.x
    const headY = meteor.y
    const tailX = headX - Math.cos(meteor.angle) * meteor.length
    const tailY = headY - Math.sin(meteor.angle) * meteor.length

    // 外层柔光
    ctx.save()
    ctx.globalAlpha = opacity * 0.28
    ctx.shadowColor = 'rgba(180, 210, 255, 0.8)'
    ctx.shadowBlur = 12
    ctx.lineWidth = meteor.width * 3
    ctx.lineCap = 'round'
    ctx.strokeStyle = 'rgba(180, 210, 255, 0.15)'
    ctx.beginPath()
    ctx.moveTo(tailX + (headX - tailX) * 0.6, tailY + (headY - tailY) * 0.6)
    ctx.lineTo(headX, headY)
    ctx.stroke()
    ctx.restore()

    const trail = ctx.createLinearGradient(headX, headY, tailX, tailY)
    trail.addColorStop(0, `rgba(248, 252, 255, ${(opacity * 0.95).toFixed(3)})`)
    trail.addColorStop(0.2, `rgba(220, 238, 255, ${(opacity * 0.7).toFixed(3)})`)
    trail.addColorStop(0.5, `rgba(180, 210, 255, ${(opacity * 0.35).toFixed(3)})`)
    trail.addColorStop(1, 'rgba(140, 180, 240, 0)')

    ctx.lineWidth = meteor.width
    ctx.lineCap = 'round'
    ctx.strokeStyle = trail
    ctx.beginPath()
    ctx.moveTo(tailX, tailY)
    ctx.lineTo(headX, headY)
    ctx.stroke()

    ctx.beginPath()
    ctx.fillStyle = `rgba(255, 255, 255, ${(opacity * 0.85).toFixed(3)})`
    ctx.arc(headX, headY, meteor.width * 1.2, 0, Math.PI * 2)
    ctx.fill()

    return (
      headX < canvasWidth + meteor.length &&
      headY < canvasHeight + meteor.length &&
      headX > -meteor.length &&
      headY > -meteor.length
    )
  })
}

function renderFrame(timestamp) {
  if (!ctx) {
    animationId = requestAnimationFrame(renderFrame)
    return
  }

  const deltaMs = lastTimestamp ? Math.min(50, timestamp - lastTimestamp) : 16
  lastTimestamp = timestamp

  // 指针缓动：让视差跟手但不生硬
  pointer.x += (pointer.tx - pointer.x) * 0.045
  pointer.y += (pointer.ty - pointer.y) * 0.045
  parallaxStyle.value = {
    transform: `translate3d(${(-pointer.x * 7).toFixed(2)}px, ${(-pointer.y * 5).toFixed(2)}px, 0)`
  }

  // 静态背景一次贴回
  if (bgLayer) ctx.drawImage(bgLayer, 0, 0, canvasWidth, canvasHeight)
  drawStars(timestamp, deltaMs)

  if (!reducedMotion) {
    drawWindParticles(timestamp, deltaMs)
    if (timestamp >= nextMeteorAt) {
      spawnMeteor()
      scheduleNextMeteor(timestamp)
    }
    drawMeteors(deltaMs)
  }

  animationId = requestAnimationFrame(renderFrame)
}

function startLoop() {
  if (animationId === null) {
    lastTimestamp = 0
    animationId = requestAnimationFrame(renderFrame)
  }
}

function stopLoop() {
  if (animationId !== null) {
    cancelAnimationFrame(animationId)
    animationId = null
  }
}

let visibilityObserver = null

function onVisibilityChange() {
  if (document.hidden) stopLoop()
  else if (isVisible) startLoop()
}

onMounted(() => {
  reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  syncBannerWallpaper()
  window.addEventListener('banner-wallpaper-change', syncBannerWallpaper)
  window.addEventListener('storage', syncBannerWallpaper)
  window.addEventListener('resize', handleResize, { passive: true })
  document.addEventListener('visibilitychange', onVisibilityChange)

  glowSprite = makeGlowSprite(64)
  setupCanvas()
  scheduleNextMeteor(performance.now())
  startLoop()

  now.value = new Date()
  clockTimer = setInterval(() => (now.value = new Date()), 20_000)

  // 字体加载完成后字宽会变，需要重新量一次，否则逐字渐变会错位
  measureTitle()
  document.fonts?.ready?.then(measureTitle).catch(() => {})
  window.addEventListener('resize', measureTitle, { passive: true })

  if (!reducedMotion) {
    heroRef.value?.addEventListener('pointermove', onPointerMove, { passive: true })
    heroRef.value?.addEventListener('pointerleave', onPointerLeave, { passive: true })
  }

  // 首屏滚出视口后暂停动画：星空很美，但不值得一直烧 GPU
  if ('IntersectionObserver' in window) {
    visibilityObserver = new IntersectionObserver(
      ([entry]) => {
        isVisible = entry.isIntersecting
        if (isVisible && !document.hidden) startLoop()
        else stopLoop()
      },
      { threshold: 0 }
    )
    visibilityObserver.observe(heroRef.value)
  }
})

onBeforeUnmount(() => {
  stopLoop()
  if (resizeId !== null) cancelAnimationFrame(resizeId)
  visibilityObserver?.disconnect()
  clearInterval(clockTimer)
  window.removeEventListener('resize', handleResize)
  window.removeEventListener('resize', measureTitle)
  window.removeEventListener('banner-wallpaper-change', syncBannerWallpaper)
  window.removeEventListener('storage', syncBannerWallpaper)
  document.removeEventListener('visibilitychange', onVisibilityChange)
  heroRef.value?.removeEventListener('pointermove', onPointerMove)
  heroRef.value?.removeEventListener('pointerleave', onPointerLeave)
})
</script>

<style scoped>
.hero {
  position: relative;
  isolation: isolate;
  display: flex;
  align-items: center;
  min-height: 100svh;
  min-height: 100dvh;
  padding: calc(var(--header-h) + var(--space-l)) 0 var(--space-2xl);
  overflow: hidden;
  background: #03060e;
}

.hero__canvas,
.hero__veil,
.hero__grain,
.hero__seam {
  position: absolute;
  inset: 0;
  pointer-events: none;
}
.hero__canvas {
  z-index: 0;
  width: 100%;
  height: 100%;
}
.hero__veil {
  z-index: 1;
  background:
    radial-gradient(circle at 16% 14%, rgba(255, 255, 255, 0.07), transparent 46%),
    linear-gradient(180deg, rgba(3, 6, 14, 0.08) 0%, rgba(3, 6, 14, 0.34) 100%);
}
.hero__grain {
  z-index: 2;
  opacity: 0.15;
  mix-blend-mode: overlay;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='140' height='140' filter='url(%23n)' opacity='0.5'/%3E%3C/svg%3E");
}
.hero__seam {
  z-index: 3;
  top: auto;
  height: 22vh;
  background: linear-gradient(180deg, transparent, var(--ink-900));
}

/* ---------------- 内容 ---------------- */
.hero__inner {
  position: relative;
  z-index: 4;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.35rem;
  max-width: 46rem;
  will-change: transform;
}

.hero__eyebrow {
  margin: 0 0 0.6rem;
  animation: hero-fade 900ms var(--ease-out-expo) 80ms backwards;
}
.hero__live {
  display: inline-flex;
  align-items: center;
  gap: 0.35em;
  margin-left: 0.5rem;
  padding: 0.15rem 0.5rem;
  border-radius: var(--r-full);
  border: 1px solid rgba(94, 234, 212, 0.28);
  background: rgba(94, 234, 212, 0.1);
  color: var(--aurora-c);
  letter-spacing: 0.16em;
}
.hero__live i {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: var(--aurora-c);
  box-shadow: 0 0 8px var(--aurora-c);
  animation: live-pulse 2.2s ease-in-out infinite;
}
@keyframes live-pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.4; transform: scale(0.72); }
}

.hero__title {
  margin: 0;
  font-size: var(--step-5);
  font-weight: 700;
  letter-spacing: -0.035em;
  line-height: 1.02;
}
.hero__title-line {
  display: block;
  /* 逐字渐变对齐到整行宽度：
     --line-w 由 measureTitle() 量出后内联写入（子元素自动继承） */
  --line-w: 100%;
  --title-grad: linear-gradient(108deg, #ffffff 0%, #dbe7ff 34%, #ffffff 62%, #cbd9f6 100%);
  filter: drop-shadow(0 12px 34px rgba(6, 14, 34, 0.6));
}

.hero__desc {
  max-width: 33ch;
  margin: 1rem 0 0;
  font-size: var(--step-1);
  line-height: 1.7;
  color: rgba(226, 236, 252, 0.74);
  animation: hero-fade 900ms var(--ease-out-expo) 720ms backwards;
}

.hero__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.7rem;
  margin-top: 1.5rem;
  animation: hero-fade 900ms var(--ease-out-expo) 840ms backwards;
}
.hero__cta {
  padding: 0.85rem 1.6rem;
  font-size: var(--step-0);
}
.hero__cta--ghost {
  display: inline-flex;
  align-items: center;
  gap: 0.5em;
  border-radius: var(--r-full);
  border: 1px solid rgba(255, 255, 255, 0.28);
  background: rgba(255, 255, 255, 0.07);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  color: #fff;
  font-weight: 560;
  transition:
    background-color var(--dur-2) var(--ease-out-quart),
    border-color var(--dur-2) var(--ease-out-quart),
    transform var(--dur-2) var(--ease-spring);
}
.hero__cta--ghost:hover {
  background: rgba(255, 255, 255, 0.14);
  border-color: rgba(255, 255, 255, 0.44);
  transform: translateY(-2px);
}
.hero__cta--ghost:active {
  transform: translateY(0) scale(0.985);
}

.hero__now {
  display: inline-flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.45rem;
  margin: 1.6rem 0 0;
  font-family: var(--font-mono);
  font-size: var(--step--2);
  letter-spacing: 0.04em;
  color: var(--text-faint);
  animation: hero-fade 900ms var(--ease-out-expo) 960ms backwards;
}
.hero__now-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--aurora-a);
  box-shadow: 0 0 10px var(--aurora-a);
}
.hero__now-sep {
  opacity: 0.4;
}

@keyframes hero-fade {
  from {
    opacity: 0;
    transform: translateY(16px);
  }
  to {
    opacity: 1;
    transform: none;
  }
}

/* ---------------- 滚动提示 ---------------- */
.hero__scroll {
  position: absolute;
  left: 50%;
  bottom: calc(var(--space-m) + env(safe-area-inset-bottom));
  z-index: 4;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.6rem;
  padding: 0.5rem;
  border: none;
  background: none;
  transform: translateX(-50%);
  cursor: pointer;
  animation: hero-fade 1s var(--ease-out-expo) 1.1s backwards;
}
.hero__scroll-label {
  font-family: var(--font-mono);
  font-size: 0.5625rem;
  letter-spacing: 0.34em;
  text-transform: uppercase;
  color: var(--text-faint);
  transition: color var(--dur-2);
}
.hero__scroll:hover .hero__scroll-label {
  color: var(--text-dim);
}
.hero__scroll-line {
  position: relative;
  display: block;
  width: 1px;
  height: 46px;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.14);
}
.hero__scroll-line i {
  position: absolute;
  inset: 0 0 auto 0;
  height: 40%;
  background: linear-gradient(180deg, transparent, var(--aurora-a));
  animation: scroll-run 2.1s var(--ease-in-out) infinite;
}
@keyframes scroll-run {
  0% { transform: translateY(-110%); }
  60%, 100% { transform: translateY(260%); }
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
  border: 0;
}

@media (max-width: 640px) {
  .hero {
    align-items: flex-end;
    padding-bottom: calc(var(--space-2xl) + var(--space-s));
  }
  .hero__desc {
    font-size: var(--step-0);
  }
  .hero__actions {
    width: 100%;
  }
  .hero__cta {
    flex: 1 1 auto;
    justify-content: center;
  }
  .hero__scroll {
    display: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  .hero__inner {
    transition: none;
  }
  .hero__scroll-line i {
    animation: none;
    height: 100%;
    background: rgba(255, 255, 255, 0.2);
  }
}
</style>

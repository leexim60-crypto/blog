<template>
  <section class="banner-bg relative w-full h-[100svh] min-h-[540px] overflow-hidden text-white">
    <canvas ref="skyCanvas" class="sky-canvas" aria-hidden="true"></canvas>
    <div class="sky-overlay" aria-hidden="true"></div>

    <div class="banner-content relative z-10 w-full h-full flex items-center justify-center flex-col text-center px-5">
      <div
        class="w-24 h-24 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center mb-7 text-white shadow-lg"
      >
        <span class="text-4xl font-bold">陈</span>
      </div>

      <h1 class="gradient-title font-extrabold text-4xl sm:text-5xl md:text-6xl mb-4">
        陈Hello的博客
      </h1>

      <p class="gradient-desc text-base sm:text-lg md:text-xl mb-10 max-w-xl leading-relaxed">
        欢迎来到我的数字小宇宙，这里收录了我部署上线的项目
      </p>

      <button
        class="homepage-link outline-none flex justify-center items-center gap-2 px-9 h-12 text-base rounded-full border border-white/60 text-white"
        @click="$emit('openProjects')"
      >
        <el-icon :size="18"><Grid /></el-icon>
        查看我的项目
      </button>
    </div>

    <div class="scroll-hint absolute bottom-7 left-1/2 -translate-x-1/2 z-10 text-white/50 flex flex-col items-center gap-1.5">
      <span class="text-xs tracking-widest">SCROLL</span>
      <el-icon :size="18" class="animate-bounce"><ArrowDownBold /></el-icon>
    </div>
  </section>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'

defineEmits(['openProjects'])

const skyCanvas = ref(null)
let ctx = null
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
const moonX = 0.78
const moonY = 0.15

const easeSine = (t) => -(Math.cos(Math.PI * t) - 1) / 2
const smoothStep = (e0, e1, x) => {
  const t = Math.max(0, Math.min(1, (x - e0) / (e1 - e0)))
  return t * t * (3 - 2 * t)
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
  const dpr = Math.min(window.devicePixelRatio || 1, 2)

  canvasWidth = width
  canvasHeight = height
  canvas.width = Math.floor(width * dpr)
  canvas.height = Math.floor(height * dpr)

  const context = canvas.getContext('2d')
  if (!context) return
  context.setTransform(dpr, 0, 0, dpr, 0, 0)
  ctx = context

  createStars()
  createWindParticles()
  meteors = []
}

function createStars() {
  const area = canvasWidth * canvasHeight
  const count = Math.min(280, Math.max(120, Math.round(area / 7200)))
  const starColors = [
    { r: 229, g: 239, b: 255 },
    { r: 255, g: 244, b: 230 },
    { r: 210, g: 230, b: 255 },
    { r: 255, g: 252, b: 240 },
    { r: 180, g: 210, b: 255 }
  ]

  stars = Array.from({ length: count }, () => {
    const bright = Math.random() > 0.88
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
      color,
      bright
    }
  })
}

function createWindParticles() {
  const count = Math.min(18, Math.max(8, Math.round(canvasWidth / 120)))
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
  nextMeteorAt = now + 4000 + Math.random() * 3000
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
    ttl: 900 + Math.random() * 500,
    sparks: []
  })
}

function drawBackdrop(timestamp) {
  const w = canvasWidth
  const h = canvasHeight

  const gradient = ctx.createLinearGradient(0, 0, 0, h)
  gradient.addColorStop(0, '#020810')
  gradient.addColorStop(0.3, '#04101e')
  gradient.addColorStop(0.6, '#061428')
  gradient.addColorStop(0.85, '#081830')
  gradient.addColorStop(1, '#040e1c')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, w, h)

  const mx = w * moonX
  const my = h * moonY
  const moonGlow = ctx.createRadialGradient(mx, my, 0, mx, my, Math.max(w, h) * 0.7)
  moonGlow.addColorStop(0, 'rgba(160, 195, 255, 0.18)')
  moonGlow.addColorStop(0.15, 'rgba(130, 175, 240, 0.12)')
  moonGlow.addColorStop(0.4, 'rgba(80, 120, 200, 0.06)')
  moonGlow.addColorStop(0.7, 'rgba(40, 70, 140, 0.025)')
  moonGlow.addColorStop(1, 'rgba(4, 10, 28, 0)')
  ctx.fillStyle = moonGlow
  ctx.fillRect(0, 0, w, h)

  const breathe = Math.sin(timestamp * 0.00008) * 0.5 + 0.5
  const breathe2 = Math.sin(timestamp * 0.00012 + 1.2) * 0.5 + 0.5

  const n1Alpha = 0.025 + breathe * 0.015
  const n1 = ctx.createRadialGradient(w * 0.22, h * 0.2, 0, w * 0.22, h * 0.2, w * 0.4)
  n1.addColorStop(0, `rgba(100, 130, 220, ${n1Alpha.toFixed(4)})`)
  n1.addColorStop(0.5, `rgba(60, 80, 160, ${(n1Alpha * 0.4).toFixed(4)})`)
  n1.addColorStop(1, 'rgba(4, 10, 28, 0)')
  ctx.fillStyle = n1
  ctx.fillRect(0, 0, w, h)

  const n2Alpha = 0.012 + breathe2 * 0.008
  const n2 = ctx.createRadialGradient(w * 0.5, h * 0.95, 0, w * 0.5, h * 0.95, w * 0.6)
  n2.addColorStop(0, `rgba(140, 120, 90, ${n2Alpha.toFixed(4)})`)
  n2.addColorStop(0.4, `rgba(80, 70, 60, ${(n2Alpha * 0.4).toFixed(4)})`)
  n2.addColorStop(1, 'rgba(4, 10, 28, 0)')
  ctx.fillStyle = n2
  ctx.fillRect(0, 0, w, h)

  const n3Alpha = 0.008 + breathe * 0.006
  const n3 = ctx.createRadialGradient(w * 0.35, h * 0.6, 0, w * 0.35, h * 0.6, w * 0.5)
  n3.addColorStop(0, `rgba(85, 187, 138, ${n3Alpha.toFixed(4)})`)
  n3.addColorStop(0.5, `rgba(60, 130, 100, ${(n3Alpha * 0.3).toFixed(4)})`)
  n3.addColorStop(1, 'rgba(4, 10, 28, 0)')
  ctx.fillStyle = n3
  ctx.fillRect(0, 0, w, h)
}

function drawMoon(timestamp) {
  const w = canvasWidth
  const h = canvasHeight
  const mx = w * moonX
  const my = h * moonY
  const moonSize = Math.min(w, h) * 0.028

  const haloPulse = 0.9 + Math.sin(timestamp * 0.0001) * 0.1
  const halo = ctx.createRadialGradient(mx, my, moonSize * 0.5, mx, my, moonSize * 12)
  halo.addColorStop(0, `rgba(200, 220, 255, ${(0.08 * haloPulse).toFixed(4)})`)
  halo.addColorStop(0.3, `rgba(160, 190, 240, ${(0.04 * haloPulse).toFixed(4)})`)
  halo.addColorStop(0.6, `rgba(120, 155, 220, ${(0.015 * haloPulse).toFixed(4)})`)
  halo.addColorStop(1, 'rgba(60, 90, 160, 0)')
  ctx.fillStyle = halo
  ctx.fillRect(0, 0, w, h)

  const body = ctx.createRadialGradient(mx - moonSize * 0.15, my - moonSize * 0.15, 0, mx, my, moonSize)
  body.addColorStop(0, 'rgba(245, 248, 255, 0.92)')
  body.addColorStop(0.5, 'rgba(225, 235, 250, 0.85)')
  body.addColorStop(0.85, 'rgba(200, 218, 245, 0.7)')
  body.addColorStop(1, 'rgba(180, 200, 235, 0.4)')

  ctx.beginPath()
  ctx.fillStyle = body
  ctx.arc(mx, my, moonSize, 0, Math.PI * 2)
  ctx.fill()

  ctx.globalAlpha = 0.08
  ctx.fillStyle = 'rgba(120, 140, 180, 1)'
  ctx.beginPath()
  ctx.arc(mx - moonSize * 0.2, my + moonSize * 0.1, moonSize * 0.25, 0, Math.PI * 2)
  ctx.fill()
  ctx.beginPath()
  ctx.arc(mx + moonSize * 0.25, my - moonSize * 0.2, moonSize * 0.18, 0, Math.PI * 2)
  ctx.fill()
  ctx.globalAlpha = 1.0
}

function drawStars(timestamp, deltaMs) {
  for (const star of stars) {
    const t1 = Math.sin(timestamp * star.twinkleSpeed + star.twinkleOffset)
    const t2 = Math.sin(timestamp * star.twinkleSpeed2 + star.twinkleOffset2)
    const twinkle = easeSine((t1 * 0.7 + t2 * 0.3 + 1) / 2)
    const alpha = Math.min(0.95, star.baseAlpha + twinkle * 0.3)
    const { r, g, b } = star.color

    ctx.beginPath()
    ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha.toFixed(3)})`

    if (star.bright) {
      ctx.shadowColor = `rgba(${r}, ${g}, ${b}, 0.4)`
      ctx.shadowBlur = 6
    } else {
      ctx.shadowBlur = 0
    }
    ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2)
    ctx.fill()

    if (star.bright && alpha > 0.55) {
      ctx.shadowBlur = 0
      const spikeAlpha = (alpha - 0.55) * 1.2
      const spikeLen = star.radius * 3.5
      ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${(spikeAlpha * 0.25).toFixed(3)})`
      ctx.lineWidth = 0.4
      ctx.beginPath()
      ctx.moveTo(star.x - spikeLen, star.y)
      ctx.lineTo(star.x + spikeLen, star.y)
      ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(star.x, star.y - spikeLen)
      ctx.lineTo(star.x, star.y + spikeLen)
      ctx.stroke()
    }

    star.x += star.driftX * deltaMs
    star.y += star.driftY * deltaMs
    if (star.x < -4) star.x = canvasWidth + 4
    if (star.x > canvasWidth + 4) star.x = -4
    if (star.y < -4) star.y = canvasHeight + 4
    if (star.y > canvasHeight + 4) star.y = -4
  }
  ctx.shadowBlur = 0
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
    meteor.x += Math.cos(meteor.angle) * meteor.speed * step
    meteor.y += Math.sin(meteor.angle) * meteor.speed * step

    const t = 1 - progress
    const opacity = t * t * (3 - 2 * t)

    const headX = meteor.x
    const headY = meteor.y
    const tailX = headX - Math.cos(meteor.angle) * meteor.length
    const tailY = headY - Math.sin(meteor.angle) * meteor.length

    ctx.save()
    ctx.globalAlpha = opacity * 0.3
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

  drawBackdrop(timestamp)
  drawMoon(timestamp)
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

onMounted(() => {
  reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  setupCanvas()
  scheduleNextMeteor(performance.now())
  animationId = requestAnimationFrame(renderFrame)
  window.addEventListener('resize', handleResize, { passive: true })
})

onBeforeUnmount(() => {
  if (animationId !== null) cancelAnimationFrame(animationId)
  if (resizeId !== null) cancelAnimationFrame(resizeId)
  window.removeEventListener('resize', handleResize)
})
</script>

<style scoped>
.banner-bg {
  isolation: isolate;
  background: #030812;
}

.sky-canvas,
.sky-overlay {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.sky-canvas {
  z-index: 0;
  width: 100%;
  height: 100%;
}

.sky-overlay {
  z-index: 1;
  background:
    radial-gradient(circle at 18% 16%, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0) 45%),
    linear-gradient(180deg, rgba(3, 8, 18, 0.08) 0%, rgba(3, 8, 18, 0.36) 100%);
}

.gradient-title {
  background: linear-gradient(110deg, #f7fbff 5%, #d6e6ff 42%, #f8fbff 78%, #d4e1fa 100%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  -webkit-font-smoothing: antialiased;
  text-shadow: 0 10px 28px rgba(12, 20, 46, 0.44);
}

.gradient-desc {
  background: linear-gradient(120deg, #edf5ff 0%, #cfddf7 55%, #e7eefc 100%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  -webkit-font-smoothing: antialiased;
  text-shadow: 0 6px 22px rgba(8, 15, 36, 0.36);
}

.homepage-link {
  background: rgba(255, 255, 255, 0.18);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.4),
    0 12px 32px rgba(3, 9, 22, 0.28);
  transition:
    transform 240ms ease,
    background-color 240ms ease,
    box-shadow 240ms ease;
}

.homepage-link:hover {
  cursor: pointer;
  transform: translateY(-1px) scale(1.01);
  background: rgba(255, 255, 255, 0.24);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.48),
    0 16px 36px rgba(3, 9, 22, 0.36);
}

@media (prefers-reduced-motion: reduce) {
  .homepage-link {
    transition: none;
  }
}
</style>

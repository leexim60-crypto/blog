<template>
  <div class="nf">
    <!-- 迷你星空：404 页也应该是同一片夜空 -->
    <canvas ref="canvasRef" class="nf__canvas" aria-hidden="true"></canvas>
    <div class="nf__veil" aria-hidden="true"></div>

    <div class="nf__inner shell">
      <p class="eyebrow">Error 404</p>

      <h1 class="nf__code" aria-hidden="true">
        <span class="nf__digit">4</span>
        <span class="nf__digit nf__digit--orb">
          <span class="nf__orb"></span>
        </span>
        <span class="nf__digit">4</span>
      </h1>
      <h2 class="nf__title">这片星域还没被点亮</h2>
      <p class="nf__desc">
        你要找的页面可能已经被移动、删除，或者从来没有存在过。
      </p>

      <div class="nf__actions">
        <router-link to="/" class="btn-aurora">
          <el-icon><HomeFilled /></el-icon> 返回首页
        </router-link>
        <router-link to="/diary" class="btn-ghost">
          <el-icon><Notebook /></el-icon> 去看日记
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'

const canvasRef = ref(null)

/* 极简星空：只画缓慢闪烁的点，不跑流星 —— 404 页要的是安静 */
let ctx = null
let raf = null
let stars = []
let w = 0
let h = 0
let dpr = 1

function setup() {
  const canvas = canvasRef.value
  if (!canvas) return
  const rect = canvas.getBoundingClientRect()
  w = Math.max(1, rect.width)
  h = Math.max(1, rect.height)
  dpr = Math.min(window.devicePixelRatio || 1, 1.75)
  canvas.width = Math.floor(w * dpr)
  canvas.height = Math.floor(h * dpr)
  ctx = canvas.getContext('2d')
  if (!ctx) return
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

  const count = Math.min(220, Math.max(90, Math.round((w * h) / 7000)))
  stars = Array.from({ length: count }, () => ({
    x: Math.random() * w,
    y: Math.random() * h,
    r: Math.random() * 1.1 + 0.25,
    a: Math.random() * 0.5 + 0.15,
    s: Math.random() * 0.0016 + 0.0005,
    o: Math.random() * Math.PI * 2
  }))
}

function draw(t) {
  if (!ctx) return
  ctx.clearRect(0, 0, w, h)
  for (const s of stars) {
    const tw = Math.sin(t * s.s + s.o) * 0.5 + 0.5
    ctx.beginPath()
    ctx.fillStyle = `rgba(226, 238, 255, ${(s.a * (0.45 + tw * 0.55)).toFixed(3)})`
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2)
    ctx.fill()
  }
  raf = requestAnimationFrame(draw)
}

function onResize() {
  setup()
}

onMounted(() => {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    setup()
    // 减弱动效：只画一帧静态星空
    if (ctx) {
      for (const s of stars) {
        ctx.beginPath()
        ctx.fillStyle = `rgba(226, 238, 255, ${s.a.toFixed(3)})`
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2)
        ctx.fill()
      }
    }
  } else {
    setup()
    raf = requestAnimationFrame(draw)
  }
  window.addEventListener('resize', onResize, { passive: true })
})

onBeforeUnmount(() => {
  if (raf !== null) cancelAnimationFrame(raf)
  window.removeEventListener('resize', onResize)
})
</script>

<style scoped>
.nf {
  position: relative;
  isolation: isolate;
  display: grid;
  place-items: center;
  min-height: 100svh;
  min-height: 100dvh;
  padding: calc(var(--header-h) + var(--space-l)) 0 var(--space-2xl);
  overflow: hidden;
}
.nf__canvas,
.nf__veil {
  position: absolute;
  inset: 0;
  pointer-events: none;
}
.nf__canvas {
  z-index: 0;
  width: 100%;
  height: 100%;
}
.nf__veil {
  z-index: 1;
  background: radial-gradient(60% 50% at 50% 45%, rgba(110, 168, 255, 0.09), transparent 68%);
}

.nf__inner {
  position: relative;
  z-index: 2;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
}

/* ---- 404 数字：中间的 0 是一颗会呼吸的星球 ---- */
.nf__code {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.02em;
  margin: 1rem 0 0;
  font-size: clamp(5rem, 18vw, 11rem);
  font-weight: 700;
  line-height: 0.95;
  letter-spacing: -0.05em;
}
.nf__digit {
  background: linear-gradient(180deg, #ffffff 10%, rgba(190, 212, 255, 0.42) 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}
.nf__digit--orb {
  display: inline-grid;
  place-items: center;
  width: 0.72em;
  height: 0.72em;
  margin: 0 0.02em;
}
.nf__orb {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  border: 0.055em solid rgba(190, 212, 255, 0.55);
  box-shadow:
    inset 0 0 0.35em rgba(110, 168, 255, 0.28),
    0 0 0.6em rgba(110, 168, 255, 0.2);
  background: radial-gradient(circle at 34% 30%, rgba(200, 222, 255, 0.2), transparent 62%);
  animation: orb-breathe 4.5s var(--ease-in-out) infinite;
}
@keyframes orb-breathe {
  0%, 100% {
    transform: scale(1);
    box-shadow:
      inset 0 0 0.35em rgba(110, 168, 255, 0.28),
      0 0 0.6em rgba(110, 168, 255, 0.2);
  }
  50% {
    transform: scale(1.06);
    box-shadow:
      inset 0 0 0.5em rgba(110, 168, 255, 0.42),
      0 0 1.1em rgba(110, 168, 255, 0.38);
  }
}

.nf__title {
  margin: 1rem 0 0;
  font-size: var(--step-2);
  font-weight: 660;
  letter-spacing: -0.02em;
}
.nf__desc {
  max-width: 34ch;
  margin: 0.7rem 0 0;
  font-size: var(--step-0);
  color: var(--text-dim);
  line-height: 1.75;
}
.nf__actions {
  display: flex;
  gap: 0.7rem;
  flex-wrap: wrap;
  justify-content: center;
  margin-top: var(--space-m);
}
.nf__actions .btn-aurora,
.nf__actions .btn-ghost {
  padding: 0.8rem 1.5rem;
  font-size: var(--step-0);
}
</style>

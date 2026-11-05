<template>
  <div ref="root" class="moon-explorer" :class="{ 'is-dragging': dragging }">
    <div class="moon-caption"><span>02 / PROJECT MOON</span><em>A little world to explore.</em></div>
    <div class="moon-orbit" aria-hidden="true"></div>
    <span class="moon-cross moon-cross--one" aria-hidden="true">+</span>
    <span class="moon-cross moon-cross--two" aria-hidden="true">+</span>

    <div class="moon-center">
      <div ref="surface" class="moon-surface" :style="bodyStyle" tabindex="0" role="group"
        aria-label="可旋转的项目月球" :aria-describedby="`${uid}-instructions`"
        @pointerdown="pointerDown" @pointermove="pointerMove" @pointerup="pointerUp"
        @pointercancel="cancelDrag" @lostpointercapture="lostCapture" @click.capture="guardClick"
        @keydown="rotateWithKeyboard" @focusin="focusIn" @focusout="focusOut">
        <canvas :key="canvasKey" ref="canvas" class="moon-canvas" aria-hidden="true"
          @webglcontextlost.prevent="contextLost"></canvas>
        <span v-if="!ready" class="moon-loading" aria-hidden="true">正在唤醒月球…</span>
        <a v-for="landing in projected" :key="landing.project.url" v-show="landing.visible"
          class="crater-link" :class="{ 'is-selected': active === landing.index }"
          :data-project="landing.index" :href="landing.project.url" target="_blank" rel="noopener noreferrer"
          :style="landing.style" :tabindex="landing.visible ? 0 : -1"
          :aria-label="`进入${landing.project.displayName || landing.project.name}（新窗口）`"
          @pointerenter="hoverLanding(landing.index)" @pointerleave="leaveLanding"
          @focus="active = landing.index" @blur="active = -1">
          <span class="crater-ring" :style="landing.ringStyle" aria-hidden="true"></span>
          <span class="crater-index" aria-hidden="true">{{ String(landing.index + 1).padStart(2, '0') }}</span>
          <span class="crater-cross" aria-hidden="true">+</span>
        </a>
      </div>
    </div>

    <div class="moon-readout" :class="{ 'has-selection': selected }" aria-live="polite">
      <span class="readout-icon" aria-hidden="true">{{ selected ? '↗' : '◎' }}</span>
      <div><strong>{{ selected ? selected.project.displayName || selected.project.name : '把作品，藏进月球里。' }}</strong>
        <span>{{ selected ? '点击月面陨石坑，进入这个作品' : '拖动旋转 · 松手回弹 · 点击陨石坑探索' }}</span></div>
      <span class="readout-number">{{ selected ? String(selected.index + 1).padStart(2, '0') : String(projects.length).padStart(2, '0') }}</span>
    </div>

    <div class="moon-tools">
      <div class="moon-landings" aria-label="定位月球上的作品">
        <button v-for="landing in landings" :key="landing.project.url" type="button"
          :aria-label="`定位${landing.project.displayName || landing.project.name}的陨石坑`"
          :title="landing.project.displayName || landing.project.name" :aria-pressed="active === landing.index"
          @click="locate(landing.index)">{{ String(landing.index + 1).padStart(2, '0') }}</button>
      </div>
      <div class="moon-actions"><button type="button" :aria-pressed="autoRotate" @click="toggleAuto">{{ autoRotate ? '暂停旋转' : '自动旋转' }}</button>
        <button type="button" aria-label="将月球恢复到初始位置" @click="reset">复位 <span aria-hidden="true">↺</span></button></div>
    </div>
    <p :id="`${uid}-instructions`" class="moon-help">拖动月面转一转，或用方向键探索；点击编号定位作品。</p>
    <span class="sr-only" role="status">{{ ready ? '月球已就绪，可拖动旋转并点击陨石坑进入项目。' : '月球正在加载。' }}</span>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch, nextTick, getCurrentInstance } from 'vue'
import { createMoonRenderer, projectLandings, rotatePoint, TAU } from '../utils/moonRenderer'

const props = defineProps({ projects: {type:Array, default:() => []} })
const uid = `moon-${getCurrentInstance().uid}`
const root = ref(null), canvas = ref(null), surface = ref(null)
const canvasKey = ref(0), ready = ref(false), dragging = ref(false)
const yaw = ref(-.08), pitch = ref(-.06), active = ref(-1), size = ref(360)
const autoRotate = ref(false), deformation = ref({x:0, y:0, sx:0, sy:0})
const landings = computed(() => projectLandings(props.projects))
const selected = computed(() => landings.value[active.value])
const bodyStyle = computed(() => {
  const d = deformation.value
  return {transform:`translate3d(${d.x}px, ${d.y}px, 0) scale(${1 + d.sx}, ${1 + d.sy})`}
})
const projected = computed(() => landings.value.map(l => {
  const [x,y,z] = rotatePoint(l.point, yaw.value, pitch.value), r = size.value * .455
  const diameter = Math.max(44, l.radius * r * 2)
  return {...l, visible:z > .2, style:{left:`${size.value / 2 + x * r}px`, top:`${size.value / 2 - y * r}px`, width:`${diameter}px`, height:`${diameter}px`, opacity:Math.min(1, (z - .1) / .3)}, ringStyle:{transform:`rotate(${Math.atan2(-y, x)}rad) scaleX(${Math.max(.2,z)})`}}
}))

let renderer, frame = 0, lastTime = 0, visible = true, reduced = false, focusInside = false
let resizeObserver, intersectionObserver, motionQuery, disposed = false, fallback = false
let drag, clickBlockedUntil = 0, velocity = {yaw:0, pitch:0}, springVelocity = {x:0,y:0,sx:0,sy:0}, target
const clamp = (n, min, max) => Math.max(min, Math.min(max,n))
const angleDelta = (to, from) => ((to - from + Math.PI) % TAU + TAU) % TAU - Math.PI

function schedule() {
  if (!frame && visible && !document.hidden && !disposed && renderer) frame = requestAnimationFrame(animate)
}
function animate(now) {
  frame = 0
  if (disposed || !visible || document.hidden || !renderer) return
  const dt = Math.min(.033, lastTime ? (now - lastTime) / 1000 : 1 / 60)
  lastTime = now
  let moving = false
  if (target && !dragging.value) {
    const dx = angleDelta(target.yaw, yaw.value), dy = target.pitch - pitch.value
    const lerp = reduced ? 1 : 1 - Math.exp(-dt * 8)
    yaw.value += dx * lerp; pitch.value += dy * lerp
    if (Math.abs(dx) + Math.abs(dy) < .002) {yaw.value = target.yaw; pitch.value = target.pitch; target = null}
    moving = true
  } else if (!dragging.value) {
    if (!reduced && Math.abs(velocity.yaw) + Math.abs(velocity.pitch) > .002) {
      yaw.value += velocity.yaw * dt; pitch.value = clamp(pitch.value + velocity.pitch * dt,-1.15,1.15)
      const decay = Math.exp(-dt * 3.8); velocity.yaw *= decay; velocity.pitch *= decay; moving = true
    } else if (autoRotate.value && !focusInside && active.value < 0) {yaw.value += dt * .055; moving = true}
  }
  if (!dragging.value && !reduced) {
    const d = {...deformation.value}
    for (const key of ['x','y','sx','sy']) {
      springVelocity[key] += (-d[key] * 210 - springVelocity[key] * 13) * dt
      d[key] += springVelocity[key] * dt
      if (Math.abs(d[key]) > (key.length === 1 ? .005 : .00005) || Math.abs(springVelocity[key]) > .002) moving = true
      else {d[key] = 0; springVelocity[key] = 0}
    }
    deformation.value = d
  }
  renderer.draw(yaw.value, pitch.value)
  if (moving || dragging.value) schedule()
}
function halt() {cancelAnimationFrame(frame); frame = 0; lastTime = 0}

function pointerDown(event) {
  if (drag || !event.isPrimary || event.button !== 0) return
  const rect = surface.value.getBoundingClientRect(), dx = event.clientX - rect.left - rect.width / 2, dy = event.clientY - rect.top - rect.height / 2
  if (dx * dx + dy * dy > (rect.width * .47) ** 2) return
  drag = {id:event.pointerId, startX:event.clientX, startY:event.clientY, x:event.clientX, y:event.clientY, time:event.timeStamp, moved:false, captured:false}
  target = null; velocity = {yaw:0,pitch:0}; active.value = -1
}
function pointerMove(event) {
  if (!drag || event.pointerId !== drag.id) return
  const dx = event.clientX - drag.x, dy = event.clientY - drag.y
  if (!drag.moved && Math.hypot(event.clientX - drag.startX,event.clientY - drag.startY) > 6) {
    drag.moved = true; dragging.value = true; active.value = -1
    surface.value.setPointerCapture(event.pointerId); drag.captured = true
  }
  if (drag.moved) {
    const speed = 2.5 / size.value, dt = Math.max(8,event.timeStamp - drag.time) / 1000
    yaw.value += dx * speed; pitch.value = clamp(pitch.value + dy * speed,-1.15,1.15)
    velocity = {yaw:clamp(dx * speed / dt,-3.4,3.4), pitch:clamp(dy * speed / dt,-2.2,2.2)}
    if (!reduced) deformation.value = {x:clamp(dx * .22,-7,7), y:clamp(dy * .22,-7,7), sx:clamp(Math.abs(dx) * .0008 - Math.abs(dy) * .0004,-.026,.036), sy:clamp(Math.abs(dy) * .0008 - Math.abs(dx) * .0004,-.026,.036)}
    event.preventDefault(); schedule()
  }
  drag.x = event.clientX; drag.y = event.clientY; drag.time = event.timeStamp
}
function finishDrag(event, cancelled = false) {
  if (!drag || event.pointerId !== drag.id) return
  const previous = drag; drag = null; dragging.value = false
  if (previous.moved) {
    clickBlockedUntil = performance.now() + 450
    // Stopping the pointer before release should stop angular inertia too.
    if (cancelled || reduced || event.timeStamp - previous.time > 90) velocity = {yaw:0,pitch:0}
    if (!reduced && !cancelled) {springVelocity.x = deformation.value.x * 5; springVelocity.y = deformation.value.y * 5}
  }
  if (previous.captured && surface.value?.hasPointerCapture(previous.id)) surface.value.releasePointerCapture(previous.id)
  schedule()
}
const pointerUp = e => finishDrag(e)
const cancelDrag = e => finishDrag(e,true)
function lostCapture(e) {if (drag?.id === e.pointerId) finishDrag(e,true)}
function guardClick(e) {if (e.detail !== 0 && performance.now() < clickBlockedUntil) {e.preventDefault(); e.stopPropagation()}}
function hoverLanding(index) {if (!drag && !dragging.value && performance.now() > clickBlockedUntil) {active.value = index; velocity = {yaw:0,pitch:0}}}
function leaveLanding() {if (!focusInside) {active.value = -1; schedule()}}
function focusIn() {focusInside = true; velocity = {yaw:0,pitch:0}}
function focusOut(e) {if (!surface.value?.contains(e.relatedTarget)) {focusInside = false; active.value = -1; schedule()}}
function rotateWithKeyboard(e) {
  if (e.target !== surface.value) return
  const move = {ArrowLeft:[-.2,0],ArrowRight:[.2,0],ArrowUp:[0,-.16],ArrowDown:[0,.16]}[e.key]
  if (!move) {if(e.key === 'Home') {e.preventDefault(); reset()} return}
  e.preventDefault(); target = null; active.value = -1; velocity = {yaw:0,pitch:0}
  yaw.value += move[0]; pitch.value = clamp(pitch.value + move[1],-1.15,1.15); schedule()
}
function locate(index) {
  const l = landings.value[index]
  if (!l) return
  velocity = {yaw:0,pitch:0}; active.value = index
  target = {yaw:-l.lon, pitch:l.lat}; schedule()
}
function reset() {
  target = {yaw:-.08,pitch:-.06}; active.value = -1; velocity = {yaw:0,pitch:0}; schedule()
}
function toggleAuto() {autoRotate.value = !autoRotate.value; active.value = -1; velocity = {yaw:0,pitch:0}; schedule()}
function resize() {
  if (!surface.value || !renderer) return
  size.value = surface.value.clientWidth
  renderer.resize(size.value,Math.min(devicePixelRatio || 1,2)); schedule()
}
async function mountRenderer() {
  ready.value = false; halt(); renderer?.dispose(); renderer = null
  await nextTick()
  if (disposed || !canvas.value) return
  try {renderer = createMoonRenderer(canvas.value,landings.value,fallback)}
  catch {
    if (fallback) return
    fallback = true; canvasKey.value++; await nextTick()
    if (!disposed) renderer = createMoonRenderer(canvas.value,landings.value,true)
  }
  if (disposed) {renderer?.dispose(); return}
  ready.value = true; resize()
}
function contextLost() {fallback = true; canvasKey.value++; mountRenderer()}
function visibilityChanged() {if (document.hidden) halt(); else schedule()}
function motionChanged() {
  reduced = motionQuery.matches; autoRotate.value = !reduced
  velocity = {yaw:0,pitch:0}; springVelocity = {x:0,y:0,sx:0,sy:0}
  deformation.value = {x:0,y:0,sx:0,sy:0}; schedule()
}
watch(() => props.projects.map(p => p.url).join('|'), () => {active.value = -1; mountRenderer()})
onMounted(async () => {
  motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)'); reduced = motionQuery.matches; autoRotate.value = !reduced
  motionQuery.addEventListener('change',motionChanged)
  document.addEventListener('visibilitychange',visibilityChanged)
  resizeObserver = new ResizeObserver(resize); resizeObserver.observe(surface.value)
  intersectionObserver = new IntersectionObserver(entries => {visible = entries[0].isIntersecting; if (visible) schedule(); else halt()},{threshold:.03})
  intersectionObserver.observe(root.value)
  await mountRenderer()
})
onBeforeUnmount(() => {
  disposed = true; halt(); drag = null; renderer?.dispose(); renderer = null
  resizeObserver?.disconnect(); intersectionObserver?.disconnect()
  motionQuery?.removeEventListener('change',motionChanged); document.removeEventListener('visibilitychange',visibilityChanged)
})
</script>

<style scoped>
.moon-explorer {
  position: relative;
  height: 520px;
  min-width: 0;
  isolation: isolate;
}

.moon-caption {
  position: absolute;
  top: 8px;
  right: 0;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 7px;
  color: var(--text-faint);
}

.moon-caption>span {
  font: 9px var(--font-mono);
  letter-spacing: .1em;
}

.moon-caption em {
  font: italic 20px var(--font-serif);
  color: #98b3a2;
}

.moon-center {
  position: absolute;
  inset: 38px 0 auto;
  display: flex;
  justify-content: center;
}

.moon-surface {
  position: relative;
  width: 360px;
  height: 360px;
  border-radius: 50%;
  touch-action: none;
  user-select: none;
  cursor: grab;
  will-change: transform;
}

.moon-surface:focus-visible {
  outline: 1px dashed #b4dfc266;
  outline-offset: 7px;
  border-radius: 50%;
}

.is-dragging .moon-surface, .is-dragging .crater-link {
  cursor: grabbing;
}

.moon-canvas {
  display: block;
  width: 100%;
  height: 100%;
  pointer-events: none;
  border-radius: 50%;
  filter: drop-shadow(-12px -7px 28px #b4dfc209);
}

.moon-loading {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  font-size: 11px;
  color: var(--text-dim);
  border: 1px solid var(--hairline);
  border-radius: 50%;
  background: radial-gradient(circle at 35% 30%,#66847355,#111a16);
}

.moon-orbit {
  position: absolute;
  width: 440px;
  max-width: 100%;
  height: 220px;
  left: 50%;
  top: 205px;
  transform: translate(-50%,-50%) rotate(-32deg);
  border: 1px solid #a2d9bc16;
  border-radius: 50%;
  pointer-events: none;
}

.moon-cross {
  position: absolute;
  color: #94ae9b70;
  font: 19px var(--font-sans);
  pointer-events: none;
}

.moon-cross--one {
  top: 45px;
  left: 9%;
}

.moon-cross--two {
  top: 340px;
  right: 2%;
}

.crater-link {
  position: absolute;
  transform: translate(-50%,-50%);
  display: grid;
  place-items: center;
  border-radius: 50%;
  color: #e2f4e6;
  -webkit-user-drag: none;
  cursor: pointer;
  transition: color .2s;
}

.crater-link:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 4px;
  border-radius: 50%;
}

.crater-ring {
  position: absolute;
  inset: 2px;
  border: 1px dashed #bce5c77d;
  border-radius: 50%;
  box-shadow: 0 0 9px #a8d9b81a,inset 0 0 7px #a8d9b813;
  pointer-events: none;
  opacity: .66;
  transition: opacity .2s,border-color .2s;
}

.crater-index {
  position: absolute;
  font: 9px var(--font-mono);
  left: 50%;
  top: 50%;
  transform: translate(-50%,9px);
  letter-spacing: .08em;
  text-shadow: 0 1px 5px #000;
  pointer-events: none;
}

.crater-cross {
  font: 16px var(--font-mono);
  font-weight: 300;
  text-shadow: 0 1px 5px #000;
  pointer-events: none;
  opacity: .8;
}

.crater-link:hover .crater-ring,.crater-link.is-selected .crater-ring {
  opacity: 1;
  border-color: #ceefd8;
  border-style: solid;
  box-shadow: 0 0 15px #b4dfc250,inset 0 0 12px #b4dfc230;
}

.crater-link:hover,.crater-link.is-selected {
  color: #d9ffe2;
}

.is-dragging .crater-ring {
  opacity: .25;
}

.moon-readout {
  position: absolute;
  left: 50%;
  bottom: 56px;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 12px;
  width: 315px;
  max-width: 95%;
  border: 1px solid #b4dfc221;
  background: #142019ed;
  padding: 13px 17px;
  border-radius: 10px;
  backdrop-filter: blur(14px);
  pointer-events: none;
  transition: border-color .2s;
}

.has-selection {
  border-color: #b4dfc24a;
}

.readout-icon {
  color: var(--accent);
  font: 24px var(--font-serif);
}

.moon-readout>div {
  min-width: 0;
  flex: 1;
}

.moon-readout strong {
  display: block;
  font-size: 12px;
  font-weight: 450;
  color: #d8e8dc;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.moon-readout div>span {
  display: block;
  font-size: 9px;
  margin-top: 5px;
  color: var(--text-dim);
}

.readout-number {
  font: 10px var(--font-mono);
  color: var(--accent);
}

.moon-tools {
  position: absolute;
  bottom: 18px;
  left: 50%;
  transform: translateX(-50%);
  width: 315px;
  max-width: 95%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.moon-landings,.moon-actions {
  display: flex;
  align-items: center;
  gap: 6px;
}

.moon-tools button {
  border: 1px solid var(--hairline);
  background: #b4dfc204;
  border-radius: 5px;
  cursor: pointer;
  color: var(--text-dim);
  font-size: 9px;
  padding: 5px 8px;
  min-height: 28px;
}

.moon-tools button:hover,.moon-tools button[aria-pressed=true] {
  color: var(--accent);
  border-color: #b4dfc235;
  background: var(--accent-soft);
}

.moon-landings button {
  font: 9px var(--font-mono);
  min-width: 29px;
}

.moon-actions button {
  border-color: transparent;
}

.moon-actions button>span {
  margin-left: 5px;
  font-size: 13px;
}

.moon-help {
  position: absolute;
  left: 0;
  right: 0;
  bottom: -8px;
  text-align: center;
  font-size: 8px;
  color: var(--text-faint);
  margin: 0;
}

@media (max-width:1000px) {
  .moon-explorer {
    height: 470px;
  }
  .moon-surface {
    width: 300px;
    height: 300px;
  }
  .moon-center {
    top: 45px;
  }
  .moon-readout,.moon-tools {
    width: 285px;
  }
  .moon-caption>span {
    font-size: 8px;
  }
  .moon-caption em {
    font-size: 18px;
  }
}

@media (max-width:640px) {
  .moon-explorer {
    height: 435px;
    margin-top: 18px;
  }
  .moon-surface {
    width: 285px;
    height: 285px;
  }
  .moon-center {
    top: 31px;
  }
  .moon-orbit {
    width: 330px;
    height: 170px;
    top: 170px;
  }
  .moon-caption {
    top: 0;
    right: 4%;
  }
  .moon-caption>span {
    font-size: 7px;
  }
  .moon-caption em {
    display: none;
  }
  .moon-readout {
    bottom: 58px;
    padding: 12px 14px;
  }
  .moon-tools {
    bottom: 18px;
  }
  .moon-help {
    font-size: 7px;
    bottom: -6px;
  }
  .moon-cross--two {
    top: 290px;
  }
}

@media (prefers-reduced-motion:reduce) {
  .moon-surface {
    will-change: auto;
  }
  .crater-link,.crater-ring {
    transition: none;
  }
}
</style>

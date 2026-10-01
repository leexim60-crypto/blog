<template>
  <!-- 页面小组件栏：
       窄屏（<768）→ 右下角悬浮按钮 + 底部抽屉
       中屏（768–1831）→ 右侧抽屉式浮层（带遮罩，点击遮罩关闭）
       超宽（≥1832）→ 停靠在右侧留白里，默认展开、不遮挡内容 -->
  <div v-if="isOverlay && open" class="widget-scrim" @click="toggle" aria-hidden="true"></div>

  <aside
    class="widget-rail"
    :class="{ 'is-open': open, 'is-docked': isDocked, 'is-overlay': isOverlay }"
    aria-label="页面小组件"
  >
    <!-- 收起状态的竖排拉手 -->
    <button
      v-if="!open"
      class="widget-handle"
      type="button"
      aria-label="展开页面小组件"
      :aria-expanded="open"
      @click="toggle"
    >
      <el-icon><MagicStick /></el-icon>
      <span class="widget-handle-text">小挂件</span>
    </button>

    <div v-else class="widget-panel" role="region" aria-label="页面小组件面板">
      <div class="widget-panel-head">
        <span><el-icon><MagicStick /></el-icon> 页面小挂件</span>
        <div class="flex items-center gap-1">
          <button
            class="widget-mini-btn"
            type="button"
            title="组件设置"
            aria-label="组件设置"
            :aria-pressed="showSettings"
            @click="showSettings = !showSettings"
          >
            <el-icon><Setting /></el-icon>
          </button>
          <button
            class="widget-mini-btn"
            type="button"
            title="收起"
            aria-label="收起小组件面板"
            @click="toggle"
          >
            <el-icon><Fold /></el-icon>
          </button>
        </div>
      </div>

      <!-- 设置面板：勾选要显示的组件 -->
      <transition name="widget-slide">
        <div v-if="showSettings" class="widget-settings">
          <p class="widget-settings-tip">勾选你想显示的小挂件，选择会记住在本机</p>
          <label v-for="w in allWidgets" :key="w.key" class="widget-setting-item">
            <el-checkbox :model-value="enabled.includes(w.key)" @change="toggleWidget(w.key)" />
            <span class="widget-setting-name">{{ w.name }}</span>
            <span class="widget-setting-desc">{{ w.desc }}</span>
          </label>
        </div>
      </transition>

        <div class="widget-list">
          <component v-for="w in visibleWidgets" :key="w.key" :is="w.comp" />
          <p v-if="!visibleWidgets.length" class="widget-empty">还没有开启任何挂件，点右上角齿轮勾选 ✨</p>
        </div>
      </div>
    </aside>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch, defineAsyncComponent } from 'vue'
import { useRoute } from 'vue-router'

const WidgetClock = defineAsyncComponent(() => import('./WidgetClock.vue'))
const WidgetWeather = defineAsyncComponent(() => import('./WidgetWeather.vue'))
const WidgetStats = defineAsyncComponent(() => import('./WidgetStats.vue'))
const WidgetQuote = defineAsyncComponent(() => import('./WidgetQuote.vue'))
const WidgetMusic = defineAsyncComponent(() => import('./WidgetMusic.vue'))
const WidgetBingWallpaper = defineAsyncComponent(() => import('./WidgetBingWallpaper.vue'))
const WidgetCalendar = defineAsyncComponent(() => import('./WidgetCalendar.vue'))
const WidgetCountdown = defineAsyncComponent(() => import('./WidgetCountdown.vue'))

const STORAGE_KEY = 'blog_widgets_v1'

// 全部可选挂件（顺序即展示顺序）
const allWidgets = [
  { key: 'clock', name: '时钟', desc: '时间 / 日期 / 今日进度', comp: WidgetClock },
  { key: 'weather', name: '天气', desc: '自动定位实时天气', comp: WidgetWeather },
  { key: 'stats', name: '小站统计', desc: '日记数 / 阅读量 / 运行天数', comp: WidgetStats },
  { key: 'countdown', name: '节日倒计时', desc: '下一个节日还有几天', comp: WidgetCountdown },
  { key: 'quote', name: '一言', desc: '随机一句好句子', comp: WidgetQuote },
  { key: 'music', name: '随机听听', desc: '网易云热歌随机播放', comp: WidgetMusic },
  { key: 'wallpaper', name: '每日一图', desc: 'Bing 壁纸，可设为横幅背景', comp: WidgetBingWallpaper },
  { key: 'calendar', name: '日记日历', desc: '有日记的日期会亮起小点', comp: WidgetCalendar }
]

const DEFAULT_ENABLED = ['clock', 'weather', 'stats', 'countdown', 'quote', 'music', 'wallpaper', 'calendar']

const route = useRoute()

/* 视口分档（与下方 CSS 断点保持一致）：
   - ≥1832px：右侧留白放得下 320px 面板（容器宽 1152 居中，
     需 VW/2 ≥ 1152/2 + 20 间隙 + 320 → VW ≥ 1832），停靠展开
   - 768–1831px：以浮层形式展开（带遮罩），默认收起
   - <768px：底部抽屉 */
const DOCK_MIN = 1832
const SHEET_MAX = 767

const vw = ref(typeof window !== 'undefined' ? window.innerWidth : 0)
const isDocked = computed(() => vw.value >= DOCK_MIN)
const isOverlay = computed(() => vw.value > SHEET_MAX && vw.value < DOCK_MIN)

// 初始状态先按「窄屏收起」，再由 load() 根据本机记忆与视口修正，
// 避免 SSR / 首帧闪烁
const open = ref(false)
const showSettings = ref(false)
const enabled = ref([...DEFAULT_ENABLED])

const visibleWidgets = computed(() => allWidgets.filter((w) => enabled.value.includes(w.key)))

/* 用户是否亲手开合过面板。一旦手动操作过，就完全尊重用户的选择，
   不再因为「换个视口档位」自动展开/收起，否则会在拖窗口时反复弹跳。 */
const userToggled = ref(false)

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const obj = JSON.parse(raw)
      if (Array.isArray(obj.enabled)) enabled.value = obj.enabled
      if (typeof obj.open === 'boolean') {
        open.value = obj.open
        userToggled.value = true
      }
    }
  } catch (e) {
    /* 隐私模式下 localStorage 不可用，用默认值即可 */
  }
  // 没存过偏好时，只有停靠档才默认展开
  if (!userToggled.value) open.value = isDocked.value
}

function save() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ enabled: enabled.value, open: open.value }))
  } catch (e) {
    /* ignore */
  }
}

function toggle() {
  userToggled.value = true
  open.value = !open.value
}

function toggleWidget(key) {
  const i = enabled.value.indexOf(key)
  if (i >= 0) enabled.value.splice(i, 1)
  else enabled.value.push(key)
}

watch([enabled, open], save, { deep: true })

// 停靠态给 <html> 加标记：style.css 里据此给 body 预留右侧宽度
watch(
  isDocked,
  (docked) => {
    document.documentElement.classList.toggle('rail-docked', docked)
  },
  { immediate: true }
)

// 停靠态下才默认展开；用户手动收起后就保持收起
watch(isDocked, (docked) => {
  if (!userToggled.value) open.value = docked
})

onMounted(() => {
  load()
  // 日记详情/编辑页专注阅读写作，自动收起挂件
  if (route.path.startsWith('/diary/') && route.path !== '/diary') open.value = false
  window.addEventListener('resize', onResize, { passive: true })
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', onResize)
  document.documentElement.classList.remove('rail-docked')
})

// 视口变到「放不下面板」的档位时收起，避免内容被遮挡；
// 反过来变大不会自动弹开，把主动权留给用户
function onResize() {
  vw.value = window.innerWidth
  if (!isDocked.value && open.value) open.value = false
}
</script>

<style scoped>
/* ============================ 遮罩（浮层形态） ============================ */
/* z-index 高于顶栏（--z-header: 50），否则顶栏会浮在遮罩之上，
   既不被压暗、也仍然可点，看起来像遮罩没生效 */
.widget-scrim {
  position: fixed;
  inset: 0;
  z-index: 60;
  background: rgba(3, 6, 14, 0.62);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  animation: scrim-in var(--dur-3) var(--ease-out-quart);
}
@keyframes scrim-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* ============================ 停靠态：占位 ============================ */
/* 停靠时给 body 右侧留出面板宽度，避免内容被盖住。
   用 :global 因为要作用到 <html>/<body> 上 */
:global(html.rail-docked) body {
  padding-right: 320px;
}

/* 顶栏是 fixed 定位，不会跟随 body 的 padding，
   需要单独让出右侧宽度，否则内容会与面板左对齐而顶栏仍居中 */
:global(html.rail-docked) .site-header {
  right: 320px;
}

.widget-rail {
  position: fixed;
  right: 0;
  top: 50%;
  transform: translateY(-50%);
  z-index: var(--z-rail);
  display: flex;
  align-items: center;
  max-height: 88vh;
}

/* 浮层形态：抬到顶栏之上，面板与遮罩同层 */
.widget-rail.is-overlay {
  z-index: 61;
}

/* 停靠态：贴着视口右侧，占满高度 */
.widget-rail.is-docked {
  top: 0;
  bottom: 0;
  transform: none;
  max-height: none;
  align-items: stretch;
}

/* 收起拉手 */
.widget-handle {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 14px 8px;
  border: 1px solid var(--hairline);
  border-right: none;
  border-radius: var(--r-s) 0 0 var(--r-s);
  background: rgba(6, 18, 36, 0.78);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  color: var(--text-dim);
  cursor: pointer;
  box-shadow: -6px 0 24px rgba(2, 8, 20, 0.5);
  transition:
    color var(--dur-2) var(--ease-out-quart),
    background-color var(--dur-2) var(--ease-out-quart),
    padding-right var(--dur-3) var(--ease-out-expo);
}
.widget-handle:hover {
  color: #fff;
  background: rgba(30, 70, 130, 0.85);
  padding-right: 12px;
}
.widget-handle-text {
  writing-mode: vertical-rl;
  font-size: 12px;
  letter-spacing: 2px;
}

/* 展开面板 */
.widget-panel {
  width: 320px;
  max-height: 88vh;
  overflow-y: auto;
  padding: 16px;
  border-left: 1px solid var(--hairline);
  background: linear-gradient(180deg, rgba(8, 22, 42, 0.92), rgba(4, 12, 26, 0.94));
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  box-shadow: -18px 0 50px rgba(2, 8, 20, 0.6);
  border-radius: var(--r-m) 0 0 var(--r-m);
  animation: widget-in 0.3s var(--ease-out-expo);
}
@keyframes widget-in {
  from { opacity: 0; transform: translateX(16px); }
  to { opacity: 1; transform: translateX(0); }
}
.widget-panel::-webkit-scrollbar {
  width: 4px;
}
.widget-panel::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.15);
  border-radius: 2px;
}

.widget-panel-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 13px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.85);
  padding-bottom: 10px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}
.widget-panel-head > span {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.widget-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 12px;
}

/* 设置面板 */
.widget-settings {
  margin-top: 12px;
  padding: 12px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
}
.widget-settings-tip {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.35);
  margin-bottom: 8px;
}
.widget-setting-item {
  display: grid;
  grid-template-columns: 22px 1fr;
  grid-template-rows: auto auto;
  align-items: center;
  column-gap: 6px;
  padding: 6px 0;
  cursor: pointer;
}
.widget-setting-item :deep(.el-checkbox) {
  grid-row: span 2;
  height: auto;
}
.widget-setting-item :deep(.el-checkbox__label) {
  display: none;
}
.widget-setting-name {
  font-size: 12.5px;
  color: rgba(255, 255, 255, 0.78);
}
.widget-setting-desc {
  font-size: 10.5px;
  color: rgba(255, 255, 255, 0.32);
  grid-column: 2;
}

.widget-empty {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.35);
  text-align: center;
  padding: 20px 0;
}

.widget-slide-enter-active,
.widget-slide-leave-active {
  transition: all 0.25s ease;
}
.widget-slide-enter-from,
.widget-slide-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}

/* ================= 浮层 / 抽屉形态（<1832px） ================= */
/* 右侧滑入的浮层面板：与停靠态区分开，靠遮罩避免误触 */
@media (max-width: 1831px) {
  .widget-panel {
    position: fixed;
    top: 50%;
    right: 0;
    transform: translateY(-50%);
    max-height: 86vh;
    border-radius: var(--r-m) 0 0 var(--r-m);
    animation: widget-in 0.3s var(--ease-out-expo);
  }
}

/* 移动端 / 窄屏：改成右下角悬浮按钮 + 底部抽屉，功能不缺失 */
@media (max-width: 767px) {
  .widget-rail {
    top: auto;
    bottom: 0;
    left: 0;
    right: 0;
    transform: none;
    max-height: none;
    pointer-events: none;
  }

  .widget-handle {
    pointer-events: auto;
    position: fixed;
    right: 14px;
    bottom: calc(16px + env(safe-area-inset-bottom));
    flex-direction: row;
    padding: 12px 16px;
    border-radius: var(--r-full);
    border-right: 1px solid var(--hairline);
    box-shadow: 0 8px 28px rgba(2, 8, 20, 0.6);
  }

  .widget-handle-text {
    writing-mode: horizontal-tb;
    font-size: 13px;
    letter-spacing: 1px;
  }

  .widget-panel {
    pointer-events: auto;
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
    width: 100%;
    max-height: 72vh;
    border-radius: var(--r-l) var(--r-l) 0 0;
    border-left: none;
    border-top: 1px solid var(--hairline);
    padding-bottom: calc(16px + env(safe-area-inset-bottom));
    animation: widget-up 0.3s var(--ease-out-expo);
  }

  @keyframes widget-up {
    from { transform: translateY(100%); }
    to { transform: translateY(0); }
  }
}
/* 停靠态面板：不再需要负向外阴影，改为内部分隔线 */
.widget-rail.is-docked .widget-panel {
  border-radius: 0;
  border-left: 1px solid var(--hairline);
  box-shadow: none;
  height: 100%;
  max-height: 100%;
  padding-top: calc(var(--header-h) + var(--space-s));
  padding-bottom: var(--space-s);
  animation: none;
}
</style>

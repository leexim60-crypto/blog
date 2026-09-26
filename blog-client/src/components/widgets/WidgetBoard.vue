<template>
  <!-- 桌面端：右侧固定悬浮挂件栏（可折叠） -->
  <aside class="widget-rail" :class="{ 'is-open': open }" aria-label="页面小组件">
    <!-- 收起状态的竖排拉手 -->
    <button v-if="!open" class="widget-handle" title="展开小组件" @click="toggle">
      <el-icon><MagicStick /></el-icon>
      <span class="widget-handle-text">小挂件</span>
    </button>

    <div v-else class="widget-panel">
      <div class="widget-panel-head">
        <span><el-icon><MagicStick /></el-icon> 页面小挂件</span>
        <div class="flex items-center gap-1">
          <button class="widget-mini-btn" title="组件设置" @click="showSettings = !showSettings">
            <el-icon><Setting /></el-icon>
          </button>
          <button class="widget-mini-btn" title="收起" @click="toggle">
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
import { ref, computed, onMounted, watch, defineAsyncComponent } from 'vue'
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
// 宽屏默认展开（一屏放得下），窄屏默认收起成悬浮按钮，避免遮住内容
const open = ref(typeof window !== 'undefined' ? window.innerWidth > 1180 : true)
const showSettings = ref(false)
const enabled = ref([...DEFAULT_ENABLED])

const visibleWidgets = computed(() => allWidgets.filter((w) => enabled.value.includes(w.key)))

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const obj = JSON.parse(raw)
      if (Array.isArray(obj.enabled)) enabled.value = obj.enabled
      if (typeof obj.open === 'boolean') open.value = obj.open
    }
  } catch (e) {
    /* ignore */
  }
}

function save() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ enabled: enabled.value, open: open.value }))
  } catch (e) {
    /* ignore */
  }
}

function toggle() {
  open.value = !open.value
}

function toggleWidget(key) {
  const i = enabled.value.indexOf(key)
  if (i >= 0) enabled.value.splice(i, 1)
  else enabled.value.push(key)
}

watch([enabled, open], save, { deep: true })

onMounted(() => {
  load()
  // 日记详情/编辑页专注阅读写作，自动收起挂件
  if (route.path.startsWith('/diary/') && route.path !== '/diary') open.value = false
})
</script>

<style scoped>
/* 桌面端悬浮在右侧，移动端整条栏隐藏（避免遮挡内容） */
.widget-rail {
  position: fixed;
  right: 0;
  top: 50%;
  transform: translateY(-50%);
  z-index: 40;
  display: flex;
  align-items: center;
  max-height: 88vh;
}

/* 收起拉手 */
.widget-handle {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 14px 8px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-right: none;
  border-radius: 14px 0 0 14px;
  background: rgba(6, 18, 36, 0.75);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  color: rgba(255, 255, 255, 0.7);
  cursor: pointer;
  box-shadow: -6px 0 24px rgba(2, 8, 20, 0.5);
  transition: all 0.28s;
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
  border-left: 1px solid rgba(255, 255, 255, 0.1);
  background: linear-gradient(180deg, rgba(8, 22, 42, 0.92), rgba(4, 12, 26, 0.94));
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  box-shadow: -18px 0 50px rgba(2, 8, 20, 0.6);
  border-radius: 16px 0 0 16px;
  animation: widget-in 0.3s ease;
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

/* 移动端 / 窄屏：改成右下角悬浮按钮 + 底部抽屉，功能不缺失 */
@media (max-width: 1180px) {
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
    bottom: 16px;
    flex-direction: row;
    padding: 12px 16px;
    border-radius: 999px;
    border-right: 1px solid rgba(255, 255, 255, 0.12);
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
    border-radius: 20px 20px 0 0;
    border-left: none;
    border-top: 1px solid rgba(255, 255, 255, 0.12);
    animation: widget-up 0.3s ease;
  }

  @keyframes widget-up {
    from { transform: translateY(100%); }
    to { transform: translateY(0); }
  }
}
</style>

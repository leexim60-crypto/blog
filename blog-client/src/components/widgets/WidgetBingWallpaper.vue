<template>
  <div class="widget-card widget-wallpaper">
    <div class="wallpaper-frame">
      <!-- 直接用 <img> 加载，避免 JSON 接口的跨域限制 -->
      <img
        v-if="src"
        :src="src"
        class="wallpaper-img"
        alt="每日一图"
        referrerpolicy="no-referrer"
        @error="onImgError"
      />
      <div v-else class="wallpaper-loading">
        <el-icon class="is-loading" :size="22"><Loading /></el-icon>
      </div>

      <div class="wallpaper-mask"></div>

      <div class="wallpaper-info">
        <span class="widget-badge wallpaper-badge">每日一图 · Bing</span>
        <p class="wallpaper-title">{{ title }}</p>
        <p v-if="copyright" class="wallpaper-copyright">{{ copyright }}</p>
      </div>

      <div class="wallpaper-actions">
        <button class="widget-mini-btn" title="换一张" @click="shuffle"><el-icon><Refresh /></el-icon></button>
        <button class="widget-mini-btn" title="查看原图" @click="openOriginal"><el-icon><Download /></el-icon></button>
        <button
          class="widget-mini-btn"
          :class="{ 'is-active': applied }"
          :title="applied ? '取消首页横幅背景' : '设为首页横幅背景'"
          @click="toggleApply"
        >
          <el-icon><Picture /></el-icon>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'

const BANNER_KEY = 'blog_banner_wallpaper'

/* Bing 官方每日壁纸直链（无需 key、无跨域限制，直接当图片用）
   加载失败时回退到 picsum 随机风景图，保证挂件不留白 */
const BING = 'https://api.dujin.org/bing/1920.php'
const fallbackSrc = () => 'https://picsum.photos/seed/blog' + Math.floor(Math.random() * 9999) + '/1600/900'

const src = ref('')
const title = ref('Bing 每日壁纸')
const copyright = ref('每日更新 · 可设为首页横幅背景')
const applied = ref(false)

function useFallback() {
  src.value = fallbackSrc()
  title.value = '随机风景图'
  copyright.value = '图片来自 picsum.photos'
}

/**
 * 先用 new Image() 预加载：
 * Bing 直链偶发超时/被墙时，4 秒内自动换成随机风景图，
 * 避免挂件长时间空白（也避免阻塞页面 load 事件）。
 */
function load() {
  title.value = 'Bing 每日壁纸'
  copyright.value = '每日更新 · 可设为首页横幅背景'

  const probe = new Image()
  let settled = false
  const timer = setTimeout(() => {
    if (settled) return
    settled = true
    probe.src = ''
    useFallback()
  }, 4000)

  probe.onload = () => {
    if (settled) return
    settled = true
    clearTimeout(timer)
    src.value = BING
  }
  probe.onerror = () => {
    if (settled) return
    settled = true
    clearTimeout(timer)
    useFallback()
  }
  probe.src = BING
}

function onImgError() {
  // Bing 直链挂了就换随机风景图，保证挂件不留白
  src.value = fallbackSrc()
  title.value = '随机风景图'
  copyright.value = '图片来自 picsum.photos'
}

function shuffle() {
  useFallback()
  ElMessage.success('换了一张随机壁纸')
}

function openOriginal() {
  if (src.value) window.open(src.value, '_blank', 'noopener')
}

function toggleApply() {
  if (applied.value) {
    localStorage.removeItem(BANNER_KEY)
    applied.value = false
    ElMessage.success('已恢复默认星空横幅')
  } else {
    localStorage.setItem(BANNER_KEY, src.value)
    applied.value = true
    ElMessage.success('已应用到首页横幅，回到顶部看看')
  }
  // 通知同页面的 SkyBanner 立即刷新
  window.dispatchEvent(new CustomEvent('banner-wallpaper-change'))
}

onMounted(() => {
  applied.value = !!localStorage.getItem(BANNER_KEY)
  load()
})
</script>

<style scoped>
.widget-wallpaper {
  padding: 0;
  overflow: hidden;
}
.wallpaper-frame {
  position: relative;
  min-height: 220px;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  background: rgba(255, 255, 255, 0.04);
}
.wallpaper-img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.wallpaper-loading {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(255, 255, 255, 0.4);
}
.wallpaper-mask {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    180deg,
    rgba(2, 8, 20, 0.12) 0%,
    rgba(2, 8, 20, 0.5) 55%,
    rgba(2, 8, 20, 0.94) 100%
  );
}
.wallpaper-info {
  position: relative;
  padding: 0 18px 18px;
}
.wallpaper-badge {
  display: inline-block;
  margin-bottom: 8px;
  background: rgba(2, 8, 20, 0.55);
}
.wallpaper-title {
  font-size: 15px;
  font-weight: 600;
  color: #fff;
  line-height: 1.5;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.6);
}
.wallpaper-copyright {
  margin-top: 5px;
  font-size: 11px;
  color: rgba(255, 255, 255, 0.55);
  line-height: 1.5;
}
.wallpaper-actions {
  position: absolute;
  top: 12px;
  right: 12px;
  display: flex;
  gap: 6px;
}
.wallpaper-actions .widget-mini-btn {
  background: rgba(2, 8, 20, 0.55);
  backdrop-filter: blur(8px);
}
.widget-mini-btn.is-active {
  background: linear-gradient(135deg, #4f7cff, #b45cff);
  color: #fff;
  border-color: transparent;
}
</style>

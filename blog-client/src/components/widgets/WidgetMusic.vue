<template>
  <div class="widget-card widget-music">
    <div class="widget-head">
      <span class="widget-title"><el-icon><Headset /></el-icon> 随机听听</span>
      <span class="widget-badge">{{ badge }}</span>
    </div>

    <!-- 初始加载 -->
    <div v-if="loading" class="widget-skeleton">
      <el-icon class="is-loading" :size="20"><Loading /></el-icon>
      <span>正在获取歌单…</span>
    </div>

    <!-- 完全没筛到可播歌曲 -->
    <div v-else-if="!tracks.length" class="widget-skeleton">
      <el-icon :size="20"><Headset /></el-icon>
      <span class="flex-1">{{ errorText || '暂时没有可播放的歌曲' }}</span>
      <button class="widget-mini-btn" @click="reload"><el-icon><Refresh /></el-icon></button>
    </div>

    <template v-else>
      <div class="music-main">
        <!-- 唱片封面 -->
        <div class="music-disc" :class="{ 'is-playing': playing }">
          <img
            v-if="current.pic && !coverFailed"
            :src="current.pic"
            alt="cover"
            referrerpolicy="no-referrer"
            @error="coverFailed = true"
          />
          <span v-else class="music-disc-fallback"><el-icon :size="22"><Headset /></el-icon></span>
        </div>
        <div class="music-meta">
          <p class="music-title" :title="current.title">{{ current.title || '未选择歌曲' }}</p>
          <p class="music-artist" :title="current.author">{{ current.author }}</p>
          <p class="music-tip">{{ tipText }}</p>
        </div>
      </div>

      <!-- 筛选进度 -->
      <div v-if="probing" class="music-probing">
        <span class="music-probing-bar"><i :style="{ width: probePercent + '%' }"></i></span>
        <span class="music-probing-text">正在筛选可播放的歌曲…已找到 {{ found }} 首</span>
      </div>

      <div class="music-progress" @click="seek">
        <span class="music-progress-bg">
          <i :style="{ width: progress + '%' }"></i>
        </span>
        <span class="music-time">{{ fmt(cur) }} / {{ fmt(dur) }}</span>
      </div>

      <div class="music-controls">
        <button class="music-btn" title="上一首" @click="prev"><el-icon><ArrowLeftBold /></el-icon></button>
        <button class="music-btn music-btn-main" :title="playing ? '暂停' : '播放'" @click="toggle">
          <el-icon :size="18"><component :is="playing ? 'VideoPause' : 'VideoPlay'" /></el-icon>
        </button>
        <button class="music-btn" title="下一首" @click="next"><el-icon><ArrowRightBold /></el-icon></button>
        <button class="music-btn" title="换一批歌" @click="reload"><el-icon><Refresh /></el-icon></button>
        <button class="music-btn" :title="muted ? '取消静音' : '静音'" @click="toggleMute">
          <el-icon><component :is="muted ? 'Mute' : 'Bell'" /></el-icon>
        </button>
      </div>
    </template>

    <!-- 隐藏的播放器本体 -->
    <audio
      ref="audioEl"
      preload="none"
      @timeupdate="onTime"
      @loadedmetadata="onMeta"
      @ended="next"
      @error="onError"
      @playing="onPlaying"
      @play="playing = true"
      @pause="playing = false"
    ></audio>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { fetchJson, readCache, writeCache } from '../../utils/widgetFetch'

/* =========================================================
 * 为什么需要「预探测」：
 * 公共 Meting 接口返回的音频直链里，约有一半因版权限制是 404 的，
 * 直接播就会出现「点了没反应 / 一直跳过」。
 * 好在这些直链都带 Access-Control-Allow-Origin: *，
 * 所以浏览器可以先 fetch 一小段（Range: bytes=0-1023）判断真伪，
 * 只把确认能播的歌放进播放列表。
 * ========================================================= */

const INSTANCE = 'https://api.i-meto.com/meting/api'
// 网易云「热歌榜」+「飙升榜」：候选池约 250+ 首，打乱后筛选
const POOL_LISTS = ['3778678', '19723756']
const CACHE_KEY = 'widget_music_playable_v3'
const CACHE_TTL = 6 * 60 * 60 * 1000 // 6 小时内复用筛选结果，避免重复探测

const TARGET = 18 // 目标可播曲目数
const MAX_PROBE = 110 // 最多探测多少首，防止无限请求
const CONCURRENCY = 6 // 并发探测数
const PROBE_TIMEOUT = 5000

const audioEl = ref(null)
const tracks = ref([])
const index = ref(0)
const loading = ref(true)
const probing = ref(false)
const found = ref(0)
const errorText = ref('')
const playing = ref(false)
const muted = ref(false)
const cur = ref(0)
const dur = ref(0)
const coverFailed = ref(false)

const current = computed(() => tracks.value[index.value] || {})
const progress = computed(() => (dur.value ? Math.min(100, (cur.value / dur.value) * 100) : 0))
const probePercent = computed(() => Math.min(100, Math.round((found.value / TARGET) * 100)))

const badge = computed(() => {
  if (probing.value) return '筛选中'
  if (!tracks.value.length) return '网易云'
  return `可播 ${tracks.value.length} 首`
})

const tipText = computed(() => {
  if (probing.value) return '已过滤版权受限的歌曲，可放心播放'
  return '点击播放 · 曲目已预先验证可播'
})

const fmt = (s) => {
  if (!s || Number.isNaN(s)) return '0:00'
  return Math.floor(s / 60) + ':' + String(Math.floor(s % 60)).padStart(2, '0')
}

/** 探测单首歌是否真的可播（只取前 1KB） */
async function probePlayable(url) {
  try {
    const res = await fetch(url, {
      headers: { Range: 'bytes=0-1023' },
      signal: AbortSignal.timeout(PROBE_TIMEOUT)
    })
    const ct = res.headers.get('content-type') || ''
    return res.ok && ct.includes('audio')
  } catch (e) {
    return false
  }
}

/** 拉取多个歌单并去重 */
async function fetchPool() {
  const settled = await Promise.allSettled(
    POOL_LISTS.map((id) =>
      fetchJson(`${INSTANCE}?server=netease&type=playlist&id=${id}`, { timeout: 12000 })
    )
  )
  const seen = new Set()
  const pool = []
  for (const r of settled) {
    if (r.status !== 'fulfilled' || !Array.isArray(r.value)) continue
    for (const t of r.value) {
      if (!t || !t.url || !t.title) continue
      const key = t.title + '|' + t.author
      if (seen.has(key)) continue
      seen.add(key)
      pool.push(t)
    }
  }
  return pool
}

async function loadTracks(force = false) {
  loading.value = true
  probing.value = false
  errorText.value = ''
  found.value = 0

  // 1) 命中缓存：直接可用，无需任何探测
  if (!force) {
    const cached = readCache(CACHE_KEY, CACHE_TTL)
    if (Array.isArray(cached) && cached.length >= 3) {
      tracks.value = cached.slice().sort(() => Math.random() - 0.5)
      index.value = 0
      loading.value = false
      return
    }
  }

  // 2) 拉候选池
  let pool = []
  try {
    pool = await fetchPool()
  } catch (e) {
    pool = []
  }
  if (!pool.length) {
    tracks.value = []
    errorText.value = '歌单接口暂时不可用'
    loading.value = false
    return
  }

  // 3) 打乱后并发探测，边筛边上屏
  loading.value = false
  probing.value = true

  const shuffled = pool.slice().sort(() => Math.random() - 0.5)
  const playable = []
  let cursor = 0

  while (playable.length < TARGET && cursor < shuffled.length && cursor < MAX_PROBE) {
    const batch = shuffled.slice(cursor, cursor + CONCURRENCY)
    cursor += batch.length

    const results = await Promise.all(batch.map((t) => probePlayable(t.url)))
    batch.forEach((t, i) => {
      if (results[i]) playable.push(t)
    })

    found.value = playable.length
    // 一旦有可播歌曲就立刻上屏，用户不用等筛选全部结束
    if (playable.length) {
      const wasEmpty = tracks.value.length === 0
      tracks.value = playable.slice()
      if (wasEmpty) index.value = 0
    }
  }

  probing.value = false

  if (playable.length) {
    writeCache(CACHE_KEY, playable)
  } else {
    tracks.value = []
    errorText.value = '暂时没筛到可播放的歌曲'
  }
}

/** 换一批：清掉缓存重新筛选 */
function reload() {
  const el = audioEl.value
  if (el) {
    el.pause()
    el.removeAttribute('src')
  }
  playing.value = false
  cur.value = 0
  dur.value = 0
  consecutiveErr = 0
  loadTracks(true)
}

async function play() {
  const el = audioEl.value
  if (!el || !current.value.url) return
  coverFailed.value = false
  el.src = current.value.url
  el.load()
  try {
    await el.play()
  } catch (e) {
    playing.value = false
  }
}

function toggle() {
  const el = audioEl.value
  if (!el) return
  if (playing.value) {
    el.pause()
  } else if (el.getAttribute('src')) {
    el.play().catch(() => {})
  } else {
    play()
  }
}

function go(step) {
  if (!tracks.value.length) return
  index.value = (index.value + step + tracks.value.length) % tracks.value.length
  cur.value = 0
  dur.value = 0
  coverFailed.value = false
  consecutiveErr = 0
  if (playing.value) play()
}

const next = () => go(1)
const prev = () => go(-1)

function toggleMute() {
  muted.value = !muted.value
  if (audioEl.value) audioEl.value.muted = muted.value
}

function onTime() {
  if (audioEl.value) cur.value = audioEl.value.currentTime || 0
}

function onMeta() {
  if (audioEl.value) dur.value = audioEl.value.duration || 0
}

function seek(e) {
  const el = audioEl.value
  if (!el || !dur.value) return
  const rect = e.currentTarget.getBoundingClientRect()
  const ratio = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width))
  el.currentTime = ratio * dur.value
  cur.value = el.currentTime
}

/* 播放出错处理：
   曲目已预先筛过，这里出错多半是网络抖动，跳过几首还不行就停下并提示，
   避免像旧版那样连续失败后彻底卡死（点了永远没反应）。 */
let consecutiveErr = 0

function onPlaying() {
  consecutiveErr = 0
}

function onError() {
  if (!tracks.value.length) return
  consecutiveErr++
  if (consecutiveErr > 3) {
    playing.value = false
    errorText.value = '网络异常，请点刷新重试'
    return
  }
  setTimeout(() => {
    if (playing.value) next()
  }, 300)
}

onMounted(() => loadTracks())

onBeforeUnmount(() => {
  const el = audioEl.value
  if (el) {
    el.pause()
    el.removeAttribute('src')
  }
})
</script>

<style scoped>
.music-main {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-top: 14px;
}
.music-disc {
  width: 62px;
  height: 62px;
  border-radius: 50%;
  flex-shrink: 0;
  overflow: hidden;
  border: 2px solid rgba(255, 255, 255, 0.15);
  box-shadow: 0 0 20px rgba(80, 130, 255, 0.35);
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.05);
  animation: disc-spin 14s linear infinite;
  animation-play-state: paused;
}
.music-disc.is-playing {
  animation-play-state: running;
}
.music-disc img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.music-disc-fallback {
  color: rgba(255, 255, 255, 0.5);
}
@keyframes disc-spin {
  to { transform: rotate(360deg); }
}
.music-meta {
  min-width: 0;
}
.music-title {
  font-size: 15px;
  font-weight: 600;
  color: #fff;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.music-artist {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
  margin-top: 3px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.music-tip {
  font-size: 10px;
  color: rgba(255, 255, 255, 0.25);
  margin-top: 6px;
  line-height: 1.4;
}

/* 筛选进度条 */
.music-probing {
  margin-top: 12px;
}
.music-probing-bar {
  display: block;
  height: 3px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.08);
  overflow: hidden;
}
.music-probing-bar i {
  display: block;
  height: 100%;
  border-radius: 999px;
  background: linear-gradient(90deg, #3ddc97, #4fd1c5);
  box-shadow: 0 0 10px rgba(61, 220, 151, 0.5);
  transition: width 0.3s ease;
}
.music-probing-text {
  display: block;
  margin-top: 6px;
  font-size: 10px;
  color: rgba(255, 255, 255, 0.35);
}

.music-progress {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 14px;
  cursor: pointer;
}
.music-progress-bg {
  position: relative;
  flex: 1;
  height: 4px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.1);
  overflow: hidden;
}
.music-progress-bg i {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  border-radius: 999px;
  background: linear-gradient(90deg, #4f7cff, #b45cff);
}
.music-time {
  font-size: 10px;
  color: rgba(255, 255, 255, 0.35);
  font-variant-numeric: tabular-nums;
}
.music-controls {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-top: 12px;
}
.music-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.05);
  color: rgba(255, 255, 255, 0.7);
  cursor: pointer;
  transition: all 0.25s;
}
.music-btn:hover {
  background: rgba(255, 255, 255, 0.15);
  color: #fff;
  transform: translateY(-1px);
}
.music-btn-main {
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, #4f7cff, #b45cff);
  border: none;
  color: #fff;
  box-shadow: 0 0 18px rgba(110, 110, 255, 0.55);
}
</style>

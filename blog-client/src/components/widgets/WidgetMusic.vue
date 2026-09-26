<template>
  <div class="widget-card widget-music">
    <div class="widget-head">
      <span class="widget-title"><el-icon><Headset /></el-icon> 随机听听</span>
      <span class="widget-badge">{{ playlistName }}</span>
    </div>

    <div v-if="loading" class="widget-skeleton">
      <el-icon class="is-loading" :size="20"><Loading /></el-icon>
      <span>正在获取歌单…</span>
    </div>

    <div v-else-if="!tracks.length" class="widget-skeleton">
      <el-icon :size="20"><Headset /></el-icon>
      <span class="flex-1">歌单加载失败</span>
      <button class="widget-mini-btn" @click="loadTracks"><el-icon><Refresh /></el-icon></button>
    </div>

    <template v-else>
      <div class="music-main">
        <!-- 唱片封面 -->
        <div class="music-disc" :class="{ 'is-playing': playing }">
          <img v-if="current.pic" :src="current.pic" alt="cover" referrerpolicy="no-referrer" />
          <span v-else class="music-disc-fallback"><el-icon :size="22"><Headset /></el-icon></span>
        </div>
        <div class="music-meta">
          <p class="music-title" :title="current.title">{{ current.title || '未选择歌曲' }}</p>
          <p class="music-artist" :title="current.author">{{ current.author }}</p>
          <p class="music-tip">点击播放（第三方歌单接口，仅供试听）</p>
        </div>
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
      @play="playing = true"
      @pause="playing = false"
    ></audio>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { fetchJson, readCache, writeCache } from '../../utils/widgetFetch'

// 网易云音乐热歌榜（通过 Meting 公共 API 解析，无需后端）
const PLAYLIST_ID = '3778678'
const API = `https://api.i-meto.com/meting/api?server=netease&type=playlist&id=${PLAYLIST_ID}`
const CACHE_KEY = 'widget_music_v1'
const CACHE_TTL = 6 * 60 * 60 * 1000

const audioEl = ref(null)
const tracks = ref([])
const index = ref(0)
const loading = ref(true)
const playing = ref(false)
const muted = ref(false)
const cur = ref(0)
const dur = ref(0)
const playlistName = ref('网易云热歌榜')

const current = computed(() => tracks.value[index.value] || {})
const progress = computed(() => (dur.value ? Math.min(100, (cur.value / dur.value) * 100) : 0))

const fmt = (s) => {
  if (!s || Number.isNaN(s)) return '0:00'
  const m = Math.floor(s / 60)
  return m + ':' + String(Math.floor(s % 60)).padStart(2, '0')
}

async function loadTracks() {
  loading.value = true
  try {
    const cached = readCache(CACHE_KEY, CACHE_TTL)
    let list = cached
    if (!list || !list.length) {
      list = await fetchJson(API, { timeout: 10000 })
      if (Array.isArray(list) && list.length) writeCache(CACHE_KEY, list)
    }
    if (Array.isArray(list) && list.length) {
      // 打乱顺序，每次进来都是「随机听听」
      tracks.value = list.slice().sort(() => Math.random() - 0.5).slice(0, 30)
      index.value = 0
    }
  } catch (e) {
    tracks.value = []
  } finally {
    loading.value = false
  }
}

async function play() {
  const el = audioEl.value
  if (!el || !current.value.url) return
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
  } else if (el.src) {
    el.play().catch(() => {})
  } else {
    play()
  }
}

function next() {
  if (!tracks.value.length) return
  index.value = (index.value + 1) % tracks.value.length
  cur.value = 0
  dur.value = 0
  if (playing.value) play()
}

function prev() {
  if (!tracks.value.length) return
  index.value = (index.value - 1 + tracks.value.length) % tracks.value.length
  cur.value = 0
  dur.value = 0
  if (playing.value) play()
}

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

// 版权/网络原因单曲不可用时自动跳过
let errCount = 0
function onError() {
  if (!tracks.value.length || errCount > 3) return
  errCount++
  setTimeout(() => {
    if (playing.value) next()
  }, 400)
}

onMounted(loadTracks)
onBeforeUnmount(() => {
  const el = audioEl.value
  if (el) {
    el.pause()
    el.src = ''
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
  gap: 10px;
  margin-top: 12px;
}
.music-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
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

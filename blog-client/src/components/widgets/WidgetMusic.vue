<template>
  <div class="widget-card widget-music">
    <div class="widget-head">
      <span class="widget-title"><el-icon><Headset /></el-icon> 随机听听</span>
      <span class="widget-badge">{{ badge }}</span>
    </div>

    <div v-if="loading" class="widget-skeleton">
      <el-icon class="is-loading" :size="20"><Loading /></el-icon>
      <span>正在获取歌单…</span>
    </div>

    <div v-else-if="!tracks.length" class="widget-skeleton">
      <el-icon :size="20"><Headset /></el-icon>
      <span class="flex-1">{{ errorText || '暂时没有可播放的歌曲' }}</span>
      <button class="widget-mini-btn" @click="reload"><el-icon><Refresh /></el-icon></button>
    </div>

    <template v-else>
      <div class="music-main">
        <!-- 唱片封面（封面图源多为 http，https 站点下会失败，自动回退为图标） -->
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
          <p class="music-artist" :title="current.artist">{{ current.artist }}</p>
          <p class="music-tip">{{ tipText }}</p>
        </div>
      </div>

      <!-- 取流中 -->
      <div v-if="resolving" class="music-probing">
        <span class="music-probing-bar is-indeterminate"><i></i></span>
        <span class="music-probing-text">正在获取播放地址…</span>
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

    <audio
      ref="audioEl"
      preload="none"
      @timeupdate="onTime"
      @loadedmetadata="onMeta"
      @ended="onEnded"
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
 * 音源：GDStudio 音乐台（music-api.gdstudio.xyz）
 *
 * 为什么换掉之前的 Meting 公共实例：
 * 之前用 api.i-meto.com 拿到的直链约一半是 404（版权限制），
 * 只能靠「预探测」筛掉死歌，实测命中率仅 42%，体验很差。
 * GDStudio 抽样 10/10 全部可播且是 320kbps，所以这里改成：
 *   - 只请求一次歌单（200 首，随机打乱）
 *   - 点播放时才按需取该首的播放地址（1 次请求）
 * 请求量因此极低，也避开了接口的限流（请求过密会 503）。
 * ========================================================= */

const API = 'https://music-api.gdstudio.xyz/api.php'
const SOURCE = 'netease'
const PLAYLIST_ID = '3778678' // 网易云热歌榜
const CACHE_KEY = 'widget_music_tracks_v4'
const CACHE_TTL = 6 * 60 * 60 * 1000

const audioEl = ref(null)
const tracks = ref([])
const index = ref(0)
const loading = ref(true)
const resolving = ref(false)
const errorText = ref('')
const playing = ref(false)
const muted = ref(false)
const cur = ref(0)
const dur = ref(0)
const coverFailed = ref(false)

const current = computed(() => tracks.value[index.value] || {})
const progress = computed(() => (dur.value ? Math.min(100, (cur.value / dur.value) * 100) : 0))

const badge = computed(() => {
  if (!tracks.value.length) return '网易云'
  return `${tracks.value.length} 首`
})

const tipText = computed(() => {
  if (resolving.value) return '正在获取播放地址…'
  return '点击播放 · 320kbps 音质'
})

const fmt = (s) => {
  if (!s || Number.isNaN(s)) return '0:00'
  return Math.floor(s / 60) + ':' + String(Math.floor(s % 60)).padStart(2, '0')
}

/** 把 GDStudio 返回的网易云原始结构压成组件用的扁平结构 */
function normalize(t) {
  return {
    id: t.id,
    title: t.name || '未知曲目',
    artist: (t.ar || []).map((a) => a.name).join(' / ') || '未知歌手',
    // 封面多为 http，https 站点下加载会失败 → 由 @error 回退成图标
    pic: (t.al && t.al.picUrl) || '',
    duration: t.dt ? t.dt / 1000 : 0
  }
}

/** 取某首歌的播放地址（GDStudio 返回的是有时效的直链，所以不缓存） */
async function resolveUrl(id) {
  const res = await fetchJson(`${API}?types=url&source=${SOURCE}&id=${id}&br=320`, { timeout: 15000 })
  return res && res.url ? res.url : ''
}

async function loadTracks(force = false) {
  const token = ++listToken
  // 换歌单时立刻中止正在进行的播放，避免旧歌单的曲目被异步加载回来
  playToken++
  loadedUrl = ''

  loading.value = true
  errorText.value = ''

  if (!force) {
    const cached = readCache(CACHE_KEY, CACHE_TTL)
    if (Array.isArray(cached) && cached.length) {
      tracks.value = cached.slice().sort(() => Math.random() - 0.5)
      index.value = 0
      loading.value = false
      return
    }
  }

  try {
    const res = await fetchJson(`${API}?types=playlist&source=${SOURCE}&id=${PLAYLIST_ID}`, {
      timeout: 15000
    })
    if (token !== listToken) return // 已被更新的一次「换一批」取代
    const list = res?.playlist?.tracks
    if (!Array.isArray(list) || !list.length) throw new Error('empty')

    const normalized = list.map(normalize).filter((t) => t.id)
    writeCache(CACHE_KEY, normalized)
    tracks.value = normalized.slice().sort(() => Math.random() - 0.5)
    index.value = 0
  } catch (e) {
    if (token !== listToken) return
    tracks.value = []
    errorText.value = '歌单接口暂时不可用（可能被限流）'
  } finally {
    if (token === listToken) loading.value = false
  }
}

/** 换一批：重新拉歌单并打乱 */
function reload() {
  const el = audioEl.value
  if (el) {
    el.pause()
    el.removeAttribute('src')
    el.load() // 仅移除 src 不会重置元素，currentSrc 会残留上一首
  }
  playing.value = false
  cur.value = 0
  dur.value = 0
  consecutiveErr = 0
  loadTracks(true) // 内部会推进 playToken / listToken 并清空 loadedUrl
}

/* 播放代次：取流是异步的，切歌后旧请求的结果必须丢弃，否则会乱序覆盖 src */
let playToken = 0
/* 当前「已经加载进 audio 元素」的直链，用来判断点播放是续播还是重新取流 */
let loadedUrl = ''
/* 连续播放失败次数，超过阈值就停下，避免无限跳过把接口刷到限流 */
let consecutiveErr = 0
/* 换一批的代次：重新拉歌单是异步的，期间不能被旧歌单的播放结果污染 */
let listToken = 0

async function play() {
  const el = audioEl.value
  const track = current.value
  if (!el || !track.id) return

  const token = ++playToken
  resolving.value = true
  coverFailed.value = false

  let url = ''
  try {
    url = await resolveUrl(track.id)
  } catch (e) {
    url = ''
  }
  // 等待取流期间用户又切了歌，这次结果作废
  if (token !== playToken) return
  resolving.value = false

  if (!url) {
    // 这首歌拿不到地址（版权/限流/网络异常），跳过；连续失败过多则停下
    loadedUrl = ''
    consecutiveErr++
    if (consecutiveErr > 3) {
      playing.value = false
      errorText.value = '播放失败较多，请点刷新重试'
      return
    }
    if (tracks.value.length > 1) go(1, { autoplay: true, keepErr: true })
    else errorText.value = '这首歌暂时无法播放'
    return
  }

  loadedUrl = url
  // 先 pause 再换源：直接改 src 会让浏览器对旧资源抛中断错误
  el.pause()
  el.src = url
  el.load()
  try {
    await el.play()
  } catch (e) {
    /* 换源/暂停引起的中断不算失败，真正的加载失败由 onError 处理 */
  }
  // 如果这期间用户又切了歌，playToken 已变，说明上面加载的已是过期曲目：交给最新那次 play 接管
}

function toggle() {
  const el = audioEl.value
  if (!el) return
  if (playing.value) {
    el.pause()
  } else if (loadedUrl && el.getAttribute('src') === loadedUrl) {
    // 音源与当前曲目一致，直接续播
    el.play().catch(() => {})
  } else {
    // 没有音源、或暂停期间切过歌，必须重新取流，否则会放回上一首
    play()
  }
}

/**
 * 切歌。
 * autoplay 默认跟随当前播放状态：播放中点下一首继续播，暂停中点下一首只换 UI。
 * 注意换源动作不能依赖 playing —— 自然播完时浏览器先发 pause（playing 已变 false），
 * 再发 ended，若此时用 playing 判断就会「只换 UI 不换源」，表现为一直重复放上一首。
 */
function go(step, { autoplay = playing.value, keepErr = false } = {}) {
  if (!tracks.value.length) return
  index.value = (index.value + step + tracks.value.length) % tracks.value.length
  cur.value = 0
  dur.value = 0
  coverFailed.value = false
  if (!keepErr) consecutiveErr = 0

  if (autoplay) {
    play()
  } else {
    // 暂停状态下切歌：清掉旧音源，避免下次点播放又放出上一首
    playToken++
    loadedUrl = ''
    const el = audioEl.value
    if (el) {
      el.pause()
      el.removeAttribute('src')
      el.load()
    }
    resolving.value = false
  }
}

const next = () => go(1)
const prev = () => go(-1)

/** 自然播完必须显式自动播放下一首（此刻 playing 已被 pause 事件置为 false） */
function onEnded() {
  go(1, { autoplay: true })
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

/* 出错处理：连续多次失败就停下并提示，避免无限跳过把接口刷到限流 */
function onPlaying() {
  consecutiveErr = 0
}

function onError() {
  if (!tracks.value.length) return
  const el = audioEl.value
  // 换源过程中旧资源被中断也会触发 error，那不算播放失败
  if (!loadedUrl || !el || el.getAttribute('src') !== loadedUrl) return

  consecutiveErr++
  if (consecutiveErr > 3) {
    playing.value = false
    errorText.value = '播放失败较多，请点刷新重试'
    return
  }
  setTimeout(() => {
    if (playing.value) go(1, { autoplay: true, keepErr: true })
  }, 400)
}

onMounted(() => loadTracks())

onBeforeUnmount(() => {
  playToken++
  listToken++
  loadedUrl = ''
  const el = audioEl.value
  if (el) {
    el.pause()
    el.removeAttribute('src')
    el.load()
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

.music-probing {
  margin-top: 12px;
}
.music-probing-bar {
  display: block;
  height: 3px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.08);
  overflow: hidden;
  position: relative;
}
.music-probing-bar.is-indeterminate i {
  position: absolute;
  top: 0;
  left: -40%;
  width: 40%;
  height: 100%;
  border-radius: 999px;
  background: linear-gradient(90deg, #4f7cff, #b45cff);
  animation: indeterminate 1.1s ease-in-out infinite;
}
@keyframes indeterminate {
  0% { left: -40%; }
  100% { left: 100%; }
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

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { fetchJson, readCache, writeCache } from '../utils/widgetFetch'

export const MUSIC_SOURCES = [
  { key: 'netease-hot', label: '网易云 · 热歌榜', id: '3778678' },
  { key: 'netease-new', label: '网易云 · 新歌榜', id: '3779629' },
  { key: 'netease-rise', label: '网易云 · 飙升榜', id: '19723756' },
  { key: 'netease-original', label: '网易云 · 原创榜', id: '2884035' },
  { key: 'netease-custom', label: '网易云 · 自选歌单' },
  { key: 'open', label: '开放音源 · 器乐' },
  { key: 'custom', label: '我的音源 · 直链 / 本地' }
]
const API = import.meta.env.VITE_MUSIC_API_URL || 'https://music-api.gdstudio.xyz/api.php'
const PREF_KEY = 'blog_music_preferences_v1'
const URL_KEY = 'blog_music_custom_urls_v1'
const secureURL = value => {
  try { const u = new URL(value); return ['https:', 'http:'].includes(u.protocol) && !(location.protocol === 'https:' && u.protocol === 'http:') ? u.href : '' } catch { return '' }
}
const normalizeTrack = t => ({ id: String(t.id), streamId: String(t.url_id || t.id), title: t.name || t.title || '未命名曲目', artist: (t.ar || t.artists || (Array.isArray(t.artist) ? t.artist : [])).map(a => typeof a === 'string' ? a : a.name).join(' / ') || (typeof t.artist === 'string' ? t.artist : '') || '未知歌手', pic: secureURL(t.al?.picUrl || t.album?.picUrl || t.pic || ''), source: 'netease' })
const openTracks = [1,2,3].map(n => ({id:`soundhelix-${n}`,title:['A little escape','After the rain','Slow afternoon'][n-1],artist:'SoundHelix · 器乐作品',url:`https://www.soundhelix.com/examples/mp3/SoundHelix-Song-${n}.mp3`,source:'open'}))
export const useMusicStore = defineStore('music', () => {
  const tracks = ref([]), index = ref(0), source = ref('netease-hot'), playlistId = ref('')
  const playing = ref(false), loading = ref(false), resolving = ref(false), errorText = ref('')
  const elapsed = ref(0), duration = ref(0), volume = ref(.65), muted = ref(false), repeat = ref('list'), favorites = ref([])
  const customTracks = ref([])
  const current = computed(() => tracks.value[index.value] || null)
  const sourceLabel = computed(() => MUSIC_SOURCES.find(s => s.key === source.value)?.label || '我的音源')
  const currentFavorite = computed(() => current.value && favorites.value.includes(`${current.value.source}:${current.value.id}`))
  let audio, initialized = false, playGeneration = 0, listGeneration = 0, loadedURL = '', retryTimer, disposed = false
  const objectURLs = new Set()

  function persist() {
    try { localStorage.setItem(PREF_KEY, JSON.stringify({ source:source.value, playlistId:playlistId.value, volume:volume.value, muted:muted.value, repeat:repeat.value, favorites:favorites.value })) } catch { /* storage can be disabled */ }
  }
  function ensureAudio() {
    if(audio) return audio
    audio = new Audio(); audio.preload = 'none'; audio.volume = volume.value; audio.muted = muted.value
    audio.addEventListener('timeupdate',() => { elapsed.value = Number.isFinite(audio.currentTime) ? audio.currentTime : 0 })
    audio.addEventListener('loadedmetadata',() => { duration.value = Number.isFinite(audio.duration) ? audio.duration : 0 })
    audio.addEventListener('playing',() => { playing.value = true; resolving.value = false; errorText.value = ''; syncMediaSession() })
    audio.addEventListener('pause',() => { playing.value = false; if(navigator.mediaSession) navigator.mediaSession.playbackState = 'paused' })
    audio.addEventListener('ended',() => { if(repeat.value === 'one') {audio.currentTime = 0; play()} else step(1,true) })
    audio.addEventListener('error',() => {
      if(!loadedURL || audio.getAttribute('src') !== loadedURL) return
      playing.value = false; resolving.value = false; loadedURL = ''; errorText.value = '这首曲目暂时无法播放，试试下一首或切换音源。'
    })
    return audio
  }
  function syncMediaSession() {
    if(!navigator.mediaSession || !current.value) return
    if(typeof MediaMetadata !== 'undefined') navigator.mediaSession.metadata = new MediaMetadata({title:current.value.title,artist:current.value.artist,artwork:current.value.pic ? [{src:current.value.pic}] : []})
    navigator.mediaSession.playbackState = playing.value ? 'playing' : 'paused'
    for(const [action,handler] of Object.entries({play:()=>play(),pause:()=>pause(),previoustrack:()=>step(-1),nexttrack:()=>step(1),seekto:details=>seek(details.seekTime)})) {
      try {navigator.mediaSession.setActionHandler(action,handler)} catch { /* some browsers omit individual actions */ }
    }
  }
  function resetAudio() {
    playGeneration++; clearTimeout(retryTimer); loadedURL = ''; resolving.value = false; playing.value = false; elapsed.value = 0; duration.value = 0
    if(audio) {audio.pause();audio.removeAttribute('src');audio.load()}
  }
  async function init() {
    if(initialized) return
    initialized = true; disposed = false
    try {
      const p = JSON.parse(localStorage.getItem(PREF_KEY) || '{}')
      if(MUSIC_SOURCES.some(s=>s.key===p.source)) source.value = p.source
      playlistId.value = /^\d+$/.test(p.playlistId || '') ? p.playlistId : ''
      if(Number.isFinite(p.volume)) volume.value = Math.max(0,Math.min(1,p.volume))
      muted.value = p.muted === true
      if(['list','one','shuffle'].includes(p.repeat)) repeat.value = p.repeat
      if(Array.isArray(p.favorites)) favorites.value = p.favorites.filter(v=>typeof v === 'string')
      const saved = JSON.parse(localStorage.getItem(URL_KEY) || '[]')
      if(Array.isArray(saved)) customTracks.value = saved.filter(t=>t && secureURL(t.url)).map(t=>({...t,url:secureURL(t.url),source:'custom'}))
    } catch { /* corrupted preferences fall back to defaults */ }
    await loadSource()
  }
  async function loadSource(force = false) {
    const gen = ++listGeneration; resetAudio(); errorText.value = ''; loading.value = true; tracks.value = []; index.value = 0
    const selected = source.value
    try {
      if(selected === 'custom') {tracks.value = [...customTracks.value];return}
      if(selected === 'open') {tracks.value = openTracks.map(t=>({...t}));return}
      const entry = MUSIC_SOURCES.find(s=>s.key === selected), id = selected === 'netease-custom' ? playlistId.value : entry?.id
      if(!id) {errorText.value = '输入网易云歌单链接或歌单 ID，开始收听。';return}
      const cacheKey = `blog_music_playlist_v5_${id}`
      const cached = force ? null : readCache(cacheKey,6*60*60*1000)
      if(Array.isArray(cached) && cached.length) {tracks.value = cached;return}
      const params = new URLSearchParams({types:'playlist',source:'netease',id})
      const res = await fetchJson(`${API}?${params}`,{timeout:15000})
      if(gen !== listGeneration || disposed) return
      const raw = res?.playlist?.tracks || (Array.isArray(res) ? res : res?.data)
      if(!Array.isArray(raw) || !raw.length) throw new Error('No tracks')
      const normalized = raw.filter(t=>t?.id).map(normalizeTrack)
      if(!normalized.length) throw new Error('No tracks')
      tracks.value = normalized; writeCache(cacheKey,normalized)
    } catch { if(gen === listGeneration && !disposed) errorText.value = '这个音源暂时连接不上。可以重试，或切换开放音源 / 本地音乐。' }
    finally { if(gen === listGeneration && !disposed) loading.value = false }
  }
  function changeSource(key) { if(!MUSIC_SOURCES.some(s=>s.key === key)) return;source.value = key;persist();return loadSource() }
  function setPlaylist(value) {
    const raw = value.trim(); let id = /^\d+$/.test(raw) ? raw : ''
    if(!id) {try {const url = new URL(raw);if(/(^|\.)music\.163\.com$/.test(url.hostname)) id = url.searchParams.get('id') || (url.hash.match(/[?&]id=(\d+)/)?.[1] || '')} catch { /* invalid input */ }}
    if(!/^\d+$/.test(id)) {errorText.value = '请输入有效的网易云歌单链接或数字 ID。';return false}
    playlistId.value = id;source.value = 'netease-custom';persist();loadSource(true);return true
  }
  async function search(keyword) {
    if(!keyword.trim()) return loadSource()
    const gen = ++listGeneration;resetAudio();loading.value = true;errorText.value = ''
    try {
      const params = new URLSearchParams({types:'search',source:'netease',name:keyword.trim(),count:'30',pages:'1'})
      const res = await fetchJson(`${API}?${params}`,{timeout:15000})
      if(gen !== listGeneration || disposed) return
      const raw = Array.isArray(res) ? res : res?.result?.songs || res?.data
      tracks.value = Array.isArray(raw) ? raw.filter(t=>t?.id).map(normalizeTrack) : [];index.value = 0
      if(!tracks.value.length) errorText.value = '没有找到曲目，换个关键词试试。'
    } catch { if(gen === listGeneration && !disposed) errorText.value = '搜索暂时不可用，请稍后重试。' }
    finally {if(gen === listGeneration && !disposed) loading.value = false}
  }
  async function play() {
    const track = current.value
    if(!track || loading.value) return
    const el = ensureAudio(), gen = ++playGeneration
    errorText.value = ''
    if(loadedURL && el.getAttribute('src') === loadedURL) {
      try {await el.play()} catch(e) {if(gen === playGeneration && e.name !== 'AbortError') errorText.value = e.name === 'NotAllowedError' ? '请再点一次播放，浏览器需要你的操作。' : '无法播放，请重试或切换音源。'}
      return
    }
    resolving.value = true
    try {
      let url = track.url
      if(!url) {
        const params = new URLSearchParams({types:'url',source:track.source,id:track.streamId || track.id,br:'320'})
        const res = await fetchJson(`${API}?${params}`,{timeout:15000})
        url = secureURL(res?.url || '')
      }
      if(gen !== playGeneration || disposed) return
      if(!url) throw new Error('No playable URL')
      el.pause();el.src = url;loadedURL = url;el.load();await el.play()
    } catch(e) {
      if(gen !== playGeneration || disposed) return
      if(e.name === 'AbortError' && loadedURL) return
      errorText.value = e.name === 'NotAllowedError' ? '请再点一次播放，浏览器需要你的操作。' : '暂时无法获取播放地址。试试下一首，或切换开放音源。'
      playing.value = false
    } finally { if(gen === playGeneration && !disposed) resolving.value = false }
  }
  function pause() {playGeneration++;resolving.value = false;audio?.pause();playing.value = false}
  function toggle() {if(playing.value || resolving.value) pause();else play()}
  function selectTrack(i,autoplay = true) {if(i < 0 || i >= tracks.value.length) return;resetAudio();index.value = i;errorText.value = '';syncMediaSession();if(autoplay) play()}
  function step(delta,autoplay = playing.value || resolving.value) {
    if(!tracks.value.length) return
    const next = repeat.value === 'shuffle' && tracks.value.length > 1 ? (index.value + 1 + Math.floor(Math.random()*(tracks.value.length-1))) % tracks.value.length : (index.value+delta+tracks.value.length)%tracks.value.length
    selectTrack(next,autoplay)
  }
  function seek(seconds) {if(audio && duration.value > 0) {audio.currentTime = Math.max(0,Math.min(duration.value,Number(seconds) || 0));elapsed.value = audio.currentTime}}
  function setVolume(value) {volume.value = Math.max(0,Math.min(1,Number(value) || 0));if(audio) audio.volume = volume.value;persist()}
  function toggleMute() {muted.value = !muted.value;if(audio) audio.muted = muted.value;persist()}
  function cycleRepeat() {repeat.value = ['list','one','shuffle'][(['list','one','shuffle'].indexOf(repeat.value)+1)%3];persist()}
  function toggleFavorite() {if(!current.value) return;const key = `${current.value.source}:${current.value.id}`;favorites.value = favorites.value.includes(key) ? favorites.value.filter(k=>k!==key) : [...favorites.value,key];persist()}
  function addURL(raw,title) {
    const url = secureURL(raw.trim())
    if(!url) {errorText.value = '请输入可播放的音频直链（HTTPS），而不是音乐分享页面。';return false}
    const existing = customTracks.value.find(t=>t.url === url)
    let fileTitle = new URL(url).pathname.split('/').pop() || '我的音乐'
    try {fileTitle = decodeURIComponent(fileTitle)} catch { /* preserve malformed percent escapes as plain text */ }
    if(!existing) customTracks.value.push({id:`url-${Date.now()}-${Math.random().toString(36).slice(2,7)}`,url,title:title?.trim() || fileTitle,artist:'自定义音源',source:'custom'})
    try {localStorage.setItem(URL_KEY,JSON.stringify(customTracks.value.filter(t=>!t.local)))} catch { /* storage can be disabled */ }
    changeSource('custom');return true
  }
  function addFiles(files) {
    const accepted = Array.from(files).filter(f=>f.type.startsWith('audio/') || /\.(mp3|m4a|wav|ogg|flac|aac|opus|webm)$/i.test(f.name))
    if(!accepted.length) {errorText.value = '请选择 MP3、M4A、WAV、OGG 等音频文件。';return}
    for(const file of accepted) {const url = URL.createObjectURL(file);objectURLs.add(url);customTracks.value.push({id:`file-${Date.now()}-${Math.random().toString(36).slice(2,7)}`,url,title:file.name.replace(/\.[^.]+$/,''),artist:'本地音乐 · 仅在本机播放',source:'custom',local:true})}
    changeSource('custom')
  }
  function removeCustom(id) {
    const item = customTracks.value.find(t=>t.id===id)
    if(item?.local) {URL.revokeObjectURL(item.url);objectURLs.delete(item.url)}
    customTracks.value = customTracks.value.filter(t=>t.id!==id)
    try {localStorage.setItem(URL_KEY,JSON.stringify(customTracks.value.filter(t=>!t.local)))} catch { /* storage can be disabled */ }
    if(source.value === 'custom') loadSource()
  }
  function dispose() {disposed = true;listGeneration++;resetAudio();for(const url of objectURLs) URL.revokeObjectURL(url);objectURLs.clear();if(navigator.mediaSession) {navigator.mediaSession.metadata = null;for(const action of ['play','pause','previoustrack','nexttrack','seekto']) {try {navigator.mediaSession.setActionHandler(action,null)} catch {}}}audio = null;initialized = false}
  return {tracks,index,source,playlistId,current,sourceLabel,playing,loading,resolving,errorText,elapsed,duration,volume,muted,repeat,favorites,currentFavorite,init,loadSource,changeSource,setPlaylist,search,play,pause,toggle,selectTrack,step,seek,setVolume,toggleMute,cycleRepeat,toggleFavorite,addURL,addFiles,removeCustom,dispose}
})

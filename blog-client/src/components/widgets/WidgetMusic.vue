<template>
  <div class="widget-card music-player">
    <div class="player-heading"><span><el-icon><Headset /></el-icon> 此刻在听 <small>NOW PLAYING</small></span><span class="player-badge">{{ music.tracks.length }} 首</span></div>
    <div class="player-source"><label :for="`${uid}-source`">音源</label><select :id="`${uid}-source`" :value="music.source" @change="changeSource($event.target.value)"><option v-for="s in MUSIC_SOURCES" :key="s.key" :value="s.key">{{ s.label }}</option></select><button class="player-icon" :disabled="music.loading" aria-label="刷新当前音源" @click="music.loadSource(true)"><el-icon><Refresh /></el-icon></button></div>
    <form v-if="music.source === 'netease-custom'" class="player-input-row" @submit.prevent="music.setPlaylist(playlistInput)"><input v-model="playlistInput" aria-label="网易云歌单链接或 ID" placeholder="粘贴网易云歌单链接或 ID"><button type="submit">载入</button></form>
    <form v-if="music.source.startsWith('netease')" class="player-search" @submit.prevent="music.search(query)"><el-icon><Search /></el-icon><input v-model="query" aria-label="搜索歌曲或歌手" placeholder="搜索歌曲 / 歌手"><button v-if="query" type="button" aria-label="清空音乐搜索" @click="query = ''; music.loadSource()"><el-icon><Close /></el-icon></button><button type="submit" :disabled="music.loading">搜索</button></form>
    <div v-if="music.source === 'custom'" class="custom-source"><form class="player-input-row" @submit.prevent="addURL"><input v-model="urlInput" type="url" aria-label="音频直链" placeholder="https://…/music.mp3" required><button type="submit">添加直链</button></form><label class="file-pick"><el-icon><Plus /></el-icon> 选择本地音乐<input type="file" accept="audio/*,.mp3,.m4a,.flac,.ogg,.wav,.opus" multiple @change="addFiles"></label><p>本地文件仅在本机播放；音频直链会保存在此浏览器。</p></div>
    <div class="player-main"><div class="player-record" :class="{ spinning: music.playing }"><img v-if="music.current?.pic && !coverFailed" :src="music.current.pic" :alt="`${music.current.title} 的封面`" referrerpolicy="no-referrer" @error="coverFailed = true"><span v-else aria-hidden="true">✳</span><i></i></div><div class="player-track"><p class="track-eyebrow">{{ music.loading ? '寻找此刻的旋律' : music.resolving ? '正在连接音源' : music.playing ? '让音乐陪你一会儿' : '按下播放，让时间慢一点' }}</p><h3>{{ music.current?.title || (music.loading ? '正在载入歌单…' : '选一个音源，开始听听。') }}</h3><p class="track-artist">{{ music.current?.artist || '每一个日常，都可以有自己的配乐。' }}</p></div><button class="player-favorite" :class="{ active:music.currentFavorite }" :aria-pressed="!!music.currentFavorite" :aria-label="music.currentFavorite ? '取消收藏当前歌曲' : '收藏当前歌曲'" :disabled="!music.current" @click="music.toggleFavorite"><svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z"/></svg></button></div>
    <div class="player-progress"><input type="range" :min="0" :max="music.duration || 1" step="0.1" :value="music.elapsed" :disabled="!music.duration" aria-label="歌曲播放进度" :style="{ '--progress': `${progress}%` }" @input="music.seek($event.target.value)"><div><span>{{ fmt(music.elapsed) }}</span><span>{{ fmt(music.duration) }}</span></div></div>
    <div class="player-controls"><button class="player-icon repeat-button" :aria-label="`切换播放模式，当前${repeatLabel}`" :title="repeatLabel" @click="music.cycleRepeat"><span>{{ music.repeat === 'shuffle' ? '⤨' : music.repeat === 'one' ? '↻¹' : '↻' }}</span></button><div class="player-transport"><button class="player-icon" aria-label="上一首" :disabled="!music.current || music.loading" @click="music.step(-1)"><el-icon><ArrowLeftBold /></el-icon></button><button class="player-play" :disabled="!music.current || music.loading" :aria-label="music.playing || music.resolving ? '暂停' : '播放'" @click="music.toggle"><el-icon :class="{ 'is-loading': music.resolving }"><component :is="music.resolving ? 'Loading' : music.playing ? 'VideoPause' : 'VideoPlay'" /></el-icon></button><button class="player-icon" aria-label="下一首" :disabled="!music.current || music.loading" @click="music.step(1)"><el-icon><ArrowRightBold /></el-icon></button></div><div class="player-volume"><button class="player-icon" :aria-label="music.muted ? '取消静音' : '静音'" @click="music.toggleMute"><el-icon><component :is="music.muted ? 'Mute' : 'Bell'" /></el-icon></button><input type="range" min="0" max="1" step="0.01" :value="music.volume" aria-label="音量" @input="music.setVolume($event.target.value)"></div></div>
    <div v-if="music.errorText" class="player-error" role="status"><p>{{ music.errorText }}</p><button v-if="music.source !== 'open' && music.source !== 'custom'" @click="changeSource('open')">切换开放音源 <el-icon><Right /></el-icon></button></div>
    <div class="player-bottom"><span><i :class="{ active: music.playing }"></i>{{ music.resolving ? '获取播放地址中…' : music.playing ? '音乐正在播放' : '不会自动播放' }}</span><button :aria-expanded="showList" @click="showList = !showList">{{ showList ? '收起歌单' : '查看歌单' }}<el-icon><ArrowDown /></el-icon></button></div>
    <div v-if="showList" class="player-list"><div class="playlist-tools"><span>{{ music.sourceLabel }}</span><label><input v-model="favoritesOnly" type="checkbox"> 只看收藏</label></div><ol><li v-for="item in visibleTracks" :key="`${item.track.source}:${item.track.id}`" :class="{ selected:item.i === music.index }"><button class="playlist-track" :disabled="music.loading" @click="music.selectTrack(item.i)"><span class="playlist-index">{{ item.i === music.index && music.playing ? '♫' : String(item.i + 1).padStart(2,'0') }}</span><span><strong>{{ item.track.title }}</strong><small>{{ item.track.artist }}</small></span><el-icon v-if="item.i === music.index"><component :is="music.playing ? 'VideoPause' : 'VideoPlay'" /></el-icon></button><button v-if="music.source === 'custom'" class="player-icon" :aria-label="`移除 ${item.track.title}`" @click="music.removeCustom(item.track.id)"><el-icon><Close /></el-icon></button></li></ol><p v-if="!visibleTracks.length" class="playlist-empty">{{ favoritesOnly ? '还没有收藏，点歌曲旁的爱心试试。' : '这个音源还没有曲目。' }}</p></div>
    <p class="source-note">{{ music.source.startsWith('netease') ? '音源：GD 音乐台 / 网易云。部分曲目可能受版权、地区或接口状态影响。' : music.source === 'open' ? '音源：SoundHelix 开放器乐作品。' : '音频直链需要支持浏览器播放；本地音乐刷新后需要重新选择。' }}</p>
  </div>
</template>
<script setup>
import { ref, computed, onMounted, watch, getCurrentInstance } from 'vue'
import { useMusicStore, MUSIC_SOURCES } from '../../stores/music'
const music = useMusicStore(), uid = `music-${getCurrentInstance().uid}`
const coverFailed = ref(false), showList = ref(false), favoritesOnly = ref(false), query = ref(''), urlInput = ref(''), playlistInput = ref(music.playlistId)
const progress = computed(() => music.duration ? Math.min(100,music.elapsed/music.duration*100) : 0)
const repeatLabel = computed(() => ({list:'列表循环',one:'单曲循环',shuffle:'随机播放'})[music.repeat])
const visibleTracks = computed(() => music.tracks.map((track,i)=>({track,i})).filter(({track})=>!favoritesOnly.value || music.favorites.includes(`${track.source}:${track.id}`)))
const fmt = n => `${Math.floor((Number.isFinite(n) ? n : 0)/60)}:${String(Math.floor((Number.isFinite(n) ? n : 0)%60)).padStart(2,'0')}`
function changeSource(key) { query.value = '';favoritesOnly.value = false;music.changeSource(key) }
function addURL() { if(music.addURL(urlInput.value)) {urlInput.value = '';showList.value = true} }
function addFiles(e) {music.addFiles(e.target.files);e.target.value = '';showList.value = true}
watch(()=>music.current?.id,()=>{coverFailed.value = false})
onMounted(()=>music.init())
</script>
<style scoped>
.music-player {
  padding: 26px;
  background: linear-gradient(135deg,#1c2a22,#151e1a);
  border: 1px solid #b4dfc225;
  border-radius: 13px;
  box-shadow: none;
}

.player-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.player-heading>span:first-child {
  display: flex;
  align-items: center;
  gap: 7px;
  font-size: 12px;
  color: var(--text-hi);
}

.player-heading .el-icon {
  color: var(--accent);
}

.player-heading small {
  font: 7px var(--font-mono);
  letter-spacing: .12em;
  margin-left: 6px;
  color: var(--text-faint);
}

.player-badge {
  font: 8px var(--font-mono);
  border: 1px solid var(--hairline);
  padding: 3px 7px;
  border-radius: 4px;
  color: var(--text-dim);
}

.player-source {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 21px;
  border-top: 1px solid var(--hairline);
  padding-top: 15px;
}

.player-source label {
  font-size: 9px;
  color: var(--text-faint);
}

.player-source select {
  flex: 1;
  min-width: 0;
  background: #0f191340;
  border: 1px solid var(--hairline);
  color: var(--text);
  padding: 7px 8px;
  border-radius: 5px;
  font-size: 10px;
  cursor: pointer;
}

.player-source select option {
  background: #17251c;
}

.player-icon {
  display: grid;
  place-items: center;
  flex: none;
  border: 0;
  background: none;
  color: var(--text-dim);
  width: 30px;
  height: 30px;
  cursor: pointer;
  font-size: 14px;
  border-radius: 5px;
}

.player-icon:hover {
  color: var(--accent);
  background: var(--surface-3);
}

.player-search {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 10px;
  padding: 7px 9px;
  border: 1px solid var(--hairline);
  border-radius: 5px;
  font-size: 11px;
  color: var(--text-faint);
}

.player-search input {
  flex: 1;
  min-width: 0;
  border: 0;
  background: none;
  font-size: 10px;
  color: var(--text);
  outline: 0;
}

.player-search button {
  border: 0;
  background: none;
  font-size: 9px;
  padding: 0;
  color: var(--accent);
  cursor: pointer;
}

.player-input-row {
  display: flex;
  gap: 7px;
  margin-top: 10px;
}

.player-input-row input {
  min-width: 0;
  flex: 1;
  background: #0f191340;
  border: 1px solid var(--hairline);
  border-radius: 5px;
  font-size: 10px;
  padding: 9px;
  color: var(--text);
}

.player-input-row button {
  padding: 8px 10px;
  white-space: nowrap;
  background: var(--accent-soft);
  color: var(--accent);
  border: 1px solid var(--hairline);
  border-radius: 5px;
  font-size: 9px;
  cursor: pointer;
}

.file-pick {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 10px;
  color: var(--accent);
  margin-top: 12px;
  cursor: pointer;
}

.file-pick input {
  display: none;
}

.custom-source>p {
  font-size: 8px;
  color: var(--text-faint);
  margin: 6px 0 0;
  line-height: 1.7;
}

.player-main {
  display: flex;
  align-items: center;
  gap: 18px;
  margin: 24px 0 20px;
}

.player-record {
  position: relative;
  display: grid;
  place-items: center;
  width: 75px;
  height: 75px;
  border-radius: 50%;
  flex: none;
  background: repeating-radial-gradient(circle,#202922 0 2px,#162018 3px 4px);
  border: 1px solid #7895803d;
  box-shadow: 0 0 0 5px #9fceb706;
  animation: record-turn 18s linear infinite;
  animation-play-state: paused;
  overflow: hidden;
}

.player-record.spinning {
  animation-play-state: running;
}

.player-record>span {
  font-size: 30px;
  color: #a4c4ab;
}

.player-record img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: .85;
}

.player-record i {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%,-50%);
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #17231a;
  border: 2px solid #accfb6;
}

.player-track {
  min-width: 0;
  flex: 1;
}

.track-eyebrow {
  font-size: 8px;
  color: var(--text-faint);
  margin: 0 0 8px;
}

.player-track h3 {
  font-size: 18px;
  font-weight: 500;
  line-height: 1.5;
  margin: 0 0 5px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.track-artist {
  font-size: 10px;
  color: var(--text-dim);
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.player-favorite {
  background: none;
  border: 0;
  color: var(--text-faint);
  cursor: pointer;
  padding: 5px;
}

.player-favorite.active {
  color: #d89b9f;
}

.player-favorite.active svg {
  fill: #d89b9f25;
}

.player-progress input {
  appearance: none;
  height: 3px;
  width: 100%;
  border-radius: 10px;
  background: linear-gradient(90deg,var(--accent) var(--progress),#b4dfc21a var(--progress));
  display: block;
  cursor: pointer;
}

.player-progress input::-webkit-slider-thumb {
  appearance: none;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--accent);
  opacity: 0;
  transition: opacity .2s;
}

.player-progress input:hover::-webkit-slider-thumb,.player-progress input:focus::-webkit-slider-thumb {
  opacity: 1;
}

.player-progress input::-moz-range-thumb {
  width: 8px;
  height: 8px;
  border: 0;
  background: var(--accent);
}

.player-progress>div {
  display: flex;
  justify-content: space-between;
  margin-top: 8px;
  font: 8px var(--font-mono);
  color: var(--text-faint);
}

.player-controls {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 17px 0 20px;
  gap: 10px;
}

.repeat-button span {
  font: 22px var(--font-sans);
  color: var(--text-dim);
}

.player-transport {
  display: flex;
  align-items: center;
  gap: 19px;
  margin-left: 25px;
}

.player-play {
  width: 42px;
  height: 42px;
  display: grid;
  place-items: center;
  border: 0;
  border-radius: 50%;
  background: var(--accent);
  color: #15291c;
  cursor: pointer;
  font-size: 19px;
  transition: transform .2s;
}

.player-play:hover {
  transform: scale(1.07);
}

.player-volume {
  display: flex;
  align-items: center;
  gap: 3px;
}

.player-volume input {
  width: 45px;
  height: 2px;
  accent-color: var(--accent);
  cursor: pointer;
}

.player-bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-top: 1px solid var(--hairline);
  padding-top: 13px;
  font-size: 8px;
  color: var(--text-faint);
  gap: 10px;
}

.player-bottom>span {
  display: flex;
  align-items: center;
  gap: 6px;
}

.player-bottom i {
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: #637768;
}

.player-bottom i.active {
  background: var(--accent);
}

.player-bottom button {
  display: flex;
  align-items: center;
  gap: 7px;
  background: none;
  border: 0;
  color: var(--text-dim);
  font-size: 9px;
  cursor: pointer;
  padding: 0;
}

.player-error {
  background: #d1b78e0b;
  border: 1px solid #d1b78e20;
  border-radius: 6px;
  padding: 10px 12px;
  margin-bottom: 13px;
}

.player-error p {
  font-size: 10px;
  color: #c9bda4;
  margin: 0;
  line-height: 1.7;
}

.player-error button {
  display: flex;
  gap: 7px;
  align-items: center;
  border: 0;
  background: none;
  color: var(--accent);
  font-size: 9px;
  cursor: pointer;
  padding: 8px 0 0;
}

.source-note {
  font-size: 8px;
  line-height: 1.7;
  color: var(--text-faint);
  margin: 10px 0 0;
}

.player-list {
  margin-top: 15px;
}

.playlist-tools {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 9px;
  color: var(--text-faint);
  padding: 8px 0;
}

.playlist-tools label {
  display: flex;
  align-items: center;
  gap: 5px;
  white-space: nowrap;
}

.playlist-tools input {
  accent-color: var(--accent);
}

.player-list ol {
  list-style: none;
  margin: 0;
  padding: 0;
  max-height: 245px;
  overflow: auto;
}

.player-list li {
  display: flex;
  border-bottom: 1px solid var(--hairline);
  border-radius: 5px;
}

.player-list li.selected {
  background: var(--accent-soft);
}

.playlist-track {
  display: flex;
  align-items: center;
  width: 100%;
  gap: 10px;
  padding: 10px 8px;
  border: 0;
  background: none;
  text-align: left;
  cursor: pointer;
  min-width: 0;
}

.playlist-index {
  font: 8px var(--font-mono);
  color: var(--text-faint);
  width: 20px;
  flex: none;
}

.playlist-track>span:nth-child(2) {
  min-width: 0;
  flex: 1;
}

.playlist-track strong,.playlist-track small {
  display: block;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.playlist-track strong {
  font-size: 11px;
  color: var(--text);
  font-weight: 450;
}

.playlist-track small {
  font-size: 8px;
  color: var(--text-faint);
  margin-top: 4px;
}

.playlist-track>.el-icon {
  color: var(--accent);
}

.playlist-empty {
  font-size: 10px;
  color: var(--text-faint);
  padding: 20px;
  text-align: center;
}

@keyframes record-turn {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width:640px) {
  .music-player {
    padding: 20px;
  }
  .player-main {
    gap: 14px;
  }
  .player-record {
    width: 64px;
    height: 64px;
  }
  .player-track h3 {
    font-size: 16px;
  }
  .player-heading small {
    font-size: 6px;
  }
  .player-transport {
    gap: 15px;
    margin-left: 10px;
  }
  .player-volume input {
    width: 32px;
  }
}

@container (max-width:340px) {
  .player-heading small {
    display: none;
  }
}
</style>

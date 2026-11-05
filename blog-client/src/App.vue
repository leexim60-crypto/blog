<template>
  <div class="app-shell"><a class="skip-link" href="#main">跳到主要内容</a>
    <header class="site-header" :class="{ 'is-scrolled': scrolled }"><div class="shell header-inner">
      <router-link to="/" class="brand" aria-label="陈Hello，返回首页"><span class="brand-mark" aria-hidden="true">✳</span><span class="brand-name">陈Hello<span class="brand-dot">.</span></span><span class="brand-note">DIGITAL GARDEN</span></router-link>
      <nav class="site-nav" aria-label="主导航"><router-link to="/" :class="{ active: route.path === '/' && !route.hash }">首页</router-link><router-link to="/diary" :class="{ active: route.path.startsWith('/diary') }">日记</router-link><router-link to="/#work" :class="{ active: route.hash === '#work' }">作品</router-link><router-link to="/#listening" :class="{ active: route.hash === '#listening' }">音乐</router-link></nav>
      <div class="header-account"><span class="header-status"><span class="status-dot"></span> 持续生长中</span><el-dropdown v-if="userStore.isLoggedIn" trigger="click" @command="userCommand"><button class="account-button"><span class="account-avatar">{{ initial }}</span><span>{{ userStore.user?.nickname || userStore.user?.username }}</span><el-icon><ArrowDown /></el-icon></button><template #dropdown><el-dropdown-menu><el-dropdown-item command="write">写一篇日记</el-dropdown-item><el-dropdown-item command="logout" divided>退出登录</el-dropdown-item></el-dropdown-menu></template></el-dropdown><button v-else class="header-login" @click="userStore.openLogin()">登录 / 注册 <el-icon><TopRight /></el-icon></button></div>
      <button ref="menuButton" class="menu-toggle" :aria-expanded="mobileOpen" aria-controls="mobile-menu" :aria-label="mobileOpen ? '关闭导航菜单' : '打开导航菜单'" @click="mobileOpen = !mobileOpen"><el-icon><component :is="mobileOpen ? 'Close' : 'Grid'" /></el-icon></button>
    </div><div class="read-progress" aria-hidden="true"><span :style="{ transform: `scaleX(${progress})` }"></span></div></header>
    <Transition name="menu"><div v-if="mobileOpen" id="mobile-menu" ref="menuRef" class="mobile-menu" role="dialog" aria-modal="true" aria-label="站点导航" @keydown="trapMenu"><p class="eyebrow">EXPLORE THE GARDEN</p><nav><router-link v-for="(item, i) in navItems" :key="item.to" :to="item.to" @click="mobileOpen = false"><small>0{{ i + 1 }}</small>{{ item.label }}<el-icon><TopRight /></el-icon></router-link></nav><button class="btn-aurora" @click="mobileOpen = false; userStore.isLoggedIn ? router.push('/diary/new') : userStore.openLogin()">{{ userStore.isLoggedIn ? '记录这一刻' : '登录 / 注册' }}<el-icon><Right /></el-icon></button><p class="mobile-menu-note">保持好奇，持续创造。✳</p></div></Transition>
    <main id="main" tabindex="-1"><router-view v-slot="{ Component, route: r }"><Transition name="page" mode="out-in"><component :is="Component" :key="r.path" /></Transition></router-view></main>
    <footer class="site-footer"><div class="shell"><div class="footer-top"><div><router-link to="/" class="footer-brand">陈Hello<span>.</span></router-link><p>用代码探索可能，用文字收藏日常。</p></div><nav aria-label="页脚导航"><router-link to="/#work">精选作品 <el-icon><TopRight /></el-icon></router-link><router-link to="/diary">生活日记 <el-icon><TopRight /></el-icon></router-link><router-link to="/#listening">听点音乐 <el-icon><TopRight /></el-icon></router-link></nav><span class="footer-signature">Made of little things.</span></div><div class="footer-bottom"><span>© {{ year }} 陈Hello <span class="footer-bottom__sep">/</span> 保持好奇，持续创造</span><span class="footer-clock num">{{ clockText }}</span><button @click="toTop">回到顶部 <el-icon><Top /></el-icon></button></div></div></footer>
    <LoginDialog /><WidgetBoard />
    <div class="music-dock" :class="{ 'is-playing': music.playing }"><button class="music-dock-open" @click="musicDialog = true" :aria-label="music.current?.title ? `打开音乐播放器：${music.current.title}` : '打开音乐播放器'"><span class="music-dock-icon"><i v-for="i in 4" :key="i"></i></span><span>{{ music.current?.title && music.playing ? music.current.title : '听点音乐' }}</span></button><button v-if="music.current?.id" class="music-dock-toggle" :aria-label="music.playing ? '暂停音乐' : '播放音乐'" @click="music.toggle"><el-icon><component :is="music.playing ? 'VideoPause' : 'VideoPlay'" /></el-icon></button></div>
    <el-dialog v-model="musicDialog" title="此刻的背景音乐" class="music-dialog" width="560px" destroy-on-close><WidgetMusic /></el-dialog>
  </div>
</template>
<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useUserStore } from './stores/user'
import { useMusicStore } from './stores/music'
import LoginDialog from './components/LoginDialog.vue'
import WidgetBoard from './components/widgets/WidgetBoard.vue'
import WidgetMusic from './components/widgets/WidgetMusic.vue'
const route = useRoute(), router = useRouter(), userStore = useUserStore(), music = useMusicStore()
const mobileOpen = ref(false), musicDialog = ref(false), scrolled = ref(false), progress = ref(0), menuRef = ref(null), menuButton = ref(null)
const navItems = [{to:'/',label:'首页'},{to:'/diary',label:'日记'},{to:'/#work',label:'精选作品'},{to:'/#listening',label:'听点音乐'}]
const initial = computed(() => String(userStore.user?.nickname || userStore.user?.username || '?').trim().charAt(0).toUpperCase())
const year = new Date().getFullYear(), clockText = ref('')
let clockTimer, frame = 0, previousOverflow = ''
function tickClock() { clockText.value = new Date().toLocaleString('zh-CN',{timeZone:'Asia/Shanghai',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hour12:false}).replace(/\//g,'.') }
function onScroll() { if(frame) return; frame = requestAnimationFrame(() => { scrolled.value = window.scrollY > 12; const max = document.documentElement.scrollHeight - innerHeight; progress.value = max > 0 ? Math.min(1,window.scrollY/max) : 0; frame = 0 }) }
function toTop() { window.scrollTo({top:0,behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'}) }
function userCommand(command) { if(command === 'logout') { userStore.logout(); ElMessage.success('已退出登录') } else router.push('/diary/new') }
function onKeydown(e) { if(e.key === 'Escape') mobileOpen.value = false }
function onResize() { if(innerWidth >= 768) mobileOpen.value = false }
function trapMenu(e) { if(e.key !== 'Tab') return; const items = menuRef.value?.querySelectorAll('a,button'); if(!items?.length) return; const first = items[0], last = items[items.length-1]; if(e.shiftKey && document.activeElement === first) {e.preventDefault();last.focus()} else if(!e.shiftKey && document.activeElement === last) {e.preventDefault();first.focus()} }
watch(mobileOpen,async open => { if(open) {previousOverflow = document.body.style.overflow;document.body.style.overflow = 'hidden';await nextTick();menuRef.value?.querySelector('a')?.focus()} else {document.body.style.overflow = previousOverflow;menuButton.value?.focus()} })
watch(() => route.fullPath,() => {mobileOpen.value = false})
onMounted(() => {window.addEventListener('scroll',onScroll,{passive:true});window.addEventListener('keydown',onKeydown);window.addEventListener('resize',onResize,{passive:true});tickClock();clockTimer = setInterval(tickClock,30000);onScroll()})
onBeforeUnmount(() => {window.removeEventListener('scroll',onScroll);window.removeEventListener('keydown',onKeydown);window.removeEventListener('resize',onResize);clearInterval(clockTimer);cancelAnimationFrame(frame);if(mobileOpen.value) document.body.style.overflow = previousOverflow;music.dispose()})
</script>
<style scoped>
.app-shell {
  min-height: 100svh;
  display: flex;
  flex-direction: column;
}

main {
  flex: 1;
}

.skip-link {
  position: fixed;
  top: -80px;
  left: 20px;
  z-index: 4000;
  background: var(--accent);
  color: #11241c;
  padding: 10px 20px;
  border-radius: 8px;
}

.skip-link:focus {
  top: 10px;
}

.site-header {
  height: var(--header-h);
  position: fixed;
  inset: 0 0 auto;
  z-index: var(--z-header);
  background: #0d1214b3;
  backdrop-filter: blur(18px);
  border-bottom: 1px solid var(--hairline);
  transition: background .3s;
}

.site-header.is-scrolled {
  background: #0d1214ee;
}

.header-inner {
  height: 100%;
  display: flex;
  align-items: center;
  gap: 30px;
}

.brand {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-right: auto;
  white-space: nowrap;
}

.brand-mark {
  display: grid;
  place-items: center;
  font-size: 31px;
  line-height: 1;
  color: var(--accent);
  transition: transform .5s;
}

.brand:hover .brand-mark {
  transform: rotate(90deg);
}

.brand-name {
  font-size: 19px;
  letter-spacing: -.04em;
  font-weight: 650;
  color: #eff4f0;
}

.brand-dot {
  color: var(--accent);
}

.brand-note {
  font: 7px var(--font-mono);
  color: var(--text-faint);
  letter-spacing: .13em;
  border-left: 1px solid var(--hairline);
  padding-left: 13px;
  margin-left: 5px;
}

.site-nav {
  display: flex;
  align-items: center;
  gap: 30px;
}

.site-nav a {
  position: relative;
  font-size: 13px;
  color: var(--text-dim);
  transition: .2s;
}

.site-nav a:hover,.site-nav a.active {
  color: var(--accent);
}

.site-nav a.active:after {
  content: '';
  position: absolute;
  bottom: -9px;
  left: 50%;
  width: 3px;
  height: 3px;
  border-radius: 50%;
  background: var(--accent);
}

.header-account {
  display: flex;
  align-items: center;
  gap: 23px;
  margin-left: auto;
}

.header-status {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 9px;
  color: var(--text-faint);
}

.header-status .status-dot {
  width: 4px;
  height: 4px;
}

.header-login {
  display: flex;
  align-items: center;
  gap: 13px;
  border: 1px solid var(--hairline-strong);
  border-radius: 7px;
  background: transparent;
  font-size: 10px;
  padding: 9px 13px;
  cursor: pointer;
}

.header-login:hover {
  border-color: var(--accent);
  color: var(--accent);
}

.account-button {
  display: flex;
  align-items: center;
  gap: 8px;
  border: 1px solid var(--hairline);
  background: var(--surface-1);
  border-radius: 7px;
  padding: 5px 8px;
  font-size: 10px;
  cursor: pointer;
  max-width: 160px;
}

.account-button>span:nth-child(2) {
  max-width: 80px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.account-avatar {
  display: grid;
  place-items: center;
  border-radius: 4px;
  background: var(--accent-soft);
  color: var(--accent);
  width: 23px;
  height: 23px;
}

.menu-toggle {
  display: none;
  width: 38px;
  height: 38px;
  background: none;
  border: 1px solid var(--hairline);
  border-radius: 7px;
  font-size: 17px;
}

.read-progress {
  position: absolute;
  bottom: -1px;
  left: 0;
  right: 0;
  height: 1px;
}

.read-progress span {
  display: block;
  height: 100%;
  background: var(--accent);
  transform-origin: left;
}

.mobile-menu {
  position: fixed;
  inset: var(--header-h) 0 0;
  background: #101916fa;
  z-index: 49;
  padding: 35px var(--gutter);
  backdrop-filter: blur(25px);
  display: flex;
  flex-direction: column;
  overflow: auto;
}

.mobile-menu nav {
  margin: 25px 0 35px;
}

.mobile-menu nav a {
  display: flex;
  align-items: center;
  gap: 22px;
  padding: 25px 0;
  border-bottom: 1px solid var(--hairline);
  font-size: 25px;
  color: var(--text-hi);
}

.mobile-menu nav small {
  font: 10px var(--font-mono);
  color: var(--text-faint);
}

.mobile-menu nav .el-icon {
  margin-left: auto;
  font-size: 21px;
  color: var(--accent);
}

.mobile-menu-note {
  font-size: 12px;
  color: var(--text-dim);
  margin-top: auto;
  padding-top: 30px;
}

.menu-enter-active,.menu-leave-active {
  transition: opacity .25s;
}

.menu-enter-from,.menu-leave-to {
  opacity: 0;
}

.site-footer {
  border-top: 1px solid var(--hairline);
  padding: 40px 0 22px;
  background: #0c1112;
}

.footer-top {
  display: flex;
  align-items: center;
  gap: 50px;
  padding-bottom: 30px;
}

.footer-brand {
  font-size: 25px;
  font-weight: 600;
  letter-spacing: -.04em;
}

.footer-brand>span {
  color: var(--accent);
}

.footer-top p {
  font-size: 10px;
  color: var(--text-dim);
  margin: 11px 0 0;
}

.footer-top nav {
  display: flex;
  gap: 24px;
  margin-left: auto;
  font-size: 10px;
  color: var(--text-dim);
}

.footer-top nav a {
  display: flex;
  align-items: center;
  gap: 6px;
}

.footer-top nav a:hover {
  color: var(--accent);
}

.footer-signature {
  font: italic 22px var(--font-serif);
  color: #7c9986;
}

.footer-bottom {
  border-top: 1px solid var(--hairline);
  padding-top: 20px;
  display: flex;
  align-items: center;
  gap: 25px;
  font-size: 9px;
  color: var(--text-faint);
}

.footer-bottom__sep {
  margin: 0 12px;
}

.footer-clock {
  font: 8px var(--font-mono);
  margin-left: auto;
}

.footer-bottom button {
  display: flex;
  align-items: center;
  gap: 9px;
  border: 0;
  background: none;
  cursor: pointer;
  font-size: 9px;
  color: var(--text-dim);
}

.footer-bottom button:hover {
  color: var(--accent);
}

.music-dock {
  position: fixed;
  z-index: 39;
  bottom: 22px;
  left: 22px;
  display: flex;
  align-items: center;
  background: #16201bf2;
  border: 1px solid #a0d5b532;
  border-radius: 99px;
  box-shadow: 0 8px 30px #0004;
  backdrop-filter: blur(15px);
  overflow: hidden;
}

.music-dock button {
  border: 0;
  background: none;
  cursor: pointer;
}

.music-dock-open {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 11px 15px;
  font-size: 10px;
}

.music-dock-open>span:last-child {
  max-width: 145px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.music-dock-icon {
  display: flex;
  align-items: center;
  gap: 2px;
  height: 15px;
}

.music-dock-icon i {
  width: 2px;
  background: var(--accent);
  height: 5px;
  border-radius: 2px;
}

.music-dock-icon i:nth-child(2) {
  height: 12px;
}

.music-dock-icon i:nth-child(3) {
  height: 8px;
}

.is-playing .music-dock-icon i {
  animation: equalizer .8s ease-in-out infinite alternate;
}

.is-playing .music-dock-icon i:nth-child(2) {
  animation-delay: -.4s;
}

.is-playing .music-dock-icon i:nth-child(3) {
  animation-delay: -.2s;
}

.is-playing .music-dock-icon i:nth-child(4) {
  animation-delay: -.6s;
}

.music-dock-toggle {
  border-left: 1px solid var(--hairline) !important;
  padding: 12px;
  font-size: 16px;
  color: var(--accent);
}

@keyframes equalizer {
  to {
    height: 14px;
  }
}

@media (max-width:1000px) {
  .brand-note,.header-status {
    display: none;
  }
  .header-inner {
    gap: 20px;
  }
  .site-nav {
    gap: 25px;
  }
  .footer-signature {
    display: none;
  }
}

@media (max-width:767px) {
  .site-nav,.header-account {
    display: none;
  }
  .menu-toggle {
    display: grid;
    place-items: center;
    margin-left: auto;
  }
  .header-inner {
    gap: 10px;
  }
  .brand-mark {
    font-size: 28px;
  }
  .brand-name {
    font-size: 19px;
  }
  .footer-top {
    align-items: flex-start;
    flex-wrap: wrap;
    gap: 22px;
  }
  .footer-top nav {
    margin: 0;
    gap: 23px;
    flex-wrap: wrap;
  }
  .footer-bottom {
    flex-wrap: wrap;
    gap: 14px;
  }
  .footer-clock {
    display: none;
  }
  .footer-bottom button {
    margin-left: auto;
  }
  .footer-bottom__sep {
    margin: 0 7px;
  }
  .music-dock {
    left: 15px;
    bottom: calc(15px + env(safe-area-inset-bottom));
  }
  .music-dock-open>span:last-child {
    max-width: 100px;
  }
}
</style>



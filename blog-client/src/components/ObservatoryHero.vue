<template>
  <section class="hero" :style="bannerStyle" aria-labelledby="hero-title">
    <div class="hero-grid" aria-hidden="true"></div>
    <div class="shell hero-layout">
      <div class="hero-copy">
        <p class="hero-label"><span class="status-dot"></span> A SMALL CORNER OF THE INTERNET</p>
        <h1 id="hero-title">你好，<br>我是 <span>陈Hello</span><i class="hero-star" aria-hidden="true">✳</i></h1>
        <p class="hero-statement">把想法写成作品，<br>把日常留在这里。</p>
        <p class="hero-description">一个热爱创造的人，一些认真打磨的作品，<br class="desktop-break">还有那些值得被记住的平凡瞬间。欢迎来到我的数字小宇宙。</p>
        <div class="hero-actions"><a href="#work" class="btn-aurora">探索我的作品 <el-icon><TopRight /></el-icon></a><router-link to="/diary" class="hero-journal">翻开日记 <el-icon><Right /></el-icon></router-link></div>
        <div class="hero-footnote"><span class="tiny-orbit" aria-hidden="true">◎</span> 保持好奇，持续创造 <span class="hero-footnote__line"></span><span class="num">{{ year }}</span></div>
      </div>
      <div class="orbital" aria-label="数字宇宙的轨道插画" role="img">
        <div class="orbital-orbit orbital-orbit--one"></div><div class="orbital-orbit orbital-orbit--two"></div><span class="orbital-cross cross-one">+</span><span class="orbital-cross cross-two">+</span>
        <div class="orbital-planet"><svg viewBox="0 0 400 400" aria-hidden="true"><defs><radialGradient id="planet-light" cx="28%" cy="22%" r="80%"><stop offset="0" stop-color="#92e4c6"/><stop offset=".32" stop-color="#469b82"/><stop offset=".68" stop-color="#1c4f43"/><stop offset="1" stop-color="#0a1818"/></radialGradient><clipPath id="planet-clip"><circle cx="200" cy="200" r="181"/></clipPath><filter id="planet-grain"><feTurbulence type="fractalNoise" baseFrequency=".55" numOctaves="3" seed="12"/><feColorMatrix type="saturate" values="0"/><feBlend in="SourceGraphic" mode="soft-light"/></filter><linearGradient id="planet-rim" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#b9f7db" stop-opacity=".7"/><stop offset="1" stop-color="#3b735f" stop-opacity="0"/></linearGradient></defs><circle cx="200" cy="200" r="181" fill="url(#planet-light)"/><g clip-path="url(#planet-clip)" fill="none" stroke="#b4f5d9" stroke-width=".7" opacity=".23"><ellipse v-for="r in [35,75,118,153,175]" :key="r" cx="200" cy="200" :rx="r" ry="181"/><ellipse v-for="r in [35,75,118,153,175]" :key="'h'+r" cx="200" cy="200" rx="181" :ry="r"/><path d="M19 200h362M200 19v362"/></g><circle cx="200" cy="200" r="181" fill="#497a66" opacity=".19" filter="url(#planet-grain)"/><circle cx="200" cy="200" r="181" fill="none" stroke="url(#planet-rim)" stroke-width="1.5"/></svg></div>
        <div class="orbital-satellite"><span></span></div><div class="orbital-card"><span class="status-dot"></span><div><strong>IDEAS IN ORBIT</strong><span>灵感正在发生</span></div><span class="orbital-card__spark">✦</span></div><div class="orbital-caption"><span>01 / PERSONAL UNIVERSE</span><span>∞ possibilities</span></div>
      </div>
    </div>
    <div class="shell hero-bottom"><a href="#work"><span>SCROLL TO EXPLORE</span><el-icon><ArrowDown /></el-icon></a><span>DESIGNED WITH CURIOSITY <span aria-hidden="true">✦</span></span></div>
  </section>
</template>
<script setup>
import { computed, ref, onMounted, onBeforeUnmount } from 'vue'
const wallpaper = ref(''), year = new Date().getFullYear()
const bannerStyle = computed(() => wallpaper.value ? { backgroundImage: `linear-gradient(90deg, rgba(13,18,20,.98), rgba(13,18,20,.7)), url("${wallpaper.value}")`, backgroundSize: 'cover', backgroundPosition: 'center' } : {})
function syncWallpaper() { try { const url = localStorage.getItem('blog_banner_wallpaper'); wallpaper.value = url && /^https?:\/\//.test(url) ? url : '' } catch { wallpaper.value = '' } }
onMounted(() => { syncWallpaper(); window.addEventListener('banner-wallpaper-change', syncWallpaper) })
onBeforeUnmount(() => window.removeEventListener('banner-wallpaper-change', syncWallpaper))
</script>
<style scoped>
.hero {
  position: relative;
  overflow: hidden;
  padding-top: var(--header-h);
  background: radial-gradient(ellipse at 76% 42%,#16352b55,transparent 52%);
}

.hero-grid {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background-image: linear-gradient(#b9dccb05 1px,transparent 1px),linear-gradient(90deg,#b9dccb05 1px,transparent 1px);
  background-size: 72px 72px;
  mask-image: linear-gradient(90deg,transparent 15%,#000);
}

.hero-layout {
  position: relative;
  display: grid;
  grid-template-columns: 1.12fr 1fr;
  align-items: center;
  gap: 20px;
  min-height: 650px;
  padding-top: 65px;
  padding-bottom: 55px;
}

.hero-label {
  font: 10px var(--font-mono);
  letter-spacing: .15em;
  color: var(--text-dim);
  display: flex;
  align-items: center;
  gap: 9px;
  margin: 0 0 32px;
}

.hero-copy h1 {
  margin: 0;
  font-size: clamp(46px,5.6vw,76px);
  line-height: 1.2;
  letter-spacing: -.055em;
  font-weight: 650;
}

.hero-copy h1>span {
  color: var(--accent);
}

.hero-star {
  display: inline-block;
  font-style: normal;
  font-size: .59em;
  vertical-align: middle;
  margin-left: 14px;
  color: var(--accent);
  animation: star-turn 24s linear infinite;
}

.hero-statement {
  font-size: clamp(20px,2.2vw,28px);
  line-height: 1.55;
  color: #e2e9e5;
  margin: 28px 0 16px;
}

.hero-description {
  font-size: 13px;
  line-height: 1.95;
  max-width: 410px;
  color: var(--text-dim);
  margin: 0;
}

.hero-actions {
  display: flex;
  align-items: center;
  gap: 28px;
  margin-top: 32px;
}

.hero-actions .btn-aurora {
  padding: 13px 23px;
}

.hero-journal {
  font-size: 13px;
  display: inline-flex;
  align-items: center;
  gap: 12px;
}

.hero-journal:hover {
  color: var(--accent);
}

.hero-footnote {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 44px;
  font-size: 11px;
  color: var(--text-faint);
}

.tiny-orbit {
  font-size: 19px;
  color: var(--accent);
}

.hero-footnote__line {
  height: 1px;
  width: 46px;
  background: var(--hairline);
}

.orbital {
  height: 480px;
  position: relative;
  isolation: isolate;
}

.orbital-planet {
  width: 360px;
  height: 360px;
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%,-50%) rotate(-22deg);
  border-radius: 50%;
  box-shadow: -20px -15px 85px #73deb817,30px 25px 70px #0007;
  overflow: hidden;
}

.orbital-planet svg {
  display: block;
  width: 100%;
  height: 100%;
}

.orbital-orbit {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 460px;
  height: 220px;
  border: 1px solid #a2d9bc27;
  border-radius: 50%;
  transform: translate(-50%,-50%) rotate(-35deg);
}

.orbital-orbit--two {
  width: 440px;
  height: 450px;
  transform: translate(-50%,-50%) rotate(20deg);
  border-style: dashed;
  border-color: #a2d9bc18;
}

.orbital-cross {
  position: absolute;
  color: #8fbaa383;
  font-size: 18px;
  font-weight: 200;
}

.cross-one {
  top: 20px;
  left: 18%;
}

.cross-two {
  right: 2%;
  bottom: 80px;
}

.orbital-satellite {
  position: absolute;
  left: 5%;
  top: 64%;
  width: 22px;
  height: 22px;
  border: 1px solid #a0d4bc50;
  border-radius: 50%;
  display: grid;
  place-items: center;
  box-shadow: 0 0 30px #84e2b52b;
}

.orbital-satellite span {
  width: 9px;
  height: 9px;
  background: var(--accent);
  border-radius: 50%;
}

.orbital-card {
  position: absolute;
  bottom: 54px;
  right: -2%;
  display: flex;
  align-items: center;
  gap: 12px;
  background: #141f1be6;
  backdrop-filter: blur(15px);
  border: 1px solid #acd6bd26;
  border-radius: 12px;
  padding: 17px 20px;
  box-shadow: 0 15px 40px #0004;
  animation: orbital-float 7s ease-in-out infinite;
}

.orbital-card strong {
  display: block;
  font: 9px var(--font-mono);
  letter-spacing: .12em;
  color: #b9d6c7;
}

.orbital-card div>span {
  display: block;
  color: var(--text-dim);
  font-size: 12px;
  margin-top: 5px;
}

.orbital-card__spark {
  color: var(--accent);
  font-size: 23px;
  margin-left: 12px;
}

.orbital-caption {
  position: absolute;
  top: 18px;
  right: 1%;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 6px;
  font: 9px var(--font-mono);
  letter-spacing: .08em;
  color: var(--text-faint);
}

.orbital-caption span:last-child {
  font: italic 19px var(--font-serif);
  letter-spacing: 0;
  color: #9eb7ab;
}

.hero-bottom {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 22px;
  padding-bottom: 24px;
  border-top: 1px solid var(--hairline);
  font: 9px var(--font-mono);
  letter-spacing: .13em;
  color: var(--text-faint);
}

.hero-bottom a {
  display: flex;
  align-items: center;
  gap: 25px;
}

.hero-bottom>span>span {
  margin-left: 13px;
  color: var(--accent);
}

@keyframes star-turn {
  to {
    transform: rotate(360deg);
  }
}

@keyframes orbital-float {
  50% {
    transform: translateY(-8px);
  }
}

@media (min-width:1440px) {
  .hero-layout {
    min-height: 720px;
  }
}

@media (max-width:900px) {
  .orbital-planet {
    width: 290px;
    height: 290px;
  }
  .orbital-orbit {
    width: 360px;
    height: 190px;
  }
  .orbital-orbit--two {
    width: 350px;
    height: 350px;
  }
  .orbital-card {
    right: 0;
    padding: 13px;
  }
  .hero-copy h1 {
    font-size: 55px;
  }
  .hero-label {
    font-size: 8px;
    letter-spacing: .08em;
  }
}

@media (max-width:640px) {
  .hero-layout {
    grid-template-columns: 1fr;
    gap: 0;
    min-height: 0;
    padding-top: 55px;
    padding-bottom: 16px;
  }
  .hero-copy h1 {
    font-size: 52px;
  }
  .hero-label {
    margin-bottom: 25px;
    font-size: 8px;
  }
  .hero-statement {
    margin-top: 23px;
    font-size: 23px;
  }
  .hero-description {
    font-size: 12px;
    max-width: 330px;
  }
  .hero-footnote {
    margin-top: 29px;
  }
  .orbital {
    height: 350px;
    margin: 16px 0 0;
  }
  .orbital-planet {
    width: 270px;
    height: 270px;
  }
  .orbital-orbit {
    width: 335px;
    height: 170px;
  }
  .orbital-orbit--two {
    width: 320px;
    height: 320px;
  }
  .orbital-caption {
    top: 5px;
    right: 4%;
  }
  .orbital-card {
    bottom: 24px;
    right: 5%;
  }
  .hero-bottom {
    font-size: 8px;
  }
  .hero-bottom>span {
    display: none;
  }
  .hero-actions {
    gap: 22px;
  }
  .hero-actions .btn-aurora {
    font-size: 12px;
  }
}
</style>

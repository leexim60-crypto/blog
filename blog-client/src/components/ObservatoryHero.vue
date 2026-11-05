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
      <MoonExplorer :projects="projectsStore.projects" />
    </div>
    <div class="shell hero-bottom"><a href="#work"><span>SCROLL TO EXPLORE</span><el-icon><ArrowDown /></el-icon></a><span>DESIGNED WITH CURIOSITY <span aria-hidden="true">✦</span></span></div>
  </section>
</template>
<script setup>
import { computed, ref, onMounted, onBeforeUnmount } from 'vue'
import MoonExplorer from './MoonExplorer.vue'
import { useProjectsStore } from '../stores/projects'
const projectsStore = useProjectsStore()
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

@media (min-width:1440px) {
  .hero-layout {
    min-height: 720px;
  }
}

@media (max-width:900px) {
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

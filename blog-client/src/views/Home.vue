<template>
  <div class="home">
    <ObservatoryHero />
    <section id="work" class="section" aria-labelledby="work-title"><div class="shell">
      <header class="section-heading" v-reveal><div><p class="eyebrow">01 / SELECTED WORK</p><h2 id="work-title">把好奇心，变成<span>作品。</span></h2><p class="section-description">从一个小念头，到一个可以亲手体验的世界。</p></div><span class="section-counter">{{ String(projectsStore.projects.length).padStart(2, '0') }}<small> 个已上线的作品</small></span></header>
      <div class="work-toolbar" v-reveal><div class="work-filters" aria-label="筛选作品"><button v-for="f in filters" :key="f.key" :class="{ active: filter === f.key }" :aria-pressed="filter === f.key" @click="filter = f.key">{{ f.label }}<span v-if="f.key === 'all'">{{ projectsStore.projects.length }}</span></button></div><span class="work-toolbar__note"><span class="status-dot"></span> SMALL IDEAS, REAL THINGS</span></div>
      <div class="work-grid"><a v-for="(proj, i) in filteredProjects" :key="proj.url" :href="proj.url" target="_blank" rel="noopener noreferrer" class="work-card" v-reveal="i * 60"><ProjectPreview :type="proj.preview"/><div class="work-card__body"><div class="work-card__meta"><span>{{ proj.category === 'game' ? 'INTERACTIVE / GAME' : 'LEARNING / TOOL' }}</span><span class="work-live"><i></i> 已上线</span></div><h3>{{ proj.displayName || proj.name }}<span class="work-card__go"><el-icon><TopRight /></el-icon></span></h3><p>{{ proj.shortDesc || proj.desc }}</p><div class="work-tags"><span v-for="tag in proj.tags" :key="tag">{{ tag }}</span></div></div></a></div>
      <p v-if="!filteredProjects.length" class="work-empty">这个分类的作品正在路上。</p>
    </div></section>
    <section id="journal" class="section section-journal" aria-labelledby="journal-title"><div class="shell journal-layout">
      <div class="journal-intro" v-reveal><p class="eyebrow">02 / LITTLE MOMENTS</p><h2 id="journal-title">日子很普通，<br>也值得<span>记录。</span></h2><p>代码之外，是生活。<br>把那些转瞬即逝的想法，慢慢写下来。</p><router-link to="/diary" class="text-link">翻阅全部日记 <el-icon><Right /></el-icon></router-link><span class="journal-handwriting">A life, in little notes.</span></div>
      <div class="journal-feed"><ol v-if="recent.length" class="journal-list"><li v-for="(d, i) in recent" :key="d.id" v-reveal="i * 60"><router-link :to="`/diary/${d.id}`" class="journal-entry"><span class="journal-date"><strong class="num">{{ dayOf(d.diary_date) }}</strong><small>{{ monthOf(d.diary_date) }}</small></span><div class="journal-entry__body"><div class="journal-entry__meta"><span>日常随记</span><span>{{ readingMinutes(d.content) }} 分钟阅读</span></div><h3>{{ d.title || fullDate(d.diary_date) }} <span v-if="d.mood">{{ d.mood }}</span></h3><p>{{ plainText(d.content, 65) }}</p></div><span class="journal-arrow"><el-icon><TopRight /></el-icon></span></router-link></li></ol><div v-else-if="loadingJournal" class="journal-loading" aria-label="正在加载日记"><div v-for="i in 3" :key="i"><span class="skeleton-line"></span><span class="skeleton-line"></span></div></div><div v-else class="journal-empty" v-reveal><span class="journal-empty__art" aria-hidden="true">⌁</span><p class="eyebrow">A PAGE WAITING TO BE WRITTEN</p><h3>{{ journalError ? '稍作停留，日记很快回来。' : '故事，就从今天开始。' }}</h3><p>{{ journalError ? '暂时无法获取日记，你可以稍后再试。' : '这里会收留每一个不想被忘记的日子。' }}</p><button v-if="journalError" class="text-link" @click="loadRecent">重新加载 <el-icon><Refresh /></el-icon></button><router-link v-else to="/diary" class="text-link">去写第一篇 <el-icon><Right /></el-icon></router-link></div></div>
    </div></section>
    <section id="listening" class="section listening-section" aria-labelledby="listening-title"><div class="shell listening-layout"><div v-reveal><p class="eyebrow">03 / SOUNDTRACK OF NOW</p><h2 id="listening-title">给此刻，<br>一点<span>背景音乐。</span></h2><p class="section-description">写代码、读日记，或者只是发一会儿呆。<br>选一首喜欢的，让时间慢下来。</p><span class="listening-note"><el-icon><Headset /></el-icon> 音乐由你开启，陪伴一直在线。</span></div><WidgetMusic class="home-player" v-reveal="80" /></div></section>
    <section class="outro"><div class="shell outro-inner" v-reveal><span class="outro-symbol" aria-hidden="true">✳</span><div><p class="eyebrow">STAY CURIOUS. KEEP CREATING.</p><h2>下一次灵感，<span>见。</span></h2><p>小宇宙持续生长中，欢迎随时回来坐坐。</p></div><router-link v-if="userStore.isLoggedIn" to="/diary/new" class="btn-aurora">记录这一刻 <el-icon><EditPen /></el-icon></router-link><button v-else class="btn-aurora" @click="userStore.openLogin()">加入这个小宇宙 <el-icon><TopRight /></el-icon></button></div></section>
  </div>
</template>
<script setup>
import { ref, computed, onMounted } from 'vue'
import ObservatoryHero from '../components/ObservatoryHero.vue'
import ProjectPreview from '../components/ProjectPreview.vue'
import WidgetMusic from '../components/widgets/WidgetMusic.vue'
import { useProjectsStore } from '../stores/projects'
import { useUserStore } from '../stores/user'
import { fetchJson } from '../utils/widgetFetch'
import { plainText, readingMinutes, parseDate, fullDateCN } from '../utils/text'
const projectsStore = useProjectsStore(), userStore = useUserStore()
const filter = ref('all'), filters = [{key:'all',label:'全部作品'},{key:'game',label:'互动游戏'},{key:'tool',label:'学习工具'}]
const filteredProjects = computed(() => projectsStore.projects.filter(p => filter.value === 'all' || p.category === filter.value))
const recent = ref([]), loadingJournal = ref(true), journalError = ref(false)
const dayOf = s => String(parseDate(s).day).padStart(2, '0')
const monthOf = s => `${parseDate(s).month}月 / ${parseDate(s).year}`
const fullDate = fullDateCN
let recentRequest = 0
async function loadRecent() { const id = ++recentRequest; loadingJournal.value = true; journalError.value = false; try { const base = import.meta.env.VITE_API_URL || '/api'; const res = await fetchJson(`${base.replace(/\/$/, '')}/diaries?page=1&pageSize=3`, {timeout:12000}); if(id === recentRequest) recent.value = (res?.data?.list || []).filter(d => d.is_public !== 0 && d.is_public !== false).slice(0,3) } catch { if(id === recentRequest) journalError.value = true } finally { if(id === recentRequest) loadingJournal.value = false } }
onMounted(loadRecent)
</script>
<style scoped>
.section {
  padding: 88px 0;
}

.section-heading {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 30px;
  gap: 24px;
}

.section-heading h2,.journal-intro h2,.listening-layout h2 {
  font-size: clamp(26px,3vw,37px);
  letter-spacing: -.03em;
  line-height: 1.45;
  margin: 14px 0 12px;
  font-weight: 550;
}

.section-heading h2 span,.journal-intro h2 span,.listening-layout h2 span,.outro h2 span {
  color: var(--accent);
}

.section-description {
  font-size: 12px;
  color: var(--text-dim);
  line-height: 1.9;
  margin: 0;
}

.section-counter {
  font: 36px var(--font-serif);
  color: var(--accent);
  white-space: nowrap;
}

.section-counter small {
  font: 10px var(--font-sans);
  margin-left: 8px;
  color: var(--text-faint);
}

.work-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-top: 1px solid var(--hairline);
  padding: 19px 0 25px;
  gap: 12px;
}

.work-filters {
  display: flex;
  gap: 5px;
}

.work-filters button {
  background: transparent;
  border: 1px solid transparent;
  border-radius: 7px;
  font-size: 11px;
  padding: 7px 14px;
  color: var(--text-dim);
  cursor: pointer;
  transition: .25s;
}

.work-filters button.active {
  border-color: var(--hairline-strong);
  background: #bddec90a;
  color: #e4ece7;
}

.work-filters button:hover {
  color: var(--accent);
}

.work-filters button span {
  font: 9px var(--font-mono);
  margin-left: 8px;
  color: var(--accent);
}

.work-toolbar__note {
  font: 8px var(--font-mono);
  letter-spacing: .09em;
  color: var(--text-faint);
  display: flex;
  gap: 8px;
  align-items: center;
}

.work-toolbar__note .status-dot {
  width: 4px;
  height: 4px;
}

.work-grid {
  display: grid;
  grid-template-columns: repeat(3,minmax(0,1fr));
  gap: 21px;
}

.work-card {
  border: 1px solid var(--hairline);
  background: #141b1b;
  border-radius: 12px;
  overflow: hidden;
  transition: transform .4s var(--ease-out-expo),border-color .4s,box-shadow .4s;
}

.work-card:hover {
  transform: translateY(-7px);
  border-color: #96c9aa50;
  box-shadow: 0 15px 50px #0003;
}

.work-card__body {
  padding: 21px;
}

.work-card__meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font: 7px var(--font-mono);
  letter-spacing: .07em;
  color: var(--text-faint);
  gap: 5px;
}

.work-live {
  display: flex;
  align-items: center;
  gap: 4px;
  font: 8px var(--font-sans);
  color: #abc8b8;
  white-space: nowrap;
}

.work-live i {
  width: 4px;
  height: 4px;
  background: #8bbb9a;
  border-radius: 50%;
}

.work-card h3 {
  font-size: 17px;
  margin: 16px 0 11px;
  font-weight: 550;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.work-card__go {
  width: 26px;
  height: 26px;
  border: 1px solid var(--hairline);
  border-radius: 50%;
  display: grid;
  place-items: center;
  color: var(--text-dim);
  font-size: 13px;
  transition: .3s;
}

.work-card:hover .work-card__go {
  background: var(--accent);
  color: #132019;
  border-color: var(--accent);
  transform: rotate(8deg);
}

.work-card__body>p {
  font-size: 11px;
  line-height: 1.9;
  color: var(--text-dim);
  min-height: 42px;
  margin: 0;
}

.work-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 20px;
}

.work-tags>span {
  padding: 3px 7px;
  background: #ffffff04;
  border: 1px solid var(--hairline);
  border-radius: 4px;
  font: 8px var(--font-mono);
  color: #92a59b;
}

.work-empty {
  padding: 30px;
  color: var(--text-dim);
}

.section-journal {
  border-top: 1px solid var(--hairline);
  background: #111817;
}

.journal-layout {
  display: grid;
  grid-template-columns: minmax(0,.85fr) minmax(0,1.5fr);
  gap: 70px;
}

.journal-intro h2 {
  margin-top: 18px;
}

.journal-intro>p:not(.eyebrow) {
  color: var(--text-dim);
  font-size: 12px;
  line-height: 1.9;
  margin: 17px 0 24px;
}

.text-link {
  display: inline-flex;
  align-items: center;
  gap: 17px;
  font-size: 11px;
  color: var(--accent);
  background: none;
  border: 0;
  padding: 0;
  cursor: pointer;
  transition: gap .3s;
}

.text-link:hover {
  gap: 23px;
}

.journal-handwriting {
  display: block;
  font: italic 24px var(--font-serif);
  color: #657b6e;
  margin-top: 45px;
}

.journal-list {
  list-style: none;
  margin: 0;
  padding: 0;
}

.journal-entry {
  display: flex;
  align-items: center;
  gap: 22px;
  border-bottom: 1px solid var(--hairline);
  padding: 24px 0;
  transition: .3s;
}

.journal-entry:hover {
  padding-left: 7px;
}

.journal-date {
  width: 49px;
  flex: none;
  display: flex;
  flex-direction: column;
  gap: 7px;
  align-items: center;
}

.journal-date strong {
  font: 39px/1 var(--font-serif);
  color: #9dac9f;
}

.journal-date small {
  font: 7px var(--font-mono);
  color: var(--text-faint);
  white-space: nowrap;
}

.journal-entry__body {
  min-width: 0;
  flex: 1;
}

.journal-entry__meta {
  display: flex;
  gap: 12px;
  font-size: 8px;
  color: var(--text-faint);
}

.journal-entry h3 {
  font-size: 15px;
  margin: 8px 0;
  line-height: 1.6;
  font-weight: 500;
}

.journal-entry h3>span {
  font-size: 12px;
  margin-left: 5px;
}

.journal-entry p {
  font-size: 11px;
  color: var(--text-dim);
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.journal-arrow {
  color: var(--text-faint);
  font-size: 16px;
}

.journal-entry:hover .journal-arrow {
  color: var(--accent);
}

.journal-loading>div {
  border-bottom: 1px solid var(--hairline);
  padding: 28px;
}

.journal-loading .skeleton-line {
  display: block;
  margin: 10px 0;
}

.journal-loading .skeleton-line:first-child {
  width: 55%;
}

.journal-empty {
  padding: 35px;
  border: 1px solid var(--hairline);
  border-radius: 12px;
  background: #17201b6b;
  min-height: 270px;
}

.journal-empty__art {
  display: block;
  font: 60px/1 var(--font-serif);
  color: var(--accent);
  margin-bottom: 12px;
}

.journal-empty h3 {
  font-weight: 450;
  font-size: 20px;
  margin: 13px 0;
}

.journal-empty>p:not(.eyebrow) {
  font-size: 11px;
  color: var(--text-dim);
  margin-bottom: 23px;
}

.listening-section {
  border-top: 1px solid var(--hairline);
}

.listening-layout {
  display: grid;
  grid-template-columns: minmax(0,.85fr) minmax(0,1.5fr);
  gap: 70px;
  align-items: center;
}

.listening-note {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 10px;
  color: var(--text-faint);
  margin-top: 26px;
}

.home-player {
  width: 100%;
  min-width: 0;
}

.outro {
  padding: 0 0 76px;
}

.outro-inner {
  padding-top: 35px;
  padding-bottom: 35px;
  border-top: 1px solid var(--hairline);
  display: flex;
  align-items: center;
  gap: 30px;
}

.outro-symbol {
  font-size: 72px;
  color: var(--accent);
  font-weight: 300;
  line-height: 1;
}

.outro h2 {
  font-size: 29px;
  margin: 9px 0;
  font-weight: 550;
}

.outro p:not(.eyebrow) {
  font-size: 11px;
  color: var(--text-dim);
  margin: 0;
}

.outro .btn-aurora {
  margin-left: auto;
  white-space: nowrap;
}

@media (max-width:950px) {
  .work-grid {
    gap: 14px;
  }
  .work-card__body {
    padding: 16px;
  }
  .work-card h3 {
    font-size: 15px;
  }
  .work-card__meta {
    font-size: 6px;
  }
  .journal-layout,.listening-layout {
    gap: 35px;
    grid-template-columns: minmax(0,.8fr) minmax(0,1.3fr);
  }
}

@media (max-width:640px) {
  .section {
    padding: 58px 0;
  }
  .section-heading {
    align-items: flex-start;
    margin-bottom: 23px;
  }
  .section-counter {
    font-size: 26px;
    padding-top: 3px;
  }
  .section-counter small {
    display: none;
  }
  .work-toolbar__note {
    display: none;
  }
  .work-filters button {
    font-size: 10px;
    padding: 7px 10px;
  }
  .work-toolbar {
    padding-bottom: 20px;
  }
  .work-grid {
    grid-template-columns: 1fr;
    gap: 22px;
  }
  .work-card__body {
    padding: 22px;
  }
  .work-card h3 {
    font-size: 19px;
  }
  .work-card__meta {
    font-size: 8px;
  }
  .work-card__body>p {
    font-size: 12px;
    min-height: 0;
  }
  .work-tags>span {
    font-size: 9px;
  }
  .journal-layout,.listening-layout {
    grid-template-columns: 1fr;
    gap: 28px;
  }
  .journal-handwriting {
    display: none;
  }
  .journal-intro>p:not(.eyebrow) {
    margin: 12px 0 18px;
  }
  .journal-intro h2 br,.listening-layout h2 br {
    display: none;
  }
  .journal-entry {
    gap: 16px;
    padding: 23px 0;
  }
  .journal-entry h3 {
    font-size: 14px;
  }
  .journal-empty {
    padding: 26px;
  }
  .listening-note {
    margin-top: 17px;
  }
  .outro {
    padding-bottom: 45px;
  }
  .outro-inner {
    gap: 20px;
    flex-wrap: wrap;
  }
  .outro-symbol {
    font-size: 50px;
  }
  .outro h2 {
    font-size: 26px;
  }
  .outro .btn-aurora {
    margin: 5px 0 0 70px;
  }
  .outro .eyebrow {
    font-size: 7px;
  }
}

.journal-feed {
  min-width: 0;
}

.journal-intro h2 {
  white-space: normal;
}

.section-description,.work-card__body>p,.journal-entry p {
  font-size: 13px;
}

.journal-intro>p:not(.eyebrow) {
  font-size: 13px;
}

.work-card h3 {
  font-size: 18px;
}

.journal-entry h3 {
  font-size: 17px;
}

.journal-entry__meta {
  font-size: 10px;
}

.journal-date small {
  font-size: 9px;
}

.work-tags>span {
  font-size: 9px;
}

@media (max-width:640px) {
  .journal-entry h3 {
    font-size: 15px;
  }
  .journal-entry p {
    font-size: 12px;
  }
}
</style>


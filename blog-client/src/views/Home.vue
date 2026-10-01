<template>
  <div class="home">
    <!-- ============================ 首屏 ============================ -->
    <SkyBanner @open-projects="projectsStore.open()" />

    <!-- ============================ 项目 ============================ -->
    <section id="work" class="section" aria-labelledby="work-title">
      <div class="shell">
        <header class="section-head">
          <p class="eyebrow" v-reveal>01 — Selected Work</p>
          <h2 id="work-title" class="section-head__title" v-reveal="60">
            我部署上线的<span class="section-head__accent">作品</span>
          </h2>
          <p class="section-head__desc" v-reveal="120">
            每一个都能直接打开玩。从像素游戏到学习工具，都是我自己写、自己上线的。
          </p>
        </header>

        <div v-if="projectsStore.projects.length" class="work-grid">
          <a
            v-for="(proj, i) in projectsStore.projects"
            :key="proj.name"
            v-spotlight
            v-reveal="120 + i * 90"
            :href="proj.url"
            target="_blank"
            rel="noopener noreferrer"
            class="work-card glass"
            :style="{ '--tint': proj.color }"
          >
            <!-- 顶部渐显的色带：卡片身份色 -->
            <span class="work-card__tint" aria-hidden="true"></span>

            <div class="work-card__top">
              <span class="work-card__icon" aria-hidden="true">
                <el-icon :size="22"><component :is="proj.icon" /></el-icon>
              </span>
              <span class="work-card__index num" aria-hidden="true">
                {{ String(i + 1).padStart(2, '0') }}
              </span>
            </div>

            <h3 class="work-card__name">{{ proj.name }}</h3>
            <p class="work-card__desc">{{ proj.desc }}</p>

            <div class="work-card__foot">
              <span class="work-card__url">{{ prettyUrl(proj.url) }}</span>
              <span class="work-card__go" aria-hidden="true">
                <el-icon><TopRight /></el-icon>
              </span>
            </div>
          </a>
        </div>

        <p v-else class="work-empty" v-reveal>项目正在整理中，稍后再来看看 ✨</p>
      </div>
    </section>

    <!-- ============================ 日记 ============================ -->
    <section id="journal" class="section section--journal" aria-labelledby="journal-title">
      <div class="shell">
        <header class="section-head section-head--row">
          <div>
            <p class="eyebrow" v-reveal>02 — Journal</p>
            <h2 id="journal-title" class="section-head__title" v-reveal="60">
              最近写下的<span class="section-head__accent">日子</span>
            </h2>
          </div>
          <router-link to="/diary" class="section-head__more" v-reveal="120">
            全部日记 <el-icon><Right /></el-icon>
          </router-link>
        </header>

        <!-- 有数据 -->
        <ol v-if="recent.length" class="journal-list">
          <li
            v-for="(d, i) in recent"
            :key="d.id"
            v-reveal="100 + i * 80"
            class="journal-item"
          >
            <router-link :to="`/diary/${d.id}`" class="journal-link">
              <span class="journal-date">
                <span class="journal-date__day num">{{ dayOf(d.diary_date) }}</span>
                <span class="journal-date__mon">{{ monthOf(d.diary_date) }}</span>
              </span>

              <span class="journal-body">
                <span class="journal-title">
                  {{ d.title || fullDate(d.diary_date) }}
                  <span v-if="d.mood" class="journal-mood">{{ d.mood }}</span>
                </span>
                <span class="journal-excerpt">{{ plainText(d.content, 64) }}</span>
              </span>

              <span class="journal-go" aria-hidden="true">
                <el-icon><Right /></el-icon>
              </span>
            </router-link>
          </li>
        </ol>

        <!-- 加载中：骨架屏，避免布局跳动 -->
        <ol v-else-if="loadingJournal" class="journal-list" aria-hidden="true">
          <li v-for="i in 3" :key="i" class="journal-item journal-item--skeleton">
            <span class="skeleton-line" :style="{ width: `${76 - i * 8}%` }"></span>
          </li>
        </ol>

        <!-- 无数据 / 后端未唤醒 -->
        <div v-else class="journal-empty" v-reveal>
          <p class="journal-empty__text">
            {{ journalError ? '日记服务正在小憩，稍后就会回来。' : '还没有公开的日记，第一篇正在路上。' }}
          </p>
          <router-link to="/diary" class="btn-ghost">
            <el-icon><Notebook /></el-icon> 去日记页看看
          </router-link>
        </div>
      </div>
    </section>

    <!-- ============================ 收尾 ============================ -->
    <section class="outro" aria-labelledby="outro-title">
      <div class="shell outro__inner">
        <div class="outro__glow" aria-hidden="true"></div>
        <p class="eyebrow" v-reveal>03 — Say Hi</p>
        <h2 id="outro-title" class="outro__title" v-reveal="60">
          星空一直在，<br class="outro__br" />欢迎随时回来看看。
        </h2>
        <div class="outro__actions" v-reveal="140">
          <button
            v-if="!userStore.isLoggedIn"
            class="btn-aurora"
            type="button"
            @click="userStore.openLogin()"
          >
            <span aria-hidden="true">✦</span> 登录 / 注册
          </button>
          <router-link v-else to="/diary/new" class="btn-aurora">
            <el-icon><EditPen /></el-icon> 写一篇日记
          </router-link>
          <router-link to="/diary" class="btn-ghost">
            <el-icon><Notebook /></el-icon> 翻阅日记
          </router-link>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import SkyBanner from '../components/SkyBanner.vue'
import { useProjectsStore } from '../stores/projects'
import { useUserStore } from '../stores/user'
import { fetchJson } from '../utils/widgetFetch'
import { plainText } from '../utils/text'

const projectsStore = useProjectsStore()
const userStore = useUserStore()

const recent = ref([])
const loadingJournal = ref(true)
const journalError = ref(false)

const prettyUrl = (url) => String(url).replace(/^https?:\/\//, '').replace(/\/$/, '')

const dayOf = (s) => parseInt(String(s).split('-')[2], 10)
const monthOf = (s) => `${parseInt(String(s).split('-')[1], 10)}月`
function fullDate(s) {
  const [y, m, d] = String(s).split('-')
  return `${y}年${parseInt(m, 10)}月${parseInt(d, 10)}日`
}

/* 首页日记预览：用原生 fetch（静默降级），后端休眠时展示占位而不是报错 */
async function loadRecent() {
  try {
    const res = await fetchJson('/api/diaries?page=1&pageSize=3', { timeout: 12000 })
    const list = res?.data?.list || []
    // 首页只展示公开日记，私密内容不应出现在这里
    recent.value = list.filter((d) => d.is_public !== 0 && d.is_public !== false).slice(0, 3)
  } catch {
    journalError.value = true
  } finally {
    loadingJournal.value = false
  }
}

onMounted(loadRecent)
</script>

<style scoped>
/* ============================== 通用区块 ============================== */
.section {
  position: relative;
  padding: var(--space-2xl) 0;
}
.section--journal {
  border-top: 1px solid var(--hairline);
}

.section-head {
  max-width: 46rem;
  margin-bottom: var(--space-l);
}
.section-head--row {
  max-width: none;
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: var(--space-m);
  flex-wrap: wrap;
}
.section-head__title {
  margin: 0.8rem 0 0;
  font-size: var(--step-4);
  font-weight: 680;
  letter-spacing: -0.03em;
}
.section-head__accent {
  background: linear-gradient(120deg, var(--aurora-a), var(--aurora-b));
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}
.section-head__desc {
  margin: 1rem 0 0;
  max-width: 44ch;
  font-size: var(--step-0);
  line-height: 1.75;
  color: var(--text-dim);
}
.section-head__more {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding-bottom: 0.35rem;
  font-size: var(--step--1);
  color: var(--text-dim);
  border-bottom: 1px solid var(--hairline-strong);
  transition: color var(--dur-2), border-color var(--dur-2), gap var(--dur-2) var(--ease-out-expo);
}
.section-head__more:hover {
  color: #fff;
  border-color: var(--aurora-a);
  gap: 0.65rem;
}

/* ============================== 项目卡片 ============================== */
.work-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.15rem;
}
@media (min-width: 640px) {
  .work-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
@media (min-width: 1024px) {
  .work-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

.work-card {
  display: flex;
  flex-direction: column;
  gap: 0.7rem;
  padding: 1.5rem;
  overflow: hidden;
  color: var(--text);
}
.work-card:hover {
  transform: translateY(-6px);
  border-color: color-mix(in srgb, var(--tint) 45%, rgba(255, 255, 255, 0.2));
  background: var(--surface-2);
  box-shadow:
    0 30px 60px rgba(1, 4, 12, 0.6),
    0 0 0 1px color-mix(in srgb, var(--tint) 22%, transparent),
    var(--inner-hi);
}

/* 顶部色带：hover 时从中间向两侧展开 */
.work-card__tint {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(90deg, transparent, var(--tint), transparent);
  transform: scaleX(0);
  opacity: 0;
  transition:
    transform var(--dur-4) var(--ease-out-expo),
    opacity var(--dur-3) var(--ease-out-quart);
}
.work-card:hover .work-card__tint {
  transform: scaleX(1);
  opacity: 1;
}

.work-card__top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
}
.work-card__icon {
  display: grid;
  place-items: center;
  width: 46px;
  height: 46px;
  border-radius: 14px;
  color: #fff;
  background: linear-gradient(135deg, var(--tint), color-mix(in srgb, var(--tint) 62%, #000));
  box-shadow: 0 8px 22px color-mix(in srgb, var(--tint) 32%, transparent);
  transition: transform var(--dur-3) var(--ease-spring);
}
.work-card:hover .work-card__icon {
  transform: scale(1.08) rotate(-6deg);
}
.work-card__index {
  font-family: var(--font-mono);
  font-size: var(--step--2);
  letter-spacing: 0.1em;
  color: var(--text-faint);
  transition: color var(--dur-2);
}
.work-card:hover .work-card__index {
  color: color-mix(in srgb, var(--tint) 70%, #fff);
}

.work-card__name {
  margin: 0.35rem 0 0;
  font-size: var(--step-1);
  font-weight: 640;
  letter-spacing: -0.015em;
  color: var(--text-hi);
}
.work-card__desc {
  flex: 1;
  margin: 0;
  font-size: var(--step--1);
  line-height: 1.72;
  color: var(--text-dim);
}

.work-card__foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  margin-top: 0.35rem;
  padding-top: 0.85rem;
  border-top: 1px solid var(--hairline);
}
.work-card__url {
  font-family: var(--font-mono);
  font-size: 0.6875rem;
  letter-spacing: 0.02em;
  color: var(--text-faint);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  transition: color var(--dur-2);
}
.work-card:hover .work-card__url {
  color: var(--text-dim);
}
.work-card__go {
  display: grid;
  place-items: center;
  width: 30px;
  height: 30px;
  flex: none;
  border-radius: 50%;
  border: 1px solid var(--hairline);
  color: var(--text-dim);
  transition:
    transform var(--dur-3) var(--ease-spring),
    color var(--dur-2),
    border-color var(--dur-2),
    background-color var(--dur-2);
}
.work-card:hover .work-card__go {
  transform: translate(3px, -3px);
  color: #fff;
  border-color: color-mix(in srgb, var(--tint) 55%, transparent);
  background: color-mix(in srgb, var(--tint) 22%, transparent);
}

.work-empty {
  padding: var(--space-l) 0;
  text-align: center;
  color: var(--text-faint);
  font-size: var(--step--1);
}

/* ============================== 日记列表 ============================== */
.journal-list {
  list-style: none;
  margin: 0;
  padding: 0;
  border-top: 1px solid var(--hairline);
}
.journal-item {
  border-bottom: 1px solid var(--hairline);
}
.journal-link {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: var(--space-m);
  padding: 1.15rem 0.5rem 1.15rem 0;
  transition:
    padding-left var(--dur-3) var(--ease-out-expo),
    background-color var(--dur-3) var(--ease-out-quart);
}
.journal-link:hover {
  padding-left: 0.85rem;
  background: linear-gradient(90deg, rgba(110, 168, 255, 0.07), transparent 70%);
}

.journal-date {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 3.1rem;
  line-height: 1;
}
.journal-date__day {
  font-size: var(--step-2);
  font-weight: 640;
  color: var(--text-hi);
  letter-spacing: -0.02em;
}
.journal-date__mon {
  margin-top: 0.25rem;
  font-family: var(--font-mono);
  font-size: 0.625rem;
  letter-spacing: 0.12em;
  color: var(--text-faint);
}

.journal-body {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  min-width: 0;
}
.journal-title {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  font-size: var(--step-0);
  font-weight: 600;
  color: var(--text-hi);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  transition: color var(--dur-2);
}
.journal-link:hover .journal-title {
  color: #fff;
}
.journal-mood {
  font-size: 0.95em;
  flex: none;
}
.journal-excerpt {
  font-size: var(--step--1);
  color: var(--text-faint);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.journal-go {
  color: var(--text-faint);
  transition: transform var(--dur-3) var(--ease-out-expo), color var(--dur-2);
}
.journal-link:hover .journal-go {
  transform: translateX(5px);
  color: var(--aurora-a);
}

/* 骨架屏 */
.journal-item--skeleton {
  padding: 1.6rem 0;
}
.skeleton-line {
  display: block;
  height: 12px;
  border-radius: 999px;
  background: linear-gradient(
    90deg,
    rgba(255, 255, 255, 0.05),
    rgba(255, 255, 255, 0.1),
    rgba(255, 255, 255, 0.05)
  );
  background-size: 200% 100%;
  animation: skeleton 1.6s var(--ease-in-out) infinite;
}
@keyframes skeleton {
  from { background-position: 200% 0; }
  to { background-position: -200% 0; }
}

.journal-empty {
  display: flex;
  align-items: center;
  gap: var(--space-s);
  flex-wrap: wrap;
  padding: var(--space-m) 0;
}
.journal-empty__text {
  color: var(--text-dim);
  font-size: var(--step--1);
}

/* ============================== 收尾区块 ============================== */
.outro {
  position: relative;
  padding: var(--space-2xl) 0 calc(var(--space-2xl) + var(--space-m));
  overflow: hidden;
}
.outro__inner {
  position: relative;
  z-index: 1;
}
.outro__glow {
  position: absolute;
  z-index: 0;
  top: -40%;
  left: -10%;
  width: 60%;
  height: 180%;
  pointer-events: none;
  background: radial-gradient(closest-side, rgba(110, 168, 255, 0.14), transparent 72%);
  filter: blur(10px);
}
.outro__title {
  margin: 1rem 0 0;
  font-size: var(--step-4);
  font-weight: 680;
  letter-spacing: -0.03em;
  line-height: 1.15;
}
.outro__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-top: var(--space-m);
}
.outro__actions .btn-aurora,
.outro__actions .btn-ghost {
  padding: 0.8rem 1.5rem;
  font-size: var(--step-0);
}

@media (max-width: 640px) {
  .journal-link {
    gap: var(--space-s);
  }
  .journal-excerpt {
    display: none;
  }
  .outro__br {
    display: none;
  }
}
</style>

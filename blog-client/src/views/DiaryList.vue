<template>
  <div class="diary">
    <!-- ============================ 页头 ============================ -->
    <header class="diary-head">
      <div class="shell">
        <p class="eyebrow" v-reveal>THE JOURNAL / 生活的切片</p>
        <div class="diary-head__row">
          <div>
            <h1 class="diary-head__title" v-reveal="60">
              把日常，写成<span class="diary-head__accent">日记。</span>
            </h1>
            <p class="diary-head__desc" v-reveal="110">
              记录灵感、心情，还有那些不想被忘记的瞬间。{{ total > 0 ? ` · 共 ${total} 篇` : '' }}
            </p>
          </div>

          <div class="diary-head__action" v-reveal="150">
            <router-link v-if="userStore.isLoggedIn" to="/diary/new" class="btn-aurora">
              <el-icon><EditPen /></el-icon> 写日记
            </router-link>
            <button v-else class="btn-aurora" type="button" @click="userStore.openLogin()">
              <span aria-hidden="true">✦</span> 登录后写日记
            </button>
          </div>
        </div>

        <!-- 搜索栏 -->
        <div class="diary-tools" v-reveal="190">
          <label class="diary-search">
            <el-icon class="diary-search__icon"><Search /></el-icon>
            <input
              v-model.trim="keyword"
              class="diary-search__input"
              type="search"
              placeholder="搜索标题或内容…"
              aria-label="搜索日记"
              @keyup.enter="reload"
            />
            <button
              v-if="keyword"
              class="diary-search__clear"
              type="button"
              aria-label="清除搜索"
              @click="keyword = ''; reload()"
            >
              <el-icon><Close /></el-icon>
            </button>
          </label>

          <button class="btn-ghost diary-tools__go" type="button" @click="reload">搜索</button>

          <label v-if="userStore.isLoggedIn" class="diary-mine">
            <el-switch v-model="mineOnly" @change="reload" />
            <span>只看我的</span>
          </label>
        </div>
      </div>
    </header>

    <!-- ============================ 列表 ============================ -->
    <div class="shell diary-body">
      <!-- 首次加载骨架 -->
      <div v-if="loading && !diaries.length" class="skeleton-wrap" aria-hidden="true">
        <div v-for="i in 3" :key="i" class="skeleton-card glass">
          <span class="skeleton-line" style="width: 42%" />
          <span class="skeleton-line" style="width: 78%" />
          <span class="skeleton-line" style="width: 60%" />
        </div>
      </div>

      <template v-else>
        <section
          v-for="(group, month) in groupedDiaries"
          :key="month"
          class="month"
          :aria-label="month"
        >
          <!-- 月份分隔：一条会生长的线 + 月份数字 -->
          <header class="month__head" v-reveal>
            <h2 class="month__label">
              <span class="month__num num">{{ month.split('年')[0] }}</span>
              <span class="month__mon num">{{ month.split('年')[1] }}</span>
            </h2>
            <span class="month__count">{{ group.length }} 篇</span>
            <span class="month__rule" aria-hidden="true"></span>
          </header>

          <ol class="entries">
            <li
              v-for="(d, i) in group"
              :key="d.id"
              v-reveal="60 + i * 55"
              class="entry"
            >
              <article class="entry__card glass" @click="openDiary(d)">
                <!-- 日期块 -->
                <div class="entry__date">
                  <span class="entry__day num">{{ dayOf(d.diary_date) }}</span>
                  <span class="entry__week">{{ weekdayOf(d.diary_date) }}</span>
                </div>

                <div class="entry__main">
                  <div class="entry__top">
                    <!-- 标题是真链接：整卡可点是给鼠标的便利，
                         键盘/读屏用户靠这个链接进入详情 -->
                    <router-link :to="`/diary/${d.id}`" class="entry__title" @click.stop>
                      {{ d.title || fullDate(d.diary_date) }}
                    </router-link>
                    <span v-if="d.mood" class="entry__mood" :title="'心情：' + d.mood">{{ d.mood }}</span>
                    <span v-if="d.weather" class="entry__weather">{{ d.weather }}</span>
                    <span v-if="!d.is_public" class="entry__private">
                      <el-icon><Lock /></el-icon> 私密
                    </span>
                  </div>

                  <p class="entry__excerpt">{{ plainText(d.content, 110) }}</p>

                  <div class="entry__meta">
                    <span class="entry__stat">
                      <el-icon><View /></el-icon>
                      <span class="num">{{ d.view_count }}</span>
                    </span>
                    <span class="entry__stat">
                      <el-icon><Clock /></el-icon>
                      <span class="num">{{ readingMinutes(d.content) }} 分钟</span>
                    </span>

                    <!-- 作者本人的操作 -->
                    <template v-if="isMine(d)">
                      <span class="entry__divider" aria-hidden="true"></span>
                      <button class="entry__act" type="button" @click.stop="goEdit(d)">
                        <el-icon><Edit /></el-icon> 编辑
                      </button>
                      <button class="entry__act entry__act--danger" type="button" @click.stop="confirmDelete(d)">
                        <el-icon><Delete /></el-icon> 删除
                      </button>
                    </template>
                  </div>
                </div>

                <span class="entry__go" aria-hidden="true">
                  <el-icon><Right /></el-icon>
                </span>
              </article>
            </li>
          </ol>
        </section>

        <!-- 加载更多 -->
        <div v-if="hasMore" class="load-more">
          <button class="btn-ghost" type="button" :disabled="loading" @click="loadMore">
            <el-icon v-if="loading" class="is-spin"><Loading /></el-icon>
            {{ loading ? '加载中…' : '加载更多' }}
          </button>
          <p class="load-more__hint num">已显示 {{ diaries.length }} / {{ total }}</p>
        </div>

        <p v-if="loadError && diaries.length" class="load-more__hint" role="status">暂时无法加载更多，请稍后重试。</p>
        <!-- 空状态 -->
        <div v-if="!loading && diaries.length === 0" class="empty">
          <div class="empty__icon" aria-hidden="true">
            <el-icon :size="30"><Notebook /></el-icon>
          </div>
          <p class="empty__title">
            {{ loadError ? '日记暂时没有连接上' : keyword || mineOnly ? '没有找到符合条件的日记' : '故事，从今天开始。' }}
          </p>
          <p class="empty__desc">
            {{ loadError ? '稍后再试，写下的日子会一直在这里。' : keyword || mineOnly ? '换个关键词，或者清空筛选试试。' : '给今天留一页，把平凡的日子慢慢收藏。' }}
          </p>
          <div class="empty__actions"><button v-if="loadError" class="btn-ghost" type="button" @click="reload">重新加载</button>
            <button
              v-if="keyword || mineOnly"
              class="btn-ghost"
              type="button"
              @click="keyword = ''; mineOnly = false; reload()"
            >
              清空筛选
            </button>
            <router-link v-if="userStore.isLoggedIn" to="/diary/new" class="btn-aurora">
              <el-icon><EditPen /></el-icon> 写一篇
            </router-link>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessageBox, ElMessage } from 'element-plus'
import request from '../utils/request'
import { plainText, readingMinutes, parseDate, fullDateCN } from '../utils/text'
import { useUserStore } from '../stores/user'

const router = useRouter()
const userStore = useUserStore()

const diaries = ref([])
const total = ref(0)
const page = ref(1)
const pageSize = 10
const loading = ref(false)
const keyword = ref('')
const mineOnly = ref(false)
const loadError = ref(false)
let requestGeneration = 0

const hasMore = computed(() => diaries.value.length < total.value)

/* 按月分组（YYYY年M月 -> [日记...]），保持后端返回的倒序 */
const groupedDiaries = computed(() => {
  const groups = {}
  for (const d of diaries.value) {
    const [y, m] = String(d.diary_date).split('-')
    const key = `${y}年${parseInt(m, 10)}月`
    ;(groups[key] = groups[key] || []).push(d)
  }
  return groups
})

const dayOf = (s) => parseDate(s).day
const weekdayOf = (s) => parseDate(s).weekday
const fullDate = fullDateCN

function isMine(d) {
  return userStore.user && d.user_id === userStore.user.id
}

function openDiary(d) {
  router.push(`/diary/${d.id}`)
}

function goEdit(d) {
  router.push(`/diary/edit/${d.id}`)
}

async function fetchPage(requestedPage = 1) {
  const generation = ++requestGeneration
  loading.value = true
  loadError.value = false
  try {
    const res = await request.get('/diaries', { params: { page: requestedPage, pageSize, keyword: keyword.value || undefined, mine: mineOnly.value ? 1 : undefined } })
    if (generation !== requestGeneration) return
    const list = res.data?.list || []
    diaries.value = requestedPage === 1 ? list : [...diaries.value, ...list]
    total.value = res.data?.total || 0
    page.value = requestedPage
  } catch { if (generation === requestGeneration) loadError.value = true }
  finally { if (generation === requestGeneration) loading.value = false }
}
function loadMore() { if (!loading.value && hasMore.value) fetchPage(page.value + 1) }
function reload() { page.value = 1; diaries.value = []; total.value = 0; fetchPage(1) }

async function confirmDelete(d) {
  try {
    await ElMessageBox.confirm('删除后无法恢复，确定删除这篇日记吗？', '删除日记', {
      confirmButtonText: '删除',
      cancelButtonText: '取消',
      type: 'warning'
    })
    const res = await request.delete(`/diaries/${d.id}`)
    if (res.code === 200) {
      ElMessage.success('已删除')
      reload()
    }
  } catch {
    /* 取消或错误 */
  }
}

onMounted(() => fetchPage(1))
watch(() => userStore.isLoggedIn, () => { mineOnly.value = false; reload() })
onBeforeUnmount(() => { requestGeneration++ })
</script>

<style scoped>
.diary {
  padding-bottom: var(--space-2xl);
}

/* ============================== 页头 ============================== */

.diary-head {
  padding: calc(var(--header-h) + var(--space-l)) 0 var(--space-m);
  border-bottom: 1px solid var(--hairline);
  background: linear-gradient(180deg, rgba(110, 168, 255, 0.05), transparent);
}

.diary-head__row {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: var(--space-m);
  flex-wrap: wrap;
  margin-top: 0.9rem;
}

.diary-head__title {
  margin: 0;
  font-size: var(--step-4);
  font-weight: 680;
  letter-spacing: -0.03em;
}

.diary-head__accent {
  background: linear-gradient(120deg, var(--aurora-a), var(--aurora-b));
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}

.diary-head__desc {
  margin: 0.6rem 0 0;
  font-size: var(--step-0);
  color: var(--text-dim);
}

.diary-head__action :deep(.el-button),
.diary-head__action .btn-aurora {
  padding: 0.7rem 1.4rem;
}

/* ---- 搜索栏 ---- */

.diary-tools {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  flex-wrap: wrap;
  margin-top: var(--space-m);
}

.diary-search {
  position: relative;
  display: flex;
  align-items: center;
  flex: 1 1 15rem;
  min-width: 0;
  padding: 0 0.75rem;
  height: 44px;
  border-radius: var(--r-full);
  border: 1px solid var(--hairline);
  background: var(--surface-1);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  transition: border-color var(--dur-2) var(--ease-out-quart),
    background-color var(--dur-2) var(--ease-out-quart),
    box-shadow var(--dur-2) var(--ease-out-quart);
}

.diary-search:focus-within {
  border-color: var(--accent-line);
  background: var(--surface-2);
  box-shadow: 0 0 0 4px var(--accent-soft);
}

.diary-search__icon {
  color: var(--text-faint);
  flex: none;
}

.diary-search__input {
  flex: 1;
  min-width: 0;
  height: 100%;
  padding: 0 0.6rem;
  border: none;
  background: none;
  color: var(--text-hi);
  font-size: var(--step--1);
  outline: none;
}

.diary-search__input::placeholder {
  color: var(--text-faint);
}

/* 去掉 Safari 原生的搜索框清除按钮，用自定义的 */

.diary-search__input::-webkit-search-cancel-button {
  display: none;
}

.diary-search__clear {
  display: grid;
  place-items: center;
  width: 22px;
  height: 22px;
  flex: none;
  border: none;
  border-radius: 50%;
  background: var(--surface-3);
  color: var(--text-dim);
  font-size: 0.7rem;
  cursor: pointer;
  transition: all var(--dur-2);
}

.diary-search__clear:hover {
  background: rgba(255, 255, 255, 0.2);
  color: #fff;
}

.diary-tools__go {
  height: 44px;
}

.diary-mine {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-size: var(--step--1);
  color: var(--text-dim);
  cursor: pointer;
  white-space: nowrap;
}

/* ============================== 列表 ============================== */

.diary-body {
  padding-top: var(--space-l);
}

.month + .month {
  margin-top: var(--space-l);
}

.month__head {
  display: flex;
  align-items: baseline;
  gap: 0.7rem;
  margin-bottom: var(--space-s);
}

.month__label {
  display: flex;
  align-items: baseline;
  gap: 0.3rem;
  margin: 0;
  font-weight: 680;
}

.month__num {
  font-family: var(--font-mono);
  font-size: var(--step--1);
  color: var(--text-faint);
  letter-spacing: 0.05em;
}

.month__mon {
  font-size: var(--step-2);
  letter-spacing: -0.02em;
  color: var(--text-hi);
}

.month__count {
  font-family: var(--font-mono);
  font-size: var(--step--2);
  color: var(--text-faint);
}

.month__rule {
  flex: 1;
  height: 1px;
  background: linear-gradient(90deg, var(--hairline-strong), transparent);
}

.entries {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

/* ---- 日记卡片 ---- */

.entry__card {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: start;
  gap: var(--space-s);
  padding: 1.15rem 1.25rem;
  cursor: pointer;
}

.entry__card:hover {
  transform: translateY(-3px);
  border-color: var(--hairline-strong);
  background: var(--surface-2);
  box-shadow: 0 22px 48px rgba(1, 4, 12, 0.55),
    var(--inner-hi);
}

.entry__date {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 2.9rem;
  padding-top: 0.1rem;
  line-height: 1;
}

.entry__day {
  font-size: var(--step-2);
  font-weight: 660;
  color: var(--text-hi);
  letter-spacing: -0.02em;
}

.entry__week {
  margin-top: 0.3rem;
  font-family: var(--font-mono);
  font-size: 0.5625rem;
  letter-spacing: 0.08em;
  color: var(--text-faint);
}

.entry__main {
  min-width: 0;
}

.entry__top {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.entry__title {
  display: block;
  margin: 0;
  font-size: var(--step-1);
  font-weight: 620;
  letter-spacing: -0.012em;
  color: var(--text-hi);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 100%;
  transition: color var(--dur-2);
}

.entry__title:hover {
  color: var(--aurora-a);
}

.entry__mood {
  font-size: 1.05em;
  line-height: 1;
}

.entry__weather {
  font-size: var(--step--2);
  color: var(--text-faint);
}

.entry__private {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.1rem 0.45rem;
  border-radius: var(--r-full);
  border: 1px solid rgba(255, 184, 107, 0.3);
  background: rgba(255, 184, 107, 0.12);
  color: var(--ember);
  font-size: 0.625rem;
}

.entry__excerpt {
  margin: 0.5rem 0 0;
  font-size: var(--step--1);
  line-height: 1.7;
  color: var(--text-dim);
  /* 两行截断，保持卡片高度一致 */
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.entry__meta {
  display: flex;
  align-items: center;
  gap: 0.9rem;
  flex-wrap: wrap;
  margin-top: 0.7rem;
  font-size: var(--step--2);
  color: var(--text-faint);
}

.entry__stat {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
}

.entry__divider {
  width: 1px;
  height: 12px;
  background: var(--hairline);
}

.entry__act {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.15rem 0.4rem;
  border: none;
  border-radius: 6px;
  background: none;
  color: var(--text-faint);
  font-size: inherit;
  cursor: pointer;
  transition: color var(--dur-2), background-color var(--dur-2);
}

.entry__act:hover {
  color: var(--aurora-a);
  background: rgba(110, 168, 255, 0.12);
}

.entry__act--danger:hover {
  color: #ff8f8f;
  background: rgba(255, 122, 122, 0.12);
}

.entry__go {
  align-self: center;
  color: var(--text-faint);
  transition: transform var(--dur-3) var(--ease-out-expo), color var(--dur-2);
}

.entry__card:hover .entry__go {
  transform: translateX(4px);
  color: var(--aurora-a);
}

/* ---- 加载更多 ---- */

.load-more {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.6rem;
  margin-top: var(--space-l);
}

.load-more .btn-ghost {
  min-width: 9rem;
}

.load-more__hint {
  font-family: var(--font-mono);
  font-size: var(--step--2);
  color: var(--text-faint);
}

.is-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* ---- 空状态 ---- */

.empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: var(--space-2xl) var(--space-m);
  text-align: center;
}

.empty__icon {
  display: grid;
  place-items: center;
  width: 68px;
  height: 68px;
  margin-bottom: 0.6rem;
  border-radius: 50%;
  border: 1px solid var(--hairline);
  background: var(--surface-1);
  color: var(--text-faint);
}

.empty__title {
  font-size: var(--step-1);
  font-weight: 620;
  color: var(--text-hi);
}

.empty__desc {
  font-size: var(--step--1);
  color: var(--text-dim);
}

.empty__actions {
  display: flex;
  gap: 0.6rem;
  flex-wrap: wrap;
  justify-content: center;
  margin-top: 0.9rem;
}

/* ---- 骨架屏 ---- */

.skeleton-wrap {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.skeleton-card {
  display: flex;
  flex-direction: column;
  gap: 0.7rem;
  padding: 1.4rem;
}

.skeleton-line {
  display: block;
  height: 11px;
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
  from {
    background-position: 200% 0;
  }
  to {
    background-position: -200% 0;
  }
}

@media (max-width: 640px) {
  .entry__card {
    grid-template-columns: auto 1fr;
    padding: 1rem;
  }
  .entry__go {
    display: none;
  }
  .entry__excerpt {
    -webkit-line-clamp: 2;
    line-clamp: 2;
  }
}

.diary-head {
  padding: calc(var(--header-h) + 66px) 0 30px;
  background: radial-gradient(ellipse at 85% 0,#a8d9b809,transparent 65%);
}

.diary-head__title {
  font-size: clamp(30px,4vw,48px);
  font-weight: 550;
  line-height: 1.4;
}

.diary-head__accent {
  color: var(--accent);
  background: none;
  -webkit-text-fill-color: var(--accent);
}

.diary-head__desc {
  font-size: 12px;
  line-height: 1.9;
  margin-top: 15px;
}

.diary-tools {
  margin-top: 32px;
  max-width: 790px;
}

.diary-search {
  border-radius: 7px;
  height: 44px;
  background: #131d18;
}

.diary-search__input {
  font-size: 12px;
}

.diary-mine {
  font-size: 11px;
}

.diary-body {
  padding-top: 20px;
}

.month__head {
  margin-bottom: 25px;
}

.month__num {
  font-family: var(--font-serif);
  font-size: 25px;
  font-weight: 400;
  color: var(--text-dim);
}

.month__mon {
  font-size: 11px;
  color: var(--text-faint);
}

.month__count {
  font-size: 10px;
}

.month__rule {
  background: var(--hairline);
}

.entry__card {
  border-radius: 9px;
  background: #121b17;
  box-shadow: none;
  padding: 23px;
}

.entry__card:hover {
  background: #18231c;
  box-shadow: none;
  border-color: #a8d9b835;
}

.entry__day {
  font-family: var(--font-serif);
  font-weight: 400;
  font-size: 40px;
  background: none;
  -webkit-text-fill-color: #b2c6b6;
}

.entry__title {
  font-size: 17px;
  font-weight: 500;
  line-height: 1.7;
}

.entry__excerpt {
  font-size: 12px;
  line-height: 1.9;
}

.entry__meta {
  font-size: 10px;
}

.entry__go {
  background: none;
  border: 1px solid var(--hairline);
  color: var(--accent);
}

.empty {
  padding: 65px 20px;
  border: 1px dashed var(--hairline-strong);
  border-radius: 12px;
  margin-top: 24px;
}

.empty__icon {
  background: #a8d9b80b;
  box-shadow: none;
  border-color: #a8d9b825;
  color: var(--accent);
}

.empty__title {
  font-weight: 450;
  font-size: 24px;
}

.empty__desc {
  font-size: 12px;
}

@media (min-width:1000px) {
  .month {
    display: grid;
    grid-template-columns: 155px 1fr;
    gap: 34px;
  }
  .month__head {
    display: flex;
    align-items: flex-start;
    flex-wrap: wrap;
    align-content: flex-start;
    padding-top: 21px;
    gap: 12px;
  }
  .month__rule {
    display: none;
  }
  .month__label {
    display: flex;
    flex-direction: column;
    gap: 9px;
  }
  .month__count {
    width: 100%;
    margin-top: 2px;
  }
  .entries {
    margin: 0;
  }
  .entry__card {
    padding: 25px 28px;
  }
  .diary-body {
    padding-top: 35px;
  }
}

@media (max-width:640px) {
  .diary-head {
    padding-top: calc(var(--header-h) + 40px);
  }
  .diary-head__row {
    gap: 20px;
  }
  .diary-head__action {
    width: 100%;
  }
  .diary-head__action .btn-aurora {
    font-size: 11px;
    padding: 10px 16px;
  }
  .diary-tools {
    margin-top: 24px;
  }
  .entry__card {
    padding: 18px 15px;
    gap: 15px;
  }
  .entry__date {
    min-width: 37px;
  }
  .entry__day {
    font-size: 34px;
  }
  .entry__title {
    font-size: 15px;
  }
  .entry__excerpt {
    font-size: 11px;
  }
  .empty__title {
    font-size: 20px;
  }
}
</style>

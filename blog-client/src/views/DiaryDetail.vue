<template>
  <div class="detail" v-loading="loading">
    <template v-if="diary">
      <!-- ============================ 文章头部 ============================ -->
      <header class="detail-head">
        <div class="shell-read">
          <nav class="detail-nav" v-reveal>
            <router-link to="/diary" class="detail-back">
              <el-icon><ArrowLeft /></el-icon> 全部日记
            </router-link>

            <div v-if="isOwner" class="detail-nav__actions">
              <button class="detail-act" type="button" @click="router.push(`/diary/edit/${diary.id}`)">
                <el-icon><Edit /></el-icon> 编辑
              </button>
              <button class="detail-act detail-act--danger" type="button" @click="confirmDelete">
                <el-icon><Delete /></el-icon> 删除
              </button>
            </div>
          </nav>

          <div class="detail-title-row">
            <div class="detail-date" v-reveal="40">
              <span class="detail-date__day num">{{ day }}</span>
              <span class="detail-date__meta">
                <span class="num">{{ month }}月</span>
                <span>{{ weekday }}</span>
              </span>
            </div>

            <h1 class="detail-title" v-reveal="90">
              {{ diary.title || fullDate }}
              <span v-if="diary.mood" class="detail-title__mood">{{ diary.mood }}</span>
            </h1>
          </div>

          <div class="detail-meta" v-reveal="140">
            <span class="detail-meta__author">
              <span class="detail-meta__avatar">{{ authorInitial }}</span>
              {{ diary.author_name || '我' }}
            </span>
            <span class="detail-meta__dot" aria-hidden="true">·</span>
            <span class="num">{{ formatDate(diary.created_at) }}</span>
            <span class="detail-meta__dot" aria-hidden="true">·</span>
            <span class="detail-meta__stat">
              <el-icon><Clock /></el-icon>
              <span class="num">{{ readingMinutes(diary.content) }} 分钟</span>
            </span>
            <span class="detail-meta__stat">
              <el-icon><View /></el-icon>
              <span class="num">{{ diary.view_count }}</span>
            </span>
            <span v-if="diary.weather" class="detail-meta__weather">{{ diary.weather }}</span>
            <span v-if="!diary.is_public" class="detail-meta__private">
              <el-icon><Lock /></el-icon> 私密日记
            </span>
          </div>
        </div>
      </header>

      <!-- ============================ 正文 ============================ -->
      <article class="detail-body">
        <div class="shell-read">
          <div class="markdown-body" v-html="html"></div>

          <!-- 文末分隔 -->
          <div class="detail-end" aria-hidden="true">
            <span class="detail-end__dot"></span>
            <span class="detail-end__dot"></span>
            <span class="detail-end__dot"></span>
          </div>

          <!-- 文末导航 -->
          <nav class="detail-foot">
            <router-link to="/diary" class="btn-ghost">
              <el-icon><ArrowLeft /></el-icon> 回到日记列表
            </router-link>
            <button class="btn-ghost detail-copy" type="button" @click="copyLink">
              <el-icon><component :is="copied ? 'Select' : 'Link'" /></el-icon>
              {{ copied ? '已复制链接' : '复制链接' }}
            </button>
          </nav>
        </div>
      </article>
    </template>

    <!-- 加载失败 / 不存在 -->
    <div v-else-if="!loading" class="shell-read detail-missing">
      <p class="detail-missing__title">这篇日记不见了</p>
      <p class="detail-missing__desc">可能已被删除，或者链接不太对。</p>
      <router-link to="/diary" class="btn-aurora">回到日记列表</router-link>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import request from '../utils/request'
import { renderMarkdown } from '../utils/markdown'
import { readingMinutes, parseDate, fullDateCN } from '../utils/text'
import { useUserStore } from '../stores/user'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const diary = ref(null)
const loading = ref(true)
const copied = ref(false)

const parsed = computed(() => parseDate(diary.value?.diary_date))
const day = computed(() => parsed.value.day || '')
const month = computed(() => parsed.value.month || '')
const weekday = computed(() => parsed.value.weekday || '')
const fullDate = computed(() => fullDateCN(diary.value?.diary_date))
const html = computed(() => renderMarkdown(diary.value?.content))
const isOwner = computed(() => diary.value && userStore.user && diary.value.user_id === userStore.user.id)
const authorInitial = computed(() => String(diary.value?.author_name || '我').trim().charAt(0).toUpperCase())

function formatDate(dt) {
  if (!dt) return ''
  return new Date(dt).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  })
}

async function fetchDiary() {
  loading.value = true
  try {
    const res = await request.get(`/diaries/${route.params.id}`)
    diary.value = res.data
  } catch {
    diary.value = null
  } finally {
    loading.value = false
  }
}

async function copyLink() {
  try {
    await navigator.clipboard.writeText(window.location.href)
    copied.value = true
    ElMessage.success('链接已复制')
    setTimeout(() => (copied.value = false), 1800)
  } catch {
    ElMessage.warning('复制失败，请手动复制地址栏链接')
  }
}

async function confirmDelete() {
  try {
    await ElMessageBox.confirm('删除后无法恢复，确定删除这篇日记吗？', '删除日记', {
      confirmButtonText: '删除',
      cancelButtonText: '取消',
      type: 'warning'
    })
    const res = await request.delete(`/diaries/${diary.value.id}`)
    if (res.code === 200) {
      ElMessage.success('已删除')
      router.replace('/diary')
    }
  } catch {
    /* 取消或错误 */
  }
}

/* 同一路由不同 id 时（例如从日历跳转）需要重新拉取 */
watch(() => route.params.id, (id) => {
  if (id) fetchDiary()
})

onMounted(fetchDiary)
onBeforeUnmount(() => {
  copied.value = false
})
</script>

<style scoped>
.detail {
  min-height: 100svh;
  padding-bottom: var(--space-2xl);
}

/* ============================== 头部 ============================== */
.detail-head {
  padding: calc(var(--header-h) + var(--space-l)) 0 var(--space-l);
  border-bottom: 1px solid var(--hairline);
  background: linear-gradient(180deg, rgba(110, 168, 255, 0.045), transparent);
}

.detail-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-s);
  margin-bottom: var(--space-m);
}
.detail-back {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-size: var(--step--1);
  color: var(--text-dim);
  transition: color var(--dur-2), gap var(--dur-2) var(--ease-out-expo);
}
.detail-back:hover {
  color: #fff;
  gap: 0.6rem;
}
.detail-nav__actions {
  display: flex;
  gap: 0.4rem;
}
.detail-act {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.35rem 0.7rem;
  border-radius: var(--r-full);
  border: 1px solid var(--hairline);
  background: var(--surface-1);
  color: var(--text-dim);
  font-size: var(--step--2);
  cursor: pointer;
  transition: all var(--dur-2) var(--ease-out-quart);
}
.detail-act:hover {
  color: #fff;
  border-color: var(--hairline-strong);
  background: var(--surface-3);
  transform: translateY(-1px);
}
.detail-act--danger:hover {
  color: #ff9d9d;
  border-color: rgba(255, 122, 122, 0.4);
  background: rgba(255, 122, 122, 0.12);
}

/* ---- 标题区：大日期 + 标题 ---- */
.detail-title-row {
  display: flex;
  align-items: flex-start;
  gap: var(--space-m);
}
.detail-date {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: none;
  padding-top: 0.3rem;
  line-height: 1;
}
.detail-date__day {
  font-size: var(--step-4);
  font-weight: 700;
  letter-spacing: -0.04em;
  background: linear-gradient(180deg, #ffffff, rgba(255, 255, 255, 0.5));
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}
.detail-date__meta {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.15rem;
  margin-top: 0.5rem;
  font-family: var(--font-mono);
  font-size: 0.625rem;
  letter-spacing: 0.1em;
  color: var(--text-faint);
}

.detail-title {
  margin: 0;
  font-size: var(--step-3);
  font-weight: 680;
  letter-spacing: -0.028em;
  line-height: 1.25;
  color: var(--text-hi);
  word-break: break-word;
}
.detail-title__mood {
  margin-left: 0.4rem;
  font-size: 0.85em;
  vertical-align: middle;
}

.detail-meta {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  flex-wrap: wrap;
  margin-top: var(--space-m);
  font-size: var(--step--2);
  color: var(--text-faint);
}
.detail-meta__author {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  color: var(--text-dim);
}
.detail-meta__avatar {
  display: grid;
  place-items: center;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  font-size: 0.625rem;
  font-weight: 700;
  color: #fff;
  background: linear-gradient(135deg, var(--aurora-a), var(--aurora-b));
}
.detail-meta__dot {
  opacity: 0.5;
}
.detail-meta__stat {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
}
.detail-meta__weather {
  padding: 0.1rem 0.5rem;
  border-radius: var(--r-full);
  border: 1px solid var(--hairline);
  background: var(--surface-1);
}
.detail-meta__private {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.1rem 0.5rem;
  border-radius: var(--r-full);
  border: 1px solid rgba(255, 184, 107, 0.3);
  background: rgba(255, 184, 107, 0.12);
  color: var(--ember);
}

/* ============================== 正文 ============================== */
.detail-body {
  padding-top: var(--space-l);
}

/* 文末三点：一个安静的结束符 */
.detail-end {
  display: flex;
  justify-content: center;
  gap: 0.45rem;
  margin: var(--space-l) 0;
}
.detail-end__dot {
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: var(--text-faint);
}

.detail-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-s);
  flex-wrap: wrap;
  padding-top: var(--space-m);
  border-top: 1px solid var(--hairline);
}

/* ---- 不存在 ---- */
.detail-missing {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: var(--space-2xl) var(--gutter);
  text-align: center;
}
.detail-missing__title {
  font-size: var(--step-2);
  font-weight: 640;
  color: var(--text-hi);
}
.detail-missing__desc {
  font-size: var(--step--1);
  color: var(--text-dim);
  margin-bottom: 0.8rem;
}

@media (max-width: 640px) {
  .detail-title-row {
    flex-direction: column;
    gap: var(--space-s);
  }
  .detail-date {
    flex-direction: row;
    align-items: baseline;
    gap: 0.5rem;
  }
  .detail-date__day {
    font-size: var(--step-3);
  }
  .detail-date__meta {
    flex-direction: row;
    gap: 0.5rem;
    margin-top: 0;
  }
}
</style>

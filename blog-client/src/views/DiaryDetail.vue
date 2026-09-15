<template>
  <div class="diary-page bg-[#040e1c] min-h-screen text-white pt-24 pb-16 px-5">
    <div class="max-w-3xl mx-auto" v-loading="loading">
      <template v-if="diary">
        <!-- 返回 -->
        <div class="mb-6">
          <span class="back-link" @click="router.push('/diary')">
            <el-icon><ArrowLeft /></el-icon> 返回日记列表
          </span>
        </div>

        <!-- 头部：日期 + 心情 + 天气 -->
        <div class="flex items-end gap-5 mb-8 pb-8 border-b border-white/10">
          <div class="flex-shrink-0 text-center">
            <div class="text-6xl font-bold leading-none bg-gradient-to-b from-white to-white/50 bg-clip-text text-transparent">
              {{ day }}
            </div>
            <div class="text-sm text-white/40 mt-2">{{ weekday }} · {{ weatherOf(diary) }}</div>
          </div>
          <div class="min-w-0 flex-1">
            <h1 class="text-2xl font-bold mb-2 break-words">
              {{ diary.title || fullDate }}
              <span v-if="diary.mood" class="text-2xl align-middle ml-1">{{ diary.mood }}</span>
            </h1>
            <div class="flex items-center gap-3 text-xs text-white/40 flex-wrap">
              <span>{{ diary.author_name || '我' }}</span>
              <span>写于 {{ formatDate(diary.created_at) }}</span>
              <span class="flex items-center gap-1"><el-icon><View /></el-icon> {{ diary.view_count }}</span>
              <span
                v-if="!diary.is_public"
                class="text-[10px] px-1.5 py-0.5 rounded bg-amber-400/15 text-amber-300 border border-amber-400/30"
              >
                私密日记
              </span>
            </div>
          </div>
          <div v-if="isOwner" class="flex gap-2 flex-shrink-0">
            <el-button size="small" round @click="router.push(`/diary/edit/${diary.id}`)">
              <el-icon><Edit /></el-icon> 编辑
            </el-button>
            <el-button size="small" round type="danger" plain @click="confirmDelete">
              <el-icon><Delete /></el-icon> 删除
            </el-button>
          </div>
        </div>

        <!-- 正文 -->
        <div class="markdown-body" v-html="html"></div>
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import request from '../utils/request'
import { renderMarkdown } from '../utils/markdown'
import { useUserStore } from '../stores/user'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const diary = ref(null)
const loading = ref(true)

const day = computed(() => (diary.value ? parseInt(diary.value.diary_date.split('-')[2]) : ''))
const weekday = computed(() => {
  if (!diary.value) return ''
  const names = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  return names[new Date(diary.value.diary_date + 'T00:00:00').getDay()]
})
const fullDate = computed(() => {
  if (!diary.value) return ''
  const [y, m, d] = diary.value.diary_date.split('-')
  return `${y}年${parseInt(m)}月${parseInt(d)}日`
})
const html = computed(() => renderMarkdown(diary.value?.content))
const isOwner = computed(() => diary.value && userStore.user && diary.value.user_id === userStore.user.id)

function weatherOf(d) {
  return d.weather || ''
}

function formatDate(dt) {
  if (!dt) return ''
  return new Date(dt).toLocaleString('zh-CN', { hour12: false })
}

async function fetchDiary() {
  loading.value = true
  try {
    const res = await request.get(`/diaries/${route.params.id}`)
    diary.value = res.data
  } catch {
    router.replace('/diary')
  } finally {
    loading.value = false
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

onMounted(fetchDiary)
</script>

<style scoped>
.back-link {
  @apply inline-flex items-center gap-1 text-sm text-white/50 hover:text-white cursor-pointer transition-colors;
}

.markdown-body {
  @apply text-white/85 leading-8;
}

.markdown-body :deep(h1),
.markdown-body :deep(h2),
.markdown-body :deep(h3) {
  @apply font-bold text-white mt-6 mb-3;
}

.markdown-body :deep(h1) {
  @apply text-2xl;
}

.markdown-body :deep(h2) {
  @apply text-xl;
}

.markdown-body :deep(h3) {
  @apply text-lg;
}

.markdown-body :deep(p) {
  @apply my-3;
}

.markdown-body :deep(a) {
  @apply text-blue-300 hover:text-blue-200 underline;
}

.markdown-body :deep(blockquote) {
  @apply border-l-4 border-blue-400/50 pl-4 my-4 text-white/60 bg-white/5 py-2 rounded-r;
}

.markdown-body :deep(code:not(.hljs)) {
  @apply bg-white/10 rounded px-1.5 py-0.5 text-sm text-pink-200;
}

.markdown-body :deep(pre) {
  @apply bg-[#0a1120] rounded-lg p-4 my-4 overflow-x-auto border border-white/10;
}

.markdown-body :deep(pre code) {
  @apply text-sm leading-6 bg-transparent p-0;
}

.markdown-body :deep(ul),
.markdown-body :deep(ol) {
  @apply my-3 pl-6;
}

.markdown-body :deep(ul) {
  @apply list-disc;
}

.markdown-body :deep(ol) {
  @apply list-decimal;
}

.markdown-body :deep(img) {
  @apply rounded-lg my-4 max-w-full;
}

.markdown-body :deep(hr) {
  @apply my-6 border-white/10;
}

.markdown-body :deep(table) {
  @apply my-4 w-full border-collapse;
}

.markdown-body :deep(th),
.markdown-body :deep(td) {
  @apply border border-white/15 px-3 py-1.5 text-left;
}

.markdown-body :deep(th) {
  @apply bg-white/10;
}
</style>

<template>
  <div class="post-detail max-w-3xl mx-auto px-5" v-loading="loading">
    <template v-if="post">
      <!-- 返回按钮 -->
      <div class="mb-4">
        <el-button text @click="router.push('/')">
          <el-icon><ArrowLeft /></el-icon> 返回首页
        </el-button>
      </div>

      <!-- 文章头部 -->
      <div class="card p-8 mb-5 rounded-2xl">
        <div class="mb-3">
          <el-tag v-if="post.category_name" :type="getCategoryType(post.category_name)">
            <el-icon><component :is="post.category_icon || 'Document'" /></el-icon>
            {{ post.category_name }}
          </el-tag>
        </div>
        <h1 class="text-2xl md:text-3xl font-bold leading-snug mb-4 text-stone-900">{{ post.title }}</h1>
        <div class="flex flex-wrap gap-5 text-sm text-stone-400 mb-3">
          <span class="flex items-center gap-1"><el-icon><User /></el-icon> {{ post.author_name }}</span>
          <span class="flex items-center gap-1"><el-icon><Calendar /></el-icon> {{ formatDate(post.created_at) }}</span>
          <span class="flex items-center gap-1"><el-icon><View /></el-icon> {{ post.view_count }} 次阅读</span>
          <span class="flex items-center gap-1"><el-icon><Clock /></el-icon> 阅读约 {{ readTime }}</span>
        </div>
        <div class="flex flex-wrap gap-1.5 mt-2" v-if="post.tags">
          <span v-for="tag in post.tags.split(',')" :key="tag" class="tag">{{ tag }}</span>
        </div>
      </div>

      <!-- 目录 -->
      <div v-if="headings.length > 0" class="card p-5 mb-5 rounded-2xl">
        <div class="flex items-center justify-between cursor-pointer" @click="tocOpen = !tocOpen">
          <h3 class="text-sm font-semibold text-stone-700 flex items-center gap-1">
            <el-icon><List /></el-icon> 目录
          </h3>
          <el-icon class="text-stone-400 transition-transform" :class="{ 'rotate-180': tocOpen }"><ArrowDown /></el-icon>
        </div>
        <div v-show="tocOpen" class="mt-3 flex flex-col gap-1.5 max-h-60 overflow-y-auto">
          <a
            v-for="(h, i) in headings"
            :key="i"
            :href="'#' + h.id"
            class="text-sm text-stone-500 hover:text-primary-600 transition-colors leading-relaxed line-clamp-1"
            :style="{ paddingLeft: (h.level - 2) * 16 + 'px' }"
            @click.prevent="scrollToHeading(h.id)"
          >{{ h.text }}</a>
        </div>
      </div>

      <!-- 文章内容 -->
      <div class="card p-8 mb-5 rounded-2xl">
        <div class="markdown-body" v-html="renderedContent"></div>
      </div>

      <!-- 相关文章 -->
      <div v-if="relatedPosts.length > 0" class="card p-6 mb-5 rounded-2xl">
        <h3 class="text-base font-semibold text-stone-700 mb-4">相关文章</h3>
        <div class="flex flex-col gap-3">
          <div
            v-for="rp in relatedPosts"
            :key="rp.id"
            class="flex items-center gap-3 p-3 rounded-lg hover:bg-stone-50 cursor-pointer transition-colors"
            @click="router.push(`/post/${rp.id}`)"
          >
            <el-tag v-if="rp.category_name" size="small" :type="getCategoryType(rp.category_name)">{{ rp.category_name }}</el-tag>
            <span class="text-sm text-stone-700 flex-1 line-clamp-1">{{ rp.title }}</span>
            <span class="text-xs text-stone-400">{{ formatDate(rp.created_at) }}</span>
          </div>
        </div>
      </div>

      <!-- 底部导航 -->
      <div class="py-5">
        <el-button text @click="router.push('/')">
          <el-icon><ArrowLeft /></el-icon> 查看更多文章
        </el-button>
      </div>
    </template>

    <!-- 文章不存在 -->
    <template v-else-if="!loading">
      <div class="flex flex-col items-center justify-center py-20">
        <el-icon :size="64" class="text-stone-300 mb-4"><Warning /></el-icon>
        <h2 class="text-xl font-bold text-stone-600 mb-2">文章不存在</h2>
        <p class="text-stone-400 mb-6">该文章可能已被删除或链接有误</p>
        <el-button type="primary" @click="router.push('/')">
          <el-icon><HomeFilled /></el-icon> 返回首页
        </el-button>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { renderMarkdown, extractHeadings } from '../utils/markdown'
import { formatDate, getCategoryType, estimateReadTime } from '../utils/helpers'
import api from '../api'

const route = useRoute()
const router = useRouter()
const post = ref(null)
const relatedPosts = ref([])
const loading = ref(false)
const tocOpen = ref(true)

const renderedContent = computed(() => renderMarkdown(post.value?.content))
const readTime = computed(() => estimateReadTime(post.value?.content))

const headings = computed(() => extractHeadings(post.value?.content))

function scrollToHeading(id) {
  const el = document.getElementById(id)
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}

async function fetchPost() {
  loading.value = true
  post.value = null
  relatedPosts.value = []
  try {
    const res = await api.get(`/posts/${route.params.id}`)
    if (res.code === 200) {
      post.value = res.data
      fetchRelated()
    }
  } catch {
    // post stays null, shows 404 state
  } finally {
    loading.value = false
  }
}

async function fetchRelated() {
  if (!post.value?.category_id) return
  try {
    const res = await api.get('/posts', { params: { page: 1, pageSize: 4, category_id: post.value.category_id } })
    if (res.code === 200) {
      relatedPosts.value = res.data.list.filter(p => p.id !== post.value.id).slice(0, 3)
    }
  } catch {}
}

// 路由参数变化时重新加载
watch(() => route.params.id, fetchPost)

onMounted(fetchPost)
</script>

<style scoped>
:deep(.hljs-keyword) { color: #569cd6; }
:deep(.hljs-string) { color: #ce9178; }
:deep(.hljs-comment) { color: #6a9955; }
:deep(.hljs-function) { color: #dcdcaa; }
:deep(.hljs-number) { color: #b5cea8; }
:deep(.hljs-tag) { color: #569cd6; }
:deep(.hljs-attr) { color: #9cdcfe; }
:deep(.hljs-built_in) { color: #4ec9b0; }
:deep(.hljs-title) { color: #dcdcaa; }
:deep(.hljs-params) { color: #9cdcfe; }
:deep(.hljs-literal) { color: #569cd6; }
</style>

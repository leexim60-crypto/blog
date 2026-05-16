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
        </div>
        <div class="flex flex-wrap gap-1.5 mt-2" v-if="post.tags">
          <span v-for="tag in post.tags.split(',')" :key="tag" class="tag">{{ tag }}</span>
        </div>
      </div>

      <!-- 文章内容 -->
      <div class="card p-8 mb-5 rounded-2xl">
        <div class="markdown-body" v-html="renderedContent"></div>
      </div>

      <!-- 底部导航 -->
      <div class="py-5">
        <el-button text @click="router.push('/')">
          <el-icon><ArrowLeft /></el-icon> 查看更多文章
        </el-button>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Marked } from 'marked'
import { markedHighlight } from 'marked-highlight'
import hljs from 'highlight.js'
import { ElMessage } from 'element-plus'
import api from '../api'

const route = useRoute()
const router = useRouter()
const post = ref(null)
const loading = ref(false)

const marked = new Marked(
  { gfm: true, breaks: false },
  markedHighlight({
    langPrefix: 'hljs language-',
    highlight(code, lang) {
      if (lang && hljs.getLanguage(lang)) {
        return hljs.highlight(code, { language: lang }).value
      }
      return hljs.highlightAuto(code).value
    }
  })
)

const renderedContent = computed(() => {
  if (!post.value?.content) return ''
  return marked.parse(post.value.content)
})

function getCategoryType(name) {
  const map = { '代码': '', '面试八股': 'warning', '感悟': 'success' }
  return map[name] || 'info'
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

async function fetchPost() {
  loading.value = true
  try {
    const res = await api.get(`/posts/${route.params.id}`)
    if (res.code === 200) {
      post.value = res.data
    } else {
      ElMessage.error(res.message || '文章不存在')
      router.push('/')
    }
  } catch {
    ElMessage.error('加载文章失败，请稍后重试')
    router.push('/')
  } finally {
    loading.value = false
  }
}

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

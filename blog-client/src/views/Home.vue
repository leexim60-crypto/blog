<template>
  <div class="home max-w-5xl mx-auto px-5">
    <!-- 头部横幅 -->
    <div class="card relative overflow-hidden p-10 mb-6 rounded-2xl bg-gradient-to-br from-rose-50 via-warm-50 to-amber-50">
      <div class="relative z-10">
        <h1 class="text-2xl font-bold text-stone-800 mb-2">Hi, 我是一名前端工程师</h1>
        <p class="text-base text-stone-500 mb-6">这里记录我的代码、面试经验和成长感悟</p>
        <div class="flex gap-8">
          <div class="flex flex-col items-center">
            <span class="text-2xl font-bold text-primary-600">{{ stats.totalPosts }}</span>
            <span class="text-xs text-stone-400">文章</span>
          </div>
          <div class="flex flex-col items-center">
            <span class="text-2xl font-bold text-primary-600">{{ stats.totalViews }}</span>
            <span class="text-xs text-stone-400">浏览</span>
          </div>
          <div class="flex flex-col items-center">
            <span class="text-2xl font-bold text-primary-600">{{ stats.totalCategories }}</span>
            <span class="text-xs text-stone-400">分类</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 分类筛选 -->
    <div class="flex gap-2 mb-4 flex-wrap">
      <div
        class="filter-item"
        :class="{ active: activeCategory === null }"
        @click="selectCategory(null)"
      >
        <el-icon><Grid /></el-icon> 全部
      </div>
      <div
        v-for="cat in categories"
        :key="cat.id"
        class="filter-item"
        :class="{ active: activeCategory === cat.id }"
        @click="selectCategory(cat.id)"
      >
        <el-icon><component :is="cat.icon || 'Document'" /></el-icon>
        {{ cat.name }}
        <span class="text-xs opacity-60">{{ cat.post_count }}</span>
      </div>
    </div>

    <!-- 搜索栏 -->
    <div class="mb-6">
      <el-input
        v-model="keyword"
        placeholder="搜索文章..."
        :prefix-icon="Search"
        size="large"
        clearable
        @keyup.enter="handleSearch"
        @clear="handleSearch"
        class="search-input"
      >
        <template #append>
          <el-button @click="handleSearch">
            <el-icon><Search /></el-icon>
          </el-button>
        </template>
      </el-input>
    </div>

    <!-- 文章列表 -->
    <div class="flex flex-col gap-4" v-loading="loading">
      <div
        v-for="post in posts"
        :key="post.id"
        class="card flex cursor-pointer overflow-hidden rounded-xl hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-300"
        @click="router.push(`/post/${post.id}`)"
      >
        <div class="w-56 min-h-40 flex-shrink-0 overflow-hidden" v-if="post.cover_image">
          <img :src="post.cover_image" :alt="post.title" class="w-full h-full object-cover" />
        </div>
        <div class="w-56 min-h-40 flex-shrink-0 flex items-center justify-center bg-gradient-to-br from-stone-100 to-stone-200" v-else>
          <div class="w-20 h-20 rounded-full bg-white flex items-center justify-center text-primary-500 shadow-md">
            <el-icon :size="40"><component :is="post.category_icon || 'Document'" /></el-icon>
          </div>
        </div>
        <div class="flex-1 p-5 flex flex-col">
          <div class="flex items-center gap-2.5 mb-2.5">
            <el-tag v-if="post.category_name" size="small" :type="getCategoryType(post.category_name)">
              {{ post.category_name }}
            </el-tag>
            <span class="text-xs text-stone-400">{{ formatDate(post.created_at) }}</span>
          </div>
          <h3 class="text-lg font-semibold mb-2 text-stone-800 line-clamp-1">{{ post.title }}</h3>
          <p class="text-sm text-stone-500 leading-relaxed line-clamp-2 flex-1">{{ post.summary }}</p>
          <div class="flex justify-between items-center mt-3">
            <div class="flex flex-wrap gap-1" v-if="post.tags">
              <span v-for="tag in post.tags.split(',')" :key="tag" class="tag">{{ tag }}</span>
            </div>
            <div class="flex gap-3 text-xs text-stone-400">
              <span class="flex items-center gap-1"><el-icon><View /></el-icon> {{ post.view_count }}</span>
            </div>
          </div>
        </div>
      </div>

      <el-empty v-if="!loading && posts.length === 0" description="暂无文章" />
    </div>

    <!-- 分页 -->
    <div class="flex justify-center py-8" v-if="total > pageSize">
      <el-pagination
        v-model:current-page="currentPage"
        :page-size="pageSize"
        :total="total"
        layout="prev, pager, next"
        @current-change="handlePageChange"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Search } from '@element-plus/icons-vue'
import api from '../api'

const router = useRouter()
const posts = ref([])
const categories = ref([])
const loading = ref(false)
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)
const activeCategory = ref(null)
const keyword = ref('')
const stats = ref({ totalPosts: 0, totalViews: 0, totalCategories: 0 })

function getCategoryType(name) {
  const map = { '代码': '', '面试八股': 'warning', '感悟': 'success' }
  return map[name] || 'info'
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

async function fetchCategories() {
  const res = await api.get('/categories')
  if (res.code === 200) {
    categories.value = res.data
    stats.value.totalCategories = res.data.length
  }
}

async function fetchStats() {
  const res = await api.get('/posts', { params: { page: 1, pageSize: 1 } })
  if (res.code === 200) {
    stats.value.totalPosts = res.data.total
  }
}

async function fetchPosts() {
  loading.value = true
  try {
    const params = {
      page: currentPage.value,
      pageSize: pageSize.value
    }
    if (activeCategory.value) params.category_id = activeCategory.value
    if (keyword.value) params.keyword = keyword.value

    const res = await api.get('/posts', { params })
    if (res.code === 200) {
      posts.value = res.data.list
      total.value = res.data.total
      stats.value.totalViews = res.data.list.reduce((sum, p) => sum + (p.view_count || 0), 0)
    }
  } finally {
    loading.value = false
  }
}

function selectCategory(catId) {
  activeCategory.value = catId
  currentPage.value = 1
  fetchPosts()
}

function handleSearch() {
  currentPage.value = 1
  fetchPosts()
}

function handlePageChange(page) {
  currentPage.value = page
  fetchPosts()
}

onMounted(() => {
  fetchCategories()
  fetchStats()
  fetchPosts()
})
</script>

<style scoped>
.filter-item {
  @apply flex items-center gap-1 px-4 py-2 rounded-full bg-white text-sm text-stone-600 cursor-pointer transition-all duration-200 border border-stone-200 hover:text-primary-600 hover:border-primary-300;
}
.filter-item.active {
  @apply bg-primary-500 text-white border-primary-500;
}
.search-input :deep(.el-input__wrapper) {
  @apply rounded-xl;
}
@media (max-width: 768px) {
  .card.flex {
    @apply flex-col;
  }
  .card.flex > div:first-child {
    @apply w-full min-h-36 max-h-44;
  }
  .filter-item {
    @apply whitespace-nowrap;
  }
}
</style>

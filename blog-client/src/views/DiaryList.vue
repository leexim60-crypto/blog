<template>
  <div class="diary-page bg-[#040e1c] min-h-screen text-white pt-24 pb-16 px-5">
    <div class="max-w-3xl mx-auto">
      <!-- 头部 -->
      <div class="flex items-center justify-between mb-8">
        <div>
          <h1 class="text-2xl sm:text-3xl font-bold tracking-wide flex items-center gap-2">
            <span>📖</span> 我的日记
          </h1>
          <p class="text-white/50 text-sm mt-1">
            记录每一天的心情 {{ total > 0 ? `· 共 ${total} 篇` : '' }}
          </p>
        </div>
        <el-button v-if="userStore.isLoggedIn" type="primary" round @click="router.push('/diary/new')">
          <el-icon class="mr-1"><EditPen /></el-icon> 写日记
        </el-button>
        <el-button v-else round @click="userStore.openLogin">登录后写日记</el-button>
      </div>

      <!-- 搜索 & 只看自己 -->
      <div class="flex gap-3 mb-8">
        <el-input
          v-model="keyword"
          placeholder="搜索日记…"
          clearable
          class="flex-1"
          @keyup.enter="reload"
          @clear="reload"
        >
          <template #prefix><el-icon><Search /></el-icon></template>
        </el-input>
        <el-button @click="reload">搜索</el-button>
        <el-checkbox
          v-if="userStore.isLoggedIn"
          v-model="mineOnly"
          label="只看我的"
          class="!text-white/70"
          @change="reload"
        />
      </div>

      <!-- 时间轴 -->
      <template v-for="(group, month) in groupedDiaries" :key="month">
        <div class="month-divider flex items-center gap-4 mb-5 mt-10 first:mt-0">
          <span class="text-lg font-bold text-blue-200">{{ month }}</span>
          <span class="text-xs text-white/40">{{ group.length }} 篇</span>
          <div class="flex-1 h-px bg-gradient-to-r from-white/20 to-transparent"></div>
        </div>

        <div class="flex flex-col gap-4">
          <article
            v-for="d in group"
            :key="d.id"
            class="diary-card relative rounded-2xl p-5 cursor-pointer transition-all duration-300"
            @click="router.push(`/diary/${d.id}`)"
          >
            <div class="flex items-start gap-4">
              <!-- 日期 -->
              <div class="flex-shrink-0 text-center w-14">
                <div class="text-3xl font-bold leading-none">{{ dayOf(d.diary_date) }}</div>
                <div class="text-xs text-white/40 mt-1">{{ weekdayOf(d.diary_date) }}</div>
              </div>

              <div class="min-w-0 flex-1">
                <div class="flex items-center gap-2 flex-wrap mb-1.5">
                  <h3 class="text-base font-semibold truncate">
                    {{ d.title || formatFullDate(d.diary_date) }}
                  </h3>
                  <span v-if="d.mood" class="text-lg">{{ d.mood }}</span>
                  <span v-if="d.weather" class="text-xs text-white/50">{{ d.weather }}</span>
                  <span
                    v-if="!d.is_public"
                    class="text-[10px] px-1.5 py-0.5 rounded bg-amber-400/15 text-amber-300 border border-amber-400/30"
                  >
                    私密
                  </span>
                </div>
                <p class="text-sm text-white/55 leading-relaxed">{{ plainText(d.content) }}</p>
                <div class="flex items-center gap-4 mt-2.5 text-xs text-white/35">
                  <span class="flex items-center gap-1"><el-icon><View /></el-icon> {{ d.view_count }}</span>
                  <!-- 作者本人的操作 -->
                  <template v-if="userStore.user && d.user_id === userStore.user.id">
                    <span
                      class="flex items-center gap-1 hover:text-blue-300 transition-colors"
                      @click.stop="router.push(`/diary/edit/${d.id}`)"
                    >
                      <el-icon><Edit /></el-icon> 编辑
                    </span>
                    <span
                      class="flex items-center gap-1 hover:text-red-400 transition-colors"
                      @click.stop="confirmDelete(d)"
                    >
                      <el-icon><Delete /></el-icon> 删除
                    </span>
                  </template>
                </div>
              </div>
            </div>
          </article>
        </div>
      </template>

      <!-- 加载更多 -->
      <div v-if="hasMore" class="text-center mt-10">
        <el-button :loading="loading" round @click="loadMore">加载更多</el-button>
      </div>

      <!-- 空状态 -->
      <el-empty
        v-if="!loading && diaries.length === 0"
        :description="keyword || mineOnly ? '没有找到符合条件的日记' : '还没有日记，写下第一篇吧'"
      >
        <el-button v-if="userStore.isLoggedIn" type="primary" round @click="router.push('/diary/new')">
          写日记
        </el-button>
      </el-empty>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessageBox, ElMessage } from 'element-plus'
import request from '../utils/request'
import { plainText } from '../utils/markdown'
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

const hasMore = computed(() => diaries.value.length < total.value)

// 按月分组（YYYY年M月 -> [日记...]）
const groupedDiaries = computed(() => {
  const groups = {}
  for (const d of diaries.value) {
    const [y, m] = d.diary_date.split('-')
    const key = `${y}年${parseInt(m)}月`
    ;(groups[key] = groups[key] || []).push(d)
  }
  return groups
})

function dayOf(dateStr) {
  return parseInt(dateStr.split('-')[2])
}

function weekdayOf(dateStr) {
  const names = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  return names[new Date(dateStr + 'T00:00:00').getDay()]
}

function formatFullDate(dateStr) {
  const [y, m, d] = dateStr.split('-')
  return `${y}年${parseInt(m)}月${parseInt(d)}日`
}

async function fetchPage() {
  loading.value = true
  try {
    const res = await request.get('/diaries', {
      params: {
        page: page.value,
        pageSize,
        keyword: keyword.value || undefined,
        mine: mineOnly.value ? 1 : undefined
      }
    })
    diaries.value.push(...res.data.list)
    total.value = res.data.total
  } catch {
    /* 拦截器已提示 */
  } finally {
    loading.value = false
  }
}

function loadMore() {
  page.value++
  fetchPage()
}

function reload() {
  page.value = 1
  diaries.value = []
  total.value = 0
  fetchPage()
}

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

onMounted(fetchPage)
</script>

<style scoped>
.diary-card {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.diary-card:hover {
  transform: translateY(-2px);
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(255, 255, 255, 0.2);
}

:deep(.el-checkbox__label) {
  color: rgba(255, 255, 255, 0.7);
}
</style>

<template>
  <div class="diary-page bg-[#040e1c] min-h-screen text-white pt-24 pb-16 px-5">
    <div class="max-w-3xl mx-auto">
      <h1 class="text-2xl font-bold tracking-wide mb-6 flex items-center gap-2">
        <span>✍️</span> {{ isEdit ? '编辑日记' : '写日记' }}
      </h1>

      <div class="flex flex-col gap-4">
        <!-- 元信息行 -->
        <div class="flex flex-wrap gap-4 items-center">
          <el-date-picker
            v-model="form.diary_date"
            type="date"
            placeholder="选择日期"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
            :clearable="false"
            :disabled-date="(d) => d.getTime() > Date.now()"
            class="!w-40"
          />
          <div class="flex items-center gap-1.5">
            <span class="text-xs text-white/40 mr-1">心情</span>
            <button
              v-for="m in moods"
              :key="m"
              type="button"
              class="mood-btn"
              :class="{ active: form.mood === m }"
              @click="form.mood = form.mood === m ? '' : m"
            >
              {{ m }}
            </button>
          </div>
          <el-select v-model="form.weather" placeholder="天气" clearable class="!w-28">
            <el-option v-for="w in weathers" :key="w" :label="w" :value="w" />
          </el-select>
          <label class="flex items-center gap-2 text-sm text-white/70 ml-auto cursor-pointer">
            <el-switch v-model="form.is_public" />
            {{ form.is_public ? '公开' : '私密' }}
          </label>
        </div>

        <!-- 标题 -->
        <el-input
          v-model="form.title"
          placeholder="标题（可留空，默认用日期）"
          maxlength="200"
          size="large"
        />

        <!-- 正文 -->
        <el-input
          v-model="form.content"
          type="textarea"
          :autosize="{ minRows: 12, maxRows: 30 }"
          placeholder="今天过得怎么样？支持 Markdown 语法…"
          resize="vertical"
        />

        <div class="flex gap-3 justify-end">
          <el-button round @click="router.back()">取消</el-button>
          <el-button type="primary" round :loading="saving" @click="save">
            {{ isEdit ? '保存修改' : '保存日记' }}
          </el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import request from '../utils/request'
import { useUserStore } from '../stores/user'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const moods = ['😊', '😄', '😐', '😔', '😢', '😡', '😴', '🥳']
const weathers = ['☀️ 晴', '⛅ 多云', '☁️ 阴', '🌧️ 雨', '⛈️ 雷雨', '❄️ 雪']

const isEdit = computed(() => !!route.params.id)
const saving = ref(false)

const form = reactive({
  title: '',
  content: '',
  diary_date: new Date().toISOString().slice(0, 10),
  mood: '',
  weather: '',
  is_public: true
})

async function loadDiary() {
  const id = route.params.id
  try {
    const res = await request.get(`/diaries/${id}`)
    const d = res.data
    // 只能编辑自己的日记
    if (d.user_id !== userStore.user?.id) {
      ElMessage.warning('只能编辑自己的日记')
      router.replace(`/diary/${id}`)
      return
    }
    form.title = d.title
    form.content = d.content
    form.diary_date = d.diary_date
    form.mood = d.mood
    form.weather = d.weather
    form.is_public = !!d.is_public
  } catch {
    router.replace('/diary')
  }
}

async function save() {
  if (!form.content.trim()) {
    ElMessage.warning('日记内容不能为空')
    return
  }
  saving.value = true
  try {
    const payload = {
      title: form.title,
      content: form.content,
      diary_date: form.diary_date,
      mood: form.mood,
      weather: form.weather,
      is_public: form.is_public ? 1 : 0
    }
    const res = isEdit.value
      ? await request.put(`/diaries/${route.params.id}`, payload)
      : await request.post('/diaries', payload)
    if (res.code === 200) {
      ElMessage.success(isEdit.value ? '已更新' : '日记已保存')
      router.push(isEdit.value ? `/diary/${route.params.id}` : `/diary/${res.data.id}`)
    }
  } catch {
    /* 拦截器已提示 */
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  if (!userStore.isLoggedIn) {
    ElMessage.warning('请先登录')
    userStore.openLogin()
    router.replace('/diary')
    return
  }
  if (isEdit.value) loadDiary()
})
</script>

<style scoped>
.mood-btn {
  @apply w-9 h-9 rounded-full text-lg flex items-center justify-center transition-all duration-200;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid transparent;
}

.mood-btn:hover {
  background: rgba(255, 255, 255, 0.12);
  transform: scale(1.1);
}

.mood-btn.active {
  background: rgba(64, 158, 255, 0.25);
  border-color: rgba(64, 158, 255, 0.6);
  transform: scale(1.1);
}

:deep(.el-textarea__inner) {
  background: rgba(255, 255, 255, 0.05);
  color: #fff;
  line-height: 1.8;
  font-family: inherit;
}

:deep(.el-input__wrapper) {
  background: rgba(255, 255, 255, 0.05);
  box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.15) inset;
}

:deep(.el-input__inner),
:deep(.el-select__placeholder) {
  color: #fff;
}

:deep(.el-input__inner::placeholder),
:deep(.el-textarea__inner::placeholder) {
  color: rgba(255, 255, 255, 0.35);
}
</style>

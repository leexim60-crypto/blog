<template>
  <div class="editor">
    <div class="shell-read">
      <!-- ============================ 头部 ============================ -->
      <header class="editor-head" v-reveal>
        <div>
          <p class="eyebrow">{{ isEdit ? 'Edit Entry' : 'New Entry' }}</p>
          <h1 class="editor-head__title">{{ isEdit ? '编辑日记' : '写日记' }}</h1>
        </div>
        <router-link to="/diary" class="editor-head__cancel">
          <el-icon><Close /></el-icon> 取消
        </router-link>
      </header>

      <!-- ============================ 元信息 ============================ -->
      <section class="editor-meta glass" v-reveal="60" aria-label="日记属性">
        <div class="editor-meta__row">
          <div class="editor-field">
            <span class="editor-field__label">日期</span>
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
          </div>

          <div class="editor-field">
            <span class="editor-field__label">天气</span>
            <el-select v-model="form.weather" placeholder="选择天气" clearable class="!w-32">
              <el-option v-for="w in weathers" :key="w" :label="w" :value="w" />
            </el-select>
          </div>

          <div class="editor-field editor-field--switch">
            <span class="editor-field__label">可见性</span>
            <label class="editor-switch">
              <el-switch v-model="form.is_public" />
              <span :class="{ 'is-private': !form.is_public }">
                {{ form.is_public ? '公开' : '私密' }}
              </span>
            </label>
          </div>
        </div>

        <div class="editor-field editor-field--mood">
          <span class="editor-field__label">今天心情</span>
          <div class="mood-row">
            <button
              v-for="m in moods"
              :key="m"
              type="button"
              class="mood-btn"
              :class="{ 'is-active': form.mood === m }"
              :aria-pressed="form.mood === m"
              :title="moodLabels[m]"
              @click="form.mood = form.mood === m ? '' : m"
            >
              {{ m }}
            </button>
          </div>
        </div>
      </section>

      <!-- ============================ 标题 ============================ -->
      <input
        v-model="form.title"
        class="editor-title"
        type="text"
        maxlength="200"
        placeholder="标题（可留空，默认用日期）"
        aria-label="日记标题"
      />

      <!-- ============================ 正文 ============================ -->
      <div class="editor-body">
        <div class="editor-toolbar">
          <div class="editor-tabs" role="tablist">
            <button
              class="editor-tab"
              :class="{ 'is-active': tab === 'write' }"
              type="button"
              role="tab"
              :aria-selected="tab === 'write'"
              @click="tab = 'write'"
            >
              <el-icon><EditPen /></el-icon> 写作
            </button>
            <button
              class="editor-tab"
              :class="{ 'is-active': tab === 'preview' }"
              type="button"
              role="tab"
              :aria-selected="tab === 'preview'"
              @click="tab = 'preview'"
            >
              <el-icon><View /></el-icon> 预览
            </button>
          </div>

          <div class="editor-stats">
            <span class="num">{{ charCount }} 字</span>
            <span class="editor-stats__sep" aria-hidden="true">·</span>
            <span class="num">约 {{ minutes }} 分钟</span>
          </div>
        </div>

        <textarea
          v-show="tab === 'write'"
          v-model="form.content"
          class="editor-textarea"
          placeholder="今天过得怎么样？支持 Markdown 语法…&#10;&#10;# 标题&#10;**加粗**、*斜体*、`代码`、- 列表、> 引用"
          aria-label="日记正文"
          spellcheck="false"
        ></textarea>

        <div v-show="tab === 'preview'" class="editor-preview">
          <div v-if="form.content.trim()" class="markdown-body" v-html="previewHtml"></div>
          <p v-else class="editor-preview__empty">还没有内容，切回「写作」开始吧 ✍️</p>
        </div>
      </div>

      <!-- ============================ 操作 ============================ -->
      <div class="editor-actions">
        <p class="editor-actions__hint">
          <el-icon><InfoFilled /></el-icon>
          按 <kbd>⌘/Ctrl</kbd> + <kbd>S</kbd> 快速保存
        </p>
        <div class="editor-actions__buttons">
          <button class="btn-ghost" type="button" @click="router.back()">取消</button>
          <button class="btn-aurora" type="button" :disabled="saving" @click="save">
            <el-icon v-if="saving" class="is-spin"><Loading /></el-icon>
            {{ saving ? '保存中…' : isEdit ? '保存修改' : '保存日记' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import request from '../utils/request'
import { renderMarkdown } from '../utils/markdown'
import { charCount as countChars, readingMinutes } from '../utils/text'
import { useUserStore } from '../stores/user'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const moods = ['😊', '😄', '😐', '😔', '😢', '😡', '😴', '🥳']
const moodLabels = {
  '😊': '开心',
  '😄': '超开心',
  '😐': '一般',
  '😔': '低落',
  '😢': '难过',
  '😡': '生气',
  '😴': '疲惫',
  '🥳': '庆祝'
}
const weathers = ['☀️ 晴', '⛅ 多云', '☁️ 阴', '🌧️ 雨', '⛈️ 雷雨', '❄️ 雪']

const isEdit = computed(() => !!route.params.id)
const saving = ref(false)
const tab = ref('write')

const form = reactive({
  title: '',
  content: '',
  diary_date: new Date().toISOString().slice(0, 10),
  mood: '',
  weather: '',
  is_public: true
})

const charCount = computed(() => countChars(form.content))
const minutes = computed(() => readingMinutes(form.content))

/* 预览：只在切到预览页时才渲染 Markdown，写作时不浪费 CPU */
const previewHtml = computed(() => (tab.value === 'preview' ? renderMarkdown(form.content) : ''))

async function loadDiary() {
  const id = route.params.id
  try {
    const res = await request.get(`/diaries/${id}`)
    const d = res.data
    if (d.user_id !== userStore.user?.id) {
      ElMessage.warning('只能编辑自己的日记')
      router.replace(`/diary/${id}`)
      return
    }
    form.title = d.title || ''
    form.content = d.content || ''
    form.diary_date = d.diary_date
    form.mood = d.mood || ''
    form.weather = d.weather || ''
    form.is_public = !!d.is_public
  } catch {
    router.replace('/diary')
  }
}

async function save() {
  if (!form.content.trim()) {
    ElMessage.warning('日记内容不能为空')
    tab.value = 'write'
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

/* ⌘/Ctrl + S 保存：写长文时最顺手的快捷键 */
function onKeydown(e) {
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') {
    e.preventDefault()
    if (!saving.value) save()
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
  window.addEventListener('keydown', onKeydown)
})

onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown))
</script>

<style scoped>
.editor {
  min-height: 100svh;
  padding: calc(var(--header-h) + var(--space-l)) 0 var(--space-2xl);
}

/* ============================== 头部 ============================== */
.editor-head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: var(--space-s);
  margin-bottom: var(--space-m);
}
.editor-head__title {
  margin: 0.6rem 0 0;
  font-size: var(--step-3);
  font-weight: 680;
  letter-spacing: -0.03em;
}
.editor-head__cancel {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  font-size: var(--step--1);
  color: var(--text-faint);
  transition: color var(--dur-2);
}
.editor-head__cancel:hover {
  color: #fff;
}

/* ============================== 元信息 ============================== */
.editor-meta {
  display: flex;
  flex-direction: column;
  gap: var(--space-s);
  padding: 1.1rem 1.25rem;
}
.editor-meta__row {
  display: flex;
  align-items: flex-end;
  gap: var(--space-m);
  flex-wrap: wrap;
}
.editor-field {
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
}
.editor-field--switch {
  margin-left: auto;
}
.editor-field__label {
  font-family: var(--font-mono);
  font-size: var(--step--2);
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--text-faint);
}
.editor-switch {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  height: 32px;
  font-size: var(--step--1);
  color: var(--text-dim);
  cursor: pointer;
}
.editor-switch .is-private {
  color: var(--ember);
}

.editor-field--mood {
  padding-top: 0.9rem;
  border-top: 1px solid var(--hairline);
}
.mood-row {
  display: flex;
  gap: 0.35rem;
  flex-wrap: wrap;
}
.mood-btn {
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: 1px solid transparent;
  background: var(--surface-2);
  font-size: 1.05rem;
  cursor: pointer;
  transition:
    transform var(--dur-2) var(--ease-spring),
    background-color var(--dur-2),
    border-color var(--dur-2),
    box-shadow var(--dur-2);
}
.mood-btn:hover {
  background: var(--surface-3);
  transform: scale(1.12);
}
.mood-btn.is-active {
  background: rgba(110, 168, 255, 0.22);
  border-color: var(--accent-line);
  transform: scale(1.12);
  box-shadow: 0 0 0 4px var(--accent-soft);
}

/* ============================== 标题输入 ============================== */
.editor-title {
  width: 100%;
  margin: var(--space-m) 0 0;
  padding: 0.35rem 0;
  border: none;
  border-bottom: 1px solid var(--hairline);
  background: none;
  color: var(--text-hi);
  font-family: inherit;
  font-size: var(--step-3);
  font-weight: 660;
  letter-spacing: -0.028em;
  outline: none;
  transition: border-color var(--dur-3) var(--ease-out-quart);
}
.editor-title::placeholder {
  color: var(--text-faint);
  font-weight: 500;
}
.editor-title:focus {
  border-bottom-color: var(--accent-line);
}

/* ============================== 正文 ============================== */
.editor-body {
  margin-top: var(--space-m);
  border: 1px solid var(--hairline);
  border-radius: var(--r-m);
  background: var(--surface-1);
  overflow: hidden;
  transition: border-color var(--dur-3), box-shadow var(--dur-3);
}
.editor-body:focus-within {
  border-color: var(--hairline-strong);
  box-shadow: 0 0 0 4px var(--accent-soft);
}

.editor-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-s);
  padding: 0.5rem 0.6rem;
  border-bottom: 1px solid var(--hairline);
  background: rgba(255, 255, 255, 0.02);
}
.editor-tabs {
  display: flex;
  gap: 0.2rem;
  padding: 0.2rem;
  border-radius: var(--r-full);
  background: var(--surface-1);
}
.editor-tab {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.35rem 0.85rem;
  border: none;
  border-radius: var(--r-full);
  background: transparent;
  color: var(--text-dim);
  font-size: var(--step--2);
  font-weight: 560;
  cursor: pointer;
  transition: all var(--dur-2) var(--ease-out-quart);
}
.editor-tab:hover {
  color: #fff;
}
.editor-tab.is-active {
  background: linear-gradient(120deg, rgba(110, 168, 255, 0.28), rgba(167, 139, 250, 0.28));
  color: #fff;
  box-shadow: inset 0 0 0 1px rgba(160, 190, 255, 0.25);
}
.editor-stats {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding-right: 0.4rem;
  font-family: var(--font-mono);
  font-size: var(--step--2);
  color: var(--text-faint);
}
.editor-stats__sep {
  opacity: 0.5;
}

.editor-textarea {
  display: block;
  width: 100%;
  min-height: 22rem;
  padding: 1.25rem 1.35rem;
  border: none;
  background: none;
  color: var(--text-hi);
  font-family: var(--font-sans);
  font-size: var(--step-0);
  line-height: 1.9;
  resize: vertical;
  outline: none;
}
.editor-textarea::placeholder {
  color: var(--text-faint);
}

.editor-preview {
  min-height: 22rem;
  padding: 1.25rem 1.35rem;
}
.editor-preview__empty {
  color: var(--text-faint);
  font-size: var(--step--1);
}

/* ============================== 操作 ============================== */
.editor-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-s);
  flex-wrap: wrap;
  margin-top: var(--space-m);
}
.editor-actions__hint {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  font-size: var(--step--2);
  color: var(--text-faint);
}
.editor-actions__hint kbd {
  padding: 0.1rem 0.35rem;
  border-radius: 5px;
  border: 1px solid var(--hairline);
  background: var(--surface-2);
  font-family: var(--font-mono);
  font-size: 0.9em;
}
.editor-actions__buttons {
  display: flex;
  gap: 0.6rem;
}
.editor-actions__buttons .btn-aurora:disabled {
  opacity: 0.7;
  cursor: wait;
  transform: none;
}
.is-spin {
  animation: spin 1s linear infinite;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 640px) {
  .editor-field--switch {
    margin-left: 0;
  }
  .editor-actions {
    flex-direction: column;
    align-items: stretch;
  }
  .editor-actions__hint {
    justify-content: center;
  }
  .editor-actions__buttons {
    flex-direction: column-reverse;
  }
  .editor-actions__buttons .btn-aurora,
  .editor-actions__buttons .btn-ghost {
    width: 100%;
  }
}
</style>

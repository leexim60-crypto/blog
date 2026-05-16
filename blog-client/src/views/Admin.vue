<template>
  <div class="admin max-w-6xl mx-auto px-5">
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-xl font-bold text-stone-800">后台管理</h1>
      <el-button type="primary" @click="openEditor()">
        <el-icon><Plus /></el-icon> 写文章
      </el-button>
    </div>

    <!-- 统计卡片 -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <div class="card flex items-center gap-4 p-5 rounded-xl" v-for="s in statCards" :key="s.label">
        <div class="w-12 h-12 rounded-xl text-white flex items-center justify-center" :style="{ background: s.color }">
          <el-icon :size="24"><component :is="s.icon" /></el-icon>
        </div>
        <div class="flex flex-col">
          <span class="text-xl font-bold text-stone-800">{{ s.value }}</span>
          <span class="text-xs text-stone-400">{{ s.label }}</span>
        </div>
      </div>
    </div>

    <!-- 文章管理表格 -->
    <div class="card p-6 rounded-2xl">
      <div class="flex justify-between items-center mb-4">
        <h3 class="text-base font-semibold text-stone-700">文章管理</h3>
        <div class="flex gap-3">
          <el-select v-model="filterCategory" placeholder="筛选分类" clearable @change="fetchPosts" style="width: 150px">
            <el-option v-for="cat in categories" :key="cat.id" :label="cat.name" :value="cat.id" />
          </el-select>
          <el-input v-model="filterKeyword" placeholder="搜索..." clearable @keyup.enter="fetchPosts" @clear="fetchPosts" style="width: 200px">
            <template #prefix><el-icon><Search /></el-icon></template>
          </el-input>
        </div>
      </div>

      <el-table :data="posts" v-loading="loading" stripe>
        <el-table-column prop="id" label="ID" width="60" />
        <el-table-column prop="title" label="标题" min-width="200" show-overflow-tooltip />
        <el-table-column prop="category_name" label="分类" width="100">
          <template #default="{ row }">
            <el-tag v-if="row.category_name" size="small" :type="getCategoryType(row.category_name)">
              {{ row.category_name }}
            </el-tag>
            <span v-else class="text-xs text-stone-400">未分类</span>
          </template>
        </el-table-column>
        <el-table-column label="标签" width="180">
          <template #default="{ row }">
            <span v-if="row.tags">
              <el-tag v-for="tag in row.tags.split(',')" :key="tag" size="small" type="info" style="margin: 2px">{{ tag }}</el-tag>
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="view_count" label="浏览" width="80" align="center" />
        <el-table-column label="状态" width="80" align="center">
          <template #default="{ row }">
            <el-tag :type="row.is_published ? 'success' : 'info'" size="small">
              {{ row.is_published ? '已发布' : '草稿' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="日期" width="110">
          <template #default="{ row }">
            {{ formatDate(row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button text type="primary" size="small" @click="openEditor(row)">编辑</el-button>
            <el-popconfirm title="确定删除这篇文章吗？" @confirm="deletePost(row.id)">
              <template #reference>
                <el-button text type="danger" size="small">删除</el-button>
              </template>
            </el-popconfirm>
          </template>
        </el-table-column>
      </el-table>

      <div class="flex justify-center py-6" v-if="total > pageSize">
        <el-pagination
          v-model:current-page="currentPage"
          :page-size="pageSize"
          :total="total"
          layout="total, prev, pager, next"
          @current-change="handlePageChange"
        />
      </div>
    </div>

    <!-- ========== 编辑器弹窗 ========== -->
    <el-dialog
      v-model="editorVisible"
      :title="editingPost ? '编辑文章' : '写文章'"
      :close-on-click-modal="false"
      fullscreen
      class="editor-dialog"
    >
      <div class="flex gap-6 h-[calc(100vh-150px)]">
        <!-- 左侧：编辑区域 -->
        <div class="flex-1 flex flex-col min-w-0 overflow-hidden">
          <!-- 标题 -->
          <input
            v-model="postForm.title"
            placeholder="输入文章标题..."
            class="w-full text-2xl font-bold text-stone-800 placeholder-stone-300 border-0 outline-none bg-transparent mb-4 pb-3 border-b border-stone-100 focus:border-primary-300 transition-colors"
          />

          <!-- Markdown 编辑器 -->
          <div class="flex-1 flex flex-col border border-stone-200 rounded-xl overflow-hidden bg-white">
            <!-- 工具栏 -->
            <div class="flex items-center gap-0.5 px-2 py-1.5 bg-stone-50 border-b border-stone-200 flex-wrap">
              <button v-for="btn in toolbarButtons" :key="btn.label" @click="insertMarkdown(btn.syntax)"
                class="toolbar-btn" :title="btn.label">
                <span class="font-mono text-xs font-bold">{{ btn.icon }}</span>
              </button>
              <div class="w-px h-5 bg-stone-200 mx-1"></div>
              <button @click="insertMarkdown('link')" class="toolbar-btn" title="链接">
                <el-icon :size="14"><Link /></el-icon>
              </button>
              <button @click="insertMarkdown('image')" class="toolbar-btn" title="图片">
                <el-icon :size="14"><Picture /></el-icon>
              </button>
              <button @click="insertMarkdown('table')" class="toolbar-btn" title="表格">
                <el-icon :size="14"><Grid /></el-icon>
              </button>
              <div class="w-px h-5 bg-stone-200 mx-1"></div>
              <el-radio-group v-model="editorMode" size="small" class="ml-auto">
                <el-radio-button value="edit">编辑</el-radio-button>
                <el-radio-button value="preview">预览</el-radio-button>
                <el-radio-button value="split">分屏</el-radio-button>
              </el-radio-group>
            </div>

            <!-- 编辑/预览区域 -->
            <div class="flex-1 flex overflow-hidden">
              <div class="editor-input flex-1" v-show="editorMode !== 'preview'">
                <textarea
                  ref="editorRef"
                  v-model="postForm.content"
                  :placeholder="mdPlaceholder"
                  class="w-full h-full p-4 text-sm text-stone-800 leading-relaxed font-mono resize-none border-0 outline-none bg-white"
                  @scroll="syncScroll"
                ></textarea>
              </div>
              <div class="editor-preview flex-1 overflow-y-auto" v-show="editorMode !== 'edit'" ref="previewRef">
                <div v-if="postForm.content" class="markdown-body p-5" v-html="previewContent"></div>
                <div v-else class="flex flex-col items-center justify-center h-full text-stone-300">
                  <el-icon :size="48"><Edit /></el-icon>
                  <p class="mt-2 text-sm">开始输入内容，这里会显示预览</p>
                </div>
              </div>
            </div>

            <!-- 底部状态栏 -->
            <div class="flex items-center justify-between px-3 py-1.5 bg-stone-50 border-t border-stone-200 text-xs text-stone-400">
              <div class="flex gap-4">
                <span>字数：<strong class="text-stone-600">{{ wordCount }}</strong></span>
                <span>行数：<strong class="text-stone-600">{{ lineCount }}</strong></span>
              </div>
              <div class="flex items-center gap-2">
                <el-popover placement="top" :width="320" trigger="click">
                  <template #reference>
                    <span class="cursor-pointer hover:text-primary-500 transition-colors">
                      <el-icon class="mr-0.5"><QuestionFilled /></el-icon> Markdown 语法参考
                    </span>
                  </template>
                  <div class="text-xs leading-relaxed text-stone-500 space-y-1">
                    <p><code class="text-primary-600 font-mono bg-primary-50 px-1 rounded"># 标题</code> — 一级标题</p>
                    <p><code class="text-primary-600 font-mono bg-primary-50 px-1 rounded">## 标题</code> — 二级标题</p>
                    <p><code class="text-primary-600 font-mono bg-primary-50 px-1 rounded">**粗体**</code> — <b>粗体</b></p>
                    <p><code class="text-primary-600 font-mono bg-primary-50 px-1 rounded">*斜体*</code> — <i>斜体</i></p>
                    <p><code class="text-primary-600 font-mono bg-primary-50 px-1 rounded">- 列表</code> — 无序列表</p>
                    <p><code class="text-primary-600 font-mono bg-primary-50 px-1 rounded">1. 列表</code> — 有序列表</p>
                    <p><code class="text-primary-600 font-mono bg-primary-50 px-1 rounded">> 引用</code> — 引用块</p>
                    <p><code class="text-primary-600 font-mono bg-primary-50 px-1 rounded">`代码`</code> — 行内代码</p>
                    <p><code class="text-primary-600 font-mono bg-primary-50 px-1 rounded">```js</code> — 代码块</p>
                    <p><code class="text-primary-600 font-mono bg-primary-50 px-1 rounded">[文字](url)</code> — 链接</p>
                    <p><code class="text-primary-600 font-mono bg-primary-50 px-1 rounded">![alt](url)</code> — 图片</p>
                    <p><code class="text-primary-600 font-mono bg-primary-50 px-1 rounded">---</code> — 分割线</p>
                  </div>
                </el-popover>
              </div>
            </div>
          </div>
        </div>

        <!-- 右侧：设置面板 -->
        <div class="w-72 flex-shrink-0 flex flex-col gap-4 overflow-y-auto pr-1">
          <!-- 发布设置 -->
          <div class="bg-stone-50 rounded-xl p-4">
            <h4 class="text-sm font-semibold text-stone-700 mb-3 flex items-center gap-1.5">
              <el-icon><Setting /></el-icon> 发布设置
            </h4>
            <div class="flex items-center justify-between mb-3">
              <span class="text-sm text-stone-500">状态</span>
              <el-switch v-model="postForm.is_published" :active-value="1" :inactive-value="0" active-text="发布" inactive-text="草稿" />
            </div>
            <div class="mb-3">
              <label class="text-sm text-stone-500 mb-1.5 block">分类</label>
              <el-select v-model="postForm.category_id" placeholder="选择分类" style="width: 100%" size="default">
                <el-option v-for="cat in categories" :key="cat.id" :label="cat.name" :value="cat.id" />
              </el-select>
            </div>
            <div>
              <label class="text-sm text-stone-500 mb-1.5 block">摘要</label>
              <el-input v-model="postForm.summary" type="textarea" :rows="3" placeholder="选填，不填会自动截取" />
            </div>
          </div>

          <!-- 封面图 -->
          <div class="bg-stone-50 rounded-xl p-4">
            <h4 class="text-sm font-semibold text-stone-700 mb-3 flex items-center gap-1.5">
              <el-icon><Picture /></el-icon> 封面图
            </h4>
            <el-input v-model="postForm.cover_image" placeholder="输入图片URL" size="default" clearable />
            <div v-if="postForm.cover_image" class="mt-3 rounded-lg overflow-hidden border border-stone-200">
              <img :src="postForm.cover_image" alt="封面预览" class="w-full h-32 object-cover" @error="coverImgError = true" />
              <div v-if="coverImgError" class="w-full h-32 flex items-center justify-center bg-stone-100 text-stone-400 text-xs">
                图片加载失败
              </div>
            </div>
          </div>

          <!-- 标签 -->
          <div class="bg-stone-50 rounded-xl p-4">
            <h4 class="text-sm font-semibold text-stone-700 mb-3 flex items-center gap-1.5">
              <el-icon><PriceTag /></el-icon> 标签
            </h4>
            <div class="flex flex-wrap gap-1.5 mb-3">
              <el-tag
                v-for="tag in postForm.tags"
                :key="tag"
                closable
                @close="removeTag(tag)"
                size="small"
              >{{ tag }}</el-tag>
              <el-input
                v-if="tagInputVisible"
                ref="tagInputRef"
                v-model="tagInputValue"
                size="small"
                style="width: 90px"
                @keyup.enter="addTag"
                @blur="addTag"
              />
              <el-button v-else size="small" text @click="showTagInput" class="!text-xs">
                + 添加
              </el-button>
            </div>
            <div>
              <p class="text-xs text-stone-400 mb-1.5">推荐标签</p>
              <div class="flex flex-wrap gap-1">
                <span
                  v-for="tag in suggestedTags"
                  :key="tag"
                  @click="addSuggestedTag(tag)"
                  class="inline-block px-2 py-0.5 text-xs rounded-full cursor-pointer transition-all duration-150"
                  :class="postForm.tags.includes(tag)
                    ? 'bg-primary-100 text-primary-600 border border-primary-200'
                    : 'bg-white text-stone-500 border border-stone-200 hover:border-primary-300 hover:text-primary-600'"
                >{{ tag }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <template #footer>
        <div class="flex items-center justify-between">
          <span class="text-xs text-stone-400">
            <template v-if="editingPost">正在编辑：{{ editingPost.title }}</template>
            <template v-else>新文章</template>
          </span>
          <div class="flex gap-2">
            <el-button @click="editorVisible = false">取消</el-button>
            <el-button type="primary" :loading="saving" @click="savePost">
              <el-icon><component :is="editingPost ? 'Check' : 'Promotion'" /></el-icon>
              {{ editingPost ? '更新文章' : '发布文章' }}
            </el-button>
          </div>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, nextTick, watch } from 'vue'
import { Marked } from 'marked'
import { markedHighlight } from 'marked-highlight'
import hljs from 'highlight.js'
import { ElMessage } from 'element-plus'
import api from '../api'

const posts = ref([])
const categories = ref([])
const loading = ref(false)
const saving = ref(false)
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)
const filterCategory = ref('')
const filterKeyword = ref('')
const editorVisible = ref(false)
const editingPost = ref(null)
const editorMode = ref('split')
const tagInputVisible = ref(false)
const tagInputValue = ref('')
const tagInputRef = ref()
const editorRef = ref()
const previewRef = ref()
const coverImgError = ref(false)

const suggestedTags = ['JavaScript', 'Vue', 'React', 'CSS', 'Node.js', '面试', '算法', '网络', '性能优化', '随笔']

const toolbarButtons = [
  { label: '一级标题', icon: 'H1', syntax: 'h1' },
  { label: '二级标题', icon: 'H2', syntax: 'h2' },
  { label: '三级标题', icon: 'H3', syntax: 'h3' },
  { label: '粗体', icon: 'B', syntax: 'bold' },
  { label: '斜体', icon: 'I', syntax: 'italic' },
  { label: '删除线', icon: 'S', syntax: 'strike' },
  { label: '行内代码', icon: '`', syntax: 'code' },
  { label: '代码块', icon: '{ }', syntax: 'codeblock' },
  { label: '引用', icon: '>', syntax: 'quote' },
  { label: '无序列表', icon: '•', syntax: 'ul' },
  { label: '有序列表', icon: '1.', syntax: 'ol' },
  { label: '分割线', icon: '—', syntax: 'hr' },
]

const mdPlaceholder = `开始写作吧...

支持 Markdown 格式，可以使用上方工具栏快速插入格式，也可以直接输入 Markdown 语法。`

const postForm = reactive({
  title: '',
  content: '',
  summary: '',
  category_id: null,
  cover_image: '',
  is_published: 1,
  tags: []
})

const statCards = computed(() => [
  { label: '总文章数', value: total.value, icon: 'Document', color: '#f43f5e' },
  { label: '已发布', value: posts.value.filter(p => p.is_published).length, icon: 'SuccessFilled', color: '#10b981' },
  { label: '草稿', value: posts.value.filter(p => !p.is_published).length, icon: 'Edit', color: '#f59e0b' },
  { label: '总浏览量', value: posts.value.reduce((s, p) => s + (p.view_count || 0), 0), icon: 'View', color: '#78716c' }
])

const wordCount = computed(() => {
  if (!postForm.content) return 0
  return postForm.content.replace(/\s/g, '').length
})

const lineCount = computed(() => {
  if (!postForm.content) return 0
  return postForm.content.split('\n').length
})

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

const previewContent = computed(() => {
  if (!postForm.content) return ''
  return marked.parse(postForm.content)
})

// 封面图 URL 变化时重置错误状态
watch(() => postForm.cover_image, () => {
  coverImgError.value = false
})

function insertMarkdown(syntax) {
  const textarea = editorRef.value
  if (!textarea) return

  const start = textarea.selectionStart
  const end = textarea.selectionEnd
  const selected = postForm.content.substring(start, end)
  let insert = ''
  let cursorOffset = 0

  switch (syntax) {
    case 'h1': insert = `# ${selected || '一级标题'}`; cursorOffset = selected ? insert.length : 2; break
    case 'h2': insert = `## ${selected || '二级标题'}`; cursorOffset = selected ? insert.length : 3; break
    case 'h3': insert = `### ${selected || '三级标题'}`; cursorOffset = selected ? insert.length : 4; break
    case 'bold': insert = `**${selected || '粗体文字'}**`; cursorOffset = selected ? insert.length : 2; break
    case 'italic': insert = `*${selected || '斜体文字'}*`; cursorOffset = selected ? insert.length : 1; break
    case 'strike': insert = `~~${selected || '删除文字'}~~`; cursorOffset = selected ? insert.length : 2; break
    case 'code': insert = `\`${selected || '代码'}\``; cursorOffset = selected ? insert.length : 1; break
    case 'codeblock': insert = `\n\`\`\`javascript\n${selected || '// 代码'}\n\`\`\`\n`; cursorOffset = 16; break
    case 'quote': insert = `> ${selected || '引用文字'}`; cursorOffset = selected ? insert.length : 2; break
    case 'ul': insert = `- ${selected || '列表项'}`; cursorOffset = selected ? insert.length : 2; break
    case 'ol': insert = `1. ${selected || '列表项'}`; cursorOffset = selected ? insert.length : 3; break
    case 'hr': insert = `\n---\n`; cursorOffset = insert.length; break
    case 'link': insert = `[${selected || '链接文字'}](https://)`; cursorOffset = selected ? insert.length - 1 : 1; break
    case 'image': insert = `![${selected || '图片描述'}](https://)`; cursorOffset = selected ? insert.length - 1 : 2; break
    case 'table':
      insert = `\n| 列1 | 列2 | 列3 |\n|-----|-----|-----|\n| 数据 | 数据 | 数据 |\n`
      cursorOffset = insert.length
      break
    default: return
  }

  postForm.content = postForm.content.substring(0, start) + insert + postForm.content.substring(end)

  nextTick(() => {
    textarea.focus()
    const newPos = start + cursorOffset
    textarea.setSelectionRange(newPos, newPos)
  })
}

function syncScroll(e) {
  if (editorMode.value !== 'split' || !previewRef.value) return
  const textarea = e.target
  const ratio = textarea.scrollTop / (textarea.scrollHeight - textarea.clientHeight)
  const preview = previewRef.value
  preview.scrollTop = ratio * (preview.scrollHeight - preview.clientHeight)
}

function getCategoryType(name) {
  const map = { '代码': '', '面试八股': 'warning', '感悟': 'success' }
  return map[name] || 'info'
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function showTagInput() {
  tagInputVisible.value = true
  nextTick(() => tagInputRef.value?.focus())
}

function addTag() {
  const val = tagInputValue.value.trim()
  if (val && !postForm.tags.includes(val)) {
    postForm.tags.push(val)
  }
  tagInputVisible.value = false
  tagInputValue.value = ''
}

function addSuggestedTag(tag) {
  if (!postForm.tags.includes(tag)) {
    postForm.tags.push(tag)
  }
}

function removeTag(tag) {
  postForm.tags = postForm.tags.filter(t => t !== tag)
}

function openEditor(post = null) {
  editingPost.value = post
  coverImgError.value = false
  if (post) {
    postForm.title = post.title
    postForm.content = post.content
    postForm.summary = post.summary || ''
    postForm.category_id = post.category_id
    postForm.cover_image = post.cover_image || ''
    postForm.is_published = post.is_published
    postForm.tags = post.tags ? post.tags.split(',') : []
  } else {
    postForm.title = ''
    postForm.content = ''
    postForm.summary = ''
    postForm.category_id = null
    postForm.cover_image = ''
    postForm.is_published = 1
    postForm.tags = []
  }
  editorVisible.value = true
}

async function fetchCategories() {
  try {
    const res = await api.get('/categories')
    if (res.code === 200) categories.value = res.data
  } catch {
    ElMessage.error('加载分类失败')
  }
}

async function fetchPosts() {
  loading.value = true
  try {
    const params = { page: currentPage.value, pageSize: pageSize.value }
    if (filterCategory.value) params.category_id = filterCategory.value
    if (filterKeyword.value) params.keyword = filterKeyword.value
    const res = await api.get('/posts/admin', { params })
    if (res.code === 200) {
      posts.value = res.data.list
      total.value = res.data.total
    }
  } finally {
    loading.value = false
  }
}

function handlePageChange(page) {
  currentPage.value = page
  fetchPosts()
}

async function savePost() {
  if (!postForm.title.trim()) return ElMessage.warning('请输入标题')
  if (!postForm.content.trim()) return ElMessage.warning('请输入内容')

  saving.value = true
  try {
    const payload = { ...postForm }
    let res
    if (editingPost.value) {
      res = await api.put(`/posts/${editingPost.value.id}`, payload)
    } else {
      res = await api.post('/posts', payload)
    }

    if (res.code === 200) {
      ElMessage.success(editingPost.value ? '更新成功' : '发布成功')
      editorVisible.value = false
      fetchPosts()
    } else {
      ElMessage.error(res.message || '操作失败')
    }
  } finally {
    saving.value = false
  }
}

async function deletePost(id) {
  try {
    const res = await api.delete(`/posts/${id}`)
    if (res.code === 200) {
      ElMessage.success('删除成功')
      fetchPosts()
    } else {
      ElMessage.error(res.message || '删除失败')
    }
  } catch {
    ElMessage.error('删除失败，请稍后重试')
  }
}

onMounted(() => {
  fetchCategories()
  fetchPosts()
})
</script>

<style scoped>
.toolbar-btn {
  @apply w-7 h-7 flex items-center justify-center rounded text-stone-500 hover:bg-stone-200 hover:text-stone-700 transition-colors cursor-pointer;
}

.editor-input textarea {
  font-family: 'Fira Code', 'Consolas', 'Monaco', monospace;
  tab-size: 2;
}

.editor-input textarea::placeholder {
  @apply text-stone-300;
}

.split .editor-input {
  @apply border-r border-stone-200;
}

:deep(.hljs-keyword) { color: #569cd6; }
:deep(.hljs-string) { color: #ce9178; }
:deep(.hljs-comment) { color: #6a9955; }

@media (max-width: 768px) {
  .flex.gap-6 {
    @apply flex-col;
  }
  .w-72 {
    @apply w-full;
  }
  .split .editor-input {
    @apply border-r-0 border-b border-stone-200;
  }
}
</style>

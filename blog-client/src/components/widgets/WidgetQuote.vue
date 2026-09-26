<template>
  <div class="widget-card widget-quote">
    <div class="widget-head">
      <span class="widget-title"><el-icon><ChatDotRound /></el-icon> 一言</span>
      <div class="flex items-center gap-1">
        <button class="widget-mini-btn" :class="{ 'is-spin': loading }" @click="load">
          <el-icon><Refresh /></el-icon>
        </button>
        <button class="widget-mini-btn" @click="copy">
          <el-icon><component :is="copied ? 'Select' : 'CopyDocument'" /></el-icon>
        </button>
      </div>
    </div>

    <p class="quote-text">{{ loading && !quote.text ? '正在寻找一句话…' : quote.text }}</p>
    <p v-if="quote.from" class="quote-from">—— {{ quote.from }}</p>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { fetchJson, readCache, writeCache } from '../../utils/widgetFetch'

const CACHE_KEY = 'widget_hitokoto_v1'
const CACHE_TTL = 30 * 60 * 1000

const quote = ref({ text: '', from: '' })
const loading = ref(false)
const copied = ref(false)

// 第三方接口挂掉时的兜底句子
const FALLBACK = [
  { text: '既然选择了远方，便只顾风雨兼程。', from: '汪国真《热爱生命》' },
  { text: '星光不问赶路人，时光不负有心人。', from: '网络' },
  { text: '所有的热爱都要全力以赴。', from: '网络' }
]

async function load() {
  loading.value = true
  try {
    const data = await fetchJson('https://v1.hitokoto.cn/?c=a&c=d&c=i&c=k&encode=json', {
      timeout: 7000
    })
    if (data && data.hitokoto) {
      quote.value = {
        text: data.hitokoto,
        from: data.from ? data.from + (data.from_who ? ' · ' + data.from_who : '') : data.from_who || ''
      }
      writeCache(CACHE_KEY, quote.value)
    }
  } catch (e) {
    if (!quote.value.text) {
      quote.value = FALLBACK[Math.floor(Math.random() * FALLBACK.length)]
    }
  } finally {
    loading.value = false
  }
}

async function copy() {
  try {
    await navigator.clipboard.writeText(quote.value.text + (quote.value.from ? ' —— ' + quote.value.from : ''))
    copied.value = true
    ElMessage.success('已复制')
    setTimeout(() => (copied.value = false), 1800)
  } catch (e) {
    ElMessage.warning('复制失败，请手动选择文字')
  }
}

onMounted(() => {
  const cached = readCache(CACHE_KEY, CACHE_TTL)
  if (cached) quote.value = cached
  load()
})
</script>

<style scoped>
.quote-text {
  margin-top: 14px;
  font-size: 14px;
  line-height: 1.85;
  color: rgba(255, 255, 255, 0.82);
  /* 首行缩进 + 引号装饰 */
  position: relative;
  padding-left: 14px;
}
.quote-text::before {
  content: '';
  position: absolute;
  left: 0;
  top: 4px;
  bottom: 4px;
  width: 3px;
  border-radius: 999px;
  background: linear-gradient(180deg, #4f7cff, #b45cff);
}
.quote-from {
  margin-top: 8px;
  text-align: right;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.4);
}
</style>

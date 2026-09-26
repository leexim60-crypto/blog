<template>
  <div class="widget-card widget-stats">
    <div class="widget-head">
      <span class="widget-title"><el-icon><Histogram /></el-icon> 小站统计</span>
      <button
        class="widget-mini-btn"
        :disabled="loading"
        :class="{ 'is-spin': loading }"
        @click="load"
      >
        <el-icon><Refresh /></el-icon>
      </button>
    </div>

    <div class="stats-grid">
      <div class="stat-item">
        <span class="stat-value">{{ num(stats.diaries) }}</span>
        <span class="stat-label">篇日记</span>
      </div>
      <div class="stat-item">
        <span class="stat-value">{{ num(stats.views) }}</span>
        <span class="stat-label">次阅读</span>
      </div>
      <div class="stat-item">
        <span class="stat-value">{{ num(stats.days) }}</span>
        <span class="stat-label">天运行</span>
      </div>
    </div>

    <p class="stats-foot">
      <span class="stats-dot"></span>
      {{ onlineText }}
    </p>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { fetchJson, formatNumber } from '../../utils/widgetFetch'

const stats = ref({ diaries: 0, views: 0, days: 0, posts: 0 })
const loading = ref(false)
const onlineText = ref('数据来自本站后端统计')

const num = formatNumber

async function load() {
  loading.value = true
  try {
    // 用原生 fetch：后端休眠/异常时不弹全局错误提示，挂件自己降级
    const res = await fetchJson('/api/stats/site', { timeout: 15000 })
    if (res.code === 200 && res.data) {
      stats.value = res.data
      onlineText.value = `文章 ${res.data.posts || 0} 篇 · 公开日记 ${res.data.publicDiaries || 0} 篇`
    }
  } catch (e) {
    // 后端冷启动/休眠时保持占位，不打断页面
    onlineText.value = '后端休息中，稍后自动恢复'
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>

<style scoped>
.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  margin-top: 14px;
}
.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 12px 6px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.07);
  transition: background-color 0.25s, transform 0.25s;
}
.stat-item:hover {
  background: rgba(255, 255, 255, 0.08);
  transform: translateY(-2px);
}
.stat-value {
  font-size: 22px;
  font-weight: 700;
  line-height: 1;
  color: #fff;
  font-variant-numeric: tabular-nums;
  background: linear-gradient(120deg, #ffffff, #a9c8ff);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}
.stat-label {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.4);
}
.stats-foot {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 12px;
  font-size: 11px;
  color: rgba(255, 255, 255, 0.35);
}
.stats-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #3ddc97;
  box-shadow: 0 0 8px #3ddc97;
  animation: stats-pulse 2s ease-in-out infinite;
}
@keyframes stats-pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.45; transform: scale(0.8); }
}
</style>

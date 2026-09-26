<template>
  <div class="widget-card widget-clock">
    <div class="widget-head">
      <span class="widget-title"><el-icon><Clock /></el-icon> 现在时间</span>
      <span class="widget-badge">{{ greeting }}</span>
    </div>

    <div class="clock-main">
      <span class="clock-hm">{{ hh }}:{{ mm }}</span>
      <span class="clock-sec">:{{ ss }}</span>
    </div>

    <div class="clock-date">
      {{ dateText }}
      <span class="text-white/25 mx-1">·</span>
      {{ weekday }}
    </div>

    <div class="clock-progress">
      <div class="clock-progress-bar">
        <span :style="{ width: dayProgress + '%' }"></span>
      </div>
      <span class="clock-progress-text">今日已过 {{ dayProgress }}%</span>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { pad2 } from '../../utils/widgetFetch'

const now = ref(new Date())
let timer = null

const hh = computed(() => pad2(now.value.getHours()))
const mm = computed(() => pad2(now.value.getMinutes()))
const ss = computed(() => pad2(now.value.getSeconds()))

const WEEKDAYS = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六']
const weekday = computed(() => WEEKDAYS[now.value.getDay()])
const dateText = computed(() => {
  const d = now.value
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`
})

// 今日进度（0-100）
const dayProgress = computed(() => {
  const d = now.value
  const passed = d.getHours() * 3600 + d.getMinutes() * 60 + d.getSeconds()
  return Math.min(100, Math.round((passed / 86400) * 1000) / 10)
})

const greeting = computed(() => {
  const h = now.value.getHours()
  if (h < 5) return '夜深了 🌙'
  if (h < 9) return '早上好 ☀️'
  if (h < 12) return '上午好 🌤️'
  if (h < 14) return '中午好 🍜'
  if (h < 18) return '下午好 ☕'
  if (h < 22) return '晚上好 🌆'
  return '早点休息 🌛'
})

onMounted(() => {
  timer = setInterval(() => {
    now.value = new Date()
  }, 1000)
})

onBeforeUnmount(() => {
  if (timer) clearInterval(timer)
})
</script>

<style scoped>
.clock-main {
  display: flex;
  align-items: baseline;
  margin-top: 14px;
  font-variant-numeric: tabular-nums;
}
.clock-hm {
  font-size: 44px;
  font-weight: 700;
  line-height: 1;
  letter-spacing: 1px;
  background: linear-gradient(120deg, #ffffff 10%, #9ec5ff 60%, #c9a8ff 100%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  text-shadow: 0 0 28px rgba(110, 160, 255, 0.35);
}
.clock-sec {
  font-size: 20px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.45);
  margin-left: 2px;
}
.clock-date {
  margin-top: 8px;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.55);
}
.clock-progress {
  margin-top: 16px;
}
.clock-progress-bar {
  height: 4px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.08);
  overflow: hidden;
}
.clock-progress-bar span {
  display: block;
  height: 100%;
  border-radius: 999px;
  background: linear-gradient(90deg, #4f7cff, #b45cff);
  box-shadow: 0 0 12px rgba(120, 110, 255, 0.6);
  transition: width 0.8s ease;
}
.clock-progress-text {
  display: inline-block;
  margin-top: 7px;
  font-size: 11px;
  color: rgba(255, 255, 255, 0.35);
}
</style>

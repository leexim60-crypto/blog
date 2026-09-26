<template>
  <div class="widget-card widget-countdown">
    <div class="widget-head">
      <span class="widget-title"><el-icon><Calendar /></el-icon> 下一个节日</span>
      <span class="widget-badge">{{ next.name }}</span>
    </div>

    <div class="cd-main">
      <div class="cd-num">{{ next.days }}</div>
      <div class="cd-unit">
        <span>天后</span>
        <span class="cd-date">{{ next.date }}</span>
      </div>
    </div>

    <div class="cd-bar">
      <i :style="{ width: yearProgress + '%' }"></i>
    </div>
    <p class="cd-tip">今年已过 {{ yearProgress }}% · 距离 {{ next.name }} 还有 {{ next.days }} 天</p>

    <ul class="cd-list">
      <li v-for="item in upcoming" :key="item.name">
        <span>{{ item.name }}</span>
        <span class="cd-list-days">{{ item.days }} 天</span>
      </li>
    </ul>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

/* 固定公历节日；农历节日（春节/端午/中秋）按当年近似日期手工维护，
   只用于装饰展示，不追求精确历法。 */
const SOLAR = [
  { name: '元旦', month: 1, day: 1 },
  { name: '情人节', month: 2, day: 14 },
  { name: '劳动节', month: 5, day: 1 },
  { name: '儿童节', month: 6, day: 1 },
  { name: '国庆节', month: 10, day: 1 },
  { name: '圣诞节', month: 12, day: 25 }
]
const LUNAR_APPROX = {
  2026: [
    { name: '春节', month: 2, day: 17 },
    { name: '端午节', month: 6, day: 19 },
    { name: '中秋节', month: 9, day: 25 }
  ],
  2027: [
    { name: '春节', month: 2, day: 6 },
    { name: '端午节', month: 6, day: 9 },
    { name: '中秋节', month: 9, day: 15 }
  ]
}

const now = new Date()
const yearProgress = Math.round(
  ((now - new Date(now.getFullYear(), 0, 1)) / (new Date(now.getFullYear() + 1, 0, 1) - new Date(now.getFullYear(), 0, 1))) *
    100
)

function buildFestivals() {
  const y = now.getFullYear()
  const all = [...SOLAR, ...(LUNAR_APPROX[y] || [])]
  const list = []
  ;[y, y + 1].forEach((yy) => {
    all.forEach((f) => {
      const date = new Date(yy, f.month - 1, f.day)
      const days = Math.ceil((date - now) / 86400000)
      if (days >= 0) list.push({ name: f.name, date: `${yy}-${String(f.month).padStart(2, '0')}-${String(f.day).padStart(2, '0')}`, days })
    })
  })
  return list.sort((a, b) => a.days - b.days)
}

const festivals = ref([])
const next = computed(() => festivals.value[0] || { name: '元旦', days: 0, date: '' })
const upcoming = computed(() => festivals.value.slice(1, 4))

onMounted(() => {
  festivals.value = buildFestivals()
})
</script>

<style scoped>
.cd-main {
  display: flex;
  align-items: baseline;
  gap: 10px;
  margin-top: 12px;
}
.cd-num {
  font-size: 46px;
  font-weight: 800;
  line-height: 1;
  font-variant-numeric: tabular-nums;
  background: linear-gradient(120deg, #ffd479, #ff8a65 55%, #b45cff);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  text-shadow: 0 0 30px rgba(255, 160, 90, 0.28);
}
.cd-unit {
  display: flex;
  flex-direction: column;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.55);
}
.cd-date {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.3);
  margin-top: 2px;
}
.cd-bar {
  height: 4px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.08);
  overflow: hidden;
  margin-top: 14px;
}
.cd-bar i {
  display: block;
  height: 100%;
  border-radius: 999px;
  background: linear-gradient(90deg, #ffd479, #ff8a65);
  box-shadow: 0 0 12px rgba(255, 160, 90, 0.5);
  transition: width 0.8s ease;
}
.cd-tip {
  margin-top: 8px;
  font-size: 11px;
  color: rgba(255, 255, 255, 0.32);
}
.cd-list {
  margin-top: 12px;
  border-top: 1px solid rgba(255, 255, 255, 0.07);
  padding-top: 10px;
}
.cd-list li {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 5px 0;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
}
.cd-list-days {
  color: rgba(255, 255, 255, 0.35);
  font-variant-numeric: tabular-nums;
}
</style>

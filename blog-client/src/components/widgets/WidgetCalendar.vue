<template>
  <div class="widget-card widget-calendar">
    <div class="widget-head">
      <button class="widget-mini-btn" @click="shiftMonth(-1)"><el-icon><ArrowLeftBold /></el-icon></button>
      <span class="widget-title">{{ year }}年{{ month }}月</span>
      <button class="widget-mini-btn" @click="shiftMonth(1)"><el-icon><ArrowRightBold /></el-icon></button>
    </div>

    <div class="cal-week">
      <span v-for="w in ['日', '一', '二', '三', '四', '五', '六']" :key="w">{{ w }}</span>
    </div>

    <div class="cal-grid">
      <button
        v-for="(cell, i) in cells"
        :key="i"
        class="cal-cell"
        :class="{
          'is-blank': !cell.day,
          'is-today': cell.isToday,
          'is-selected': cell.isSelected,
          'is-weekend': cell.weekend
        }"
        :disabled="!cell.day"
        @click="cell.day && select(cell)"
      >
        {{ cell.day || '' }}
        <span v-if="cell.hasDiary" class="cal-dot"></span>
      </button>
    </div>

    <div class="cal-foot">
      <span class="cal-legend"><i class="cal-dot"></i> 当天有日记</span>
      <span v-if="selectedText" class="cal-selected">{{ selectedText }}</span>
    </div>

    <!-- 选中日期当天的日记（点击直接跳到日记详情） -->
    <ul v-if="selectedList.length" class="cal-diary-list">
      <li v-for="d in selectedList" :key="d.id">
        <router-link :to="'/diary/' + d.id">
          <el-icon><Notebook /></el-icon>
          <span class="cal-diary-title">{{ d.title || '无题日记' }}</span>
        </router-link>
      </li>
    </ul>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { fetchJson } from '../../utils/widgetFetch'

const today = new Date()
const year = ref(today.getFullYear())
const month = ref(today.getMonth() + 1)
const diaryByDate = ref({}) // { 'YYYY-MM-DD': [{ id, title }] }
const selected = ref('')

const selectedText = computed(() => (selected.value ? '已选 ' + selected.value : ''))
const selectedList = computed(() => diaryByDate.value[selected.value] || [])
const diaryDays = computed(() => new Set(Object.keys(diaryByDate.value)))

const cells = computed(() => {
  const first = new Date(year.value, month.value - 1, 1)
  const startWeekday = first.getDay()
  const daysInMonth = new Date(year.value, month.value, 0).getDate()
  const list = []

  for (let i = 0; i < startWeekday; i++) {
    list.push({ day: 0, weekend: false })
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year.value}-${String(month.value).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    const weekday = new Date(year.value, month.value - 1, d).getDay()
    list.push({
      day: d,
      date: dateStr,
      weekend: weekday === 0 || weekday === 6,
      isToday:
        year.value === today.getFullYear() &&
        month.value === today.getMonth() + 1 &&
        d === today.getDate(),
      isSelected: selected.value === dateStr,
      hasDiary: diaryDays.value.has(dateStr)
    })
  }
  return list
})

function shiftMonth(step) {
  let m = month.value + step
  let y = year.value
  if (m < 1) {
    m = 12
    y -= 1
  } else if (m > 12) {
    m = 1
    y += 1
  }
  month.value = m
  year.value = y
  fetchDiaryDays()
}

function select(cell) {
  selected.value = selected.value === cell.date ? '' : cell.date
}

// 拉取公开日记（用于日历打点 + 当天日记列表）
async function fetchDiaryDays() {
  try {
    // 用原生 fetch：后端休眠时静默降级，不弹全局错误提示
    const res = await fetchJson('/api/diaries?page=1&pageSize=50', { timeout: 15000 })
    const list = res?.data?.list || []
    const map = {}
    list.forEach((d) => {
      const key = String(d.diary_date || '').slice(0, 10)
      if (!key) return
      if (!map[key]) map[key] = []
      map[key].push({ id: d.id, title: d.title })
    })
    diaryByDate.value = map
  } catch (e) {
    // 后端不可用时日历照常显示，只是没有小圆点
  }
}

onMounted(fetchDiaryDays)
</script>

<style scoped>
.widget-calendar .widget-head {
  justify-content: space-between;
}
.cal-week {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  margin-top: 14px;
  font-size: 11px;
  color: rgba(255, 255, 255, 0.3);
  text-align: center;
}
.cal-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 2px;
  margin-top: 6px;
}
.cal-cell {
  position: relative;
  aspect-ratio: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: transparent;
  border-radius: 10px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.72);
  cursor: pointer;
  transition: all 0.2s;
  font-variant-numeric: tabular-nums;
}
.cal-cell:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
}
.cal-cell:disabled {
  cursor: default;
}
.cal-cell.is-weekend {
  color: rgba(255, 255, 255, 0.42);
}
.cal-cell.is-today {
  color: #fff;
  font-weight: 700;
  background: rgba(79, 124, 255, 0.22);
  border: 1px solid rgba(120, 160, 255, 0.5);
}
.cal-cell.is-selected {
  background: linear-gradient(135deg, #4f7cff, #b45cff);
  color: #fff;
  font-weight: 700;
}
.cal-dot {
  position: absolute;
  bottom: 4px;
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: #3ddc97;
  box-shadow: 0 0 6px #3ddc97;
}
.cal-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 12px;
  font-size: 11px;
  color: rgba(255, 255, 255, 0.3);
}
.cal-legend {
  display: inline-flex;
  align-items: center;
  gap: 5px;
}
.cal-legend .cal-dot {
  position: static;
}
.cal-selected {
  color: rgba(255, 255, 255, 0.55);
}
.cal-diary-list {
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid rgba(255, 255, 255, 0.07);
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.cal-diary-list a {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 7px 9px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.07);
  font-size: 12px;
  color: rgba(255, 255, 255, 0.7);
  transition: all 0.22s ease;
}
.cal-diary-list a:hover {
  background: rgba(79, 124, 255, 0.18);
  border-color: rgba(120, 160, 255, 0.4);
  color: #fff;
}
.cal-diary-title {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>

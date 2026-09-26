<template>
  <div class="widget-card widget-weather">
    <div class="widget-head">
      <span class="widget-title"><el-icon><Location /></el-icon> 当前天气</span>
      <span class="widget-badge">{{ city || '定位中…' }}</span>
    </div>

    <div v-if="loading" class="widget-skeleton">
      <el-icon class="is-loading" :size="22"><Loading /></el-icon>
      <span>正在获取天气…</span>
    </div>

    <div v-else-if="error" class="widget-skeleton">
      <el-icon :size="22"><Cloudy /></el-icon>
      <span class="flex-1">{{ error }}</span>
      <button class="widget-mini-btn" @click="load(true)">重试</button>
    </div>

    <template v-else>
      <div class="weather-main">
        <span class="weather-emoji">{{ info.emoji }}</span>
        <div>
          <div class="weather-temp">
            {{ temp }}<span class="weather-unit">°C</span>
          </div>
          <div class="weather-desc">{{ info.text }}</div>
        </div>
      </div>
      <div class="weather-extra">
        <span>体感 {{ feelsLike }}°</span>
        <span class="text-white/15">|</span>
        <span>湿度 {{ humidity }}%</span>
        <span class="text-white/15">|</span>
        <span>风 {{ wind }} km/h</span>
      </div>
      <div class="weather-range">
        <span>最低 {{ tempMin }}°</span>
        <span class="weather-range-bar"><i :style="rangeStyle"></i></span>
        <span>最高 {{ tempMax }}°</span>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { fetchJson, readCache, writeCache } from '../../utils/widgetFetch'

// 定位失败时的兜底城市
const FALLBACK = { city: '北京', latitude: 39.9042, longitude: 116.4074 }
const CACHE_KEY = 'widget_weather_v1'
const CACHE_TTL = 10 * 60 * 1000

const loading = ref(true)
const error = ref('')
const city = ref('')
const weather = ref(null)
const daily = ref(null)

// WMO 天气代码 → 文案 + emoji
const WMO = {
  0: ['晴', '☀️'],
  1: ['晴间多云', '🌤️'],
  2: ['多云', '⛅'],
  3: ['阴', '☁️'],
  45: ['有雾', '🌫️'],
  48: ['雾凇', '🌫️'],
  51: ['毛毛雨', '🌦️'],
  53: ['小雨', '🌦️'],
  55: ['中雨', '🌧️'],
  56: ['冻雨', '🌧️'],
  57: ['冻雨', '🌧️'],
  61: ['小雨', '🌧️'],
  63: ['中雨', '🌧️'],
  65: ['大雨', '🌧️'],
  66: ['冻雨', '🌧️'],
  67: ['冻雨', '🌧️'],
  71: ['小雪', '🌨️'],
  73: ['中雪', '🌨️'],
  75: ['大雪', '❄️'],
  77: ['雪粒', '🌨️'],
  80: ['阵雨', '🌦️'],
  81: ['阵雨', '🌧️'],
  82: ['暴雨', '⛈️'],
  85: ['阵雪', '🌨️'],
  86: ['阵雪', '❄️'],
  95: ['雷阵雨', '⛈️'],
  96: ['雷阵雨伴冰雹', '⛈️'],
  99: ['雷阵雨伴冰雹', '⛈️']
}

const info = computed(() => {
  const code = weather.value?.weather_code
  return WMO[code] || ['未知', '🌡️']
})

const temp = computed(() => Math.round(weather.value?.temperature_2m ?? 0))
const feelsLike = computed(() => Math.round(weather.value?.apparent_temperature ?? 0))
const humidity = computed(() => Math.round(weather.value?.relative_humidity_2m ?? 0))
const wind = computed(() => Math.round(weather.value?.wind_speed_10m ?? 0))
const tempMin = computed(() => Math.round(daily.value?.temperature_2m_min?.[0] ?? temp.value))
const tempMax = computed(() => Math.round(daily.value?.temperature_2m_max?.[0] ?? temp.value))

// 温度区间在整条轨道上的位置
const rangeStyle = computed(() => {
  const lo = Math.min(tempMin.value, temp.value)
  const hi = Math.max(tempMax.value, temp.value)
  const span = Math.max(1, tempMax.value - tempMin.value)
  const left = ((lo - tempMin.value) / span) * 100
  const width = Math.max(4, ((hi - lo) / span) * 100)
  return { left: left + '%', width: width + '%' }
})

async function locate() {
  try {
    const geo = await fetchJson('https://ipwho.is/', { timeout: 6000 })
    if (geo && geo.success && geo.latitude && geo.longitude) {
      return {
        city: geo.city || geo.region || geo.country || '',
        latitude: geo.latitude,
        longitude: geo.longitude
      }
    }
  } catch (e) {
    /* 定位接口不可用时走兜底 */
  }
  return FALLBACK
}

async function load(force = false) {
  loading.value = true
  error.value = ''

  if (!force) {
    const cached = readCache(CACHE_KEY, CACHE_TTL)
    if (cached) {
      city.value = cached.city
      weather.value = cached.weather
      daily.value = cached.daily
      loading.value = false
      return
    }
  }

  try {
    const place = await locate()
    city.value = place.city

    const url =
      'https://api.open-meteo.com/v1/forecast' +
      `?latitude=${place.latitude}&longitude=${place.longitude}` +
      '&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m' +
      '&daily=temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=1'

    const data = await fetchJson(url, { timeout: 9000 })
    weather.value = data.current
    daily.value = data.daily

    writeCache(CACHE_KEY, { city: city.value, weather: data.current, daily: data.daily })
  } catch (e) {
    error.value = '天气服务暂时不可用'
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>

<style scoped>
.weather-main {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-top: 12px;
}
.weather-emoji {
  font-size: 42px;
  line-height: 1;
  filter: drop-shadow(0 0 14px rgba(120, 180, 255, 0.45));
}
.weather-temp {
  font-size: 36px;
  font-weight: 700;
  line-height: 1.05;
  color: #fff;
  font-variant-numeric: tabular-nums;
}
.weather-unit {
  font-size: 16px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.5);
  margin-left: 2px;
}
.weather-desc {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.55);
  margin-top: 2px;
}
.weather-extra {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 14px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.45);
  flex-wrap: wrap;
}
.weather-range {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 10px;
  font-size: 11px;
  color: rgba(255, 255, 255, 0.4);
  font-variant-numeric: tabular-nums;
}
.weather-range-bar {
  position: relative;
  flex: 1;
  height: 4px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.08);
  overflow: hidden;
}
.weather-range-bar i {
  position: absolute;
  top: 0;
  height: 100%;
  border-radius: 999px;
  background: linear-gradient(90deg, #4fd1c5, #f6c453, #f4746a);
}
</style>

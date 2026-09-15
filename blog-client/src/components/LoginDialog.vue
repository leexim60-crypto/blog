<template>
  <Teleport to="body">
    <Transition name="portal">
      <div v-if="userStore.showLogin" class="login-portal" @click.self="close">
        <!-- 星门卡片 -->
        <div class="star-gate" :class="mode">
          <!-- 卡片内漂浮的星星 -->
          <span v-for="s in stars" :key="s.id" class="twinkle" :style="s.style"></span>

          <!-- 关闭按钮 -->
          <button class="close-btn" @click="close" aria-label="关闭">
            <el-icon><Close /></el-icon>
          </button>

          <!-- 头部 -->
          <div class="gate-header">
            <div class="gate-avatar" :key="mode">
              <span class="avatar-emoji">{{ mode === 'login' ? '🌙' : '🚀' }}</span>
            </div>
            <h2 class="gate-title">{{ mode === 'login' ? '欢迎回到星域' : '创建你的小星球' }}</h2>
            <p class="gate-tagline">{{ tagline }}</p>
          </div>

          <!-- 登录 / 注册 大 tab -->
          <div class="mode-tabs">
            <div class="tab-slider" :class="mode"></div>
            <button class="mode-tab" :class="{ active: mode === 'login' }" @click="mode = 'login'">
              <el-icon><User /></el-icon> 登录
            </button>
            <button class="mode-tab" :class="{ active: mode === 'register' }" @click="mode = 'register'">
              <el-icon><Plus /></el-icon> 注册
            </button>
          </div>

          <!-- 表单 -->
          <form class="gate-form" @submit.prevent="submit">
            <div class="field">
              <label class="field-label">
                <el-icon><User /></el-icon> {{ mode === 'login' ? '代号' : '你的专属代号' }}
              </label>
              <input
                v-model.trim="form.username"
                class="field-input"
                type="text"
                placeholder="3-50 个字符，将是你在这片星域的身份"
                autocomplete="username"
                maxlength="50"
              />
            </div>

            <div class="field">
              <label class="field-label">
                <el-icon><Lock /></el-icon> 密码
              </label>
              <input
                v-model="form.password"
                class="field-input"
                :type="showPwd ? 'text' : 'password'"
                placeholder="至少 6 位"
                :autocomplete="mode === 'login' ? 'current-password' : 'new-password'"
                @input="mode === 'register' && evaluateStrength()"
              />
              <button type="button" class="pwd-eye" @click="showPwd = !showPwd">
                {{ showPwd ? '🙈' : '👁️' }}
              </button>

              <!-- 注册时的密码强度条 -->
              <div v-if="mode === 'register' && form.password" class="strength">
                <div class="strength-bars">
                  <span v-for="i in 4" :key="i" class="bar" :class="[strength.level >= i ? strength.color : '']"></span>
                </div>
                <span class="strength-text" :class="strength.color">{{ strength.label }}</span>
              </div>
            </div>

            <div v-if="mode === 'register'" class="field">
              <label class="field-label">
                <el-icon><Postcard /></el-icon> 昵称 <span class="optional">选填</span>
              </label>
              <input
                v-model.trim="form.nickname"
                class="field-input"
                type="text"
                placeholder="别人怎么称呼你？（留空则用代号）"
                maxlength="30"
              />
            </div>

            <!-- 大按钮 -->
            <button class="gate-btn" type="submit" :disabled="loading">
              <span v-if="!loading">
                {{ mode === 'login' ? '✨ 进入星域' : '🌟 发射，登录我的星球' }}
              </span>
              <span v-else class="launching">
                <span class="spinner"></span>
                {{ mode === 'login' ? '正在穿越星门…' : '正在点燃引擎…' }}
              </span>
            </button>
          </form>

          <p class="gate-foot">
            {{ mode === 'login'
              ? '第一次来？点上面的「注册」种下你的第一颗星 🌱'
              : '已有账号？点「登录」直接回到星域 🌌' }}
          </p>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { reactive, ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { ElMessage } from 'element-plus'
import { User, Lock, Postcard, Plus, Close } from '@element-plus/icons-vue'
import { useUserStore } from '../stores/user'

const userStore = useUserStore()
const mode = ref('login')
const loading = ref(false)
const showPwd = ref(false)
const form = reactive({ username: '', password: '', nickname: '' })

/* ---------- 趣味文案 ---------- */
const loginTaglines = [
  '今晚的星星很亮，写点什么吧',
  '你的日记本有点想你了',
  '宇宙再大，也要有人听你说',
  '回来啦？星光都为你亮着',
  '流星划过时，记得许个愿'
]
const registerTaglines = [
  '每颗星星都值得被看见',
  '在这里种下你的第一篇日记',
  '欢迎登船，新宇航员',
  '这片星空还缺一颗——你的',
  '从今天起，写点只属于你的宇宙'
]
const tagline = ref('')
function rollTagline() {
  const pool = mode.value === 'login' ? loginTaglines : registerTaglines
  let next = tagline.value
  while (next === tagline.value && pool.length > 1) {
    next = pool[Math.floor(Math.random() * pool.length)]
  }
  tagline.value = next
}
watch(mode, rollTagline)

/* ---------- 密码强度 ---------- */
const strength = reactive({ level: 0, label: '', color: '' })
const STRENGTH_LEVELS = [
  { label: '', color: '' },
  { label: '脆弱不堪 😢', color: 'lv1' },
  { label: '勉强能看 😐', color: 'lv2' },
  { label: '固若金汤 💪', color: 'lv3' },
  { label: '坚不可摧 🛡️', color: 'lv4' }
]
function evaluateStrength() {
  const pwd = form.password
  let score = 0
  if (pwd.length >= 6) score++
  if (pwd.length >= 10) score++
  if (/[a-zA-Z]/.test(pwd) && /\d/.test(pwd)) score++
  if (/[^a-zA-Z0-9]/.test(pwd) && pwd.length >= 8) score++
  strength.level = Math.min(score, 4)
  strength.label = STRENGTH_LEVELS[strength.level].label
  strength.color = STRENGTH_LEVELS[strength.level].color
}

/* ---------- 卡片内漂浮星星 ---------- */
const stars = computed(() =>
  Array.from({ length: 14 }, (_, i) => ({
    id: i,
    style: {
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      animationDelay: `${Math.random() * 4}s`,
      animationDuration: `${2 + Math.random() * 3}s`,
      transform: `scale(${0.5 + Math.random()})`
    }
  }))
)

/* ---------- 开关 & 提交 ---------- */
function close() {
  userStore.showLogin = false
}

function resetForm() {
  form.username = ''
  form.password = ''
  form.nickname = ''
  showPwd.value = false
  strength.level = 0
  strength.label = ''
  strength.color = ''
  mode.value = 'login'
}

watch(() => userStore.showLogin, v => {
  if (v) rollTagline()
  else resetForm()
})

function onKeydown(e) {
  if (e.key === 'Escape' && userStore.showLogin) close()
}
onMounted(() => window.addEventListener('keydown', onKeydown))
onUnmounted(() => window.removeEventListener('keydown', onKeydown))

async function submit() {
  if (!form.username || !form.password) {
    ElMessage.warning('代号和密码都要填上才能穿越星门哦')
    return
  }
  loading.value = true
  try {
    if (mode.value === 'login') {
      await userStore.login(form.username, form.password)
      ElMessage.success('穿越成功，欢迎回来 🌟')
    } else {
      if (form.password.length < 6) {
        ElMessage.warning('密码至少 6 位，别让星星一眼看穿')
        return
      }
      if (form.username.length < 3) {
        ElMessage.warning('代号至少 3 个字符')
        return
      }
      await userStore.register(form.username, form.password, form.nickname)
      ElMessage.success('发射成功，你的星球已就位 🚀')
    }
    userStore.showLogin = false
  } catch {
    /* 错误已在拦截器中统一提示 */
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
/* ===== 蒙层 & 进出场动画 ===== */
.login-portal {
  position: fixed;
  inset: 0;
  z-index: 3000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background: rgba(2, 6, 16, 0.72);
  backdrop-filter: blur(10px);
}
.portal-enter-active,
.portal-leave-active { transition: opacity 0.3s ease; }
.portal-enter-from,
.portal-leave-to { opacity: 0; }
.portal-enter-active .star-gate {
  animation: gate-pop 0.45s cubic-bezier(0.34, 1.56, 0.64, 1);
}
@keyframes gate-pop {
  0% { transform: scale(0.8) translateY(30px); opacity: 0; }
  100% { transform: scale(1) translateY(0); opacity: 1; }
}

/* ===== 星门卡片本体 ===== */
.star-gate {
  position: relative;
  width: 420px;
  max-width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  padding: 36px 32px 28px;
  border-radius: 24px;
  background: linear-gradient(160deg, #0b1e3a 0%, #0a1428 55%, #0d1030 100%);
  border: 1px solid rgba(120, 160, 255, 0.25);
  box-shadow:
    0 0 0 1px rgba(255, 255, 255, 0.03) inset,
    0 0 45px rgba(80, 130, 255, 0.18),
    0 25px 60px rgba(0, 0, 0, 0.55);
  overflow-x: hidden;
}
/* 登录 = 蓝紫极光，注册 = 粉紫极光 */
.star-gate::before {
  content: '';
  position: absolute;
  top: -60%;
  left: -30%;
  width: 90%;
  height: 130%;
  border-radius: 50%;
  background: radial-gradient(closest-side, rgba(99, 140, 255, 0.28), transparent 70%);
  pointer-events: none;
  transition: background 0.5s;
}
.star-gate.register::before {
  background: radial-gradient(closest-side, rgba(200, 120, 255, 0.3), transparent 70%);
  left: 40%;
}

/* 卡片内的星星 */
.twinkle {
  position: absolute;
  width: 3px;
  height: 3px;
  border-radius: 50%;
  background: #fff;
  opacity: 0;
  animation: twinkle linear infinite;
  pointer-events: none;
}
@keyframes twinkle {
  0%, 100% { opacity: 0; }
  50% { opacity: 0.9; box-shadow: 0 0 6px #fff; }
}

.close-btn {
  position: absolute;
  top: 14px;
  right: 14px;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  border: none;
  background: rgba(255, 255, 255, 0.08);
  color: rgba(255, 255, 255, 0.7);
  cursor: pointer;
  transition: all 0.2s;
  z-index: 2;
}
.close-btn:hover {
  background: rgba(255, 255, 255, 0.18);
  color: #fff;
  transform: rotate(90deg);
}

/* ===== 头部 ===== */
.gate-header { text-align: center; position: relative; z-index: 1; }
.gate-avatar {
  width: 76px;
  height: 76px;
  margin: 0 auto 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: linear-gradient(135deg, rgba(99, 140, 255, 0.25), rgba(200, 120, 255, 0.25));
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 0 25px rgba(120, 150, 255, 0.35);
  animation: float 3.5s ease-in-out infinite;
}
@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-7px); }
}
.avatar-emoji { font-size: 38px; line-height: 1; }
.gate-title {
  font-size: 22px;
  font-weight: 700;
  color: #fff;
  letter-spacing: 1px;
  background: linear-gradient(90deg, #a5c4ff, #d8b4fe, #a5c4ff);
  background-size: 200% auto;
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  animation: shimmer 4s linear infinite;
}
@keyframes shimmer {
  to { background-position: 200% center; }
}
.gate-tagline {
  margin-top: 6px;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.55);
  min-height: 1.4em;
}

/* ===== 大 Tab ===== */
.mode-tabs {
  position: relative;
  display: grid;
  grid-template-columns: 1fr 1fr;
  margin: 22px 0 20px;
  padding: 5px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.07);
  border: 1px solid rgba(255, 255, 255, 0.1);
  z-index: 1;
}
.tab-slider {
  position: absolute;
  top: 5px;
  left: 5px;
  width: calc(50% - 5px);
  height: calc(100% - 10px);
  border-radius: 10px;
  background: linear-gradient(135deg, #4f7cff, #7c5cff);
  box-shadow: 0 4px 15px rgba(90, 110, 255, 0.45);
  transition: transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.tab-slider.register { transform: translateX(100%); }
.mode-tab {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  padding: 10px 0;
  border: none;
  background: transparent;
  border-radius: 10px;
  font-size: 15px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.55);
  cursor: pointer;
  transition: color 0.25s;
}
.mode-tab.active { color: #fff; }

/* ===== 表单 ===== */
.gate-form { display: flex; flex-direction: column; gap: 16px; position: relative; z-index: 1; }
.field { position: relative; }
.field-label {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 7px;
  font-weight: 500;
}
.optional {
  font-size: 11px;
  padding: 1px 7px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.5);
}
.field-input {
  width: 100%;
  padding: 13px 44px 13px 42px;
  border-radius: 13px;
  border: 1px solid rgba(255, 255, 255, 0.15);
  background: rgba(255, 255, 255, 0.06);
  color: #fff;
  font-size: 14px;
  outline: none;
  transition: all 0.25s;
  background-image: none;
}
.field-input:focus {
  border-color: rgba(120, 150, 255, 0.7);
  background: rgba(255, 255, 255, 0.09);
  box-shadow: 0 0 0 3px rgba(90, 120, 255, 0.18), 0 0 18px rgba(90, 120, 255, 0.15);
}
.field-input::placeholder { color: rgba(255, 255, 255, 0.32); }

/* 输入框左侧 emoji 图标 */
.field-label :deep(.el-icon) { font-size: 14px; color: rgba(165, 196, 255, 0.8); }

/* 密码可见切换 */
.pwd-eye {
  position: absolute;
  right: 12px;
  bottom: 11px;
  border: none;
  background: transparent;
  font-size: 16px;
  cursor: pointer;
  opacity: 0.6;
  transition: opacity 0.2s, transform 0.2s;
}
.pwd-eye:hover { opacity: 1; transform: scale(1.15); }

/* 密码强度条 */
.strength { display: flex; align-items: center; gap: 10px; margin-top: 9px; }
.strength-bars { display: flex; gap: 5px; flex: 1; }
.strength .bar {
  flex: 1;
  height: 4px;
  border-radius: 2px;
  background: rgba(255, 255, 255, 0.12);
  transition: background 0.3s;
}
.strength .bar.lv1 { background: #f87171; box-shadow: 0 0 6px rgba(248, 113, 113, 0.6); }
.strength .bar.lv2 { background: #fbbf24; box-shadow: 0 0 6px rgba(251, 191, 36, 0.6); }
.strength .bar.lv3 { background: #34d399; box-shadow: 0 0 6px rgba(52, 211, 153, 0.6); }
.strength .bar.lv4 { background: #38bdf8; box-shadow: 0 0 8px rgba(56, 189, 248, 0.8); }
.strength-text { font-size: 11px; white-space: nowrap; }
.strength-text.lv1 { color: #f87171; }
.strength-text.lv2 { color: #fbbf24; }
.strength-text.lv3 { color: #34d399; }
.strength-text.lv4 { color: #38bdf8; }

/* ===== 主按钮 ===== */
.gate-btn {
  position: relative;
  overflow: hidden;
  margin-top: 4px;
  padding: 14px;
  border: none;
  border-radius: 14px;
  font-size: 16px;
  font-weight: 700;
  letter-spacing: 1px;
  color: #fff;
  cursor: pointer;
  background: linear-gradient(135deg, #4f7cff 0%, #7c5cff 60%, #b45cff 130%);
  background-size: 150% auto;
  box-shadow: 0 8px 22px rgba(90, 110, 255, 0.4);
  transition: transform 0.2s, box-shadow 0.25s, background-position 0.4s;
}
.gate-btn:hover:not(:disabled) {
  transform: translateY(-2px) scale(1.02);
  background-position: right center;
  box-shadow: 0 12px 30px rgba(120, 110, 255, 0.55);
}
.gate-btn:active:not(:disabled) { transform: scale(0.98); }
.gate-btn:disabled { opacity: 0.75; cursor: wait; }
/* 悬停扫光 */
.gate-btn::after {
  content: '';
  position: absolute;
  top: 0;
  left: -80%;
  width: 50%;
  height: 100%;
  background: linear-gradient(105deg, transparent, rgba(255, 255, 255, 0.35), transparent);
  transform: skewX(-20deg);
  transition: left 0.6s;
}
.gate-btn:hover::after { left: 130%; }

.launching { display: flex; align-items: center; justify-content: center; gap: 9px; }
.spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.35);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* ===== 底部提示 ===== */
.gate-foot {
  position: relative;
  z-index: 1;
  margin-top: 18px;
  text-align: center;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.42);
}

@media (max-width: 480px) {
  .star-gate { padding: 28px 20px 22px; }
}
</style>

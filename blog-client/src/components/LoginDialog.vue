<template>
  <el-dialog
    :model-value="userStore.showLogin"
    title="登录"
    width="400px"
    class="login-dialog"
    @update:model-value="v => (userStore.showLogin = v)"
    @closed="resetForm"
  >
    <div class="flex flex-col gap-4">
      <el-input v-model="form.username" placeholder="用户名" size="large" :prefix-icon="User" />
      <el-input
        v-model="form.password"
        type="password"
        placeholder="密码"
        size="large"
        :prefix-icon="Lock"
        show-password
        @keyup.enter="submit"
      />
      <el-input
        v-if="mode === 'register'"
        v-model="form.nickname"
        placeholder="昵称（选填）"
        size="large"
        :prefix-icon="Postcard"
      />

      <el-button type="primary" size="large" :loading="loading" @click="submit">
        {{ mode === 'login' ? '登录' : '注册并登录' }}
      </el-button>

      <div class="text-center text-sm text-white/50 cursor-pointer hover:text-white/80" @click="toggleMode">
        {{ mode === 'login' ? '没有账号？注册一个' : '已有账号？直接登录' }}
      </div>
    </div>
  </el-dialog>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { User, Lock, Postcard } from '@element-plus/icons-vue'
import { useUserStore } from '../stores/user'

const userStore = useUserStore()
const mode = ref('login')
const loading = ref(false)
const form = reactive({ username: '', password: '', nickname: '' })

function toggleMode() {
  mode.value = mode.value === 'login' ? 'register' : 'login'
}

function resetForm() {
  form.username = ''
  form.password = ''
  form.nickname = ''
  mode.value = 'login'
}

async function submit() {
  if (!form.username || !form.password) {
    ElMessage.warning('请输入用户名和密码')
    return
  }
  loading.value = true
  try {
    if (mode.value === 'login') {
      await userStore.login(form.username, form.password)
      ElMessage.success('登录成功')
    } else {
      if (form.password.length < 6) {
        ElMessage.warning('密码不能少于6位')
        return
      }
      await userStore.register(form.username, form.password, form.nickname)
      ElMessage.success('注册成功')
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
:deep(.el-input__wrapper) {
  background: rgba(255, 255, 255, 0.06);
  box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.15) inset;
}

:deep(.el-input__inner) {
  color: #fff;
}

:deep(.el-input__inner::placeholder) {
  color: rgba(255, 255, 255, 0.35);
}
</style>

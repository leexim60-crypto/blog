<template>
  <div class="flex justify-center items-center min-h-[calc(100vh-64px-120px)] px-5 py-5">
    <div class="card w-full max-w-md p-10 rounded-2xl">
      <div class="text-center mb-8">
        <div class="w-18 h-18 rounded-full bg-gradient-to-br from-rose-100 to-amber-100 text-primary-600 flex items-center justify-center mx-auto mb-4">
          <el-icon :size="36"><Monitor /></el-icon>
        </div>
        <h2 class="text-xl font-bold text-stone-800 mb-2">{{ isRegister ? '注册账户' : '欢迎回来' }}</h2>
        <p class="text-sm text-stone-400">{{ isRegister ? '创建一个新账户' : '登录你的博客账户' }}</p>
      </div>

      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        size="large"
        @submit.prevent="handleSubmit"
      >
        <el-form-item prop="username">
          <el-input
            v-model="form.username"
            placeholder="用户名"
            :prefix-icon="User"
          />
        </el-form-item>

        <el-form-item v-if="isRegister" prop="nickname">
          <el-input
            v-model="form.nickname"
            placeholder="昵称（选填）"
            :prefix-icon="UserFilled"
          />
        </el-form-item>

        <el-form-item prop="password">
          <el-input
            v-model="form.password"
            type="password"
            placeholder="密码"
            :prefix-icon="Lock"
            show-password
          />
        </el-form-item>

        <el-form-item v-if="isRegister" prop="confirmPassword">
          <el-input
            v-model="form.confirmPassword"
            type="password"
            placeholder="确认密码"
            :prefix-icon="Lock"
            show-password
          />
        </el-form-item>

        <el-form-item>
          <el-button
            type="primary"
            :loading="loading"
            @click="handleSubmit"
            class="w-full !rounded-xl !h-11"
          >
            {{ isRegister ? '注册' : '登录' }}
          </el-button>
        </el-form-item>
      </el-form>

      <div class="text-center text-sm text-stone-400">
        <span>{{ isRegister ? '已有账户？' : '没有账户？' }}</span>
        <a @click="toggleMode" class="text-primary-600 cursor-pointer ml-1 hover:underline">{{ isRegister ? '立即登录' : '立即注册' }}</a>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { User, UserFilled, Lock } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import api from '../api'

const router = useRouter()
const authStore = useAuthStore()
const formRef = ref()
const loading = ref(false)
const isRegister = ref(false)

const form = reactive({
  username: '',
  password: '',
  nickname: '',
  confirmPassword: ''
})

const rules = computed(() => ({
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 50, message: '用户名长度在3-50个字符之间', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能少于6个字符', trigger: 'blur' }
  ],
  confirmPassword: isRegister.value ? [
    { required: true, message: '请再次输入密码', trigger: 'blur' },
    {
      validator: (rule, value, callback) => {
        if (value !== form.password) {
          callback(new Error('两次输入的密码不一致'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ] : []
}))

function toggleMode() {
  isRegister.value = !isRegister.value
  form.confirmPassword = ''
  formRef.value?.clearValidate()
}

async function handleSubmit() {
  try {
    await formRef.value.validate()
  } catch {
    return
  }

  loading.value = true
  try {
    const endpoint = isRegister.value ? '/auth/register' : '/auth/login'
    const payload = {
      username: form.username,
      password: form.password
    }
    if (isRegister.value && form.nickname) {
      payload.nickname = form.nickname
    }

    const res = await api.post(endpoint, payload)
    if (res.code === 200) {
      authStore.setAuth(res.data.token, res.data.user)
      ElMessage.success(isRegister.value ? '注册成功！' : '登录成功！')
      router.push('/')
    } else {
      ElMessage.error(res.message || '操作失败')
    }
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
:deep(.el-input__wrapper) {
  @apply rounded-xl;
}
</style>

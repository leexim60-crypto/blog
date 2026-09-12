<template>
  <div class="flex justify-center items-center min-h-[calc(100vh-64px-100px)] px-5">
    <div class="text-center max-w-sm p-10 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
      <div class="text-white/30 mb-4">
        <el-icon :size="64"><Warning /></el-icon>
      </div>
      <h1 class="text-6xl font-bold text-white mb-2">404</h1>
      <p class="text-base text-white/50 mb-6">抱歉，你访问的页面不存在</p>
      <el-button type="primary" @click="router.push('/')">
        <el-icon><HomeFilled /></el-icon> 返回首页
      </el-button>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()
</script>

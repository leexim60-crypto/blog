<template>
  <div class="flex justify-center items-center min-h-[calc(100vh-64px-120px)] px-5">
    <div class="card text-center p-14 rounded-2xl max-w-sm">
      <div class="text-stone-300 mb-4">
        <el-icon :size="64"><Warning /></el-icon>
      </div>
      <h1 class="text-6xl font-bold text-stone-800 mb-2">404</h1>
      <p class="text-base text-stone-400 mb-6">抱歉，你访问的页面不存在</p>
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

<template>
  <div class="about max-w-2xl mx-auto px-5">
    <div class="card p-10 rounded-2xl">
      <!-- 头像区域 -->
      <div class="text-center mb-10 pb-8 border-b-2 border-stone-100">
        <div class="w-24 h-24 rounded-full bg-gradient-to-br from-rose-100 to-amber-100 text-primary-600 flex items-center justify-center mx-auto mb-4">
          <el-icon :size="48"><User /></el-icon>
        </div>
        <h1 class="text-2xl font-bold text-stone-800 mb-2">前端工程师</h1>
        <p class="text-base text-stone-400">热爱技术，热爱生活</p>
      </div>

      <!-- 关于我 -->
      <div class="info-section">
        <h2 class="section-title">关于我</h2>
        <p>一名专注于前端开发的工程师，喜欢探索新技术，享受用代码解决问题的过程。</p>
        <p>这个博客用来记录我的技术学习、面试准备和成长感悟。</p>

        <!-- 技术栈 -->
        <h2 class="section-title">技术栈</h2>
        <div class="grid grid-cols-3 md:grid-cols-4 gap-4">
          <div
            v-for="tech in techs"
            :key="tech.name"
            class="flex flex-col items-center gap-2 py-4 px-2 rounded-xl bg-stone-50 hover:-translate-y-1 transition-transform duration-200 cursor-default"
          >
            <div class="w-11 h-11 rounded-lg text-white flex items-center justify-center text-xl" :style="{ background: tech.color }">
              <el-icon><component :is="tech.icon" /></el-icon>
            </div>
            <span class="text-xs font-medium text-stone-600">{{ tech.name }}</span>
          </div>
        </div>

        <!-- 博客板块 -->
        <h2 class="section-title">博客板块</h2>
        <div class="flex flex-col gap-4">
          <div class="flex gap-4 items-start p-4 rounded-xl bg-stone-50">
            <el-icon :size="24" class="text-primary-500 mt-0.5"><Monitor /></el-icon>
            <div>
              <h3 class="text-base font-semibold text-stone-800 mb-1">代码</h3>
              <p class="text-xs text-stone-400 !m-0">编程技术分享、代码片段、项目实战经验</p>
            </div>
          </div>
          <div class="flex gap-4 items-start p-4 rounded-xl bg-stone-50">
            <el-icon :size="24" class="text-amber-500 mt-0.5"><Document /></el-icon>
            <div>
              <h3 class="text-base font-semibold text-stone-800 mb-1">面试八股</h3>
              <p class="text-xs text-stone-400 !m-0">前端面试题、八股文整理、高频考点解析</p>
            </div>
          </div>
          <div class="flex gap-4 items-start p-4 rounded-xl bg-stone-50">
            <el-icon :size="24" class="text-emerald-500 mt-0.5"><Star /></el-icon>
            <div>
              <h3 class="text-base font-semibold text-stone-800 mb-1">感悟</h3>
              <p class="text-xs text-stone-400 !m-0">技术感悟、成长心得、生活随想</p>
            </div>
          </div>
        </div>

        <!-- 联系方式 -->
        <h2 class="section-title">联系方式</h2>
        <div class="flex flex-col gap-2 text-stone-500">
          <p class="flex items-center gap-2"><el-icon><Message /></el-icon> 邮箱：developer@example.com</p>
          <p class="flex items-center gap-2"><el-icon><Link /></el-icon> GitHub：github.com/developer</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const techs = [
  { name: 'Vue.js', icon: 'Monitor', color: '#42b883' },
  { name: 'React', icon: 'Monitor', color: '#61dafb' },
  { name: 'JavaScript', icon: 'Document', color: '#f7df1e' },
  { name: 'TypeScript', icon: 'Document', color: '#3178c6' },
  { name: 'Node.js', icon: 'Connection', color: '#68a063' },
  { name: 'CSS3', icon: 'Brush', color: '#264de4' },
  { name: 'Webpack', icon: 'Box', color: '#8dd6f9' },
  { name: 'Git', icon: 'FolderOpened', color: '#f05032' }
]
</script>

<style scoped>
.section-title {
  @apply text-lg font-bold mt-7 mb-4 pb-2 border-b border-stone-200 text-stone-800;
}
.info-section p {
  @apply text-stone-500 leading-loose mb-2;
}
</style>

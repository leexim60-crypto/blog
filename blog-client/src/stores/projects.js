import { defineStore } from 'pinia'
import { ref } from 'vue'

/* =========================================================
 * 我的项目列表（部署上线的网址都写在这里）
 * 首页横幅和顶栏「我的项目」共用这一份数据
 * 添加项目：复制一段 { ... } 改 name / url / desc 即可
 * icon 可用 Element Plus 图标名：Monitor、Reading、Link、
 *   ChatDotRound、ShoppingCart、VideoPlay、Picture 等
 * ========================================================= */
export const useProjectsStore = defineStore('projects', () => {
  const showDrawer = ref(false)

  const projects = ref([
    {
      name: '英语学习网',
      url: 'https://english-mauve-seven.vercel.app',
      desc: 'React + Vite 英语学习网站：单词卡片、每日一句、单词测验、生词本',
      icon: 'Reading',
      color: '#409eff'
    },
    {
      name: '个人博客',
      url: 'https://leexim60-blog.vercel.app',
      desc: '本站 · Vue 3 + Element Plus + Node.js + MySQL 全栈博客',
      icon: 'Monitor',
      color: '#42b883'
    },
    {
      name: '博客后端 API',
      url: 'https://blog-server-leexim60.onrender.com/api/health',
      desc: 'Render 部署的 Node.js 接口服务（健康检查地址）',
      icon: 'Connection',
      color: '#68a063'
    }
  ])

  function open() {
    showDrawer.value = true
  }

  return { showDrawer, projects, open }
})

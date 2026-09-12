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
    }
    // 在下面继续添加你的项目，例如：
    // {
    //   name: '低代码搭建平台',
    //   url: 'https://xxx.vercel.app',
    //   desc: '拖拽搭建页面，一键导出 Vue 3 代码',
    //   icon: 'SetUp',
    //   color: '#409eff'
    // }
  ])

  function open() {
    showDrawer.value = true
  }

  return { showDrawer, projects, open }
})

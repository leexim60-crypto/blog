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
      name: '坦克大战 Battle City',
      url: 'https://tank-battle-3s4.pages.dev',
      desc: '红白机坦克大战复刻：Canvas 像素渲染、敌方 AI、基地防守、手机虚拟手柄，支持 PWA 离线安装',
      icon: 'Aim',
      color: '#e45c10'
    },
    {
      name: '英语学习网',
      url: 'https://english-mauve-seven.vercel.app',
      desc: 'React + Vite 英语学习网站：单词卡片、每日一句、单词测验、生词本',
      icon: 'Reading',
      color: '#409eff'
    }
  ])

  function open() {
    showDrawer.value = true
  }

  return { showDrawer, projects, open }
})

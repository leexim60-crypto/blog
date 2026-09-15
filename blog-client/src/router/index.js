import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import('../views/Home.vue')
  },
  {
    path: '/diary',
    name: 'DiaryList',
    component: () => import('../views/DiaryList.vue')
  },
  {
    path: '/diary/new',
    name: 'DiaryNew',
    component: () => import('../views/DiaryEdit.vue')
  },
  {
    path: '/diary/edit/:id',
    name: 'DiaryEdit',
    component: () => import('../views/DiaryEdit.vue')
  },
  {
    path: '/diary/:id',
    name: 'DiaryDetail',
    component: () => import('../views/DiaryDetail.vue')
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('../views/NotFound.vue')
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior() {
    return { top: 0 }
  }
})

export default router

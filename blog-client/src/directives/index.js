/**
 * 全站共用的「进入视口」与「鼠标跟随高光」指令。
 *
 * 为什么不写在每个组件里：
 * 滚动揭示需要复用同一个 IntersectionObserver（几十个元素各建一个
 * observer 会明显掉帧），而且 reduced-motion 的降级逻辑只应该写一次。
 */

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

let observer = null

function getObserver() {
  if (observer) return observer
  observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue
        entry.target.classList.add('is-in')
        // 一次性动效，进入后即停止观察，避免来回滚动反复触发
        observer.unobserve(entry.target)
      }
    },
    { rootMargin: '0px 0px -8% 0px', threshold: 0.08 }
  )
  return observer
}

/**
 * v-reveal="120"   —— 数字为延迟毫秒，做「依次浮现」的错峰
 * v-reveal         —— 立即
 */
export const vReveal = {
  mounted(el, binding) {
    el.classList.add('reveal')
    if (binding.value) {
      el.style.setProperty('--reveal-delay', `${binding.value}ms`)
    }
    if (prefersReducedMotion()) {
      el.classList.add('is-in')
      return
    }
    getObserver().observe(el)
  },
  unmounted(el) {
    if (observer) observer.unobserve(el)
  }
}

/**
 * v-spotlight —— 卡片上的极光高光跟随指针。
 * 只写 CSS 变量，实际绘制交给 .spotlight::after，避免频繁改样式表。
 */
export const vSpotlight = {
  mounted(el) {
    el.classList.add('spotlight')
    if (prefersReducedMotion()) return

    const onMove = (e) => {
      const rect = el.getBoundingClientRect()
      el.style.setProperty('--mx', `${e.clientX - rect.left}px`)
      el.style.setProperty('--my', `${e.clientY - rect.top}px`)
    }
    el.addEventListener('pointermove', onMove, { passive: true })
    el.__spotlightOff = () => el.removeEventListener('pointermove', onMove)
  },
  unmounted(el) {
    el.__spotlightOff?.()
  }
}

/** 供 main.js 一次性注册 */
export function installDirectives(app) {
  app.directive('reveal', vReveal)
  app.directive('spotlight', vSpotlight)
}

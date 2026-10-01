import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
// 完整中文语言包：包含日期选择器、分页等全部组件文案
// （之前用只含 pagination 的自定义对象覆盖 locale，导致日期选择器文案全部变成 undefined）
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import App from './App.vue'
import router from './router'
import { installDirectives } from './directives'
import { installIcons } from './icons'
import './assets/style.css'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)
app.use(ElementPlus, { locale: zhCn })

installDirectives(app)
// 按需注册图标（见 icons.js）：只装实际用到的 46 个，而不是全部 293 个
installIcons(app)

app.mount('#app')

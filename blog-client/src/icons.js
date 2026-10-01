/**
 * 按需注册 Element Plus 图标
 * ------------------------------------------------------------------
 * 之前是 `for (const [key, component] of Object.entries(ElementPlusIconsVue))`
 * 把全部 293 个图标都注册进全局 —— 实测其中只有 46 个被用到，
 * 剩下 247 个（以及它们引用的图标定义）白白进了首包。
 *
 * 这里改为显式白名单：新增图标时把名字加进 ICONS 即可，
 * 模板里仍然用 <el-icon><Grid /></el-icon> 这种全局写法，无需改动业务代码。
 *
 * 注意：项目列表（stores/projects.js）里的 icon 字段也走这里解析，
 * 所以新增项目用到的图标必须同时存在于 ICONS 中。
 */
import {
  Aim,
  ArrowDown,
  ArrowLeft,
  ArrowLeftBold,
  ArrowRightBold,
  Bell,
  Calendar,
  ChatDotRound,
  Clock,
  Close,
  Cloudy,
  CopyDocument,
  Delete,
  Download,
  Edit,
  EditPen,
  Fold,
  Grid,
  Headset,
  Histogram,
  HomeFilled,
  InfoFilled,
  Link,
  Loading,
  Location,
  Lock,
  MagicStick,
  Mute,
  Notebook,
  Picture,
  Plus,
  Postcard,
  Promotion,
  Reading,
  Refresh,
  Right,
  Search,
  Select,
  Setting,
  SwitchButton,
  Top,
  TopRight,
  User,
  VideoPause,
  VideoPlay,
  View
} from '@element-plus/icons-vue'

const ICONS = {
  Aim,
  ArrowDown,
  ArrowLeft,
  ArrowLeftBold,
  ArrowRightBold,
  Bell,
  Calendar,
  ChatDotRound,
  Clock,
  Close,
  Cloudy,
  CopyDocument,
  Delete,
  Download,
  Edit,
  EditPen,
  Fold,
  Grid,
  Headset,
  Histogram,
  HomeFilled,
  InfoFilled,
  Link,
  Loading,
  Location,
  Lock,
  MagicStick,
  Mute,
  Notebook,
  Picture,
  Plus,
  Postcard,
  Promotion,
  Reading,
  Refresh,
  Right,
  Search,
  Select,
  Setting,
  SwitchButton,
  Top,
  TopRight,
  User,
  VideoPause,
  VideoPlay,
  View
}

export function installIcons(app) {
  for (const [name, component] of Object.entries(ICONS)) {
    app.component(name, component)
  }
}

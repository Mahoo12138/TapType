# Phase 4 前端开发日志

**日期：** 2026-03-19  
**状态：** ✅ 已完成

---

## 概览

实现了 Phase 4 前端全部功能：目标设置页面、成就展示页面、成就解锁弹窗、用户设置页面、仪表盘目标进度概览、以及移动端响应式侧边栏。

---

## 完成内容

### 1. API 类型 & Hooks

- `types/api.ts` 新增 3 个接口类型：
  - `UserGoal` — 用户目标（goal_type / target_value / current_value / period / is_active）
  - `Achievement` — 成就定义（key / name / description / icon / condition / unlocked / unlocked_at）
  - `CompleteResult` — 练习完成返回（result + new_achievements）
- `api/goals.ts` — 目标 CRUD hooks：`useGoals`, `useCreateGoal`, `useUpdateGoal`, `useDeleteGoal`
- `api/achievements.ts` — 成就列表 hook：`useAchievements`
- `api/practice.ts` — `useCompletePractice` 升级：返回 `CompleteResult`，成功后自动 invalidate achievements + goals 缓存

### 2. 目标设置页面（`/goals`）

- 完整 CRUD 操作：创建（目标类型 + 目标值选择）、更新（暂停/恢复开关）、删除
- 支持四种目标类型：练习时长、平均 WPM、准确率、练习次数
- 进度条展示 current_value/target_value，完成时变为 emerald 色
- 空状态插画 + 引导文案

### 3. 成就展示页面（`/achievements`）

- 分区展示：已解锁（amber 渐变背景）/ 未解锁（灰色 + 锁图标）
- 动态图标映射：trophy/fire/medal/bolt/rocket/target/book → Lucide 图标
- 解锁日期显示（zh-CN 本地化）
- 成就数统计：`N / M 已解锁`

### 4. 成就解锁弹窗

- `AchievementToast` 组件：练习结束后若有新成就，显示顶部浮动通知
- 入场/退场动画（translate + opacity 过渡 300ms）
- 5 秒自动消失或手动关闭
- amber 渐变主题，支持 dark mode

### 5. 用户设置页面（`/settings`）

- 账户信息展示（用户名、邮箱、角色）
- 主题切换按钮（浅色 ↔ 深色）
- 修改密码表单：
  - 输入验证：新密码 ≥ 8 位、两次密码一致
  - 调用 `POST /auth/change-password`
  - 成功/失败消息反馈

### 6. 仪表盘增强

- 新增「今日目标」概览区块（TodaySection 与 SummarySection 之间）
- 展示最多 3 个活跃目标的进度条
- 点击「管理目标 →」跳转至 `/goals` 页面

### 7. 导航更新

- 侧边栏新增 3 个入口：每日目标（Target）、成就（Trophy）、设置（Settings）
- 使用对应 Lucide 图标

### 8. 移动端响应式适配

- 顶部 mobile header（`md:hidden`）：汉堡菜单按钮 + 品牌 logo
- 侧边栏改为 fixed 定位 + `translate-x` 滑入/滑出动画
- 遮罩层点击关闭侧边栏
- 主内容区 `pt-14 md:pt-0` 适配 mobile header 高度
- NavLink 点击后自动收起侧边栏

---

## 新增文件

| 文件 | 说明 |
|------|------|
| `src/api/goals.ts` | 目标 CRUD React Query hooks |
| `src/api/achievements.ts` | 成就列表 hook |
| `src/routes/goals.tsx` | 每日目标页面 |
| `src/routes/achievements.tsx` | 成就展示页面 |
| `src/routes/settings.tsx` | 用户设置页面 |
| `src/components/AchievementToast.tsx` | 成就解锁浮动通知组件 |

## 修改文件

| 文件 | 变更 |
|------|------|
| `src/types/api.ts` | 新增 `UserGoal`, `Achievement`, `CompleteResult` 类型 |
| `src/api/practice.ts` | 返回类型升级为 `CompleteResult`，新增 invalidation |
| `src/routes/practice.tsx` | 集成 `AchievementToast`，onSuccess 捕获新成就 |
| `src/routes/__root.tsx` | 新增 3 个导航项 + 移动端响应式侧边栏（hamburger / overlay / slide） |
| `src/routes/index.tsx` | 新增 `GoalsOverview` 仪表盘区块 |
| `vite.config.ts` | `autoCodeSplitting: false`（修复路由文件被 TanStack Router 插件覆盖） |
| `src/routeTree.gen.ts` | 自动生成，新增 goals / achievements / settings 路由 |

---

## 验证结果

```bash
# TypeScript 类型检查
$ npx tsc --noEmit   # ✅ 零错误

# 生产构建
$ npx vite build     # ✅ 成功
# dist/assets/index-BpYAJUq1.js   759.32 kB (gzip: 219.84 kB)
# dist/assets/index-C-nVTp0K.css   51.03 kB (gzip:  8.17 kB)
```

---

## 注意事项

- TanStack Router Vite 插件 `autoCodeSplitting` 会在构建时覆盖新加的路由文件内容，已在 `vite.config.ts` 中显式关闭
- 修改密码功能依赖后端 `POST /auth/change-password` 端点（Phase 4 后端已实现）
- `AchievementToast` 通过 `CompleteResult.new_achievements` 触发，无需额外 WebSocket 通道

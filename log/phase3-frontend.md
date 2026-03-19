# Phase 3 Frontend — 完成日志

## 概览
实现了 Phase 3 前端全部功能：仪表盘、数据分析（折线图 + 键位热力图）、错题集页面，以及完整的深色模式支持。

## 设计系统
- **设计档案**: `.impeccable.md` — 品牌个性「优雅·精致·沉稳」、苹果风、毛玻璃效果
- **色彩**: Indigo 主色 + slate 中性色，cool-tone 语义色（emerald/rose/amber）
- **图标**: emoji → Lucide React（18px, 1.8 stroke）
- **深色模式**: 手动切换（`.dark` class），slate-900/950 背景，非纯黑

## 新增依赖
| Package | Version | Purpose |
|---------|---------|---------|
| recharts | 3.8.0 | 折线图 |
| lucide-react | 0.577.0 | 图标系统 |

## 新增/修改文件

### 基础设施
| File | Action | Description |
|------|--------|-------------|
| `src/index.css` | Modified | Tailwind v4 `@custom-variant dark`、CSS 变量、自定义滚动条 |
| `src/types/api.ts` | Modified | 新增 7 个 Phase 3 类型接口 |
| `src/stores/themeStore.ts` | New | Zustand 深色模式 store + localStorage 持久化 |

### API Hooks
| File | Action | Hooks |
|------|--------|-------|
| `src/api/analysis.ts` | New | `useTrend()`, `useKeymap()`, `useSummary()` |
| `src/api/daily.ts` | New | `useDaily()` |
| `src/api/errors.ts` | New | `useErrors()`, `useReviewQueue()`, `useCreateReviewSession()` |

### 组件
| File | Action | Description |
|------|--------|-------------|
| `src/components/KeyboardHeatmap.tsx` | New | SVG QWERTY 键盘热力图，light/dark 双色板 |

### 页面
| File | Action | Description |
|------|--------|-------------|
| `src/routes/__root.tsx` | Modified | Lucide 图标、活跃路由高亮、毛玻璃侧边栏、深色模式切换按钮 |
| `src/routes/index.tsx` | Modified | 完整仪表盘：今日统计卡片（练习次数/连续打卡/用时/待复习）、累计统计、快速开始 |
| `src/routes/analysis.tsx` | Modified | WPM 趋势折线图、准确率趋势图、键位热力图；支持日/周/月粒度和 7/30/90 天范围切换 |
| `src/routes/errors.tsx` | New | 错题列表（分页）、复习时间展示、难度标签、一键强化按钮、空状态 |
| `src/routes/login.tsx` | Modified | 深色模式适配、Lucide 图标、毛玻璃表单 |
| `src/routes/register.tsx` | Modified | 同上 |
| `src/routes/practice.tsx` | Modified | 深色模式 + Lucide placeholder |
| `src/routes/content.tsx` | Modified | 同上 |

## 验证
- `tsc --noEmit` ✅ 零错误
- `vite build` ✅ 构建成功 (688 KB gzipped 206 KB)

## 对应 API 端点
| Frontend | Backend |
|----------|---------|
| Dashboard today stats | `GET /api/v1/daily` |
| Dashboard review count | `GET /api/v1/errors/review-queue` |
| Summary cards | `GET /api/v1/analysis/summary` |
| WPM/Accuracy charts | `GET /api/v1/analysis/trend` |
| Keyboard heatmap | `GET /api/v1/analysis/keymap` |
| Error list | `GET /api/v1/errors` |
| 一键强化 | `POST /api/v1/errors/review-session` |

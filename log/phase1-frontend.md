# Phase 1 前端开发日志

**日期：** 2026-03-19  
**状态：** ✅ 已完成

---

## 完成内容

### 1. 项目初始化
- Vite 8.0.1 + React 19.2.4 + TypeScript 5.9.3
- Node 20.20.1（通过 nvm 切换）
- Tailwind CSS v4（`@tailwindcss/vite` 插件 + `@import "tailwindcss"` 方式）
- 路径别名 `@/*` → `src/*`（vite.config.ts + tsconfig.app.json）

### 2. TanStack Router 文件路由
- `@tanstack/router-plugin/vite` 自动生成路由树（`routeTree.gen.ts`）
- 路由文件：`__root.tsx`、`index.tsx`、`login.tsx`、`register.tsx`、`practice.tsx`、`content.tsx`、`analysis.tsx`

### 3. TanStack Query 全局配置
- `QueryClient` 配置：retry=1、refetchOnWindowFocus=false
- `QueryClientProvider` 包裹在 `main.tsx` 入口
- 统一 API 客户端 `api/client.ts`：
  - 自动注入 `Authorization: Bearer` 请求头
  - Access Token 过期（code 40102）自动调用 `/api/v1/auth/refresh` 刷新
  - Refresh Token 过期（code 40104/40101）自动登出

### 4. Zustand Auth Store
- `stores/authStore.ts`：accessToken、user 状态管理
- 登录成功后持久化到 localStorage
- 登出时清除 localStorage + 重定向到 /login
- `isLoggedIn()` 快捷判断方法

### 5. 登录/注册页面
- `/login`：用户名 + 密码表单，调用 `POST /api/v1/auth/login`
  - 登录成功自动写入 authStore 并跳转首页
  - 已登录用户自动重定向到首页
- `/register`：用户名 + 邮箱 + 密码 + 确认密码表单
  - 前端校验：密码长度 ≥ 8、两次密码一致、用户名格式
  - 注册成功后自动登录并跳转首页

### 6. 基础布局
- `__root.tsx` 左侧栏布局：
  - Logo + 导航链接（仪表盘 / 打字练习 / 内容管理 / 数据分析）
  - 用户信息 + 登出按钮
  - 未登录时不显示侧边栏（登录/注册页面全屏）
- 各页面占位组件（Phase 2/3 实现具体功能）

### 7. Vite Proxy 联调验证
- `vite.config.ts` 配置 `/api` → `http://localhost:8080` 代理
- 验证：`curl http://localhost:5174/api/v1/auth/me` 返回 `{"code":40101,...}`
- 前端 dev server 正常启动，页面返回 200

---

## 文件清单

```
frontend/
├── index.html
├── package.json
├── vite.config.ts
├── tsconfig.app.json
├── tsconfig.json
├── tsconfig.node.json
└── src/
    ├── main.tsx                 # 入口：Router + Query Provider
    ├── index.css                # Tailwind v4 import
    ├── routeTree.gen.ts         # 自动生成的路由树
    ├── vite-env.d.ts
    ├── api/
    │   ├── client.ts            # 统一请求函数 + token 管理
    │   └── auth.ts              # 认证相关 TanStack Query hooks
    ├── stores/
    │   └── authStore.ts         # Zustand 认证状态
    ├── types/
    │   └── api.ts               # API 响应类型定义
    └── routes/
        ├── __root.tsx           # 根布局（侧边导航）
        ├── index.tsx            # 仪表盘
        ├── login.tsx            # 登录页
        ├── register.tsx         # 注册页
        ├── practice.tsx         # 打字练习（占位）
        ├── content.tsx          # 内容管理（占位）
        └── analysis.tsx         # 数据分析（占位）
```

## 技术栈版本

| 依赖 | 版本 |
|------|------|
| React | 19.2.4 |
| Vite | 8.0.1 |
| TypeScript | 5.9.3 |
| TanStack Router | ^1 |
| TanStack Query | ^5 |
| Zustand | ^5 |
| Tailwind CSS | ^4 |
| Node.js | 20.20.1 |

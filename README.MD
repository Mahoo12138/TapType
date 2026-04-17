# TapType — 项目简介

这是一个以打字练习为核心的学习与练习平台（单仓库 + Go 后端 + Vite/React 前端），面向个人自学与小规模部署。仓库采用模块化分层设计，包含练习引擎、错题复习（SM-2）、成就与目标系统、媒体存储与实时打字统计（WebSocket）。

---

**快速索引**
- **代码位置**: 根目录、[frontend](frontend)、[api](api)、[internal](internal)、[migrations](migrations)
- **开发日志**: 查看 [log](log) 目录下的阶段日志（phase1..phase5 等），了解分阶段进展
- **主要文档**: 本 README 提供快速上手与架构概览，更多细节见对应模块文件

---

**项目亮点**
- **完整练习流水**：练习创建 → 实时打字（/ws/practice）→ 结果提交 → SM-2 错题复习计划
- **后端（Go）**：基于 Go + GORM，迁移通过 `goose`/embed 管理，支持 SQLite 与 PostgreSQL
- **认证策略**：JWT 双 Token（短期 Access + HttpOnly Refresh Cookie）和限流中间件
- **前端（Vite + React）**：Vite + React 19 + TypeScript + TanStack Router/Query + Zustand 状态管理
- **分析与可视化**：WPM / 准确率 趋势、键位热力图、成就与目标面板
- **媒体服务**：数据库存储媒体（头像、音效、封面），ETag 缓存与访问权限控制

---

**架构概览**
- **后端（Go）**
	- 代码组织：`api/`（HTTP 层） + `internal/`（service/model/controller） + `utility/`（wpm、sm2、crypto）
	- 数据迁移：`migrations/`（通过 `//go:embed` 打包）
	- 认证：`/api/v1/auth`（register/login/refresh/me），JWT + refresh cookie
	- 实时：`/ws/practice` 用于上报按键事件与推送实时统计
- **前端（frontend）**
	- Vite + React 19，路由由 TanStack Router 插件生成（`src/routeTree.gen.ts`）
	- 状态：Zustand（auth, theme 等）；数据请求：TanStack Query
	- 主要页面：仪表盘、练习、内容管理（词/句库/文章段落）、错题/复习、分析、目标/成就、设置

---

**主要 API（摘要）**
- 认证：`POST /api/v1/auth/register`, `POST /api/v1/auth/login`, `POST /api/v1/auth/refresh`, `GET /api/v1/auth/me`
- 练习：`POST /api/v1/practice/sessions`（创建）、`PATCH /api/v1/practice/sessions/:id`（提交完成，返回 `CompleteResult` 含新成就）
- 错题/复习：`GET /api/v1/errors`, `GET /api/v1/errors/review-queue`, `POST /api/v1/errors/review-session`
- 分析：`GET /api/v1/analysis/trend`, `GET /api/v1/analysis/keymap`, `GET /api/v1/analysis/summary`
- 媒体：`POST /api/v1/media/upload`, `GET /api/v1/media/:id`, `GET /api/v1/media/types`
- 管理：`/api/v1/admin/*`（用户与词库审查，需 Admin 权限）


---

**技术栈与版本（核心）**
- 后端：Go (模块化)、GORM、goose 风格迁移、WebSocket
- 前端：Vite 8、React 19、TypeScript 5、Tailwind CSS v4、TanStack Router/Query、Zustand
- 存储：SQLite（开发）或 PostgreSQL（生产）

---

**快速上手（开发环境）**
- 克隆仓库并进入项目根目录

	- 安装前端依赖并启动 dev server:
		`cd frontend && npm install && npm run dev`

	- 启动后端（示例）:
		`go run main.go`

	- 执行数据库迁移（仓库提供 Makefile 辅助）:
		`make migrate-up`

说明：具体命令可能随本地环境或 Makefile 约定而不同，更多操作请查看仓库根目录的 `Makefile` 与 `Dockerfile`。

---

**本地调试要点**
- 前端开发服务器默认代理 `/api` 到 `http://localhost:8080`，在 `frontend/vite.config.ts` 中可以查看或调整
- 若需使用 PostgreSQL，配置 `database.driver=postgres` 并在 `database.dsn` 中填写连接串
- 内置种子：系统音效与预置成就与设置通过启动时的 seed 逻辑写入 DB

---

**贡献与联系方式**
- 若要参与开发，请先阅读并运行单元测试：`go test ./...`（后端）与 `npm run build`（前端）
- 有问题或建议请在仓库 Issue 中提出，或联系项目维护者

---

感谢使用 TapType，祝编码愉快！

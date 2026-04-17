# Phase 6 Open API Token 管理功能开发日志

**日期：** 2026-03-26
**状态：** ✅ 已完成

---

## 完成内容

### 1. 数据库存储与模型

- 新增 `api_tokens` 表，通过 `000012_add_api_tokens.sql` 进行建库迁移。表核心字段：`user_id`, `name`, `token_hash`, `prefix`, `scopes`, `expires_at`, `last_used_at`
- 新增 `ApiToken` GORM 模型：`token_hash` 为只写的服务端防泄漏设计，通过 `SHA-256` 存储，前端仅保留由 `tp_` 和 8 位十六进制符组成的 Prefix。

### 2. 核心架构模式改造

- **控制器**: 新增 `internal/controller/openapi/`，实现了符合规范的 `openapi_v1.go`，处理 `Create`, `Update`, `Delete`, `List` 操作。
- **服务层**: 新增 `internal/service/openapi/`。核心功能包括生成 32 Bytes 并附带 `tp_` 前缀的原始 Key、计算并固化 Hash、追踪用户额度（最多 10 个 Token）、追踪上次使用时间等。
- **中间件鉴权增强**: 重构 `internal/middleware/jwt.go`，当拦截到 Authorization Header 带有被 `tp_` 开头的 Token 时，拦截进入 `openapi` 服务的校验链路进行鉴权而非基于 JWT 验证，实现同一套 Protected Routes 支持多端（Web + API Client）免二次挂载调用。

### 3. 限流与错误处理

- `code/code.go` 新增：
  - `CodeTokenLimitExceeded` (42202): api token 达到上限
  - `CodeApiTokenInvalid` (40105): api token 验证失败（错误或过期）

### 4. 前端应用层集成

- **类型及接口**: 在 `src/types/api.ts` 新增 Open API 相关类型并于 `src/api/openapi.ts` 建立基于 `TanStack Query` 的 CRUD Hook 函数（`useApiTokens`, `useCreateApiToken`, `useUpdateApiToken`, `useDeleteApiToken`）。
- **组件及交互设计**: 在 `src/routes/settings.ts` 改写了原有的单 AccessToken 展示视图，构建了结构完整的组件 `ApiTokenSection`。
  - 将 Token 创建结果以带保护机制的高模态提示给用户（关闭即丢失）。
  - 支持快捷复制、到期识别和 Active 状态切换管理。
  - 引入了了 `@base-ui/react/menu` 和 shadcn 的 `DropdownMenu` 组件支持了高级菜单操作控制交互。

---

## 验证与测试结果

```bash
# 后端编译
$ go build ./...   # ✅ 通过

# 前端构建
$ pnpm run build   # ✅ 通过
```

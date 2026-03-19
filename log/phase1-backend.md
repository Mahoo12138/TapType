# Phase 1 — 后端基础搭建完成记录

**日期：** 2026-03-19  
**阶段：** Phase 1 — 基础搭建  
**状态：** 后端部分完成 ✅

---

## 完成内容

### 1. 项目结构调整

按照设计文档第 5 节目录结构，创建了以下核心目录与文件：

```
migrations/
├── embed.go                        # //go:embed *.sql
├── 000001_init_schema.sql          # 全量建表 DDL（13 张表 + 索引）
└── 000002_seed_achievements.sql    # 成就种子数据（8 条）

utility/
├── db/
│   └── db.go                       # GORM 初始化 + goose 迁移
└── crypto/
    └── crypto.go                   # bcrypt 密码哈希（cost=12）

internal/
├── model/
│   ├── entity/
│   │   └── user.go                 # GORM User 模型（password_hash json:"-"）
│   └── code/
│       └── code.go                 # 统一错误码（15 个业务错误码）
├── service/
│   └── auth/
│       ├── auth.go                 # Service 接口定义
│       └── auth_impl.go           # JWT 双 Token + 注册/登录/刷新实现
├── middleware/
│   ├── jwt.go                      # JWT 鉴权中间件（解析 access_token）
│   └── cors.go                     # CORS 中间件
├── controller/
│   ├── auth.go                     # 认证控制器（4 个接口）
│   └── response.go                 # 统一错误响应 helper
└── cmd/
    └── cmd.go                      # 路由注册 + 中间件挂载 + SPA fallback

resource/
├── embed.go                        # //go:embed frontend/dist
└── frontend/dist/
    └── index.html                  # 占位 SPA 页面
```

### 2. 数据库（SQLite / PostgreSQL 双驱动）

- 使用 `glebarez/sqlite`（基于 modernc.org/sqlite，纯 Go 无 CGO）
- PostgreSQL 通过 `gorm.io/driver/postgres` 支持
- 配置 `database.driver` 切换驱动，`database.dsn` 指定连接串
- 启动时通过 goose 自动执行迁移，无需手动操作

### 3. Goose 迁移管理

- `000001_init_schema.sql`：创建全部 13 张表 + 7 个核心索引
- `000002_seed_achievements.sql`：插入 8 个预置成就定义
- 迁移文件通过 `//go:embed` 编译进二进制，运行时自动执行
- Makefile 提供 `migrate-status`、`migrate-up`、`migrate-down`、`migrate-create` 命令

### 4. JWT 双 Token 认证

- **Access Token**：15 分钟有效期，存于前端内存
- **Refresh Token**：7 天有效期，通过 HttpOnly Cookie 下发（`Path=/api/v1/auth/refresh`，`SameSite=Strict`）
- JWT 使用 `HS256` 签名，密钥从配置读取
- Claims 包含 `user_id`、`role`、`token_type`

### 5. 认证接口

| 方法 | 路径 | 说明 | 鉴权 |
|------|------|------|------|
| POST | `/api/v1/auth/register` | 用户注册 | 无 |
| POST | `/api/v1/auth/login` | 用户登录 | 无 |
| POST | `/api/v1/auth/refresh` | 刷新 Token | Cookie |
| GET  | `/api/v1/auth/me` | 当前用户信息 | JWT |
| GET  | `/health` | 健康检查 | 无 |

### 6. 安全措施

- 密码使用 bcrypt（cost=12）哈希存储
- `password_hash` 字段标记 `json:"-"` 防止序列化泄露
- Refresh Token 通过 HttpOnly Cookie 传输，防 XSS 读取
- GoFrame `r.Parse()` 自动参数验证（用户名格式、邮箱格式、密码长度）
- 统一错误码返回，不泄露内部实现细节

### 7. 部署配置

- `manifest/config/config.yaml`：GoFrame 主配置（端口 8080）
- `.env.example`：环境变量模板
- `Dockerfile`：三阶段构建（Node → Go → Alpine）
- `docker-compose.yml`：单节点自托管配置
- `Makefile`：常用开发命令

### 8. SPA Fallback

- `resource/embed.go` 嵌入 `frontend/dist` 目录
- 非 `/api`、`/ws`、`/health` 路径返回 `index.html`
- 静态文件优先匹配，miss 后 fallback 到 SPA 入口

---

## 验证结果

```bash
# 健康检查
$ curl http://localhost:8080/health
{"code":0,"data":null,"message":"ok"}

# 注册
$ curl -X POST http://localhost:8080/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","email":"test@example.com","password":"password123"}'
{"code":0,"data":{"email":"test@example.com","id":"...","role":"user","username":"testuser"},"message":"success"}

# 登录（返回 access_token + HttpOnly Cookie）
$ curl -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"password123"}'
{"code":0,"data":{"access_token":"eyJ...","expires_in":900,"user":{...}},"message":"success"}

# 鉴权接口
$ curl http://localhost:8080/api/v1/auth/me -H "Authorization: Bearer <token>"
{"code":0,"data":{"id":"...","username":"testuser","email":"test@example.com","role":"user",...},"message":"success"}

# 错误处理
$ curl http://localhost:8080/api/v1/auth/me     # 无 Token → 40101
$ curl -X POST .../register (重复用户名)         # → 40901
$ curl -X POST .../login (错误密码)              # → 40101
```

---

## 待完成（Phase 1 前端）

- [ ] Vite + React 19 + Tailwind CSS v4 项目初始化
- [ ] TanStack Router 文件路由配置
- [ ] TanStack Query 全局配置
- [ ] Zustand auth store
- [ ] 登录/注册页面
- [ ] 基础布局
- [ ] Vite proxy 联调验证

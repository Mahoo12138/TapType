# Phase 4 后端开发日志

**日期：** 2026-03-19  
**状态：** ✅ 已完成

---

## 完成内容

### 1. 目标设置 API（每日目标 CRUD）

- `UserGoal` 实体模型：支持 `duration`/`wpm`/`accuracy`/`practice_count` 四种目标类型
- `goal.Service` 接口 + 实现：
  - `ListGoals(userID)` — 获取用户所有目标
  - `CreateGoal(userID, goalType, targetValue, period)` — 创建目标，校验 goalType 合法性
  - `UpdateGoal(userID, goalID, targetValue, isActive)` — 部分更新目标
  - `DeleteGoal(userID, goalID)` — 删除目标（物理删除）
  - `RefreshDailyProgress(userID)` — 根据当日 daily_record 刷新所有 active daily 目标的 current_value
- 练习完成后自动触发 `RefreshDailyProgress`，实时更新目标进度

### 2. 成就系统（预置成就定义 + 检测逻辑）

- `achievement.Service` 接口 + 实现：
  - `ListAll(userID)` — 返回所有成就定义 + 用户解锁状态
  - `DetectAndUnlock(userID)` — 检测并解锁新达成的成就
- 成就条件类型支持：
  - `practice_count` — 累计练习次数
  - `streak` — 连续打卡天数（当前或历史最长）
  - `best_wpm` — 最佳 WPM
  - `accuracy` — 最佳准确率
  - `word_count` — 累计练习词数（字符数 / 5）
- 条件存储为 JSON（`{"type":"practice_count","value":1}`），后端解析后对比用户统计数据
- 已覆盖的 8 个预置成就：初次练习、坚持 3/7/30 天、速度 60/100 WPM、99% 准确率、千词达成

### 3. 成就解锁推送（练习完成后异步检测）

- `CompletePractice` 返回类型升级为 `CompleteResult`，包含：
  - `result` — 练习结果
  - `new_achievements` — 本次新解锁的成就列表
- `postCompletionHooks` 扩展链路：SM-2 错题更新 → 每日记录更新 → 成就检测 → 目标进度刷新

### 4. 限流中间件

- `internal/middleware/ratelimit.go`：基于 Token Bucket 算法的 per-IP 限流器
  - 配置参数：`MaxTokens`（突发容量）、`RefillRate`（每秒恢复 token 数）
  - Auth 路由组：5 burst / 1 token/sec（防暴力破解）
  - 通用 API 路由组：30 burst / 10 token/sec
- 超限返回错误码 `42901`（`too many requests`）
- 后台 goroutine 每 10 分钟清理超时 bucket，防止内存泄漏

### 5. 管理员接口

- `AdminController`：
  - `GET /api/v1/admin/users` — 分页查询所有用户
  - `PUT /api/v1/admin/users/:id` — 修改用户状态（激活/禁用）或角色（user/admin）
  - `GET /api/v1/admin/word-banks` — 查看所有公开词库（审核用）
  - `GET /api/v1/admin/sentence-banks` — 查看所有公开句库
- 路由组挂载 `middleware.AdminOnly`，非 admin 角色返回 `40302`

### 6. 路由注册整合

所有新增 API 已在 `cmd.go` 注册并按职责分组。

---

## 新增 API 端点

| 方法 | 路径 | 说明 | 鉴权 |
|------|------|------|------|
| GET | `/api/v1/goals` | 目标列表 | JWT |
| POST | `/api/v1/goals` | 创建目标 | JWT |
| PUT | `/api/v1/goals/:id` | 更新目标 | JWT |
| DELETE | `/api/v1/goals/:id` | 删除目标 | JWT |
| GET | `/api/v1/achievements` | 成就列表（含解锁状态） | JWT |
| GET | `/api/v1/admin/users` | 管理员：用户列表 | JWT + Admin |
| PUT | `/api/v1/admin/users/:id` | 管理员：修改用户 | JWT + Admin |
| GET | `/api/v1/admin/word-banks` | 管理员：公开词库列表 | JWT + Admin |
| GET | `/api/v1/admin/sentence-banks` | 管理员：公开句库列表 | JWT + Admin |

### 变更的 API

| 方法 | 路径 | 变更说明 |
|------|------|----------|
| PATCH | `/api/v1/practice/sessions/:id` | 返回值扩展为 `{result, new_achievements}` |

---

## 新增文件清单

```
internal/model/entity/
└── user_goal.go                    # UserGoal GORM 模型

internal/service/
├── goal/
│   ├── goal.go                     # Service 接口
│   └── goal_impl.go               # 实现（CRUD + 目标进度刷新）
└── achievement/
    ├── achievement.go              # Service 接口
    └── achievement_impl.go         # 实现（条件检测 + 解锁）

internal/controller/
├── goal.go                         # 目标 CRUD 控制器
├── achievement.go                  # 成就列表控制器
└── admin.go                        # 管理员控制器（用户管理 + 词库审核）

internal/middleware/
└── ratelimit.go                    # Token Bucket 限流中间件
```

### 修改的文件

```
internal/cmd/cmd.go                 # 注册新服务/控制器/路由 + 限流 + AdminOnly
internal/service/practice/practice.go  # CompletePractice 返回 CompleteResult + 成就/目标 hooks
```

---

## 验证结果

```bash
# 编译
$ go build ./...   # ✅ 零错误

# 单元测试
$ go test ./...    # ✅ sm2 15 PASS, wpm 5 PASS
```

---

## 技术要点

- **成就检测**：练习完成后同步检测，新解锁的成就立即返回给前端，无需轮询
- **目标进度**：通过 `RefreshDailyProgress` 从 `daily_records` 表重算，保证数据一致性
- **限流策略**：登录/注册使用严格限流（1 req/sec burst 5），普通 API 使用宽松限流（10 req/sec burst 30）
- **管理员隔离**：AdminOnly 中间件在 JWT 解析后检查 `role` 字段，与普通路由共享 JWT 层但独立鉴权
- **user_goals 表**：Phase 1 迁移已创建，无需新增迁移文件

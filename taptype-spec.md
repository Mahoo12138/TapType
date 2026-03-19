# TapType — 项目完整技术规格文档

> 本文档面向 AI 编程 Agent 使用。所有设计决策、架构图、数据库表结构、目录规范和开发任务均已完整描述，可直接据此生成代码。

---

## 目录

1. [项目定位](#1-项目定位)
2. [功能模块总览](#2-功能模块总览)
3. [技术栈选型](#3-技术栈选型)
4. [运行时架构](#4-运行时架构)
5. [项目目录结构](#5-项目目录结构)
6. [数据库设计](#6-数据库设计)
   - 6.5 [数据库迁移管理（goose）](#65-数据库迁移管理goose)
7. [API 设计规范](#7-api-设计规范)
   - 7.8 [统一错误码表](#78-统一错误码表)
   - 7.9 [输入验证规范](#79-输入验证规范)
8. [核心模块实现要点](#8-核心模块实现要点)
   - 8.7 [JWT 双 Token 认证流程](#87-jwt-双-token-认证流程)
   - 8.8 [WebSocket 断线重连策略](#88-websocket-断线重连策略)
   - 8.9 [练习 Session 状态机](#89-练习-session-状态机)
   - 8.10 [SM-2 评分映射规则](#810-sm-2-评分映射规则)
9. [构建与部署](#9-构建与部署)
10. [开发阶段规划](#10-开发阶段规划)
11. [安全规范](#11-安全规范)
12. [测试策略](#12-测试策略)

---

## 1. 项目定位

TapType 是一个支持**自托管 + 开源**的网页应用，核心目标是：

- **打字训练 + 语言学习 + 数据驱动优化**的综合工具
- 与普通打字网站的核心差异：错误驱动学习系统 + 间隔重复算法 + 完整数据自主权
- 单一二进制部署：Go 后端 + 前端产物 embed 打包，`docker run` 一行启动

**目标用户：** 语言学习者、程序员、希望系统性提升打字效率的用户，以及有自托管需求的个人/团队。

---

## 2. 功能模块总览

```mermaid
graph TD
    subgraph CORE["核心功能层（用户直接使用）"]
        CM[内容管理<br/>词库 · 句库 · 导入导出]
        TP[打字练习系统<br/>多模式 · 实时 WPM]
        AR[分析与报告<br/>趋势 · 键位弱点分析]
    end

    subgraph ENGINE["智能引擎层（差异化核心）"]
        EDL[错误驱动学习<br/>错题集 · SM-2 间隔重复 · 一键强化]
        GS[目标与激励<br/>每日目标 · 打卡 · 成就解锁]
    end

    subgraph PLATFORM["平台支撑层"]
        UA[用户与权限<br/>多用户 · 角色管理]
        API[API 与扩展<br/>REST API · 插件预留]
        DEPLOY[自托管部署<br/>Docker · 开源自部署]
    end

    subgraph DATA["数据基础层"]
        DB[(SQLite / PostgreSQL<br/>GORM 双驱动)]
    end

    CORE --> ENGINE
    ENGINE --> PLATFORM
    PLATFORM --> DATA
```

### 2.1 内容管理

- 单词库：增删改查、标签、难度（1-5）、音标/释义/例句
- 句库：分类、来源、长度、难度
- 导入导出：JSON、CSV 格式
- 批量导入 API（供脚本/第三方工具调用）
- 词库/句库支持 `is_public`，为未来社区共享预留

### 2.2 打字练习系统

四种练习模式：

| 模式 | 说明 | 特点 |
|------|------|------|
| 普通打字 | 显示文本，用户跟打 | 实时高亮错误 |
| 背词模式 | 显示释义/例句，用户输入单词 | 有提示可触发 |
| 默写模式 | 隐藏文本，完全凭记忆输入 | 无提示 |
| 错题强化 | 仅使用错题集内容循环练习 | SM-2 驱动队列 |

实时反馈指标（WebSocket 推送）：
- 实时 WPM（每次击键后更新）
- 实时准确率
- 错误字符高亮（当前字符颜色变化）
- 卡顿点分析（单键停留时长 > 阈值时标记）

### 2.3 分析与报告

- 每次练习生成完整记录：WPM、原始WPM、准确率、错误数、一致性得分
- 历史趋势：日/周/月维度折线图
- 键位弱点热力图（基于 `keystroke_stats`）
- 进步曲线与稳定性分析

### 2.4 错误驱动学习系统（关键差异点）

- 自动记录：错误词、高耗时词（停留时长 > 平均值 × 1.5）
- `error_records` 表持久化错误历史
- SM-2 间隔重复算法驱动 `next_review_at` 字段
- 每日"待复习"队列：`WHERE next_review_at <= NOW()`
- 一键生成错题强化练习 session

### 2.5 目标与激励

- 用户可设置每日练习目标（时长/WPM目标/准确率目标）
- 每日打卡：`daily_records.streak_day` 自增
- 成就解锁体系：条件存 `achievements.condition`（JSON），后端定时检测

### 2.6 用户与权限

- 多用户注册/登录（JWT）
- 角色：`admin` / `user`
- 管理员可管理所有用户和公开词库
- 普通用户数据完全隔离

---

## 3. 技术栈选型

### 3.1 后端

| 技术 | 选型 | 说明 |
|------|------|------|
| 语言 | Go 1.23+ | 静态编译，单二进制，无运行时依赖 |
| 框架 | GoFrame v2 | 企业级，内置 Router/Middleware/Config/Log |
| ORM | GORM v2 | 支持 SQLite / PostgreSQL 双驱动切换 |
| SQLite 驱动 | `modernc.org/sqlite` | 纯 Go，无 CGO，保证交叉编译 |
| PG 驱动 | `gorm.io/driver/postgres` | 生产环境可选 |
| 认证 | JWT（`golang-jwt/jwt`） | 无状态，适合自托管 |
| WebSocket | GoFrame 内置 `ghttp.WebSocket` | 实时 WPM 推送 |
| 配置 | GoFrame `gcfg` + 环境变量 | `.env` 文件 / Docker 环境变量 |
| 日志 | GoFrame `glog` | 结构化日志 |
| 迁移 | GORM `AutoMigrate` + 手写迁移脚本 | 启动时自动执行 |

### 3.2 前端

| 技术 | 选型 | 说明 |
|------|------|------|
| 框架 | React 19 | |
| 构建 | Vite 6 | 开发代理 `/api` → `:8080` |
| 路由 | TanStack Router v1 | 文件系统路由，类型安全 |
| 服务端状态 | TanStack Query v5 | API 请求缓存与同步 |
| 客户端状态 | Zustand | 打字练习本地实时状态 |
| 样式 | Tailwind CSS v4 | |
| 图表 | Recharts | 趋势折线图、进步曲线 |
| WebSocket | 原生 `WebSocket` API + 自封装 hook | |

### 3.3 部署

| 技术 | 说明 |
|------|------|
| `//go:embed` | 将 `frontend/dist` 编译进二进制 |
| Docker multi-stage | Node 构建前端 → Go 编译 → scratch 最小镜像 |
| Docker Compose | 单节点自托管标准配置 |
| 数据持久化 | SQLite 模式挂载 `/data` 卷；PG 模式外挂数据库 |

---

## 4. 运行时架构

```mermaid
graph TB
    Browser["浏览器 (PC Web)"]

    subgraph BINARY["单个 Go 二进制文件（go:embed）"]
        subgraph GF["GoFrame HTTP Server :8080"]
            STATIC["静态文件 Handler<br/>/* → embed.FS (SPA fallback)"]
            REST["REST API Handler<br/>/api/v1/* → Controller"]
            WS["WebSocket Handler<br/>/ws/practice → 实时 WPM"]
        end

        subgraph LAYERS["业务层"]
            MW["Middleware<br/>JWT · CORS · 限流"]
            CTRL["Controller 层<br/>参数绑定 · 调用 Service"]
            SVC["Service 层<br/>业务逻辑 · SM-2 · WPM 计算"]
            DAO["DAO 层<br/>GORM 查询封装"]
        end
    end

    subgraph DB["数据存储"]
        SQLITE["SQLite<br/>（默认，本地文件）"]
        PG["PostgreSQL<br/>（可选，生产环境）"]
    end

    Browser -- "HTTP / WS" --> GF
    STATIC --> MW
    REST --> MW
    WS --> MW
    MW --> CTRL
    CTRL --> SVC
    SVC --> DAO
    DAO -- "DB_DRIVER=sqlite" --> SQLITE
    DAO -- "DB_DRIVER=postgres" --> PG
```

**关键路由规则：**
- `GET /api/v1/**` → GoFrame Controller（JSON REST）
- `GET /ws/practice` → WebSocket upgrade，推送实时打字数据
- `GET /**` → `embed.FS` 返回 `index.html`（React SPA fallback）
- 所有路由走同一端口 `:8080`，无需 Nginx

**数据库切换：**

```
DB_DRIVER=sqlite   DB_DSN=./data/taptype.db   （默认）
DB_DRIVER=postgres DB_DSN=postgres://user:pass@host:5432/taptype
```

GORM 在初始化时根据 `DB_DRIVER` 值选择驱动，业务代码无感知。

---

## 5. 项目目录结构

```
taptype/
├── main.go                          # 程序入口，仅调用 cmd.Main()
├── go.mod
├── go.sum
├── Makefile                         # 常用命令：dev, build, docker, test
├── Dockerfile
├── docker-compose.yml
├── .env.example                     # 环境变量模板
│
├── internal/
│   ├── cmd/
│   │   └── cmd.go                   # Server 初始化、路由注册、中间件挂载
│   │
│   ├── controller/                  # HTTP Handler 薄层
│   │   ├── auth.go                  # 注册、登录、刷新 Token
│   │   ├── user.go                  # 用户信息、目标设置
│   │   ├── word_bank.go             # 词库 CRUD
│   │   ├── word.go                  # 单词 CRUD + 批量导入
│   │   ├── sentence_bank.go         # 句库 CRUD
│   │   ├── sentence.go              # 句子 CRUD + 批量导入
│   │   ├── practice.go              # 创建 Session、提交结果
│   │   ├── analysis.go              # 历史趋势、键位分析
│   │   ├── error_record.go          # 错题集查询、复习队列
│   │   ├── achievement.go           # 成就列表
│   │   └── ws_practice.go           # WebSocket 实时打字 Handler
│   │
│   ├── service/                     # 业务逻辑（接口 + 实现分离）
│   │   ├── auth/
│   │   │   ├── auth.go              # interface 定义
│   │   │   └── auth_impl.go         # JWT 生成、密码验证
│   │   ├── word/
│   │   │   ├── word.go
│   │   │   └── word_impl.go         # 词库/单词业务逻辑
│   │   ├── sentence/
│   │   ├── practice/
│   │   │   ├── practice.go
│   │   │   └── practice_impl.go     # Session 创建、结果计算、错题记录
│   │   ├── analysis/
│   │   │   ├── analysis.go
│   │   │   └── analysis_impl.go     # 趋势聚合、键位弱点分析
│   │   └── spaced_repeat/
│   │       ├── spaced_repeat.go
│   │       └── spaced_repeat_impl.go # SM-2 算法调度
│   │
│   ├── dao/
│   │   ├── internal/
│   │   │   └── model/               # GORM struct 定义（与数据库一一对应）
│   │   │       ├── user.go
│   │   │       ├── word_bank.go
│   │   │       ├── word.go
│   │   │       ├── sentence_bank.go
│   │   │       ├── sentence.go
│   │   │       ├── practice_session.go
│   │   │       ├── practice_result.go
│   │   │       ├── keystroke_stat.go
│   │   │       ├── error_record.go
│   │   │       ├── user_goal.go
│   │   │       ├── daily_record.go
│   │   │       ├── achievement.go
│   │   │       └── user_achievement.go
│   │   └── query/                   # 复杂查询封装（非简单 CRUD）
│   │       ├── analysis_query.go    # 趋势聚合 SQL
│   │       └── review_queue.go      # SM-2 复习队列查询
│   │
│   ├── model/                       # API 请求/响应结构体（非数据库 struct）
│   │   ├── req/
│   │   │   ├── auth.go
│   │   │   ├── word.go
│   │   │   ├── practice.go
│   │   │   └── ...
│   │   └── res/
│   │       ├── auth.go
│   │       ├── word.go
│   │       ├── practice.go
│   │       └── ...
│   │
│   └── middleware/
│       ├── jwt.go                   # JWT 鉴权中间件
│       ├── cors.go                  # CORS 配置
│       └── ratelimit.go             # 简单限流（可选）
│
├── utility/
│   ├── sm2/
│   │   ├── sm2.go                   # SM-2 算法实现
│   │   └── sm2_test.go              # 单元测试（必须覆盖）
│   ├── wpm/
│   │   ├── wpm.go                   # WPM / 准确率 / 一致性计算
│   │   └── wpm_test.go
│   ├── crypto/
│   │   └── crypto.go                # bcrypt 密码哈希
│   └── db/
│       └── db.go                    # GORM 初始化 + 驱动切换
│
├── resource/
│   └── embed.go                     # //go:embed frontend/dist
│
└── frontend/                        # React 应用
    ├── index.html
    ├── package.json
    ├── vite.config.ts               # /api 代理到 :8080（仅开发）
    ├── tailwind.config.ts
    ├── tsconfig.json
    └── src/
        ├── main.tsx
        ├── routes/                  # TanStack Router 文件路由
        │   ├── __root.tsx           # 根布局（导航栏、侧边栏）
        │   ├── index.tsx            # 仪表盘（今日目标、streak、待复习数）
        │   ├── practice/
        │   │   ├── index.tsx        # 练习入口（选择词库/模式）
        │   │   └── session.tsx      # 打字练习页面（核心页面）
        │   ├── library/
        │   │   ├── words/           # 词库管理
        │   │   └── sentences/       # 句库管理
        │   └── analysis/
        │       ├── index.tsx        # 历史总览
        │       └── keymap.tsx       # 键位热力图
        ├── components/
        │   ├── typing/
        │   │   ├── TypingArea.tsx   # 核心打字区域组件
        │   │   ├── CharDisplay.tsx  # 字符状态显示（正确/错误/待输入）
        │   │   └── StatsBar.tsx     # 实时 WPM / 准确率条
        │   ├── charts/
        │   │   ├── WpmTrend.tsx     # WPM 历史折线图
        │   │   ├── AccuracyTrend.tsx
        │   │   └── KeyHeatmap.tsx   # 键位热力图
        │   └── ui/                  # 通用 UI 组件
        ├── hooks/
        │   ├── useTyping.ts         # 打字引擎 Hook（核心）
        │   ├── useWpm.ts            # WPM 实时计算
        │   ├── useWebSocket.ts      # WebSocket 连接管理
        │   └── useStreak.ts         # 连续打卡状态
        ├── api/                     # TanStack Query hooks（类型化）
        │   ├── auth.ts
        │   ├── words.ts
        │   ├── sentences.ts
        │   ├── practice.ts
        │   └── analysis.ts
        ├── stores/                  # Zustand stores
        │   ├── practiceStore.ts     # 当前练习 session 状态
        │   └── authStore.ts         # 用户认证状态
        └── types/                   # TypeScript 类型定义
            └── api.ts               # 与后端 model/res 对应
```

---

## 6. 数据库设计

### 6.1 设计原则

- 主键：UUID（`uuid` 类型，GORM 自动生成）
- 时间戳：所有表含 `created_at`，软删除表含 `deleted_at`（GORM 软删除）
- SQLite 兼容：避免 `jsonb`，使用 `text` 存 JSON 字符串（GORM 层序列化）
- 外键：GORM 层维护，不在 SQLite 中强制（避免迁移复杂性）

### 6.2 实体关系图

```mermaid
erDiagram
    USERS ||--o{ WORD_BANKS : owns
    USERS ||--o{ SENTENCE_BANKS : owns
    USERS ||--o{ PRACTICE_SESSIONS : starts
    USERS ||--o{ ERROR_RECORDS : accumulates
    USERS ||--o{ USER_GOALS : sets
    USERS ||--o{ DAILY_RECORDS : logs
    USERS ||--o{ USER_ACHIEVEMENTS : earns

    WORD_BANKS ||--o{ WORDS : contains
    SENTENCE_BANKS ||--o{ SENTENCES : contains

    PRACTICE_SESSIONS ||--|| PRACTICE_RESULTS : produces
    PRACTICE_SESSIONS ||--o{ KEYSTROKE_STATS : records
    PRACTICE_SESSIONS ||--o{ ERROR_RECORDS : generates

    ACHIEVEMENTS ||--o{ USER_ACHIEVEMENTS : awarded_via
```

### 6.3 表结构详细定义

#### users — 用户表

```sql
CREATE TABLE users (
    id           TEXT PRIMARY KEY,           -- UUID
    username     TEXT NOT NULL UNIQUE,
    email        TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,             -- bcrypt
    role         TEXT NOT NULL DEFAULT 'user', -- 'user' | 'admin'
    is_active    INTEGER NOT NULL DEFAULT 1,
    created_at   DATETIME NOT NULL,
    updated_at   DATETIME NOT NULL,
    deleted_at   DATETIME                    -- 软删除
);
```

#### word_banks — 词库表

```sql
CREATE TABLE word_banks (
    id          TEXT PRIMARY KEY,
    owner_id    TEXT NOT NULL REFERENCES users(id),
    name        TEXT NOT NULL,
    description TEXT,
    is_public   INTEGER NOT NULL DEFAULT 0,
    created_at  DATETIME NOT NULL,
    updated_at  DATETIME NOT NULL,
    deleted_at  DATETIME
);
```

#### words — 单词表

```sql
CREATE TABLE words (
    id               TEXT PRIMARY KEY,
    bank_id          TEXT NOT NULL REFERENCES word_banks(id),
    content          TEXT NOT NULL,          -- 单词本体
    pronunciation    TEXT,                   -- 音标，如 /prəˌnʌnsiˈeɪʃən/
    definition       TEXT,                   -- 释义
    example_sentence TEXT,                   -- 例句
    difficulty       INTEGER NOT NULL DEFAULT 1, -- 1-5
    tags             TEXT,                   -- JSON 数组字符串，如 ["IELTS","动词"]
    created_at       DATETIME NOT NULL,
    updated_at       DATETIME NOT NULL
);
```

#### sentence_banks — 句库表

```sql
CREATE TABLE sentence_banks (
    id          TEXT PRIMARY KEY,
    owner_id    TEXT NOT NULL REFERENCES users(id),
    name        TEXT NOT NULL,
    category    TEXT,                        -- 分类，如 "科技","日常","商务"
    is_public   INTEGER NOT NULL DEFAULT 0,
    created_at  DATETIME NOT NULL,
    updated_at  DATETIME NOT NULL,
    deleted_at  DATETIME
);
```

#### sentences — 句子表

```sql
CREATE TABLE sentences (
    id          TEXT PRIMARY KEY,
    bank_id     TEXT NOT NULL REFERENCES sentence_banks(id),
    content     TEXT NOT NULL,
    source      TEXT,                        -- 来源，如书名、网址
    difficulty  INTEGER NOT NULL DEFAULT 1,
    word_count  INTEGER NOT NULL DEFAULT 0,  -- 词数，入库时计算
    tags        TEXT,                        -- JSON 数组字符串
    created_at  DATETIME NOT NULL,
    updated_at  DATETIME NOT NULL
);
```

#### practice_sessions — 练习会话表

```sql
CREATE TABLE practice_sessions (
    id           TEXT PRIMARY KEY,
    user_id      TEXT NOT NULL REFERENCES users(id),
    mode         TEXT NOT NULL,              -- 'normal'|'recitation'|'dictation'|'review'
    source_type  TEXT NOT NULL,             -- 'word_bank'|'sentence_bank'|'error_list'
    source_id    TEXT,                       -- 对应词库/句库 ID
    started_at   DATETIME NOT NULL,
    ended_at     DATETIME,                   -- NULL 表示未完成
    duration_ms  INTEGER,                    -- 实际练习时长（毫秒）
    created_at   DATETIME NOT NULL
);
```

**说明：** `started_at` 记录就建，`ended_at` 和 `duration_ms` 完成后更新。未完成（中途退出）的记录保留，可统计完成率。

#### practice_results — 练习结果表

```sql
CREATE TABLE practice_results (
    id           TEXT PRIMARY KEY,
    session_id   TEXT NOT NULL UNIQUE REFERENCES practice_sessions(id),
    wpm          REAL NOT NULL,              -- 净 WPM（扣除错误）
    raw_wpm      REAL NOT NULL,              -- 原始 WPM（不扣错误）
    accuracy     REAL NOT NULL,             -- 准确率 0.0-1.0
    error_count  INTEGER NOT NULL DEFAULT 0,
    char_count   INTEGER NOT NULL DEFAULT 0, -- 总字符数
    consistency  REAL NOT NULL DEFAULT 0.0, -- WPM 一致性得分 0.0-1.0
    created_at   DATETIME NOT NULL
);
```

**WPM 计算公式：**
```
raw_wpm    = (total_chars / 5) / (duration_ms / 60000)
net_wpm    = raw_wpm - (error_count / (duration_ms / 60000))
accuracy   = correct_chars / total_chars
consistency = 1 - (stddev(per_second_wpm) / mean(per_second_wpm))
```

#### keystroke_stats — 键位统计表

```sql
CREATE TABLE keystroke_stats (
    id              TEXT PRIMARY KEY,
    session_id      TEXT NOT NULL REFERENCES practice_sessions(id),
    key_char        TEXT NOT NULL,           -- 单个字符，如 "a" "k" " "
    hit_count       INTEGER NOT NULL DEFAULT 0,
    error_count     INTEGER NOT NULL DEFAULT 0,
    avg_interval_ms INTEGER NOT NULL DEFAULT 0, -- 平均按键间隔（毫秒）
    created_at      DATETIME NOT NULL
);
```

**用途：** 每个 session 结束后批量写入。前端在练习过程中记录每个键的 timestamp，结束时聚合后随结果一并上传。

#### error_records — 错误记录与 SM-2 状态表

```sql
CREATE TABLE error_records (
    id                TEXT PRIMARY KEY,
    user_id           TEXT NOT NULL REFERENCES users(id),
    session_id        TEXT NOT NULL REFERENCES practice_sessions(id),
    content_type      TEXT NOT NULL,         -- 'word'|'sentence'
    content_id        TEXT NOT NULL,         -- 对应 words.id 或 sentences.id
    error_count       INTEGER NOT NULL DEFAULT 1,
    avg_time_ms       INTEGER NOT NULL DEFAULT 0, -- 该内容平均耗时
    last_seen_at      DATETIME NOT NULL,
    next_review_at    DATETIME NOT NULL,     -- SM-2 计算的下次复习时间
    review_interval   INTEGER NOT NULL DEFAULT 1, -- 复习间隔（天）
    easiness_factor   REAL NOT NULL DEFAULT 2.5,  -- SM-2 E-Factor
    created_at        DATETIME NOT NULL,
    updated_at        DATETIME NOT NULL,
    UNIQUE(user_id, content_type, content_id)  -- 同一用户同一内容只有一条记录
);
```

#### user_goals — 用户目标表

```sql
CREATE TABLE user_goals (
    id             TEXT PRIMARY KEY,
    user_id        TEXT NOT NULL REFERENCES users(id),
    goal_type      TEXT NOT NULL,            -- 'daily_duration'|'wpm_target'|'accuracy_target'
    target_value   REAL NOT NULL,            -- 目标值（秒/WPM/百分比）
    current_value  REAL NOT NULL DEFAULT 0,
    period         TEXT NOT NULL DEFAULT 'daily', -- 'daily'|'weekly'
    start_date     TEXT NOT NULL,            -- ISO date，如 "2025-01-01"
    is_active      INTEGER NOT NULL DEFAULT 1,
    created_at     DATETIME NOT NULL,
    updated_at     DATETIME NOT NULL
);
```

#### daily_records — 每日汇总表

```sql
CREATE TABLE daily_records (
    id                TEXT PRIMARY KEY,
    user_id           TEXT NOT NULL REFERENCES users(id),
    record_date       TEXT NOT NULL,         -- ISO date，如 "2025-01-01"
    practice_count    INTEGER NOT NULL DEFAULT 0,
    total_duration_ms INTEGER NOT NULL DEFAULT 0,
    avg_wpm           REAL NOT NULL DEFAULT 0,
    avg_accuracy      REAL NOT NULL DEFAULT 0,
    streak_day        INTEGER NOT NULL DEFAULT 1, -- 当天是连续第几天
    created_at        DATETIME NOT NULL,
    updated_at        DATETIME NOT NULL,
    UNIQUE(user_id, record_date)
);
```

**说明：** 每次练习结束后 `UPSERT` 此表。`streak_day` 在 UPSERT 时检查前一天是否有记录，有则 +1，无则重置为 1。

#### achievements — 成就定义表

```sql
CREATE TABLE achievements (
    id          TEXT PRIMARY KEY,
    key         TEXT NOT NULL UNIQUE,        -- 如 "first_practice" "streak_7"
    name        TEXT NOT NULL,               -- 显示名称
    description TEXT NOT NULL,
    icon        TEXT,                        -- icon 标识符
    condition   TEXT NOT NULL,               -- JSON，如 {"type":"streak","value":7}
    created_at  DATETIME NOT NULL
);
```

#### user_achievements — 用户已解锁成就表

```sql
CREATE TABLE user_achievements (
    id             TEXT PRIMARY KEY,
    user_id        TEXT NOT NULL REFERENCES users(id),
    achievement_id TEXT NOT NULL REFERENCES achievements(id),
    unlocked_at    DATETIME NOT NULL,
    UNIQUE(user_id, achievement_id)
);
```

### 6.4 核心索引

```sql
-- 高频查询优化
CREATE INDEX idx_words_bank_id ON words(bank_id);
CREATE INDEX idx_sentences_bank_id ON sentences(bank_id);
CREATE INDEX idx_practice_sessions_user_id ON practice_sessions(user_id);
CREATE INDEX idx_practice_sessions_user_started ON practice_sessions(user_id, started_at DESC);
CREATE INDEX idx_error_records_user_review ON error_records(user_id, next_review_at);
CREATE INDEX idx_daily_records_user_date ON daily_records(user_id, record_date DESC);
CREATE INDEX idx_keystroke_stats_session ON keystroke_stats(session_id);
```

### 6.5 数据库迁移管理（goose）

**核心原则：** 废弃 `gorm.AutoMigrate()`，改用 goose 管理全部 DDL 和数据变更。`AutoMigrate` 只能加列/加表，无法处理改列名、数据修复、删列、种子数据，生产环境使用存在风险。

**选型依据（goose vs 其他方案）：**

| 方案 | 优点 | 缺点 |
|------|------|------|
| goose | 支持 go:embed；纯 SQL 文件；SQLite/PG 同一套；启动自动执行 | 需要额外依赖 |
| golang-migrate | 社区广泛 | embed 支持较弱 |
| GORM AutoMigrate | 零配置 | 只能加不能改，无法管理种子数据 |
| 手写迁移脚本 | 完全控制 | 维护成本高，无版本追踪 |

#### 迁移文件目录结构

```
migrations/
├── embed.go                                   # //go:embed *.sql
│
├── 000001_init_schema.sql                     # 初始建表（全量 DDL）
├── 000002_seed_achievements.sql               # 种子：成就定义
├── 000003_seed_default_wordbank.sql           # 种子：内置示例词库
│
├── 000004_add_word_audio_url.sql              # 迭代：新增列
├── 000005_rename_word_tags_format.sql         # 迭代：数据格式修复
├── 000006_add_practice_config_table.sql       # 迭代：新增表
└── 000007_fix_streak_null_values.sql          # 修复：历史数据订正
```

**命名规则：** `{6位序号}_{动词}_{描述}.sql`

动词前缀约定：`init_` 初始化 / `seed_` 种子数据 / `add_` 新增列或表 / `drop_` 删除 / `rename_` 重命名 / `fix_` 数据订正 / `alter_` 其他表结构变更

#### 迁移文件写法规范

**初始建表（`000001_init_schema.sql`）**

```sql
-- +goose Up
-- +goose StatementBegin
CREATE TABLE IF NOT EXISTS users (
    id            TEXT PRIMARY KEY,
    username      TEXT NOT NULL UNIQUE,
    email         TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role          TEXT NOT NULL DEFAULT 'user',
    is_active     INTEGER NOT NULL DEFAULT 1,
    created_at    DATETIME NOT NULL,
    updated_at    DATETIME NOT NULL,
    deleted_at    DATETIME
);

CREATE TABLE IF NOT EXISTS word_banks (
    id          TEXT PRIMARY KEY,
    owner_id    TEXT NOT NULL,
    name        TEXT NOT NULL,
    description TEXT,
    is_public   INTEGER NOT NULL DEFAULT 0,
    created_at  DATETIME NOT NULL,
    updated_at  DATETIME NOT NULL,
    deleted_at  DATETIME
);

-- ... 其余建表语句（按外键依赖顺序排列）...

CREATE INDEX IF NOT EXISTS idx_words_bank_id ON words(bank_id);
CREATE INDEX IF NOT EXISTS idx_error_records_user_review ON error_records(user_id, next_review_at);
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
-- 按依赖关系逆序删除
DROP TABLE IF EXISTS user_achievements;
DROP TABLE IF EXISTS achievements;
DROP TABLE IF EXISTS daily_records;
DROP TABLE IF EXISTS user_goals;
DROP TABLE IF EXISTS error_records;
DROP TABLE IF EXISTS keystroke_stats;
DROP TABLE IF EXISTS practice_results;
DROP TABLE IF EXISTS practice_sessions;
DROP TABLE IF EXISTS sentences;
DROP TABLE IF EXISTS sentence_banks;
DROP TABLE IF EXISTS words;
DROP TABLE IF EXISTS word_banks;
DROP TABLE IF EXISTS users;
-- +goose StatementEnd
```

**种子数据（`000002_seed_achievements.sql`）**

```sql
-- +goose Up
INSERT INTO achievements (id, key, name, description, icon, condition, created_at) VALUES
    ('ach-001', 'first_practice', '初次练习', '完成第一次打字练习',   'trophy',  '{"type":"practice_count","value":1}',  datetime('now')),
    ('ach-002', 'streak_3',       '坚持 3 天', '连续练习 3 天',        'fire',    '{"type":"streak","value":3}',          datetime('now')),
    ('ach-003', 'streak_7',       '一周连击',  '连续练习 7 天',        'flame',   '{"type":"streak","value":7}',          datetime('now')),
    ('ach-004', 'streak_30',      '月度达人',  '连续练习 30 天',       'medal',   '{"type":"streak","value":30}',         datetime('now')),
    ('ach-005', 'wpm_60',         '速度突破',  '单次练习 WPM 达到 60', 'bolt',    '{"type":"best_wpm","value":60}',       datetime('now')),
    ('ach-006', 'wpm_100',        '百字飞手',  '单次练习 WPM 达到 100','rocket',  '{"type":"best_wpm","value":100}',      datetime('now')),
    ('ach-007', 'accuracy_99',    '完美主义',  '单次准确率达到 99%',   'target',  '{"type":"accuracy","value":0.99}',     datetime('now')),
    ('ach-008', 'words_1000',     '千词达成',  '累计练习超过 1000 个词','book',   '{"type":"word_count","value":1000}',   datetime('now'));

-- +goose Down
DELETE FROM achievements WHERE key IN (
    'first_practice','streak_3','streak_7','streak_30',
    'wpm_60','wpm_100','accuracy_99','words_1000'
);
```

**业务迭代加列（`000004_add_word_audio_url.sql`）**

```sql
-- +goose Up
ALTER TABLE words ADD COLUMN audio_url TEXT;

-- +goose Down
-- SQLite 3.35.0+ 支持 DROP COLUMN，modernc.org/sqlite 已满足
ALTER TABLE words DROP COLUMN audio_url;
```

**数据格式修复（`000005_rename_word_tags_format.sql`）**

```sql
-- +goose Up
-- 将旧格式 tags（逗号分隔字符串 "IELTS,动词"）统一为 JSON 数组 '["IELTS","动词"]'
UPDATE words
SET tags = '["' || REPLACE(tags, ',', '","') || '"]'
WHERE tags IS NOT NULL
  AND tags != ''
  AND tags NOT LIKE '[%';

-- +goose Down
-- 数据格式修复类迁移不提供 Down（不可逆）
SELECT 'This migration cannot be reversed automatically' AS note;
```

**历史数据订正（`000007_fix_streak_null_values.sql`）**

```sql
-- +goose Up
-- 修复早期版本未初始化 streak_day 的记录
UPDATE daily_records SET streak_day = 1 WHERE streak_day IS NULL;

-- +goose Down
-- 数据订正不可逆
```

#### Go 集成代码

```go
// migrations/embed.go
package migrations

import "embed"

//go:embed *.sql
var FS embed.FS
```

```go
// utility/db/migrate.go
package db

import (
    "database/sql"
    "fmt"

    "github.com/pressly/goose/v3"
    "taptype/migrations"
)

func RunMigrations(sqlDB *sql.DB, driver string) error {
    dialect := driver
    if driver == "sqlite" {
        dialect = "sqlite3" // goose 使用 sqlite3 作为方言名
    }
    if err := goose.SetDialect(dialect); err != nil {
        return fmt.Errorf("goose set dialect: %w", err)
    }
    goose.SetBaseFS(migrations.FS)

    // Up 自动执行所有未跑过的迁移文件，幂等
    if err := goose.Up(sqlDB, "."); err != nil {
        return fmt.Errorf("goose up: %w", err)
    }
    return nil
}
```

```go
// utility/db/db.go — Init 函数中调用迁移，不使用 AutoMigrate
func Init(driver, dsn string) (*gorm.DB, error) {
    var dialector gorm.Dialector
    switch driver {
    case "sqlite":
        dialector = sqlite.Open(dsn)
    case "postgres":
        dialector = postgres.Open(dsn)
    default:
        return nil, fmt.Errorf("unsupported DB_DRIVER: %s", driver)
    }

    gormDB, err := gorm.Open(dialector, &gorm.Config{
        NamingStrategy: schema.NamingStrategy{SingularTable: true},
        Logger:         logger.Default.LogMode(logger.Info),
    })
    if err != nil {
        return nil, fmt.Errorf("open db: %w", err)
    }

    // 使用 goose 执行迁移，禁止 AutoMigrate
    sqlDB, _ := gormDB.DB()
    if err := RunMigrations(sqlDB, driver); err != nil {
        return nil, fmt.Errorf("migration: %w", err)
    }

    return gormDB, nil
}
```

#### 迁移执行流程

```mermaid
flowchart LR
    A[应用启动] --> B{goose_db_version\n表是否存在}
    B -- 否，首次启动 --> C[创建版本跟踪表]
    B -- 是 --> D[读取当前版本号]
    C --> D
    D --> E{对比文件版本\n与数据库版本}
    E -- 有新迁移文件 --> F[按序号顺序\n执行 Up SQL]
    E -- 版本一致 --> G[跳过，正常启动]
    F --> H{执行成功?}
    H -- 是，更新版本号 --> G
    H -- 否，事务回滚 --> I[报错退出\n保留现场]
```

#### Makefile 迁移辅助命令

```makefile
# 查看当前迁移状态
migrate-status:
	goose -dir migrations sqlite3 ./data/taptype.db status

# 手动执行迁移（正常用不到，启动时自动跑）
migrate-up:
	goose -dir migrations sqlite3 ./data/taptype.db up

# 回滚最后一个迁移（谨慎使用）
migrate-down:
	goose -dir migrations sqlite3 ./data/taptype.db down

# 创建新迁移文件（自动生成序号）
migrate-create:
	goose -dir migrations create $(name) sql
	# 用法: make migrate-create name=add_word_phonetic
```

---

## 7. API 设计规范

### 7.1 基础约定

- Base URL：`/api/v1`
- 认证：`Authorization: Bearer <JWT>`（除登录/注册外所有接口必须携带）
- Content-Type：`application/json`
- 分页参数：`?page=1&page_size=20`
- 统一响应格式：

```json
{
  "code": 0,
  "message": "success",
  "data": { }
}
```

错误响应：

```json
{
  "code": 40001,
  "message": "token expired",
  "data": null
}
```

### 7.2 认证接口

```
POST   /api/v1/auth/register        注册
POST   /api/v1/auth/login           登录，返回 JWT
POST   /api/v1/auth/refresh         刷新 Token
GET    /api/v1/auth/me              当前用户信息
```

### 7.3 词库与单词

```
GET    /api/v1/word-banks           词库列表（含 is_public 筛选）
POST   /api/v1/word-banks           创建词库
GET    /api/v1/word-banks/:id       词库详情
PUT    /api/v1/word-banks/:id       修改词库
DELETE /api/v1/word-banks/:id       删除词库

GET    /api/v1/word-banks/:id/words      单词列表（支持分页/搜索/难度筛选）
POST   /api/v1/word-banks/:id/words      添加单词
POST   /api/v1/word-banks/:id/words/import  批量导入（JSON/CSV）
PUT    /api/v1/words/:id                 修改单词
DELETE /api/v1/words/:id                 删除单词
GET    /api/v1/word-banks/:id/export     导出词库（JSON/CSV）
```

### 7.4 句库与句子

```
GET    /api/v1/sentence-banks
POST   /api/v1/sentence-banks
GET    /api/v1/sentence-banks/:id
PUT    /api/v1/sentence-banks/:id
DELETE /api/v1/sentence-banks/:id

GET    /api/v1/sentence-banks/:id/sentences
POST   /api/v1/sentence-banks/:id/sentences
POST   /api/v1/sentence-banks/:id/sentences/import
PUT    /api/v1/sentences/:id
DELETE /api/v1/sentences/:id
GET    /api/v1/sentence-banks/:id/export
```

### 7.5 练习系统

```
POST   /api/v1/practice/sessions        创建练习 Session，返回 session_id 和内容列表
PATCH  /api/v1/practice/sessions/:id    完成练习，提交结果（WPM/准确率/keystroke_stats/错误词）
GET    /api/v1/practice/sessions        历史记录列表
GET    /api/v1/practice/sessions/:id    单次记录详情

WS     /ws/practice?session_id=:id      WebSocket：客户端发送实时按键数据，服务端推送计算结果
```

**WebSocket 消息协议：**

客户端 → 服务端（每次按键）：
```json
{
  "type": "keystroke",
  "char": "a",
  "timestamp": 1700000000000,
  "is_correct": true
}
```

服务端 → 客户端（实时推送）：
```json
{
  "type": "stats",
  "wpm": 68.5,
  "raw_wpm": 71.2,
  "accuracy": 0.962,
  "elapsed_ms": 15000,
  "char_index": 85
}
```

### 7.6 分析与错题

```
GET    /api/v1/analysis/trend           历史趋势（?period=day|week|month&days=30）
GET    /api/v1/analysis/keymap          键位统计（聚合所有 session）
GET    /api/v1/analysis/summary         综合概要（总时长/最高WPM/平均准确率）

GET    /api/v1/errors                   错题列表（支持 content_type 筛选）
GET    /api/v1/errors/review-queue      今日待复习列表（next_review_at <= NOW()）
POST   /api/v1/errors/review-session    一键生成错题强化练习 Session
```

### 7.7 目标与激励

```
GET    /api/v1/goals                    用户目标列表
POST   /api/v1/goals                    设置目标
PUT    /api/v1/goals/:id                修改目标
DELETE /api/v1/goals/:id

GET    /api/v1/daily                    今日记录（含 streak）
GET    /api/v1/achievements             成就列表（含已解锁状态）
```

### 7.8 统一错误码表

业务错误码格式：`{HTTP状态码前两位}{模块号}{序号}`，如 `40101` = 401 认证模块 01 号错误。

| 错误码 | HTTP 状态 | 含义 | 触发场景 |
|--------|-----------|------|----------|
| 0 | 200 | 成功 | |
| 40001 | 400 | 请求参数错误 | 字段格式不合法、缺少必填项 |
| 40002 | 400 | 导入格式错误 | CSV/JSON 格式解析失败 |
| 40101 | 401 | 未登录或 Token 缺失 | Authorization 头为空 |
| 40102 | 401 | Token 已过期 | access_token 超时 |
| 40103 | 401 | Token 签名无效 | Token 被篡改 |
| 40104 | 401 | Refresh Token 无效或过期 | 需要重新登录 |
| 40301 | 403 | 无权操作 | 操作他人资源 |
| 40302 | 403 | 需要管理员权限 | 普通用户访问 admin 接口 |
| 40401 | 404 | 资源不存在 | ID 对应记录不存在 |
| 40901 | 409 | 用户名已存在 | 注册时重名 |
| 40902 | 409 | 邮箱已存在 | 注册时重复 |
| 42201 | 422 | 密码强度不足 | 少于 8 位或缺少数字 |
| 42901 | 429 | 请求过于频繁 | 触发限流 |
| 50001 | 500 | 服务器内部错误 | 数据库异常等 |

**GoFrame 错误码实现：**

```go
// internal/model/res/code.go
var (
    CodeSuccess         = gcode.New(0,     "success", nil)
    CodeBadRequest      = gcode.New(40001, "request parameter error", nil)
    CodeImportFormat    = gcode.New(40002, "import format error", nil)
    CodeUnauthorized    = gcode.New(40101, "unauthorized", nil)
    CodeTokenExpired    = gcode.New(40102, "token expired", nil)
    CodeTokenInvalid    = gcode.New(40103, "token invalid", nil)
    CodeRefreshExpired  = gcode.New(40104, "refresh token expired", nil)
    CodeForbidden       = gcode.New(40301, "forbidden", nil)
    CodeAdminRequired   = gcode.New(40302, "admin required", nil)
    CodeNotFound        = gcode.New(40401, "resource not found", nil)
    CodeUsernameTaken   = gcode.New(40901, "username already exists", nil)
    CodeEmailTaken      = gcode.New(40902, "email already exists", nil)
    CodeWeakPassword    = gcode.New(42201, "password too weak", nil)
    CodeRateLimit       = gcode.New(42901, "too many requests", nil)
    CodeInternalError   = gcode.New(50001, "internal server error", nil)
)
```

### 7.9 输入验证规范

GoFrame 使用 struct tag `v:"..."` 声明验证规则，Controller 层通过 `r.Parse(&req)` 自动完成验证并返回标准错误，无需手动 if 判断。

```go
// internal/model/req/auth.go
type RegisterReq struct {
    g.Meta   `path:"/auth/register" method:"post"`
    Username string `json:"username" v:"required|length:3,20|regex:^[a-zA-Z0-9_]+$#用户名必填|用户名长度3-20位|只允许字母数字下划线"`
    Email    string `json:"email"    v:"required|email#邮箱必填|邮箱格式不正确"`
    Password string `json:"password" v:"required|length:8,64#密码必填|密码长度8-64位"`
}

// internal/model/req/word.go
type CreateWordReq struct {
    g.Meta        `path:"/word-banks/{bank_id}/words" method:"post"`
    BankID        string `json:"bank_id"   v:"required|uuid"`
    Content       string `json:"content"   v:"required|length:1,200"`
    Pronunciation string `json:"pronunciation" v:"max-length:100"`
    Definition    string `json:"definition"    v:"max-length:2000"`
    Difficulty    int    `json:"difficulty"    v:"min:1|max:5"`
    Tags          string `json:"tags"`  // JSON 数组字符串，Service 层解析
}

// internal/model/req/practice.go
type CreateSessionReq struct {
    g.Meta     `path:"/practice/sessions" method:"post"`
    Mode       string `json:"mode"        v:"required|in:normal,recitation,dictation,review"`
    SourceType string `json:"source_type" v:"required|in:word_bank,sentence_bank,error_list"`
    SourceID   string `json:"source_id"   v:"uuid"`
    ItemCount  int    `json:"item_count"  v:"min:1|max:200"`
}
```

**前端 API 层统一错误拦截：**

```typescript
// src/api/client.ts
import { QueryClient } from '@tanstack/react-query'

const BASE_URL = '/api/v1'

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = useAuthStore.getState().accessToken
  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init?.headers,
    },
  })
  const json = await res.json()
  if (json.code === 40102) {
    // access token 过期，尝试用 refresh token 续期
    await refreshToken()
    return request(path, init) // 重试一次
  }
  if (json.code === 40104 || json.code === 40101) {
    // refresh token 也过期，强制退出登录
    useAuthStore.getState().logout()
    throw new Error('Session expired')
  }
  if (json.code !== 0) {
    throw new ApiError(json.code, json.message)
  }
  return json.data as T
}

export class ApiError extends Error {
  constructor(public code: number, message: string) {
    super(message)
  }
}
```

---

## 8. 核心模块实现要点

### 8.1 数据库初始化（GORM 双驱动）

```go
// utility/db/db.go
func Init(driver, dsn string) (*gorm.DB, error) {
    var dialector gorm.Dialector
    switch driver {
    case "sqlite":
        dialector = sqlite.Open(dsn) // modernc.org/sqlite，无 CGO
    case "postgres":
        dialector = postgres.Open(dsn)
    default:
        return nil, fmt.Errorf("unsupported DB_DRIVER: %s", driver)
    }
    db, err := gorm.Open(dialector, &gorm.Config{
        NamingStrategy: schema.NamingStrategy{SingularTable: true},
        Logger:         logger.Default.LogMode(logger.Info),
    })
    if err != nil {
        return nil, err
    }
    return db, db.AutoMigrate(AllModels()...)
}
```

### 8.2 embed 静态文件服务

```go
// resource/embed.go
package resource

import "embed"

//go:embed frontend/dist
var Frontend embed.FS
```

```go
// internal/cmd/cmd.go — SPA fallback 挂载
sub, _ := fs.Sub(resource.Frontend, "frontend/dist")
s.AddStaticPath("/", http.FS(sub))

// SPA fallback：所有非 /api 路径返回 index.html
s.BindHandler("/*", func(r *ghttp.Request) {
    if strings.HasPrefix(r.URL.Path, "/api") || strings.HasPrefix(r.URL.Path, "/ws") {
        r.Response.Status = 404
        return
    }
    indexHTML, _ := fs.ReadFile(resource.Frontend, "frontend/dist/index.html")
    r.Response.Header().Set("Content-Type", "text/html; charset=utf-8")
    r.Response.Write(indexHTML)
})
```

### 8.3 SM-2 间隔重复算法

SM-2 是核心学习算法，必须有单元测试覆盖。

```go
// utility/sm2/sm2.go

// Quality: 用户评分 0-5（0=完全忘记，3=困难但记得，5=完美）
// 对于打字练习，映射规则：
//   错误次数 > 3  → Quality = 1
//   错误次数 1-3  → Quality = 2
//   耗时 > 均值×1.5 → Quality = 3
//   正确且耗时正常  → Quality = 4 或 5

type State struct {
    Interval       int     // 复习间隔（天）
    EasinessFactor float64 // E-Factor，初始 2.5
    Repetitions    int     // 连续正确次数
}

func Calculate(s State, quality int) (State, time.Time) {
    if quality < 3 {
        s.Repetitions = 0
        s.Interval = 1
    } else {
        switch s.Repetitions {
        case 0:
            s.Interval = 1
        case 1:
            s.Interval = 6
        default:
            s.Interval = int(math.Round(float64(s.Interval) * s.EasinessFactor))
        }
        s.Repetitions++
    }
    // 更新 E-Factor（不低于 1.3）
    s.EasinessFactor = math.Max(1.3,
        s.EasinessFactor+0.1-float64(5-quality)*(0.08+float64(5-quality)*0.02))
    nextReview := time.Now().AddDate(0, 0, s.Interval)
    return s, nextReview
}
```

### 8.4 前端打字引擎 Hook（关键实现）

```typescript
// src/hooks/useTyping.ts
// 重要：必须处理 IME（输入法）compositionstart/end 事件
// 否则中文拼音阶段的中间字符会触发错误比对

export function useTyping(targetText: string) {
  const [inputChars, setInputChars] = useState<CharState[]>([]);
  const [isComposing, setIsComposing] = useState(false); // IME 状态
  const [keyTimestamps, setKeyTimestamps] = useState<Map<string, number[]>>(new Map());

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (isComposing) return; // IME 输入中，忽略所有按键事件

    const timestamp = Date.now();
    // 记录按键时间戳用于 WPM 计算和卡顿分析
    setKeyTimestamps(prev => {
      const key = e.key;
      const times = prev.get(key) ?? [];
      return new Map(prev).set(key, [...times, timestamp]);
    });

    // ... 字符比对逻辑
  }, [isComposing, targetText]);

  // IME 事件处理
  const onCompositionStart = () => setIsComposing(true);
  const onCompositionEnd = (e: CompositionEvent) => {
    setIsComposing(false);
    // composition 结束后将最终字符作为一次输入处理
  };

  return { inputChars, handleKeyDown, onCompositionStart, onCompositionEnd, keyTimestamps };
}
```

### 8.5 WPM 实时计算

```go
// utility/wpm/wpm.go

// 每次 WebSocket 推送时调用
func Calculate(totalChars, correctChars, errorCount int, durationMs int64) WpmResult {
    minutes := float64(durationMs) / 60000.0
    if minutes == 0 {
        return WpmResult{}
    }
    rawWpm := float64(totalChars) / 5.0 / minutes
    netWpm := rawWpm - float64(errorCount)/minutes
    if netWpm < 0 {
        netWpm = 0
    }
    accuracy := 0.0
    if totalChars > 0 {
        accuracy = float64(correctChars) / float64(totalChars)
    }
    return WpmResult{
        WPM:       math.Round(netWpm*10) / 10,
        RawWPM:    math.Round(rawWpm*10) / 10,
        Accuracy:  math.Round(accuracy*1000) / 1000,
        ElapsedMs: durationMs,
    }
}
```

### 8.6 每日 streak 更新逻辑

```go
// service/practice/practice_impl.go — 练习完成后调用
func (s *PracticeService) updateDailyRecord(ctx context.Context, userID string, result PracticeResult) error {
    today := time.Now().Format("2006-01-02")
    yesterday := time.Now().AddDate(0, 0, -1).Format("2006-01-02")

    var streakDay int = 1
    var yesterdayRecord model.DailyRecord
    if err := s.db.Where("user_id = ? AND record_date = ?", userID, yesterday).
        First(&yesterdayRecord).Error; err == nil {
        streakDay = yesterdayRecord.StreakDay + 1 // 昨天有记录，streak +1
    }

    // UPSERT 今日记录
    return s.db.Where("user_id = ? AND record_date = ?", userID, today).
        Assign(model.DailyRecord{
            // 更新字段...
            StreakDay: streakDay,
        }).FirstOrCreate(&model.DailyRecord{}).Error
}
```

### 8.7 JWT 双 Token 认证流程

使用 Access Token + Refresh Token 双 Token 机制。Access Token 短期有效（15分钟），Refresh Token 长期有效（7天），用于无感刷新，避免频繁登录。

```
access_token  有效期: 15 分钟，存于内存（Zustand store）
refresh_token 有效期: 7 天，存于 httpOnly Cookie（防 XSS 读取）
```

**登录响应：**

```json
{
  "code": 0,
  "data": {
    "access_token": "eyJhbGc...",
    "expires_in": 900,
    "user": { "id": "...", "username": "...", "role": "user" }
  }
}
```

`refresh_token` 通过 `Set-Cookie: refresh_token=...; HttpOnly; SameSite=Strict; Path=/api/v1/auth/refresh` 下发，前端不感知其值。

**Token 刷新流程：**

```mermaid
sequenceDiagram
    participant FE as 前端
    participant BE as 后端

    FE->>BE: 携带 access_token 请求 API
    BE-->>FE: 返回 40102 token expired

    FE->>BE: POST /api/v1/auth/refresh（自动携带 httpOnly Cookie）
    BE->>BE: 验证 refresh_token 有效性
    BE-->>FE: 返回新 access_token
    FE->>FE: 更新 Zustand store 中的 access_token
    FE->>BE: 重试原始请求（携带新 token）
    BE-->>FE: 正常响应
```

**后端 Refresh 接口实现要点：**

```go
// internal/controller/auth.go
func (c *AuthController) Refresh(ctx context.Context, req *model.RefreshReq) (res *model.RefreshRes, err error) {
    // 从 Cookie 读取 refresh_token（不从 body/header）
    refreshToken := g.RequestFromCtx(ctx).Cookie.Get("refresh_token").String()
    if refreshToken == "" {
        return nil, gerror.NewCode(code.CodeRefreshExpired)
    }
    // 验证并签发新 access_token
    newAccessToken, err := c.authSvc.RefreshAccessToken(ctx, refreshToken)
    if err != nil {
        return nil, gerror.NewCode(code.CodeRefreshExpired)
    }
    return &model.RefreshRes{AccessToken: newAccessToken, ExpiresIn: 900}, nil
}
```

### 8.8 WebSocket 断线重连策略

打字练习中 WebSocket 断线会导致实时数据丢失，需要在前端实现自动重连并恢复状态。

**重连策略：** 指数退避（1s → 2s → 4s → 8s → 最大 30s），最多重试 5 次，超出后提示用户手动重连。

```typescript
// src/hooks/useWebSocket.ts
const BACKOFF_BASE = 1000
const MAX_RETRIES = 5

export function useWebSocket(sessionId: string) {
  const wsRef = useRef<WebSocket | null>(null)
  const retryCount = useRef(0)
  const retryTimer = useRef<ReturnType<typeof setTimeout>>()

  const connect = useCallback(() => {
    const token = useAuthStore.getState().accessToken
    const ws = new WebSocket(`/ws/practice?session_id=${sessionId}&token=${token}`)

    ws.onmessage = (e) => {
      const msg = JSON.parse(e.data) as WsMessage
      if (msg.type === 'stats') {
        usePracticeStore.getState().updateStats(msg)
      }
    }

    ws.onclose = (e) => {
      if (e.code === 1000) return // 正常关闭，不重连
      if (retryCount.current >= MAX_RETRIES) {
        usePracticeStore.getState().setWsError('连接断开，请刷新页面')
        return
      }
      const delay = Math.min(BACKOFF_BASE * 2 ** retryCount.current, 30000)
      retryCount.current++
      retryTimer.current = setTimeout(connect, delay)
    }

    ws.onopen = () => { retryCount.current = 0 } // 重连成功，重置计数
    wsRef.current = ws
  }, [sessionId])

  // 离开页面时正常关闭（code 1000）
  useEffect(() => {
    connect()
    return () => {
      clearTimeout(retryTimer.current)
      wsRef.current?.close(1000)
    }
  }, [connect])

  const send = useCallback((data: object) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data))
    }
    // WS 未就绪时的按键数据缓存到 practiceStore，重连后批量补发
  }, [])

  return { send }
}
```

**服务端断线处理：** 客户端断线后，服务端检测到 `OnClose` 事件，将已接收的按键数据写入 Redis 临时缓存（key: `ws:session:{id}`，TTL 5分钟），重连时客户端携带 `last_char_index` 参数，服务端从断点续算。

### 8.9 练习 Session 状态机

```mermaid
stateDiagram-v2
    [*] --> Created : POST /practice/sessions
    Created --> Active : 前端 WebSocket 连接成功
    Active --> Paused : 用户切换 Tab / 失去焦点
    Paused --> Active : 用户返回聚焦
    Active --> Completed : 全部内容输入完成
    Completed --> [*] : PATCH /practice/sessions/:id 提交结果
    Active --> Abandoned : 用户主动退出 / 超时 30 分钟无操作
    Paused --> Abandoned : 超时 30 分钟
    Abandoned --> [*] : ended_at=NULL 保留记录（可统计完成率）
```

**状态说明：**

| 状态 | `ended_at` | `duration_ms` | 说明 |
|------|-----------|--------------|------|
| Created | NULL | NULL | Session 已建，等待开始 |
| Active | NULL | NULL | 正在练习 |
| Paused | NULL | NULL | 暂停（前端本地状态，不写库） |
| Completed | 有值 | 有值 | 正常完成，写入 practice_results |
| Abandoned | NULL | NULL | 未完成，`ended_at` 为 NULL 作为标识 |

前端在以下场景触发 Abandon（静默，不报错给用户）：
- `visibilitychange` 超过 30 分钟后页面返回
- 组件 unmount 时 session 未 Completed

### 8.10 SM-2 评分映射规则

打字练习结束后，需要将练习表现转换为 SM-2 的 quality 分（0-5）来更新 `error_records`。

**映射规则：**

| 练习表现 | Quality 分 | 说明 |
|----------|-----------|------|
| 错误次数 ≥ 3 次 | 1 | 严重错误，间隔重置为 1 天 |
| 错误次数 1-2 次 | 2 | 明显错误，间隔缩短 |
| 错误 0 次但耗时 > 均值 × 1.5 | 3 | 正确但卡顿，勉强通过 |
| 错误 0 次，耗时在均值 1.0-1.5 倍 | 4 | 正确，略有迟疑 |
| 错误 0 次，耗时 ≤ 均值 | 5 | 完美，流畅正确 |

**均值基准：** 取该用户历史所有练习中该内容的 `avg_time_ms`，首次练习取全局 WPM 推算的期望时间。

```go
// utility/sm2/quality.go
func ScoreFromTyping(errorCount int, actualMs, avgMs int64) int {
    if errorCount >= 3 {
        return 1
    }
    if errorCount >= 1 {
        return 2
    }
    if avgMs == 0 {
        return 4 // 首次，无历史均值，给4分
    }
    ratio := float64(actualMs) / float64(avgMs)
    switch {
    case ratio > 1.5:
        return 3
    case ratio > 1.0:
        return 4
    default:
        return 5
    }
}
```

---

## 9. 构建与部署

### 9.1 Makefile

```makefile
.PHONY: dev build docker test

# 本地开发（前后端分离）
dev-backend:
	cd backend && go run main.go

dev-frontend:
	cd frontend && npm run dev

# 生产构建
build:
	cd frontend && npm ci && npm run build
	CGO_ENABLED=0 GOOS=linux GOARCH=amd64 \
		go build -ldflags="-s -w" -o bin/taptype .

# Docker 镜像
docker:
	docker build -t taptype:latest .

# 测试
test:
	go test ./utility/... -v -cover
	go test ./internal/service/... -v
```

### 9.2 Dockerfile（三阶段构建）

```dockerfile
# Stage 1: 构建前端
FROM node:22-alpine AS frontend
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ .
RUN npm run build

# Stage 2: 编译 Go 二进制
FROM golang:1.23-alpine AS builder
WORKDIR /app
# 先复制依赖文件利用 layer 缓存
COPY go.mod go.sum ./
RUN go mod download
# 复制前端产物（embed 需要）
COPY --from=frontend /app/frontend/dist ./frontend/dist
COPY . .
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 \
    go build -ldflags="-s -w" -o taptype .

# Stage 3: 最小运行镜像
FROM scratch
COPY --from=builder /app/taptype /taptype
EXPOSE 8080
ENTRYPOINT ["/taptype"]
```

### 9.3 docker-compose.yml

```yaml
version: '3.8'

services:
  taptype:
    image: taptype:latest
    build: .
    ports:
      - "8080:8080"
    volumes:
      - ./data:/data           # SQLite 文件持久化
    environment:
      - SERVER_PORT=8080
      - DB_DRIVER=sqlite
      - DB_DSN=/data/taptype.db
      - JWT_SECRET=change-this-to-a-random-secret
      - JWT_EXPIRE_HOURS=24
    restart: unless-stopped
```

### 9.4 环境变量完整列表（.env.example）

```env
# 服务器
SERVER_PORT=8080

# 数据库（选其一）
DB_DRIVER=sqlite                         # sqlite | postgres
DB_DSN=./data/taptype.db               # SQLite 路径
# DB_DSN=postgres://user:pass@localhost:5432/taptype  # PostgreSQL

# JWT
JWT_SECRET=your-secret-key-change-this
JWT_EXPIRE_HOURS=24

# 日志
LOG_LEVEL=info                           # debug | info | warn | error

# 功能开关
ALLOW_REGISTER=true                      # 是否允许公开注册（false 则仅管理员可创建用户）
```

### 9.5 Vite 开发代理配置

```typescript
// frontend/vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      '/ws': {
        target: 'ws://localhost:8080',
        ws: true,
      }
    }
  }
})
```

---

## 10. 开发阶段规划

### Phase 1：基础搭建（第 1-2 周）

**交付目标：** 可以运行的 Docker 镜像，能注册登录，前后端联通。

**后端任务：**
- [ ] GoFrame 项目初始化，目录结构按第 5 节创建
- [ ] `utility/db` 实现 SQLite/PG 双驱动切换
- [ ] GORM AutoMigrate 跑通全部表结构
- [ ] JWT 注册/登录/鉴权中间件
- [ ] `GET /api/v1/auth/me` 验证鉴权流程
- [ ] `resource/embed.go` + SPA fallback handler
- [ ] Dockerfile 三阶段构建验证

**前端任务：**
- [ ] Vite + React 19 + Tailwind CSS v4 初始化
- [ ] TanStack Router 文件路由配置
- [ ] TanStack Query 全局配置（baseURL、token 注入、错误拦截）
- [ ] Zustand auth store（登录状态持久化到 localStorage）
- [ ] 登录/注册页面
- [ ] 基础布局（侧边导航 + 主内容区）
- [ ] Vite proxy 联调验证

**验收标准：** `docker compose up` 后浏览器访问 `:8080` 能完成注册和登录。

---

### Phase 2：核心功能（第 3-5 周）

**交付目标：** 完整的内容管理 + 可正常打字练习 + 记录保存。

**后端任务：**
- [ ] 词库 / 单词 CRUD API（含导入导出）
- [ ] 句库 / 句子 CRUD API（含导入导出）
- [ ] 创建练习 Session API（返回练习内容列表）
- [ ] WebSocket Handler（接收按键数据，实时推送 WPM）
- [ ] `utility/wpm` 模块实现 + 单元测试
- [ ] 练习完成提交 API（保存 result + keystroke_stats）
- [ ] 简单错误词记录（提交时写入 error_records）

**前端任务：**
- [ ] 词库管理页面（列表/创建/编辑/删除/导入）
- [ ] 句库管理页面
- [ ] 练习入口页面（选择词库/句库/模式）
- [ ] 核心打字练习页面：
  - [ ] `useTyping` hook（含 IME 处理）
  - [ ] `CharDisplay` 字符状态组件（正确绿/错误红/当前下划线）
  - [ ] `StatsBar` 实时 WPM/准确率显示
  - [ ] `useWebSocket` hook 连接 `/ws/practice`
  - [ ] 练习完成后提交结果并展示总结卡片
- [ ] 历史记录列表页面（分页）

**验收标准：** 能够完整走通"选词库 → 练习 → 查看结果 → 历史记录"流程。

---

### Phase 3：智能学习（第 6-8 周）

**交付目标：** 错误驱动学习系统全面上线，分析可视化完成。

**后端任务：**
- [ ] `utility/sm2` SM-2 算法实现 + 完整单元测试
- [ ] 练习完成时触发 SM-2 更新（错误词 next_review_at 重新计算）
- [ ] 复习队列 API（`GET /api/v1/errors/review-queue`）
- [ ] 一键生成错题强化 Session API
- [ ] 键位弱点分析 API（聚合 keystroke_stats）
- [ ] 历史趋势 API（日/周/月聚合）
- [ ] 综合概要 API
- [ ] 每日 streak 更新逻辑

**前端任务：**
- [ ] 仪表盘页面（今日目标进度、streak 展示、待复习数量入口）
- [ ] 分析页面：WPM 历史折线图（Recharts）
- [ ] 分析页面：准确率趋势折线图
- [ ] 键位热力图（键盘布局 SVG + 错误率着色）
- [ ] 错题集页面（列表 + 下次复习时间显示）
- [ ] 一键强化练习入口
- [ ] 练习总结页面增加：本次错误词高亮、卡顿点分析

**验收标准：** 练习 5 次后，错题集有数据，复习队列正常，分析图表可见。

---

### Phase 4：完善发布（第 9-11 周）

**交付目标：** 生产就绪，文档齐全，可发布 Docker Hub。

**后端任务：**
- [ ] 目标设置 API（每日目标 CRUD）
- [ ] 成就系统（预置成就定义 + 检测逻辑）
- [ ] 成就解锁推送（练习完成后异步检测）
- [ ] OpenAPI v3 文档（GoFrame swagger 集成）
- [ ] 性能压测（100 并发 WS 连接 + 1000 rps REST）
- [ ] 限流中间件上线
- [ ] 管理员接口（用户管理、公开词库审核）
- [ ] 数据库迁移版本控制

**前端任务：**
- [ ] 目标设置页面
- [ ] 成就展示页面（含锁定/解锁状态）
- [ ] 成就解锁弹窗（练习结束后触发）
- [ ] 连续打卡 streak 组件（仪表盘展示）
- [ ] 用户设置页面（修改密码、主题切换）
- [ ] 深色/浅色主题切换（Tailwind dark mode）
- [ ] 移动端响应式适配（PC 优先，但移动端不破坏）

**运维任务：**
- [ ] Docker Hub 自动发布 CI（GitHub Actions）
- [ ] README.md（项目介绍 + 快速部署指南）
- [ ] CHANGELOG.md
- [ ] 健康检查接口 `GET /health`

**验收标准：** `docker run taptype:latest` 能完整体验全部功能，文档可供陌生人自助部署。

---

## 11. 安全规范

### 11.1 认证与授权

- JWT `secret` 必须从环境变量读取，禁止硬编码，长度至少 32 字节随机字符串
- Access Token 有效期 15 分钟，Refresh Token 7 天，存于 HttpOnly Cookie
- 所有写操作（POST/PUT/DELETE）在 Controller 层检查 `user_id == current_user_id`，防止越权操作他人资源
- 管理员接口单独路由组，挂载 `middleware.AdminOnly()` 中间件

### 11.2 输入安全

- SQL 注入：GORM 参数化查询，禁止字符串拼接 SQL
- XSS：前端 React 默认转义，后端 JSON 序列化不会注入 HTML
- 文件上传（导入 CSV/JSON）：限制大小 10MB；只解析预定字段，忽略多余字段；对 `content` 字段长度二次校验
- 批量操作：单次导入上限 5000 条，超出返回 400

### 11.3 限流配置

```go
// internal/middleware/ratelimit.go
// 使用 GoFrame 内置限流或 golang.org/x/time/rate
var limiters = map[string]rate.Limit{
    "/api/v1/auth/login":    rate.Every(1 * time.Second),  // 登录：1次/秒
    "/api/v1/auth/register": rate.Every(10 * time.Second), // 注册：6次/分钟
    "/api/v1/*":             rate.Every(100 * time.Millisecond), // 通用：10次/秒
}
```

### 11.4 数据安全

- 密码：bcrypt cost=12 哈希存储，禁止明文和 MD5/SHA1
- 敏感字段（`password_hash`）：在 GORM model 上加 `json:"-"` 防止序列化泄露
- SQLite 文件权限：容器内 `chmod 600 /data/taptype.db`，Docker volume 挂载到宿主机时提示修改权限
- 日志：禁止打印 JWT token、密码、用户邮箱完整值

---

## 12. 测试策略

### 12.1 测试分层

```
单元测试（utility/*）      → 纯函数，无 IO，快速，必须 100% 覆盖核心算法
集成测试（service/*）      → SQLite :memory: 数据库，覆盖完整业务流程
API 测试（controller/*）   → GoFrame httptest，覆盖请求/响应格式和状态码
E2E 测试（Playwright）     → 覆盖核心用户路径
```

### 12.2 后端关键测试用例

**SM-2 算法（必须全覆盖）：**

```go
func TestSM2Calculate(t *testing.T) {
    tests := []struct {
        name    string
        state   sm2.State
        quality int
        wantInterval int
        wantEF       float64
    }{
        {"首次 quality=5", sm2.State{Interval:1, EasinessFactor:2.5, Repetitions:0}, 5, 1,  2.6},
        {"首次 quality=3", sm2.State{Interval:1, EasinessFactor:2.5, Repetitions:0}, 3, 1,  2.36},
        {"quality<3 重置", sm2.State{Interval:6, EasinessFactor:2.5, Repetitions:2}, 2, 1,  2.18},
        {"EF 最小值保护",  sm2.State{Interval:1, EasinessFactor:1.4, Repetitions:0}, 0, 1,  1.3},
        {"第二次 quality=4", sm2.State{Interval:1, EasinessFactor:2.5, Repetitions:1}, 4, 6,  2.5},
    }
    // ...
}
```

**Streak 更新逻辑：**

```go
func TestUpdateDailyRecord(t *testing.T) {
    // 场景1：首次练习 → streak=1
    // 场景2：昨天有记录 → streak+1
    // 场景3：前天有记录但昨天没有 → streak重置为1
    // 场景4：今天已有记录 → UPSERT更新，streak不变
}
```

### 12.3 前端 Hook 测试（useTyping）

```typescript
// src/hooks/__tests__/useTyping.test.ts
describe('useTyping', () => {
  it('正确字符标记为 correct', () => { /* ... */ })
  it('错误字符标记为 incorrect', () => { /* ... */ })
  it('IME compositionstart 期间忽略按键', () => { /* ... */ })
  it('IME compositionend 后处理最终字符', () => { /* ... */ })
  it('Backspace 回退到上一个字符', () => { /* ... */ })
  it('全部完成后触发 onComplete 回调', () => { /* ... */ })
})
```

### 12.4 CI 流水线（GitHub Actions）

```yaml
# .github/workflows/ci.yml
name: CI
on: [push, pull_request]

jobs:
  backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-go@v5
        with: { go-version: '1.23' }
      - run: go test ./... -race -count=1 -coverprofile=coverage.out
      - run: go vet ./...

  frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '22' }
      - run: cd frontend && npm ci
      - run: cd frontend && npm run type-check
      - run: cd frontend && npm run test

  docker:
    needs: [backend, frontend]
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: docker build -t taptype:ci .
      - run: docker run --rm -e DB_DRIVER=sqlite -e DB_DSN=:memory: taptype:ci /taptype --version
```

---

## 附录

### A. 成就预置数据参考

```json
[
  { "key": "first_practice", "name": "初次练习", "condition": {"type": "practice_count", "value": 1} },
  { "key": "streak_3",       "name": "坚持 3 天", "condition": {"type": "streak", "value": 3} },
  { "key": "streak_7",       "name": "一周连击", "condition": {"type": "streak", "value": 7} },
  { "key": "streak_30",      "name": "月度达人", "condition": {"type": "streak", "value": 30} },
  { "key": "wpm_60",         "name": "速度突破",  "condition": {"type": "best_wpm", "value": 60} },
  { "key": "wpm_100",        "name": "百字飞手",  "condition": {"type": "best_wpm", "value": 100} },
  { "key": "accuracy_99",    "name": "完美主义",  "condition": {"type": "accuracy", "value": 0.99} },
  { "key": "words_1000",     "name": "千词达成",  "condition": {"type": "word_count", "value": 1000} }
]
```

### B. 前端 API 类型定义示例

```typescript
// src/types/api.ts
export interface PracticeSession {
  id: string;
  mode: 'normal' | 'recitation' | 'dictation' | 'review';
  source_type: 'word_bank' | 'sentence_bank' | 'error_list';
  source_id: string | null;
  started_at: string;
  ended_at: string | null;
  duration_ms: number | null;
}

export interface PracticeResult {
  id: string;
  session_id: string;
  wpm: number;
  raw_wpm: number;
  accuracy: number;
  error_count: number;
  char_count: number;
  consistency: number;
  created_at: string;
}

export interface WsStatsMessage {
  type: 'stats';
  wpm: number;
  raw_wpm: number;
  accuracy: number;
  elapsed_ms: number;
  char_index: number;
}

export interface ErrorRecord {
  id: string;
  content_type: 'word' | 'sentence';
  content_id: string;
  content: string;           // 关联查询填充
  error_count: number;
  next_review_at: string;
  review_interval: number;
  easiness_factor: number;
}
```

### C. 关键依赖版本锁定

**Go 模块（go.mod）：**

```
github.com/gogf/gf/v2          v2.7+
gorm.io/gorm                   v1.25+
gorm.io/driver/postgres        v1.5+
modernc.org/sqlite             v1.29+
github.com/golang-jwt/jwt/v5   v5.2+
github.com/pressly/goose/v3    v3.21+   // 数据库迁移
golang.org/x/crypto            latest    // bcrypt
```

**前端（package.json）：**

```json
{
  "dependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "@tanstack/react-router": "^1.x",
    "@tanstack/react-query": "^5.x",
    "zustand": "^5.x",
    "recharts": "^2.x"
  },
  "devDependencies": {
    "vite": "^6.x",
    "@vitejs/plugin-react": "^4.x",
    "tailwindcss": "^4.x",
    "typescript": "^5.x"
  }
}
```

### D. 导入导出格式规范

#### 词库 JSON 格式

```json
{
  "bank": {
    "name": "IELTS 核心词汇",
    "description": "雅思高频词汇 3000",
    "is_public": false
  },
  "words": [
    {
      "content": "aberration",
      "pronunciation": "/ˌæbəˈreɪʃən/",
      "definition": "n. 偏差；失常；像差",
      "example_sentence": "This was an aberration from his usual high standards.",
      "difficulty": 4,
      "tags": ["IELTS", "名词", "高频"]
    }
  ]
}
```

#### 词库 CSV 格式

```
content,pronunciation,definition,example_sentence,difficulty,tags
aberration,/ˌæbəˈreɪʃən/,"n. 偏差；失常","This was an aberration...",4,"IELTS,名词"
accomplish,/əˈkʌmplɪʃ/,"v. 完成；实现","He accomplished his goal.",2,"IELTS,动词"
```

CSV 规则：首行为固定 header；`tags` 字段用逗号分隔后端再解析；含逗号的字段用双引号包裹；`difficulty` 为 1-5 整数，缺省为 1。

#### 句库 JSON 格式

```json
{
  "bank": {
    "name": "科技英语句子",
    "category": "科技",
    "is_public": false
  },
  "sentences": [
    {
      "content": "The algorithm processes data in real time.",
      "source": "MIT Technology Review",
      "difficulty": 3,
      "tags": ["科技", "算法"]
    }
  ]
}
```

**导入接口行为：**
- 单次导入上限：词库 5000 条，句库 2000 条
- 重复内容（同一 bank 内 content 相同）：跳过，不报错，返回跳过数量
- 部分失败：记录失败行号和原因，成功的继续写入（非事务性导入）
- 响应格式：`{ "imported": 120, "skipped": 3, "failed": 1, "errors": [{"row": 5, "reason": "difficulty out of range"}] }`

### E. Zustand Store 结构

```typescript
// src/stores/authStore.ts
interface AuthState {
  accessToken: string | null
  user: { id: string; username: string; role: 'user' | 'admin' } | null
  isAuthenticated: boolean
  login: (token: string, user: AuthState['user']) => void
  logout: () => void
  // refresh token 在 httpOnly cookie，不在 store 里
}

// src/stores/practiceStore.ts
interface PracticeState {
  // Session 元信息
  sessionId: string | null
  mode: PracticeMode | null
  items: PracticeItem[]          // 当前练习内容列表
  currentIndex: number           // 当前练习到第几个

  // 实时打字状态（每次按键更新）
  inputBuffer: string            // 当前正在输入的字符串
  charStates: CharState[]        // 每个字符：'pending'|'correct'|'incorrect'
  startTime: number | null       // 开始时间戳（ms）
  keyTimestamps: Map<string, number[]>  // 键位 → 时间戳列表，用于卡顿分析

  // 实时统计（WebSocket 服务端推送）
  wpm: number
  rawWpm: number
  accuracy: number
  elapsedMs: number

  // WS 状态
  wsStatus: 'connecting' | 'connected' | 'reconnecting' | 'error'
  wsError: string | null

  // Actions
  startSession: (sessionId: string, mode: PracticeMode, items: PracticeItem[]) => void
  recordKeystroke: (char: string, isCorrect: boolean) => void
  updateStats: (stats: WsStatsMessage) => void
  nextItem: () => void
  completeSession: () => SessionSummary
  resetSession: () => void
  setWsError: (msg: string) => void
}
```

### F. 测试策略

#### 后端单元测试（必须覆盖）

| 模块 | 测试文件 | 覆盖要点 |
|------|---------|---------|
| `utility/sm2` | `sm2_test.go` | Quality 0-5 各分支；E-Factor 边界（最小 1.3）；间隔计算正确性 |
| `utility/wpm` | `wpm_test.go` | WPM/准确率/一致性公式；零除保护；极端值（0字符、0毫秒） |
| `utility/sm2` | `quality_test.go` | 打字表现 → Quality 映射的 5 个分支 |
| `service/practice` | `streak_test.go` | 首次练习 streak=1；连续天+1；中断后重置为1 |
| `service/auth` | `auth_test.go` | 密码哈希/验证；Token 生成/解析；过期检测 |

测试运行命令：`go test ./... -count=1 -race -cover`

#### 后端集成测试

使用 SQLite 内存模式（`:memory:`）作为测试数据库，每个测试用例独立数据库，无需 mock：

```go
func setupTestDB(t *testing.T) *gorm.DB {
    db, _ := db.Init("sqlite", ":memory:")
    t.Cleanup(func() { sqlDB, _ := db.DB(); sqlDB.Close() })
    return db
}
```

#### 前端测试

| 类型 | 工具 | 覆盖要点 |
|------|------|---------|
| Hook 单元测试 | Vitest + `@testing-library/react-hooks` | `useTyping` IME 处理；WPM 计算；错误字符标记 |
| 组件测试 | Vitest + Testing Library | `CharDisplay` 字符状态渲染；`StatsBar` 数据显示 |
| E2E | Playwright | 完整练习流程；登录注册；词库导入 |

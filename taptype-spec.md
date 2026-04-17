# TapType — 项目完整技术规格文档

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
13. [设置模块](#13-设置模块)
    - 13.1 [设计原则](#131-设计原则)
    - 13.2 [表结构设计](#132-表结构设计)
    - 13.3 [设置定义种子数据](#133-设置定义种子数据)
    - 13.4 [Go 服务层实现](#134-go-服务层实现)
    - 13.5 [API 接口](#135-api-接口)
    - 13.6 [前端集成](#136-前端集成)
    - 13.7 [新增设置的操作规范](#137-新增设置的操作规范)
14. [文章库模块](#14-文章库模块)
    - 14.1 [与句库的核心区别](#141-与句库的核心区别)
    - 14.2 [表结构设计](#142-表结构设计)
    - 14.3 [分段策略](#143-分段策略)
    - 14.4 [进度追踪](#144-进度追踪)
    - 14.5 [练习系统集成](#145-练习系统集成)
    - 14.6 [API 接口](#146-api-接口)
    - 14.7 [迁移文件](#147-迁移文件)
    - 14.8 [目录结构补充](#148-目录结构补充)
15. [媒体文件存储](#15-媒体文件存储)
    - 15.1 [设计原则](#151-设计原则)
    - 15.2 [表结构](#152-表结构)
    - 15.3 [设置定义种子数据](#153-设置定义种子数据)
    - 15.4 [Go 服务层实现](#154-go-服务层实现)
    - 15.5 [API 接口](#155-api-接口)
    - 15.6 [迁移文件](#156-迁移文件)
    - 15.7 [新增文件类型的操作规范](#157-新增文件类型的操作规范)
    - 15.8 [前端集成](#158-前端集成)

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
| ------ | ------ | ------ |
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
        │   ├── content/
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
    id                 TEXT PRIMARY KEY,
    bank_id            TEXT NOT NULL REFERENCES sentence_banks(id),
    content            TEXT NOT NULL,
    translation        TEXT,                    -- 释义/译文，练习时展示在打字区下方
    -- 记录释义来源，便于未来扩展翻译 API
    -- 'manual'=手动填写；'api:deepl'|'api:openai'=翻译 API 自动填充
    translation_source TEXT NOT NULL DEFAULT 'manual',
    source             TEXT,                    -- 内容来源，如书名、网址
    difficulty         INTEGER NOT NULL DEFAULT 1,
    word_count         INTEGER NOT NULL DEFAULT 0,  -- 词数，入库时计算
    tags               TEXT,                    -- JSON 数组字符串
    created_at         DATETIME NOT NULL,
    updated_at         DATETIME NOT NULL
);
```

**`translation_source` 扩展规范：** 当前合法值为 `manual`。接入翻译 API 后，按 `api:{provider}` 格式写入，如 `api:deepl`、`api:openai`。后端可据此决定是否允许覆盖（手动填写的优先级高于 API 自动填充）。

**句库导入 CSV/JSON 新增字段：**

```json
{
  "content": "The algorithm processes data in real time.",
  "translation": "该算法实时处理数据。",
  "translation_source": "manual",
  "source": "MIT Technology Review",
  "difficulty": 3,
  "tags": ["科技", "算法"]
}
```

CSV 新增 `translation` 列，`translation_source` 缺省时默认写入 `manual`。

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
    "typecraft/migrations"
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
	goose -dir migrations sqlite3 ./data/typecraft.db status

# 手动执行迁移（正常用不到，启动时自动跑）
migrate-up:
	goose -dir migrations sqlite3 ./data/typecraft.db up

# 回滚最后一个迁移（谨慎使用）
migrate-down:
	goose -dir migrations sqlite3 ./data/typecraft.db down

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
| -------- | ----------- | ------ | ---------- |
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

**交付目标：** 能注册登录，前后端联通。

**后端任务：**

- [x] GoFrame 项目初始化，目录结构按第 5 节创建
- [x] `utility/db` 实现 SQLite/PG 双驱动切换
- [x] 使用 goose 管理表结构
- [x] JWT 注册/登录/鉴权中间件
- [x] `GET /api/v1/auth/me` 验证鉴权流程
- [x] `resource/embed.go` + SPA fallback handler
- [x] Dockerfile 三阶段构建验证

**前端任务：**

- [x] Vite + React 19 + Tailwind CSS v4 项目初始化
- [x] TanStack Router 文件路由配置
- [x] TanStack Query 全局配置（baseURL、token 注入、错误拦截）
- [x] Zustand auth store（登录状态持久化到 localStorage）
- [x] 登录/注册页面
- [x] 基础布局（侧边导航 + 主内容区）
- [x] Vite proxy 联调验证

**验收标准：** 项目启动后浏览器访问 `:8080` 能完成注册和登录。

---

### Phase 2：核心功能（第 3-5 周）

**交付目标：** 完整的内容管理 + 可正常打字练习 + 记录保存。

**后端任务：**

- [x] 词库 / 单词 CRUD API（含导入导出）
- [x] 句库 / 句子 CRUD API（含导入导出）
- [x] 创建练习 Session API（返回练习内容列表）
- [x] WebSocket Handler（接收按键数据，实时推送 WPM）
- [x] `utility/wpm` 模块实现 + 单元测试
- [x] 练习完成提交 API（保存 result + keystroke_stats）
- [x] 简单错误词记录（提交时写入 error_records）

**前端任务：**

- [x] 词库管理页面（列表/创建/编辑/删除/导入）
- [x] 句库管理页面
- [x] 练习入口页面（选择词库/句库/模式）
- [x] 核心打字练习页面：
  - [x] `useTyping` hook（含 IME 处理）
  - [x] `CharDisplay` 字符状态组件（正确绿/错误红/当前下划线）
  - [x] `StatsBar` 实时 WPM/准确率显示
  - [x] `useWebSocket` hook 连接 `/ws/practice`
  - [x] 练习完成后提交结果并展示总结卡片
- [x] 历史记录列表页面（分页）

**验收标准：** 能够完整走通"选词库 → 练习 → 查看结果 → 历史记录"流程。

---

### Phase 3：智能学习（第 6-8 周）

**交付目标：** 错误驱动学习系统全面上线，分析可视化完成。

**后端任务：**

- [x] `utility/sm2` SM-2 算法实现 + 完整单元测试
- [x] 练习完成时触发 SM-2 更新（错误词 next_review_at 重新计算）
- [x] 复习队列 API（`GET /api/v1/errors/review-queue`）
- [x] 一键生成错题强化 Session API
- [x] 键位弱点分析 API（聚合 keystroke_stats）
- [x] 历史趋势 API（日/周/月聚合）
- [x] 综合概要 API
- [x] 每日 streak 更新逻辑

**前端任务：**

- [x] 仪表盘页面（今日目标进度、streak 展示、待复习数量入口）
- [x] 分析页面：WPM 历史折线图（Recharts）
- [x] 分析页面：准确率趋势折线图
- [x] 键位热力图（键盘布局 SVG + 错误率着色）
- [x] 错题集页面（列表 + 下次复习时间显示）
- [x] 一键强化练习入口
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

## 13. 设置模块

### 13.1 设计原则

设置模块随项目复杂度持续增长，必须在首次设计时解决可扩展性问题，避免每次新增设置都要改表结构。

**核心矛盾：**

- 硬编码列方案（每个设置一列）：类型安全、查询简单，但每加一个设置都要加列、加迁移、改代码
- 纯 EAV（key-value 表）：无限扩展，但没有类型约束、难以验证、前端无法自描述

**本项目采用"定义驱动的 KV 存储"方案：**

```
setting_definitions（设置定义表，相当于 schema）
    ↓ 描述设置的类型、默认值、校验规则、UI 元信息
system_settings（系统级设置值，admin 管理）
user_settings（用户级设置值，用户自管理）
    ↑ 两张值表均通过 definition_key 引用定义表
```

**方案核心优势：**

| 能力                   | 实现方式                                                     |
| ---------------------- | ------------------------------------------------------------ |
| 新增设置不改表结构     | 只需插入一条 `setting_definitions` 记录（一条迁移 SQL）      |
| 类型安全               | `type` 字段 + `validation_rule` JSON 驱动后端校验            |
| 前端自描述             | `/api/v1/settings/definitions` 返回完整元信息，前端动态渲染设置页 |
| 系统控制用户设置可见性 | `setting_controls` 表，admin 可逐项关闭用户设置的可见/可编辑状态 |
| 默认值管理             | `default_value` 存在定义表，未配置时 fallback 到默认值       |
| 设置分组               | `group_key` 字段，前端按分组渲染 tab/section                 |

### 13.2 表结构设计

#### 实体关系

```mermaid
erDiagram
    SETTING_DEFINITIONS ||--o{ SYSTEM_SETTINGS : "has value"
    SETTING_DEFINITIONS ||--o{ USER_SETTINGS : "has value"
    SETTING_DEFINITIONS ||--o{ SETTING_CONTROLS : "controlled by"
    USERS ||--o{ USER_SETTINGS : owns
    USERS ||--o{ SETTING_CONTROLS : "admin sets"

    SETTING_DEFINITIONS {
        text key PK
        text scope
        text type
        text group_key
        text label
        text description
        text default_value
        text enum_options
        text validation_rule
        integer is_public
        integer sort_order
        datetime created_at
        datetime updated_at
    }
    SYSTEM_SETTINGS {
        text id PK
        text definition_key FK
        text value
        text updated_by
        datetime updated_at
    }
    USER_SETTINGS {
        text id PK
        text user_id FK
        text definition_key FK
        text value
        datetime updated_at
    }
    SETTING_CONTROLS {
        text id PK
        text definition_key FK
        integer is_visible
        integer is_editable
        text updated_by
        datetime updated_at
    }
```

#### setting_definitions — 设置定义表

所有设置的 schema，由开发者在迁移文件中管理，**运行时只读**。

```sql
CREATE TABLE setting_definitions (
    key             TEXT PRIMARY KEY,
    -- 'system'：仅 admin 可读写；'user'：用户可读写自己的值
    scope           TEXT NOT NULL CHECK(scope IN ('system', 'user')),
    -- 值类型，用于后端校验和前端渲染
    type            TEXT NOT NULL CHECK(type IN ('bool','string','int','float','enum','json')),
    -- UI 分组，如 'account'|'practice'|'display'|'advanced'
    group_key       TEXT NOT NULL DEFAULT 'general',
    label           TEXT NOT NULL,           -- 前端显示名称（可国际化 key）
    description     TEXT,                    -- 设置说明
    default_value   TEXT NOT NULL,           -- 默认值（始终为字符串，按 type 解析）
    -- type=enum 时，合法选项 JSON 数组，如 '["light","dark","system"]'
    enum_options    TEXT,
    -- 校验规则 JSON，如 '{"min":1,"max":100}' 或 '{"regex":"^https?://"}'
    validation_rule TEXT,
    -- 是否在公开 API 中暴露（false 表示仅 admin 可见）
    is_public       INTEGER NOT NULL DEFAULT 1,
    sort_order      INTEGER NOT NULL DEFAULT 0,
    created_at      DATETIME NOT NULL,
    updated_at      DATETIME NOT NULL
);
```

#### system_settings — 系统设置值表

```sql
CREATE TABLE system_settings (
    id              TEXT PRIMARY KEY,
    definition_key  TEXT NOT NULL UNIQUE REFERENCES setting_definitions(key),
    value           TEXT NOT NULL,
    updated_by      TEXT NOT NULL REFERENCES users(id),  -- 哪个 admin 最后修改
    updated_at      DATETIME NOT NULL
);
```

**说明：** 每个 system setting key 只有一条记录（`UNIQUE`）。未配置时从 `setting_definitions.default_value` 读取，UPSERT 写入。

#### user_settings — 用户设置值表

```sql
CREATE TABLE user_settings (
    id              TEXT PRIMARY KEY,
    user_id         TEXT NOT NULL REFERENCES users(id),
    definition_key  TEXT NOT NULL REFERENCES setting_definitions(key),
    value           TEXT NOT NULL,
    updated_at      DATETIME NOT NULL,
    UNIQUE(user_id, definition_key)
);

CREATE INDEX idx_user_settings_user ON user_settings(user_id);
```

**说明：** 每个用户每个 key 只有一条记录（`UNIQUE`），UPSERT 更新。未配置时从 `setting_definitions.default_value` 读取。

#### setting_controls — 系统对用户设置的管控表

admin 可以关闭某个用户设置的可见性或可编辑性（例如：禁止用户修改主题、强制所有人使用默认语言）。

```sql
CREATE TABLE setting_controls (
    id              TEXT PRIMARY KEY,
    -- 只有 scope='user' 的设置才有意义被管控
    definition_key  TEXT NOT NULL UNIQUE REFERENCES setting_definitions(key),
    -- 是否在用户设置页面展示此设置项（false = 完全隐藏）
    is_visible      INTEGER NOT NULL DEFAULT 1,
    -- 是否允许用户修改此设置（false = 展示但灰显，不可修改）
    is_editable     INTEGER NOT NULL DEFAULT 1,
    updated_by      TEXT NOT NULL REFERENCES users(id),
    updated_at      DATETIME NOT NULL
);
```

### 13.3 设置定义种子数据

迁移文件 `000010_seed_setting_definitions.sql`，所有设置集中在此定义：

```sql
-- +goose Up
INSERT INTO setting_definitions
    (key, scope, type, group_key, label, description, default_value, enum_options, validation_rule, is_public, sort_order, created_at, updated_at)
VALUES
-- ============================================================
-- 系统设置（scope = 'system'）
-- ============================================================
('system.allow_register',
 'system','bool','security',
 '允许公开注册','关闭后只有管理员可创建新用户',
 'true', NULL, NULL, 0, 10, datetime('now'), datetime('now')),

('system.allow_username_change',
 'system','bool','security',
 '允许修改用户名','关闭后用户不可自行修改用户名',
 'true', NULL, NULL, 0, 20, datetime('now'), datetime('now')),

('system.allow_nickname_change',
 'system','bool','security',
 '允许修改昵称','关闭后用户不可自行修改显示昵称',
 'true', NULL, NULL, 0, 30, datetime('now'), datetime('now')),

('system.site_host',
 'system','string','general',
 '站点地址','用于生成对外链接，末尾不含斜杠',
 'http://localhost:8080', NULL, '{"regex":"^https?://"}', 0, 40, datetime('now'), datetime('now')),

('system.max_word_banks_per_user',
 'system','int','limits',
 '每用户词库上限','每个用户最多可创建的词库数量，0 表示不限制',
 '20', NULL, '{"min":0,"max":1000}', 0, 50, datetime('now'), datetime('now')),

('system.max_sentence_banks_per_user',
 'system','int','limits',
 '每用户句库上限','每个用户最多可创建的句库数量，0 表示不限制',
 '20', NULL, '{"min":0,"max":1000}', 0, 60, datetime('now'), datetime('now')),

('system.max_words_per_bank',
 'system','int','limits',
 '每词库单词上限','单个词库最多容纳的单词数，0 表示不限制',
 '5000', NULL, '{"min":0,"max":100000}', 0, 70, datetime('now'), datetime('now')),

-- ============================================================
-- 用户设置（scope = 'user'）— 显示与外观
-- ============================================================
('user.language',
 'user','enum','display',
 '界面语言',NULL,
 'zh-CN', '["zh-CN","en-US"]', NULL, 1, 10, datetime('now'), datetime('now')),

('user.theme',
 'user','enum','display',
 '主题','light=浅色，dark=深色，system=跟随系统',
 'system', '["light","dark","system"]', NULL, 1, 20, datetime('now'), datetime('now')),

('user.font_size',
 'user','enum','display',
 '字体大小',NULL,
 'medium', '["small","medium","large"]', NULL, 1, 30, datetime('now'), datetime('now')),

-- ============================================================
-- 用户设置（scope = 'user'）— 打字练习偏好
-- ============================================================
('user.practice.show_wpm',
 'user','bool','practice',
 '练习时显示 WPM','关闭后练习中不显示实时速度',
 'true', NULL, NULL, 1, 100, datetime('now'), datetime('now')),

('user.practice.show_accuracy',
 'user','bool','practice',
 '练习时显示准确率',NULL,
 'true', NULL, NULL, 1, 110, datetime('now'), datetime('now')),

('user.practice.show_timer',
 'user','bool','practice',
 '练习时显示计时器',NULL,
 'true', NULL, NULL, 1, 120, datetime('now'), datetime('now')),

('user.practice.enable_sound',
 'user','bool','practice',
 '按键音效','启用后每次击键播放音效',
 'false', NULL, NULL, 1, 130, datetime('now'), datetime('now')),

('user.practice.enable_pronunciation',
 'user','bool','practice',
 '自动发音','进入下一个单词时自动播放发音',
 'false', NULL, NULL, 1, 140, datetime('now'), datetime('now')),

('user.practice.pronunciation_voice',
 'user','enum','practice',
 '发音音色','朗读单词时使用的语音',
 'en-US', '["en-US","en-GB","en-AU"]', NULL, 1, 150, datetime('now'), datetime('now')),

('user.practice.auto_next',
 'user','bool','practice',
 '自动进入下一题','当前项目完成后自动跳转，无需手动确认',
 'false', NULL, NULL, 1, 160, datetime('now'), datetime('now')),

('user.practice.show_keyboard_hint',
 'user','bool','practice',
 '显示键位提示','在屏幕底部显示虚拟键盘，高亮下一个待输入键',
 'false', NULL, NULL, 1, 170, datetime('now'), datetime('now')),

('user.practice.mistake_behavior',
 'user','enum','practice',
 '出错时行为','stop=停留在错误字符；continue=继续输入覆盖',
 'stop', '["stop","continue"]', NULL, 1, 180, datetime('now'), datetime('now'));

-- +goose Down
DELETE FROM setting_definitions WHERE key LIKE 'system.%' OR key LIKE 'user.%';
```

### 13.4 Go 服务层实现

#### GORM Model

```go
// internal/dao/internal/model/setting.go

type SettingDefinition struct {
    Key            string    `gorm:"primaryKey"`
    Scope          string    `gorm:"not null"`             // 'system'|'user'
    Type           string    `gorm:"not null"`
    GroupKey       string    `gorm:"not null;default:'general'"`
    Label          string    `gorm:"not null"`
    Description    string
    DefaultValue   string    `gorm:"not null"`
    EnumOptions    string                                  // JSON 数组字符串
    ValidationRule string                                  // JSON 对象字符串
    IsPublic       bool      `gorm:"not null;default:true"`
    SortOrder      int       `gorm:"not null;default:0"`
    CreatedAt      time.Time
    UpdatedAt      time.Time
}

type SystemSetting struct {
    ID            string    `gorm:"primaryKey"`
    DefinitionKey string    `gorm:"not null;uniqueIndex"`
    Value         string    `gorm:"not null"`
    UpdatedBy     string    `gorm:"not null"`
    UpdatedAt     time.Time
}

type UserSetting struct {
    ID            string    `gorm:"primaryKey"`
    UserID        string    `gorm:"not null;index"`
    DefinitionKey string    `gorm:"not null"`
    Value         string    `gorm:"not null"`
    UpdatedAt     time.Time
}

func (UserSetting) UniqueIndex() [][]string {
    return [][]string{{"user_id", "definition_key"}}
}

type SettingControl struct {
    ID            string    `gorm:"primaryKey"`
    DefinitionKey string    `gorm:"not null;uniqueIndex"`
    IsVisible     bool      `gorm:"not null;default:true"`
    IsEditable    bool      `gorm:"not null;default:true"`
    UpdatedBy     string    `gorm:"not null"`
    UpdatedAt     time.Time
}
```

#### 服务接口

```go
// internal/service/settings/settings.go
type ISettingService interface {
    // 系统设置（admin only）
    GetSystemSetting(ctx context.Context, key string) (string, error)
    GetSystemSettingBool(ctx context.Context, key string) (bool, error)
    GetSystemSettingInt(ctx context.Context, key string) (int, error)
    SetSystemSetting(ctx context.Context, key, value, adminID string) error
    GetAllSystemSettings(ctx context.Context) (map[string]string, error)

    // 用户设置
    GetUserSetting(ctx context.Context, userID, key string) (string, error)
    GetUserSettingBool(ctx context.Context, userID, key string) (bool, error)
    GetAllUserSettings(ctx context.Context, userID string) (map[string]string, error)
    SetUserSetting(ctx context.Context, userID, key, value string) error
    BatchSetUserSettings(ctx context.Context, userID string, kvs map[string]string) error

    // 设置定义查询（前端自描述）
    GetDefinitions(ctx context.Context, scope string, isPublic bool) ([]*model.SettingDefinition, error)

    // 管控接口（admin only）
    SetSettingControl(ctx context.Context, key string, isVisible, isEditable bool, adminID string) error
    GetSettingControls(ctx context.Context) (map[string]model.SettingControl, error)
}
```

#### 服务实现（含缓存和降级）

```go
// internal/service/settings/settings_impl.go

type settingService struct {
    db    *gorm.DB
    cache gcache.Cache  // GoFrame 内置缓存，system settings 热路径用
}

// GetSystemSetting 读系统设置，优先从缓存取，缓存 TTL=5 分钟
// 未配置时降级到 default_value
func (s *settingService) GetSystemSetting(ctx context.Context, key string) (string, error) {
    cacheKey := "sys_setting:" + key
    if v := s.cache.MustGet(ctx, cacheKey); !v.IsNil() {
        return v.String(), nil
    }

    var ss model.SystemSetting
    err := s.db.WithContext(ctx).Where("definition_key = ?", key).First(&ss).Error
    if errors.Is(err, gorm.ErrRecordNotFound) {
        // 降级到默认值
        return s.getDefaultValue(ctx, key)
    }
    if err != nil {
        return "", err
    }
    _ = s.cache.Set(ctx, cacheKey, ss.Value, 5*time.Minute)
    return ss.Value, nil
}

func (s *settingService) GetSystemSettingBool(ctx context.Context, key string) (bool, error) {
    v, err := s.GetSystemSetting(ctx, key)
    if err != nil {
        return false, err
    }
    return v == "true", nil
}

func (s *settingService) GetSystemSettingInt(ctx context.Context, key string) (int, error) {
    v, err := s.GetSystemSetting(ctx, key)
    if err != nil {
        return 0, err
    }
    return strconv.Atoi(v)
}

// SetSystemSetting 写入后立即清除缓存
func (s *settingService) SetSystemSetting(ctx context.Context, key, value, adminID string) error {
    // 1. 校验 key 存在且 scope=system
    def, err := s.getDefinition(ctx, key)
    if err != nil || def.Scope != "system" {
        return gerror.NewCode(code.CodeNotFound, "system setting not found")
    }
    // 2. 类型校验
    if err := s.validate(def, value); err != nil {
        return err
    }
    // 3. UPSERT
    now := time.Now()
    result := s.db.WithContext(ctx).
        Where("definition_key = ?", key).
        Assign(model.SystemSetting{Value: value, UpdatedBy: adminID, UpdatedAt: now}).
        FirstOrCreate(&model.SystemSetting{
            ID: uuid.New().String(), DefinitionKey: key,
        })
    if result.Error != nil {
        return result.Error
    }
    // 4. 清除缓存（写穿策略）
    _ = s.cache.Remove(ctx, "sys_setting:"+key)
    return nil
}

// GetAllUserSettings 返回用户所有设置，未配置的项用 default_value 补齐
func (s *settingService) GetAllUserSettings(ctx context.Context, userID string) (map[string]string, error) {
    // 1. 取所有 user scope 的定义和默认值
    var defs []model.SettingDefinition
    s.db.WithContext(ctx).Where("scope = ?", "user").Find(&defs)

    result := make(map[string]string, len(defs))
    for _, d := range defs {
        result[d.Key] = d.DefaultValue // 先用默认值填充
    }

    // 2. 覆盖用户已配置的值
    var settings []model.UserSetting
    s.db.WithContext(ctx).Where("user_id = ?", userID).Find(&settings)
    for _, us := range settings {
        result[us.DefinitionKey] = us.Value
    }
    return result, nil
}

// validate 根据定义中的 type 和 validation_rule 校验 value 合法性
func (s *settingService) validate(def *model.SettingDefinition, value string) error {
    switch def.Type {
    case "bool":
        if value != "true" && value != "false" {
            return gerror.NewCode(code.CodeBadRequest, "value must be 'true' or 'false'")
        }
    case "int":
        n, err := strconv.Atoi(value)
        if err != nil {
            return gerror.NewCode(code.CodeBadRequest, "value must be an integer")
        }
        if def.ValidationRule != "" {
            var rule struct{ Min, Max *int }
            _ = json.Unmarshal([]byte(def.ValidationRule), &rule)
            if rule.Min != nil && n < *rule.Min {
                return gerror.NewCode(code.CodeBadRequest, fmt.Sprintf("value must be >= %d", *rule.Min))
            }
            if rule.Max != nil && n > *rule.Max {
                return gerror.NewCode(code.CodeBadRequest, fmt.Sprintf("value must be <= %d", *rule.Max))
            }
        }
    case "enum":
        var opts []string
        _ = json.Unmarshal([]byte(def.EnumOptions), &opts)
        for _, o := range opts {
            if o == value {
                return nil
            }
        }
        return gerror.NewCode(code.CodeBadRequest, fmt.Sprintf("value must be one of %v", opts))
    case "string":
        if def.ValidationRule != "" {
            var rule struct{ Regex string; MaxLength *int }
            _ = json.Unmarshal([]byte(def.ValidationRule), &rule)
            if rule.Regex != "" {
                matched, _ := regexp.MatchString(rule.Regex, value)
                if !matched {
                    return gerror.NewCode(code.CodeBadRequest, "value format invalid")
                }
            }
        }
    }
    return nil
}
```

#### 中间件：系统设置检查

系统设置作为中间件直接注入路由，无需在每个 Controller 里单独读取：

```go
// internal/middleware/settings.go

// CheckAllowRegister 检查是否允许注册，直接挂到注册路由上
func CheckAllowRegister() ghttp.HandlerFunc {
    return func(r *ghttp.Request) {
        allowed, _ := settingSvc.GetSystemSettingBool(r.Context(), "system.allow_register")
        if !allowed {
            r.Response.WriteJsonExit(g.Map{
                "code": 40301, "message": "registration is disabled by administrator",
            })
        }
        r.Middleware.Next()
    }
}

// InjectUserSettings 将用户设置注入 Context，Controller/Service 可直接取
func InjectUserSettings() ghttp.HandlerFunc {
    return func(r *ghttp.Request) {
        userID := r.GetCtxVar("userID").String()
        if userID != "" {
            settings, _ := settingSvc.GetAllUserSettings(r.Context(), userID)
            ctx := context.WithValue(r.Context(), ctxKeyUserSettings, settings)
            r.SetCtx(ctx)
        }
        r.Middleware.Next()
    }
}

// 路由挂载示例（internal/cmd/cmd.go）
s.Group("/api/v1/auth", func(group *ghttp.RouterGroup) {
    group.POST("/register",
        middleware.CheckAllowRegister(),  // 注册路由加系统设置检查
        controller.Auth.Register,
    )
})
```

### 13.5 API 接口

#### 系统设置（Admin Only）

```
GET    /api/v1/admin/settings
       返回所有系统设置（含定义元信息 + 当前值），仅 admin 可见

PUT    /api/v1/admin/settings/:key
       修改单个系统设置
       Body: { "value": "false" }

GET    /api/v1/admin/settings/user-controls
       返回所有 user scope 设置的管控状态列表

PUT    /api/v1/admin/settings/user-controls/:key
       修改某个用户设置项的管控状态
       Body: { "is_visible": true, "is_editable": false }
```

#### 用户设置

```
GET    /api/v1/settings/definitions
       返回对当前用户可见的设置定义列表（含管控状态），用于前端动态渲染设置页
       已被 is_visible=false 管控的设置不返回

GET    /api/v1/settings
       返回当前用户所有设置的实际值（未配置项返回 default_value）

PUT    /api/v1/settings/:key
       修改单个用户设置
       Body: { "value": "dark" }
       校验：is_editable=false 的设置拒绝写入（403）

PUT    /api/v1/settings
       批量修改用户设置（Settings 页面保存按钮）
       Body: { "user.theme": "dark", "user.language": "en-US" }
```

#### 响应格式示例

`GET /api/v1/settings/definitions` 响应：

```json
{
  "code": 0,
  "data": {
    "groups": [
      {
        "key": "display",
        "label": "显示与外观",
        "items": [
          {
            "key": "user.language",
            "type": "enum",
            "label": "界面语言",
            "description": null,
            "default_value": "zh-CN",
            "enum_options": ["zh-CN", "en-US"],
            "current_value": "zh-CN",
            "is_editable": true
          },
          {
            "key": "user.theme",
            "type": "enum",
            "label": "主题",
            "default_value": "system",
            "enum_options": ["light", "dark", "system"],
            "current_value": "dark",
            "is_editable": true
          }
        ]
      },
      {
        "key": "practice",
        "label": "打字练习",
        "items": [
          {
            "key": "user.practice.enable_pronunciation",
            "type": "bool",
            "label": "自动发音",
            "current_value": "false",
            "is_editable": false
          }
        ]
      }
    ]
  }
}
```

### 13.6 前端集成

#### 设置 Store（Zustand）

```typescript
// src/stores/settingsStore.ts
interface SettingsState {
  // 用户设置（key → value 字符串映射）
  userSettings: Record<string, string>
  isLoaded: boolean

  // 辅助 getter（避免在组件里手动解析字符串）
  getBool: (key: string) => boolean
  getEnum: (key: string) => string
  getInt: (key: string) => number

  setUserSettings: (settings: Record<string, string>) => void
  updateSetting: (key: string, value: string) => void
}

const useSettingsStore = create<SettingsState>((set, get) => ({
  userSettings: {},
  isLoaded: false,
  getBool: (key) => get().userSettings[key] === 'true',
  getEnum: (key) => get().userSettings[key] ?? '',
  getInt: (key) => parseInt(get().userSettings[key] ?? '0', 10),
  setUserSettings: (settings) => set({ userSettings: settings, isLoaded: true }),
  updateSetting: (key, value) =>
    set((s) => ({ userSettings: { ...s.userSettings, [key]: value } })),
}))
```

#### TanStack Query Hooks

```typescript
// src/api/settings.ts

// 登录后立即拉取用户设置并注入 store
export function useUserSettings() {
  return useQuery({
    queryKey: ['settings', 'user'],
    queryFn: () => request<Record<string, string>>('/settings'),
    onSuccess: (data) => useSettingsStore.getState().setUserSettings(data),
    staleTime: 5 * 60 * 1000,  // 5 分钟内不重新请求
  })
}

// 设置定义（含管控状态），用于渲染设置页
export function useSettingDefinitions() {
  return useQuery({
    queryKey: ['settings', 'definitions'],
    queryFn: () => request<SettingDefinitionsResponse>('/settings/definitions'),
    staleTime: 10 * 60 * 1000,
  })
}

// 批量保存（防抖 + 乐观更新）
export function useSaveSettings() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (kvs: Record<string, string>) =>
      request('/settings', { method: 'PUT', body: JSON.stringify(kvs) }),
    onMutate: (kvs) => {
      // 乐观更新本地 store，不等服务端响应
      Object.entries(kvs).forEach(([k, v]) =>
        useSettingsStore.getState().updateSetting(k, v)
      )
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['settings'] }),
  })
}
```

#### 在练习组件中消费设置

```typescript
// src/routes/practice/session.tsx
function PracticeSession() {
  const showWpm        = useSettingsStore(s => s.getBool('user.practice.show_wpm'))
  const enableSound    = useSettingsStore(s => s.getBool('user.practice.enable_sound'))
  const mistakeBehavior = useSettingsStore(s => s.getEnum('user.practice.mistake_behavior'))
  const autoPronounce  = useSettingsStore(s => s.getBool('user.practice.enable_pronunciation'))

  // 组件直接读 store，无需重新请求 API
  return (
    <div>
      {showWpm && <StatsBar />}
      <TypingArea mistakeBehavior={mistakeBehavior} onCorrect={() => {
        if (enableSound) playKeySound()
        if (autoPronounce) pronounce(currentWord)
      }} />
    </div>
  )
}
```

#### 设置页面动态渲染

```typescript
// src/routes/settings/index.tsx
// 基于 definitions API 动态渲染，新增设置无需改前端代码

function SettingsPage() {
  const { data } = useSettingDefinitions()
  const { mutate: save } = useSaveSettings()
  const [draft, setDraft] = useState<Record<string, string>>({})

  return (
    <div>
      {data?.groups.map(group => (
        <section key={group.key}>
          <h2>{group.label}</h2>
          {group.items.map(item => (
            <SettingItem
              key={item.key}
              definition={item}
              value={draft[item.key] ?? item.current_value}
              disabled={!item.is_editable}
              onChange={(v) => setDraft(d => ({ ...d, [item.key]: v }))}
            />
          ))}
        </section>
      ))}
      <button onClick={() => save(draft)}>保存</button>
    </div>
  )
}

// SettingItem 根据 type 自动渲染对应控件
function SettingItem({ definition, value, disabled, onChange }) {
  switch (definition.type) {
    case 'bool':  return <Toggle checked={value === 'true'} disabled={disabled} onChange={v => onChange(String(v))} />
    case 'enum':  return <Select options={definition.enum_options} value={value} disabled={disabled} onChange={onChange} />
    case 'int':   return <NumberInput value={Number(value)} disabled={disabled} onChange={v => onChange(String(v))} />
    case 'string':return <TextInput value={value} disabled={disabled} onChange={onChange} />
    default:      return null
  }
}
```

### 13.7 新增设置的操作规范

> 以下步骤是后续迭代中新增任何设置时的完整 SOP，无需改表结构。

**Step 1：在迁移文件中插入定义**

创建新迁移文件，例如 `000015_add_setting_practice_countdown.sql`：

```sql
-- +goose Up
INSERT INTO setting_definitions
    (key, scope, type, group_key, label, description, default_value, enum_options, validation_rule, is_public, sort_order, created_at, updated_at)
VALUES
    ('user.practice.countdown_seconds',
     'user', 'int', 'practice',
     '练习前倒计时', '开始练习前的倒计时秒数，0 表示不倒计时',
     '3', NULL, '{"min":0,"max":10}',
     1, 190, datetime('now'), datetime('now'));

-- +goose Down
DELETE FROM setting_definitions WHERE key = 'user.practice.countdown_seconds';
```

**Step 2：在后端消费点读取**

```go
// 在需要用到此设置的 service 中
countdown, _ := settingSvc.GetUserSettingInt(ctx, userID, "user.practice.countdown_seconds")
```

**Step 3：前端自动感知**

`/api/v1/settings/definitions` 返回的数据自动包含新设置，`SettingItem` 组件根据 `type=int` 渲染数字输入框，**无需修改前端代码**。

**Step 4（可选）：添加系统管控**

如需 admin 控制该设置是否对用户可见，调用管控接口即可，不涉及代码改动。

---

**新增系统设置同理**：只需在迁移文件插入 `scope='system'` 的定义，后端通过 `settingSvc.GetSystemSettingXxx(ctx, key)` 消费，Admin UI 的系统设置页面会自动列出新设置项。
---

## 14. 文章库模块

### 14.1 与句库的核心区别

文章库不是句库的升级版，两者面向完全不同的使用场景。不复用句库表，是为了保持各自结构的清晰性。

| 维度 | 句库 | 文章库 |
|------|------|--------|
| 内容粒度 | 单条独立句子，互不关联 | 连贯篇章，段落间有叙事上下文 |
| 顺序 | 无序，随机抽取练习 | 有序，段落必须顺序推进 |
| 练习单元 | 一条句子 = 一次练习 | 一个段落 = 一次练习，跨 session 续接 |
| 进度概念 | 无，每次独立 | 有，记录已完成段落数 |
| 释义挂载 | 句子直接带 `translation` 字段 | 段落内每个句子独立带 `translation` |
| 错误追踪粒度 | 句子级 | 段落级 |

**文章库的四层结构：**

```
article_banks（文章库）
  └── articles（文章，含原文和元信息）
        └── article_paragraphs（段落，练习单位）
              └── article_sentences（段内句子，展示单位，带释义）
```

`article_paragraphs` 是打字练习的原子单位，用户每次练习输入一个完整段落。`article_sentences` 是该段落拆分出来的句子，每句附带 `translation`，在练习界面中逐句高亮 + 显示当前句释义，给用户提供语义锚点，不改变练习的输入粒度。

### 14.2 表结构设计

#### 实体关系

```mermaid
erDiagram
    USERS ||--o{ ARTICLE_BANKS : owns
    ARTICLE_BANKS ||--o{ ARTICLES : contains
    ARTICLES ||--o{ ARTICLE_PARAGRAPHS : split_into
    ARTICLE_PARAGRAPHS ||--o{ ARTICLE_SENTENCES : contains
    USERS ||--o{ USER_ARTICLE_PROGRESS : tracks
    ARTICLES ||--o{ USER_ARTICLE_PROGRESS : tracked_by
    ARTICLE_PARAGRAPHS ||--o{ PRACTICE_SESSIONS : used_in

    ARTICLE_BANKS {
        text id PK
        text owner_id FK
        text name
        text description
        text language
        integer is_public
        datetime created_at
        datetime updated_at
        datetime deleted_at
    }
    ARTICLES {
        text id PK
        text bank_id FK
        text title
        text author
        text source_url
        text content
        integer paragraph_count
        integer total_char_count
        integer difficulty
        text tags
        datetime created_at
        datetime updated_at
    }
    ARTICLE_PARAGRAPHS {
        text id PK
        text article_id FK
        integer paragraph_index
        text content
        integer char_count
        integer sentence_count
        datetime created_at
    }
    ARTICLE_SENTENCES {
        text id PK
        text paragraph_id FK
        integer sentence_index
        text content
        text translation
        text translation_source
        datetime created_at
        datetime updated_at
    }
    USER_ARTICLE_PROGRESS {
        text id PK
        text user_id FK
        text article_id FK
        integer completed_paragraphs
        integer total_paragraphs
        text status
        datetime last_practiced_at
        datetime completed_at
        datetime created_at
        datetime updated_at
    }
```

#### article_banks — 文章库表

```sql
CREATE TABLE article_banks (
    id          TEXT PRIMARY KEY,
    owner_id    TEXT NOT NULL REFERENCES users(id),
    name        TEXT NOT NULL,
    description TEXT,
    language    TEXT NOT NULL DEFAULT 'en',  -- 主语言，如 'en'|'zh'|'ja'
    is_public   INTEGER NOT NULL DEFAULT 0,
    created_at  DATETIME NOT NULL,
    updated_at  DATETIME NOT NULL,
    deleted_at  DATETIME
);
```

#### articles — 文章表

```sql
CREATE TABLE articles (
    id               TEXT PRIMARY KEY,
    bank_id          TEXT NOT NULL REFERENCES article_banks(id),
    title            TEXT NOT NULL,
    author           TEXT,
    source_url       TEXT,
    content          TEXT NOT NULL,          -- 原始全文（保留，用于重新分段）
    paragraph_count  INTEGER NOT NULL DEFAULT 0,   -- 冗余，入库时计算
    total_char_count INTEGER NOT NULL DEFAULT 0,   -- 冗余，入库时计算
    difficulty       INTEGER NOT NULL DEFAULT 1,   -- 1-5
    tags             TEXT,                   -- JSON 数组字符串
    created_at       DATETIME NOT NULL,
    updated_at       DATETIME NOT NULL
);

CREATE INDEX idx_articles_bank_id ON articles(bank_id);
```

**说明：** 文章不再存储 `split_strategy`。分段策略改为固定使用自然段落（`\n\n`）分隔，这与"段落级练习"的定位一致。如有特殊需要，导入时前端提供预处理后的文本即可。

#### article_paragraphs — 段落表（练习单位）

```sql
CREATE TABLE article_paragraphs (
    id              TEXT PRIMARY KEY,
    article_id      TEXT NOT NULL REFERENCES articles(id),
    paragraph_index INTEGER NOT NULL,        -- 从 0 开始
    content         TEXT NOT NULL,           -- 完整段落文本（用户实际输入的内容）
    char_count      INTEGER NOT NULL,
    sentence_count  INTEGER NOT NULL DEFAULT 0,  -- 冗余，生成时计算
    created_at      DATETIME NOT NULL,

    UNIQUE(article_id, paragraph_index)
);

CREATE INDEX idx_article_paragraphs_article ON article_paragraphs(article_id);
```

#### article_sentences — 段内句子表（展示单位，带释义）

```sql
CREATE TABLE article_sentences (
    id                 TEXT PRIMARY KEY,
    paragraph_id       TEXT NOT NULL REFERENCES article_paragraphs(id),
    sentence_index     INTEGER NOT NULL,     -- 在段落内从 0 开始
    content            TEXT NOT NULL,        -- 单句文本
    translation        TEXT,                 -- 释义/译文，可为空
    -- 'manual'=手动填写；'api:deepl'|'api:openai'=翻译 API 写入
    translation_source TEXT NOT NULL DEFAULT 'manual',
    created_at         DATETIME NOT NULL,
    updated_at         DATETIME NOT NULL,

    UNIQUE(paragraph_id, sentence_index)
);

CREATE INDEX idx_article_sentences_paragraph ON article_sentences(paragraph_id);
```

**`article_sentences` 与 `sentences` 表的关系：** 两张表完全独立，不存在外键或复用关系。`sentences` 是句库的独立内容；`article_sentences` 是文章段落的子结构，依附于 `article_paragraphs` 存在，删除段落时级联删除。

#### user_article_progress — 用户阅读进度表

```sql
CREATE TABLE user_article_progress (
    id                   TEXT PRIMARY KEY,
    user_id              TEXT NOT NULL REFERENCES users(id),
    article_id           TEXT NOT NULL REFERENCES articles(id),
    completed_paragraphs INTEGER NOT NULL DEFAULT 0,
    total_paragraphs     INTEGER NOT NULL,
    -- 'not_started' | 'in_progress' | 'completed'
    status               TEXT NOT NULL DEFAULT 'not_started',
    last_practiced_at    DATETIME,
    completed_at         DATETIME,
    created_at           DATETIME NOT NULL,
    updated_at           DATETIME NOT NULL,

    UNIQUE(user_id, article_id)
);

CREATE INDEX idx_user_article_progress_user   ON user_article_progress(user_id);
CREATE INDEX idx_user_article_progress_status ON user_article_progress(user_id, status);
```

**进度语义：** `completed_paragraphs = 3` 表示 index 0、1、2 已完成，下次练习从 index 3 开始。`completed_paragraphs == total_paragraphs` 时 `status` 更新为 `completed`。

### 14.3 处理流程：导入到生成

文章导入时，后端依次执行分段 → 分句 → 写库，一次性完成所有子记录生成。

```mermaid
flowchart TD
    A[接收文章导入请求\ncontent + title + ...] --> B[按自然段分割\nsplitByParagraph]
    B --> C[过滤空段\n合并过短段落 < 20字符]
    C --> D[写入 article_paragraphs\n计算 paragraph_index / char_count]
    D --> E[对每个段落做句子分割\nsplitBySentence]
    E --> F[写入 article_sentences\nsentence_index, content\ntranslation 暂为空]
    F --> G[回写 articles\nparagraph_count / total_char_count]
    G --> H[返回文章 ID\n及段落/句子统计]
```

```go
// utility/splitter/splitter.go

// SplitParagraphs 按自然段分割，合并过短段落
func SplitParagraphs(content string) []string {
    raw := strings.Split(strings.TrimSpace(content), "\n\n")
    var result []string
    buf := ""
    for _, p := range raw {
        p = strings.TrimSpace(strings.ReplaceAll(p, "\n", " "))
        if p == "" {
            continue
        }
        if len([]rune(buf+p)) < 20 {
            buf += p + " "
            continue
        }
        result = append(result, strings.TrimSpace(buf+p))
        buf = ""
    }
    if buf != "" {
        result = append(result, strings.TrimSpace(buf))
    }
    return result
}

// SplitSentences 按句子边界分割（支持英文和中文标点）
func SplitSentences(paragraph string) []string {
    // 匹配句末标点：. ! ? 。！？，后跟空格或结尾
    re := regexp.MustCompile(`[^.!?。！？]+[.!?。！？]+["']?\s*`)
    matches := re.FindAllString(paragraph, -1)
    var result []string
    for _, m := range matches {
        if s := strings.TrimSpace(m); s != "" {
            result = append(result, s)
        }
    }
    // 如果整段没有找到句子边界（如单个短句），整段作为一个句子
    if len(result) == 0 && strings.TrimSpace(paragraph) != "" {
        result = append(result, strings.TrimSpace(paragraph))
    }
    return result
}
```

### 14.4 进度追踪

```go
// service/article/article_impl.go

// CompleteParagraph 段落练习完成后调用，更新进度
func (s *articleService) CompleteParagraph(ctx context.Context, userID, articleID string, paragraphIndex int) error {
    var prog model.UserArticleProgress
    err := s.db.WithContext(ctx).
        Where("user_id = ? AND article_id = ?", userID, articleID).
        First(&prog).Error

    if errors.Is(err, gorm.ErrRecordNotFound) {
        var art model.Article
        s.db.First(&art, "id = ?", articleID)
        prog = model.UserArticleProgress{
            ID:              uuid.New().String(),
            UserID:          userID,
            ArticleID:       articleID,
            TotalParagraphs: art.ParagraphCount,
            Status:          "in_progress",
        }
    }

    // 必须按顺序提交，防止乱序
    if paragraphIndex != prog.CompletedParagraphs {
        return gerror.NewCode(code.CodeBadRequest, "paragraph index out of order")
    }

    prog.CompletedParagraphs++
    prog.LastPracticedAt = gtime.Now()

    if prog.CompletedParagraphs >= prog.TotalParagraphs {
        prog.Status = "completed"
        prog.CompletedAt = gtime.Now()
    } else {
        prog.Status = "in_progress"
    }

    return s.db.WithContext(ctx).Save(&prog).Error
}

// NextParagraph 返回用户下一个待练习段落（含段内句子列表）
func (s *articleService) NextParagraph(ctx context.Context, userID, articleID string) (*res.ParagraphDetail, error) {
    var prog model.UserArticleProgress
    s.db.Where("user_id = ? AND article_id = ?", userID, articleID).First(&prog)
    // 未找到时 CompletedParagraphs 默认 0，从头开始

    var para model.ArticleParagraph
    err := s.db.Where("article_id = ? AND paragraph_index = ?", articleID, prog.CompletedParagraphs).
        First(&para).Error
    if errors.Is(err, gorm.ErrRecordNotFound) {
        return nil, gerror.NewCode(code.CodeNotFound, "article already completed")
    }

    // 同时加载段内句子（含 translation）
    var sentences []model.ArticleSentence
    s.db.Where("paragraph_id = ?", para.ID).
        Order("sentence_index ASC").
        Find(&sentences)

    return &res.ParagraphDetail{
        Paragraph: para,
        Sentences: sentences,
    }, nil
}
```

### 14.5 练习界面数据流与 UI 逻辑

`article_paragraphs.content` 是用户实际输入的完整文本。`article_sentences` 提供了逐句的语义标注，前端据此在打字区上方实现**句子高亮跟随**和**实时释义展示**。

```
┌─────────────────────────────────────────────────────┐
│  段落进度：第 4 段 / 共 12 段    ████████░░░░  33%   │
├─────────────────────────────────────────────────────┤
│  [上文灰显，仅展示语境]                               │
│  The question was first asked in 2025.              │
│                                                     │
│  ▶ [当前句高亮]                                      │
│  Humanity had spread across the stars.              │
│  📖 人类已经扩散到了群星之间。                        │  ← translation
├─────────────────────────────────────────────────────┤
│  [打字区，输入完整段落文本]                            │
│  The question was first asked in 2025. Humanity_   │
│  光标: 已完成第一句，正在输入第二句                    │
├─────────────────────────────────────────────────────┤
│  WPM: 68    准确率: 96.2%    用时: 0:32             │
└─────────────────────────────────────────────────────┘
```

**前端句子高亮逻辑：**

```typescript
// src/components/article/ParagraphTypingArea.tsx
// sentences 含每句的 char offset（相对于段落全文的起始位置）
// 根据当前 charIndex 判断光标落在哪个句子，高亮对应句子并显示其 translation

interface SentenceWithOffset {
  sentence: ArticleSentence
  startOffset: number    // 在段落全文中的起始字符索引
  endOffset: number      // 结束索引（含）
}

function buildSentenceOffsets(sentences: ArticleSentence[], paragraphContent: string): SentenceWithOffset[] {
  let cursor = 0
  return sentences.map(s => {
    const start = paragraphContent.indexOf(s.content, cursor)
    const end = start + s.content.length - 1
    cursor = end + 1
    return { sentence: s, startOffset: start, endOffset: end }
  })
}

// 当前光标所在句子 index
function getCurrentSentenceIndex(charIndex: number, offsets: SentenceWithOffset[]): number {
  return offsets.findIndex(o => charIndex >= o.startOffset && charIndex <= o.endOffset)
}
```

### 14.6 释义填写与翻译 API 扩展

#### 当前（手动填写）

`article_sentences` 的 `translation` 字段导入时留空，用户在文章管理页逐句填写。前端提供内联编辑：

```
句子列表（管理视图）
┌────────────────────────────────────────────────────────────┐
│ #1  The question was first asked in 2025.                  │
│     释义: [这个问题最早在 2025 年被提出。              ✏️ ] │
│                                                            │
│ #2  Humanity had spread across the stars.                  │
│     释义: [                                          ✏️ ] │  ← 未填
└────────────────────────────────────────────────────────────┘
```

#### 未来（翻译 API 对接）

后端预留 `translation_source` 字段和批量翻译接口，接入翻译 API 时只需实现 `ITranslator` 接口：

```go
// internal/service/translator/translator.go
type ITranslator interface {
    // Translate 批量翻译，返回对应 translation 字符串列表
    Translate(ctx context.Context, texts []string, targetLang string) ([]string, error)
    // Provider 返回服务标识，写入 translation_source
    Provider() string  // 如 "api:deepl"
}

// 触发批量翻译的接口
// POST /api/v1/articles/:id/translate
// Body: { "target_lang": "zh-CN", "provider": "deepl", "overwrite_manual": false }
// overwrite_manual=false 时跳过已有 translation_source='manual' 的句子
```

### 14.7 练习系统集成

文章练习复用 `practice_sessions` 表，新增合法值：

```
source_type: 'article_paragraph'    （原 'article_section' 废弃）
mode:        'article'
source_id:   article_paragraphs.id
```

`error_records` 的 `content_type` 同步新增 `article_paragraph`，SM-2 逻辑不变。

**练习完整时序：**

```mermaid
sequenceDiagram
    participant FE as 前端
    participant BE as 后端

    FE->>BE: GET /api/v1/articles/:id/next-paragraph
    BE-->>FE: ParagraphDetail { paragraph, sentences[] }
    note right of FE: sentences[] 含每句 content + translation<br/>前端构建 offset 映射

    FE->>BE: POST /api/v1/practice/sessions<br/>{ mode:"article", source_type:"article_paragraph", source_id }
    BE-->>FE: { session_id }

    loop 打字过程
        FE->>BE: WS keystroke
        BE-->>FE: 实时 WPM / 准确率
    end

    FE->>BE: PATCH /api/v1/practice/sessions/:id  提交结果
    BE->>BE: 写 practice_results / keystroke_stats / error_records

    FE->>BE: POST /api/v1/articles/:id/paragraphs/:index/complete
    BE-->>FE: { completed_paragraphs: 4, total: 12, status: "in_progress" }
    FE->>FE: 展示完成卡，询问继续/暂停
```

### 14.8 API 接口

```
-- 文章库管理
GET    /api/v1/article-banks                               文章库列表
POST   /api/v1/article-banks                               创建文章库
GET    /api/v1/article-banks/:id                           文章库详情
PUT    /api/v1/article-banks/:id                           修改文章库
DELETE /api/v1/article-banks/:id                           删除文章库

-- 文章管理
GET    /api/v1/article-banks/:id/articles                  文章列表（分页）
POST   /api/v1/article-banks/:id/articles                  导入文章（自动分段+分句）
GET    /api/v1/articles/:id                                文章详情（含段落列表）
PUT    /api/v1/articles/:id                                修改文章元信息
DELETE /api/v1/articles/:id                                删除文章

-- 句子释义管理
GET    /api/v1/articles/:id/sentences                      文章全部句子列表（管理视图）
PUT    /api/v1/article-sentences/:id                       修改单句释义
POST   /api/v1/articles/:id/translate                      批量触发翻译 API（预留）

-- 进度与练习
GET    /api/v1/articles/:id/next-paragraph                 获取下一个待练习段落（含 sentences[]）
POST   /api/v1/articles/:id/paragraphs/:index/complete     完成段落，更新进度
GET    /api/v1/articles/progress                           当前用户所有文章进度
DELETE /api/v1/articles/:id/progress                       重置进度（从头开始）

-- 导入导出
GET    /api/v1/article-banks/:id/export                    导出文章库 JSON
```

**`GET /api/v1/articles/:id/next-paragraph` 响应：**

```json
{
  "code": 0,
  "data": {
    "paragraph": {
      "id": "para-004",
      "paragraph_index": 3,
      "content": "The question was first asked in 2025. Humanity had spread across the stars. AC existed in hyperspace.",
      "char_count": 98,
      "sentence_count": 3
    },
    "sentences": [
      {
        "id": "sent-010",
        "sentence_index": 0,
        "content": "The question was first asked in 2025.",
        "translation": "这个问题最早在 2025 年被提出。",
        "translation_source": "manual"
      },
      {
        "id": "sent-011",
        "sentence_index": 1,
        "content": "Humanity had spread across the stars.",
        "translation": "人类已经扩散到了群星之间。",
        "translation_source": "manual"
      },
      {
        "id": "sent-012",
        "sentence_index": 2,
        "content": "AC existed in hyperspace.",
        "translation": null,
        "translation_source": "manual"
      }
    ],
    "progress": {
      "completed_paragraphs": 3,
      "total_paragraphs": 12,
      "status": "in_progress"
    }
  }
}
```

**导入 JSON 格式（支持预填释义）：**

```json
{
  "bank": { "name": "经典科幻", "language": "en" },
  "articles": [
    {
      "title": "The Last Question",
      "author": "Isaac Asimov",
      "content": "The question was first asked in 2025. Humanity had spread across the stars. AC existed in hyperspace.\n\nThe slow dying of the sun had made this necessary.",
      "difficulty": 4,
      "tags": ["科幻"],
      "sentences_translation": {
        "The question was first asked in 2025.": "这个问题最早在 2025 年被提出。",
        "Humanity had spread across the stars.": "人类已经扩散到了群星之间。"
      }
    }
  ]
}
```

`sentences_translation` 是可选字段，以句子原文为 key，后端按文本匹配写入对应 `article_sentences.translation`，未命中的句子 `translation` 留空。

### 14.9 迁移文件

**`000011_add_article_library.sql`**

```sql
-- +goose Up
-- +goose StatementBegin
CREATE TABLE article_banks (
    id          TEXT PRIMARY KEY,
    owner_id    TEXT NOT NULL REFERENCES users(id),
    name        TEXT NOT NULL,
    description TEXT,
    language    TEXT NOT NULL DEFAULT 'en',
    is_public   INTEGER NOT NULL DEFAULT 0,
    created_at  DATETIME NOT NULL,
    updated_at  DATETIME NOT NULL,
    deleted_at  DATETIME
);

CREATE TABLE articles (
    id               TEXT PRIMARY KEY,
    bank_id          TEXT NOT NULL REFERENCES article_banks(id),
    title            TEXT NOT NULL,
    author           TEXT,
    source_url       TEXT,
    content          TEXT NOT NULL,
    paragraph_count  INTEGER NOT NULL DEFAULT 0,
    total_char_count INTEGER NOT NULL DEFAULT 0,
    difficulty       INTEGER NOT NULL DEFAULT 1,
    tags             TEXT,
    created_at       DATETIME NOT NULL,
    updated_at       DATETIME NOT NULL
);

CREATE TABLE article_paragraphs (
    id              TEXT PRIMARY KEY,
    article_id      TEXT NOT NULL REFERENCES articles(id),
    paragraph_index INTEGER NOT NULL,
    content         TEXT NOT NULL,
    char_count      INTEGER NOT NULL,
    sentence_count  INTEGER NOT NULL DEFAULT 0,
    created_at      DATETIME NOT NULL,
    UNIQUE(article_id, paragraph_index)
);

CREATE TABLE article_sentences (
    id                 TEXT PRIMARY KEY,
    paragraph_id       TEXT NOT NULL REFERENCES article_paragraphs(id),
    sentence_index     INTEGER NOT NULL,
    content            TEXT NOT NULL,
    translation        TEXT,
    translation_source TEXT NOT NULL DEFAULT 'manual',
    created_at         DATETIME NOT NULL,
    updated_at         DATETIME NOT NULL,
    UNIQUE(paragraph_id, sentence_index)
);

CREATE TABLE user_article_progress (
    id                   TEXT PRIMARY KEY,
    user_id              TEXT NOT NULL REFERENCES users(id),
    article_id           TEXT NOT NULL REFERENCES articles(id),
    completed_paragraphs INTEGER NOT NULL DEFAULT 0,
    total_paragraphs     INTEGER NOT NULL,
    status               TEXT NOT NULL DEFAULT 'not_started',
    last_practiced_at    DATETIME,
    completed_at         DATETIME,
    created_at           DATETIME NOT NULL,
    updated_at           DATETIME NOT NULL,
    UNIQUE(user_id, article_id)
);

CREATE INDEX idx_articles_bank_id             ON articles(bank_id);
CREATE INDEX idx_article_paragraphs_article   ON article_paragraphs(article_id);
CREATE INDEX idx_article_sentences_paragraph  ON article_sentences(paragraph_id);
CREATE INDEX idx_user_article_progress_user   ON user_article_progress(user_id);
CREATE INDEX idx_user_article_progress_status ON user_article_progress(user_id, status);
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
DROP TABLE IF EXISTS user_article_progress;
DROP TABLE IF EXISTS article_sentences;
DROP TABLE IF EXISTS article_paragraphs;
DROP TABLE IF EXISTS articles;
DROP TABLE IF EXISTS article_banks;
-- +goose StatementEnd
```

**`000012_seed_setting_article_limits.sql`**

```sql
-- +goose Up
INSERT INTO setting_definitions
    (key, scope, type, group_key, label, description, default_value, enum_options, validation_rule, is_public, sort_order, created_at, updated_at)
VALUES
    ('system.max_article_banks_per_user',
     'system', 'int', 'limits',
     '每用户文章库上限', '0 表示不限制',
     '10', NULL, '{"min":0,"max":1000}', 0, 80, datetime('now'), datetime('now')),
    ('system.max_articles_per_bank',
     'system', 'int', 'limits',
     '每文章库文章上限', '0 表示不限制',
     '200', NULL, '{"min":0,"max":10000}', 0, 90, datetime('now'), datetime('now'));

-- +goose Down
DELETE FROM setting_definitions
WHERE key IN ('system.max_article_banks_per_user', 'system.max_articles_per_bank');
```

**`000013_add_sentence_translation.sql`** — 为句库补充释义字段：

```sql
-- +goose Up
ALTER TABLE sentences ADD COLUMN translation        TEXT;
ALTER TABLE sentences ADD COLUMN translation_source TEXT NOT NULL DEFAULT 'manual';

-- +goose Down
ALTER TABLE sentences DROP COLUMN translation_source;
ALTER TABLE sentences DROP COLUMN translation;
```

### 14.10 目录结构补充

```
internal/
├── controller/
│   ├── article_bank.go          # 文章库 CRUD
│   ├── article.go               # 文章导入、详情
│   ├── article_sentence.go      # 句子释义编辑、翻译触发
│   └── article_progress.go      # 进度查询与更新
│
├── service/
│   ├── article/
│   │   ├── article.go           # interface
│   │   └── article_impl.go      # 导入流程、进度、next-paragraph
│   └── translator/
│       ├── translator.go        # ITranslator interface
│       └── manual.go            # 空实现（当前版本，直接返回空）
│
├── dao/internal/model/
│   ├── article_bank.go
│   ├── article.go
│   ├── article_paragraph.go
│   ├── article_sentence.go
│   └── user_article_progress.go

utility/
└── splitter/
    ├── splitter.go              # SplitParagraphs + SplitSentences
    └── splitter_test.go

frontend/src/
├── routes/library/articles/
│   ├── index.tsx                # 文章库列表
│   ├── $bankId.tsx              # 文章列表
│   ├── $articleId.tsx           # 文章详情 + 进度 + 句子释义管理
│   └── $articleId.practice.tsx  # 打字练习页（段落级）
│
├── components/article/
│   ├── ArticleCard.tsx          # 含进度条的文章卡片
│   ├── ParagraphTypingArea.tsx  # 打字区（含句子高亮跟随逻辑）
│   ├── SentenceHighlight.tsx    # 当前句高亮 + translation 展示
│   └── TranslationEditor.tsx    # 内联释义编辑器（管理视图）
│
└── api/articles.ts

```

**`splitter_test.go` 必须覆盖的边界场景：**

| 测试用例 | 覆盖函数 | 说明 |
|---------|---------|------|
| 正常多段文本 | `SplitParagraphs` | 标准 `\n\n` 分隔 |
| 整篇无换行 | `SplitParagraphs` | 返回 1 条段落 |
| 过短段落合并 | `SplitParagraphs` | < 20 字符合并到下一段 |
| 连续多个空行 | `SplitParagraphs` | `\n\n\n\n` 视为单个分隔 |
| 英文标准句子 | `SplitSentences` | `.` `!` `?` 正确切分 |
| 中文标点句子 | `SplitSentences` | `。` `！` `？` 正确切分 |
| 缩写不切分 | `SplitSentences` | `Mr. Smith` 不在 `.` 处切断 |
| 引号内标点 | `SplitSentences` | `"Hello."` 作为完整句 |
| 单句无标点 | `SplitSentences` | 整段作为一个句子返回 |
| 空字符串输入 | 两个函数 | 返回空 slice，不 panic |

---

## 15. 媒体文件存储

### 15.1 设计原则

**定义驱动**，与设置模块保持一致的扩展思路：新增一种文件类型，只需在 `media_type_definitions` 插入一行迁移记录，服务层代码不动。

**两张表，职责分离：**

```
media_type_definitions   ← 文件类型的规则定义（MIME 白名单、大小限制、数量上限）
media_files              ← 实际存储的文件（BLOB + 元信息）
```

**`slot` 字段解决"同类多文件"问题：**

- 单例文件（头像、文章封面）：`slot = 'default'`，唯一约束保证每个 owner 只有一个
- 命名文件（系统音效）：`slot = 'key' | 'error' | 'success'`，按名字区分
- 未来如需单词配图：`slot = 'img_0' | 'img_1'`，最多几张由 `max_count` 控制

`UNIQUE(type_key, owner_type, owner_id, slot)` 统一处理以上三种情况，全部非 NULL 才能正确触发约束。

**`is_public` 控制访问权限：**  
头像（`is_public=1`）可以匿名访问；音效（`is_public=0`）需要登录才能拉取。`/api/v1/media/:id` 服务端统一检查定义表的 `is_public` 字段，不需要在每个路由写权限逻辑。

**为什么不用对象存储：** 所有文件 ≤256KB、总量可控，BLOB 存数据库让备份一个文件即可恢复全部数据（含媒体）。ETag + 客户端缓存解决重复读 BLOB 的性能问题。

### 15.2 表结构

#### 实体关系

```mermaid
erDiagram
    MEDIA_TYPE_DEFINITIONS ||--o{ MEDIA_FILES : "typed by"
    USERS ||--o{ MEDIA_FILES : owns

    MEDIA_TYPE_DEFINITIONS {
        text key PK
        text label
        text description
        text owner_scope
        text allowed_mime_types
        integer max_size_bytes
        integer max_count
        integer is_public
        integer sort_order
        datetime created_at
    }
    MEDIA_FILES {
        text id PK
        text type_key FK
        text owner_type
        text owner_id
        text slot
        text filename
        text content_type
        blob data
        integer size_bytes
        text hash
        datetime created_at
        datetime updated_at
    }
```

#### media_type_definitions — 文件类型定义表

```sql
CREATE TABLE media_type_definitions (
    key               TEXT PRIMARY KEY,
    -- 显示名称
    label             TEXT NOT NULL,
    description       TEXT,
    -- owner 归属范围：'user'=用户资源；'system'=系统资源；'content'=内容资源（词/句/文章）
    owner_scope       TEXT NOT NULL CHECK(owner_scope IN ('user', 'system', 'content')),
    -- 允许的 MIME 类型，JSON 数组，如 '["image/jpeg","image/png"]'
    allowed_mime_types TEXT NOT NULL,
    -- 单个文件大小上限（字节），默认 256KB
    max_size_bytes    INTEGER NOT NULL DEFAULT 262144,
    -- 每个 owner 该类型最多存几个文件（0 = 不限，由 slot 自然控制）
    -- 1 = 单例（头像、封面）；N = 最多 N 个（单词配图）
    max_count         INTEGER NOT NULL DEFAULT 1,
    -- 是否公开可访问（0=需要登录，1=匿名可读）
    is_public         INTEGER NOT NULL DEFAULT 1,
    sort_order        INTEGER NOT NULL DEFAULT 0,
    created_at        DATETIME NOT NULL
);
```

#### media_files — 文件存储表

```sql
CREATE TABLE media_files (
    id           TEXT PRIMARY KEY,
    -- 关联类型定义
    type_key     TEXT NOT NULL REFERENCES media_type_definitions(key),
    -- 资源所属实体类型：'user' | 'system' | 'word' | 'sentence' | 'article' | ...
    owner_type   TEXT NOT NULL,
    -- 所属实体 ID（system 资源为 NULL）
    owner_id     TEXT,
    -- 槽位名：单例用 'default'；命名变体用具体名称；同类多文件用序号如 'img_0'
    slot         TEXT NOT NULL DEFAULT 'default',
    -- 原始文件名（仅记录，不用于寻址）
    filename     TEXT NOT NULL,
    -- 实际 MIME 类型（从内容检测，非客户端上报）
    content_type TEXT NOT NULL,
    -- 文件二进制内容
    data         BLOB NOT NULL,
    -- 字节数（不读 BLOB 即可校验大小）
    size_bytes   INTEGER NOT NULL,
    -- SHA-256 内容哈希，用于 ETag 和内容去重
    hash         TEXT NOT NULL,
    created_at   DATETIME NOT NULL,
    updated_at   DATETIME NOT NULL,

    -- 同一 owner 的同一类型同一 slot 唯一
    UNIQUE(type_key, owner_type, owner_id, slot)
);

CREATE INDEX idx_media_files_owner   ON media_files(owner_type, owner_id);
CREATE INDEX idx_media_files_type    ON media_files(type_key);
CREATE INDEX idx_media_files_hash    ON media_files(hash);
```

#### users 表新增 avatar_media_id

```sql
-- 在迁移文件中同步执行
ALTER TABLE users ADD COLUMN avatar_media_id TEXT REFERENCES media_files(id);
```

头像 URL 由前端按 `avatarUrl(user.avatar_media_id)` 拼装，不在数据库里存完整 URL，换域名时无需迁移数据。

### 15.3 设置定义种子数据

迁移文件 `000014_seed_media_type_definitions.sql`，所有文件类型集中定义：

```sql
-- +goose Up
INSERT INTO media_type_definitions
    (key, label, description, owner_scope, allowed_mime_types, max_size_bytes, max_count, is_public, sort_order, created_at)
VALUES
-- 用户头像（单例，公开访问）
('user.avatar',
 '用户头像', NULL,
 'user',
 '["image/jpeg","image/png","image/webp","image/gif"]',
 262144, 1, 1, 10, datetime('now')),

-- 系统打字音效（命名 slot，登录后可访问）
-- slot: 'key'=击键音；'error'=出错音；'success'=完成音
('system.sound',
 '系统音效', '打字练习中使用的音效文件，通过 slot 区分用途',
 'system',
 '["audio/mpeg","audio/ogg","audio/wav","audio/webm"]',
 262144, 0, 0, 20, datetime('now')),

-- 单词配图（每个单词最多 3 张，公开）
('word.image',
 '单词配图', '为单词添加辅助记忆的图片',
 'content',
 '["image/jpeg","image/png","image/webp"]',
 262144, 3, 1, 30, datetime('now')),

-- 文章封面（单例，公开）
('article.cover',
 '文章封面', NULL,
 'content',
 '["image/jpeg","image/png","image/webp"]',
 262144, 1, 1, 40, datetime('now'));

-- +goose Down
DELETE FROM media_type_definitions
WHERE key IN ('user.avatar', 'system.sound', 'word.image', 'article.cover');
```

### 15.4 Go 服务层实现

#### GORM Model

```go
// internal/dao/internal/model/media.go

type MediaTypeDefinition struct {
    Key              string    `gorm:"primaryKey"`
    Label            string    `gorm:"not null"`
    Description      string
    OwnerScope       string    `gorm:"not null"`
    AllowedMimeTypes string    `gorm:"not null"`   // JSON 数组字符串
    MaxSizeBytes     int       `gorm:"not null;default:262144"`
    MaxCount         int       `gorm:"not null;default:1"`
    IsPublic         bool      `gorm:"not null;default:true"`
    SortOrder        int       `gorm:"not null;default:0"`
    CreatedAt        time.Time
}

type MediaFile struct {
    ID          string    `gorm:"primaryKey"`
    TypeKey     string    `gorm:"not null;index"`
    OwnerType   string    `gorm:"not null;index"`
    OwnerID     *string   // system 资源为 nil
    Slot        string    `gorm:"not null;default:'default'"`
    Filename    string    `gorm:"not null"`
    ContentType string    `gorm:"not null"`
    Data        []byte    `gorm:"not null"`        // SQLite=BLOB，PG=bytea，GORM 自动适配
    SizeBytes   int       `gorm:"not null"`
    Hash        string    `gorm:"not null;index"`
    CreatedAt   time.Time
    UpdatedAt   time.Time
}
```

#### 服务接口

```go
// internal/service/media/media.go
type IMediaService interface {
    // Upload 上传一个文件，返回 file_id
    // typeKey: 'user.avatar' / 'system.sound' 等
    // ownerType/ownerID: 资源归属
    // slot: 'default' 为单例；其他值为命名槽
    Upload(ctx context.Context, req UploadReq) (string, error)

    // Delete 删除指定文件（校验归属权）
    Delete(ctx context.Context, fileID, operatorID string) error

    // ListByOwner 列出某个 owner 的某类型文件
    ListByOwner(ctx context.Context, typeKey, ownerType, ownerID string) ([]*MediaFileMeta, error)

    // GetDefinitions 返回所有类型定义（供前端上传前校验）
    GetDefinitions(ctx context.Context) ([]*model.MediaTypeDefinition, error)
}

type UploadReq struct {
    TypeKey   string
    OwnerType string
    OwnerID   *string  // system 时为 nil
    Slot      string   // 不传时默认 'default'
    Filename  string
    Data      []byte
}
```

#### 核心实现

```go
// internal/service/media/media_impl.go

func (s *mediaService) Upload(ctx context.Context, req UploadReq) (string, error) {
    // 1. 读取类型定义（带简单内存缓存，定义表几乎不变）
    def, err := s.getDefinition(ctx, req.TypeKey)
    if err != nil {
        return "", gerror.NewCode(code.CodeNotFound, "media type not found: "+req.TypeKey)
    }

    // 2. 大小校验
    if len(req.Data) > def.MaxSizeBytes {
        return "", gerror.NewCode(code.CodeBadRequest,
            fmt.Sprintf("file size %d exceeds limit %d", len(req.Data), def.MaxSizeBytes))
    }

    // 3. MIME 检测（从内容检测，不信任客户端）
    contentType := http.DetectContentType(req.Data)
    var allowed []string
    json.Unmarshal([]byte(def.AllowedMimeTypes), &allowed)
    if !slices.Contains(allowed, contentType) {
        return "", gerror.NewCode(code.CodeBadRequest,
            fmt.Sprintf("content type %s not allowed", contentType))
    }

    // 4. max_count 校验（仅 max_count > 0 时有意义）
    if def.MaxCount > 0 {
        var count int64
        s.db.Model(&model.MediaFile{}).
            Where("type_key = ? AND owner_type = ? AND owner_id = ?",
                req.TypeKey, req.OwnerType, req.OwnerID).
            Count(&count)
        // 同 slot 的 UPSERT 不算新增，只有 slot 不存在时才检查上限
        var existing model.MediaFile
        slotExists := s.db.Where(
            "type_key = ? AND owner_type = ? AND owner_id = ? AND slot = ?",
            req.TypeKey, req.OwnerType, req.OwnerID, req.Slot,
        ).First(&existing).Error == nil

        if !slotExists && int(count) >= def.MaxCount {
            return "", gerror.NewCode(code.CodeBadRequest,
                fmt.Sprintf("max count %d reached for type %s", def.MaxCount, req.TypeKey))
        }
    }

    // 5. 内容哈希
    hashBytes := sha256.Sum256(req.Data)
    hash := hex.EncodeToString(hashBytes[:])

    // 6. UPSERT（同 type+owner+slot 覆盖写入）
    slot := req.Slot
    if slot == "" {
        slot = "default"
    }
    now := time.Now()
    file := model.MediaFile{
        ID:          uuid.New().String(),
        TypeKey:     req.TypeKey,
        OwnerType:   req.OwnerType,
        OwnerID:     req.OwnerID,
        Slot:        slot,
        Filename:    req.Filename,
        ContentType: contentType,
        Data:        req.Data,
        SizeBytes:   len(req.Data),
        Hash:        hash,
        CreatedAt:   now,
        UpdatedAt:   now,
    }

    err = s.db.WithContext(ctx).Clauses(clause.OnConflict{
        Columns: []clause.Column{
            {Name: "type_key"}, {Name: "owner_type"},
            {Name: "owner_id"}, {Name: "slot"},
        },
        DoUpdates: clause.AssignmentColumns([]string{
            "filename", "content_type", "data",
            "size_bytes", "hash", "updated_at",
        }),
    }).Create(&file).Error

    return file.ID, err
}
```

#### ETag 缓存服务

```go
// internal/controller/media.go

func (c *MediaController) Serve(r *ghttp.Request) {
    fileID := r.Get("id").String()

    // 第一次查询：只读元数据，不读 BLOB
    var meta struct {
        Hash        string
        ContentType string
        TypeKey     string
    }
    if err := db.Model(&model.MediaFile{}).
        Select("hash, content_type, type_key").
        Where("id = ?", fileID).
        First(&meta).Error; err != nil {
        r.Response.WriteStatus(http.StatusNotFound)
        return
    }

    // 根据定义表决定是否需要登录
    def, _ := mediaSvc.getDefinition(r.Context(), meta.TypeKey)
    if def != nil && !def.IsPublic {
        if r.GetCtxVar("userID").IsEmpty() {
            r.Response.WriteStatus(http.StatusUnauthorized)
            return
        }
    }

    // ETag 对比，命中则 304
    etag := `"` + meta.Hash + `"`
    if r.Header.Get("If-None-Match") == etag {
        r.Response.WriteHeader(http.StatusNotModified)
        return
    }

    // hash 不匹配才读 BLOB（第二次查询）
    var file model.MediaFile
    db.Where("id = ?", fileID).First(&file)

    r.Response.Header().Set("Content-Type", file.ContentType)
    r.Response.Header().Set("ETag", etag)
    r.Response.Header().Set("Cache-Control", "public, max-age=604800, immutable")
    r.Response.Header().Set("Content-Length", strconv.Itoa(file.SizeBytes))
    r.Response.Write(file.Data)
}
```

### 15.5 API 接口

```
-- 媒体内容访问（公开资源无需登录，非公开资源需要 JWT）
GET  /api/v1/media/:id
     ETag 缓存，支持 If-None-Match，命中返回 304

-- 类型定义查询（前端上传前获取校验规则）
GET  /api/v1/media/types
     返回所有 media_type_definitions（含 allowed_mime_types、max_size_bytes）

-- 通用上传接口
POST /api/v1/media/upload
     multipart/form-data
     字段：type_key, owner_type, owner_id（可选）, slot（可选，默认 'default'）, file
     返回：{ "file_id": "...", "url": "/api/v1/media/..." }

-- 删除（owner 本人或 admin 可操作）
DELETE /api/v1/media/:id

-- 按 owner 列出文件
GET  /api/v1/media?type_key=user.avatar&owner_type=user&owner_id=:uid
     返回该 owner 该类型的所有 slot 文件列表

-- 快捷接口（底层调通用接口）
POST   /api/v1/users/me/avatar                 上传自己头像（type_key='user.avatar'，slot='default'）
DELETE /api/v1/users/me/avatar                 删除自己头像
POST   /api/v1/admin/media/system.sound/:slot  上传系统音效（需 admin）
GET    /api/v1/sounds                          返回所有系统音效的 file_id + URL
```

**通用上传请求示例（前端）：**

```typescript
// 上传头像
upload({ type_key: 'user.avatar', owner_type: 'user', owner_id: me.id, file })

// 上传系统音效（admin）
upload({ type_key: 'system.sound', owner_type: 'system', slot: 'key', file })

// 未来：上传单词配图
upload({ type_key: 'word.image', owner_type: 'word', owner_id: wordId, slot: 'img_0', file })
```

**`GET /api/v1/sounds` 响应：**

```json
{
  "code": 0,
  "data": {
    "key":     { "file_id": "abc-123", "url": "/api/v1/media/abc-123" },
    "error":   { "file_id": "def-456", "url": "/api/v1/media/def-456" },
    "success": null
  }
}
```

### 15.6 迁移文件

**`000014_add_media_storage.sql`** — 建表：

```sql
-- +goose Up
-- +goose StatementBegin
CREATE TABLE media_type_definitions (
    key               TEXT PRIMARY KEY,
    label             TEXT NOT NULL,
    description       TEXT,
    owner_scope       TEXT NOT NULL CHECK(owner_scope IN ('user','system','content')),
    allowed_mime_types TEXT NOT NULL,
    max_size_bytes    INTEGER NOT NULL DEFAULT 262144,
    max_count         INTEGER NOT NULL DEFAULT 1,
    is_public         INTEGER NOT NULL DEFAULT 1,
    sort_order        INTEGER NOT NULL DEFAULT 0,
    created_at        DATETIME NOT NULL
);

CREATE TABLE media_files (
    id           TEXT PRIMARY KEY,
    type_key     TEXT NOT NULL REFERENCES media_type_definitions(key),
    owner_type   TEXT NOT NULL,
    owner_id     TEXT,
    slot         TEXT NOT NULL DEFAULT 'default',
    filename     TEXT NOT NULL,
    content_type TEXT NOT NULL,
    data         BLOB NOT NULL,
    size_bytes   INTEGER NOT NULL,
    hash         TEXT NOT NULL,
    created_at   DATETIME NOT NULL,
    updated_at   DATETIME NOT NULL,
    UNIQUE(type_key, owner_type, owner_id, slot)
);

CREATE INDEX idx_media_files_owner ON media_files(owner_type, owner_id);
CREATE INDEX idx_media_files_type  ON media_files(type_key);
CREATE INDEX idx_media_files_hash  ON media_files(hash);

ALTER TABLE users ADD COLUMN avatar_media_id TEXT REFERENCES media_files(id);
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
ALTER TABLE users DROP COLUMN avatar_media_id;
DROP TABLE IF EXISTS media_files;
DROP TABLE IF EXISTS media_type_definitions;
-- +goose StatementEnd
```

**`000015_seed_media_type_definitions.sql`** — 初始类型定义：

```sql
-- +goose Up
INSERT INTO media_type_definitions
    (key, label, description, owner_scope, allowed_mime_types, max_size_bytes, max_count, is_public, sort_order, created_at)
VALUES
    ('user.avatar',
     '用户头像', NULL,
     'user', '["image/jpeg","image/png","image/webp","image/gif"]',
     262144, 1, 1, 10, datetime('now')),

    ('system.sound',
     '系统音效', '打字练习音效，通过 slot 区分：key / error / success',
     'system', '["audio/mpeg","audio/ogg","audio/wav","audio/webm"]',
     262144, 0, 0, 20, datetime('now')),

    ('word.image',
     '单词配图', '辅助单词记忆的图片，每个单词最多 3 张',
     'content', '["image/jpeg","image/png","image/webp"]',
     262144, 3, 1, 30, datetime('now')),

    ('article.cover',
     '文章封面', NULL,
     'content', '["image/jpeg","image/png","image/webp"]',
     262144, 1, 1, 40, datetime('now'));

-- +goose Down
DELETE FROM media_type_definitions
WHERE key IN ('user.avatar','system.sound','word.image','article.cover');
```

### 15.7 新增文件类型的操作规范

> 与设置模块完全一致的 SOP，只需一个迁移文件，服务层代码不动。

**Step 1：插入类型定义**

例如未来要支持句子配音（用户上传自己朗读的 mp3）：

```sql
-- 000025_add_sentence_audio_type.sql
-- +goose Up
INSERT INTO media_type_definitions
    (key, label, description, owner_scope, allowed_mime_types, max_size_bytes, max_count, is_public, sort_order, created_at)
VALUES
    ('sentence.audio',
     '句子配音', '用户为句子录制的朗读音频',
     'content', '["audio/mpeg","audio/ogg","audio/webm"]',
     262144, 1, 0, 50, datetime('now'));

-- +goose Down
DELETE FROM media_type_definitions WHERE key = 'sentence.audio';
```

**Step 2：前端直接调通用上传接口**

```typescript
upload({
  type_key: 'sentence.audio',
  owner_type: 'sentence',
  owner_id: sentenceId,
  slot: 'default',
  file: audioBlob,
})
```

**Step 3：服务层自动按定义校验，无需改代码**

`IMediaService.Upload` 查定义表拿规则（MIME 白名单、大小限制、数量上限），统一校验逻辑已经实现，新类型自动享有。

### 15.8 前端集成

#### 通用上传 Hook

```typescript
// src/hooks/useMediaUpload.ts
// 上传前从 /api/v1/media/types 拿定义，在本地做前置校验，减少无效请求

export function useMediaUpload() {
  const { data: typeDefs } = useQuery({
    queryKey: ['media', 'types'],
    queryFn: () => request<MediaTypeDefinition[]>('/media/types'),
    staleTime: Infinity,  // 类型定义不变，永不重新请求
  })

  const upload = useCallback(async (params: {
    typeKey: string
    ownerType: string
    ownerId?: string
    slot?: string
    file: File
  }): Promise<{ fileId: string; url: string }> => {
    // 找到对应定义，前置校验
    const def = typeDefs?.find(d => d.key === params.typeKey)
    if (def) {
      if (params.file.size > def.max_size_bytes) {
        throw new Error(`文件不能超过 ${def.max_size_bytes / 1024}KB`)
      }
      const allowed: string[] = JSON.parse(def.allowed_mime_types)
      if (!allowed.includes(params.file.type)) {
        throw new Error(`不支持的文件类型 ${params.file.type}`)
      }
    }

    const form = new FormData()
    form.append('type_key',   params.typeKey)
    form.append('owner_type', params.ownerType)
    if (params.ownerId) form.append('owner_id', params.ownerId)
    if (params.slot)    form.append('slot',     params.slot)
    form.append('file', params.file)

    const res = await fetch('/api/v1/media/upload', {
      method: 'POST',
      headers: { Authorization: `Bearer ${useAuthStore.getState().accessToken}` },
      body: form,
    })
    const json = await res.json()
    if (json.code !== 0) throw new ApiError(json.code, json.message)
    return { fileId: json.data.file_id, url: json.data.url }
  }, [typeDefs])

  return { upload }
}
```

#### 头像上传组件

```typescript
// src/components/ui/AvatarUpload.tsx
export function AvatarUpload({ userId, currentUrl }: { userId: string; currentUrl: string | null }) {
  const { upload } = useMediaUpload()
  const [isPending, setIsPending] = useState(false)

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setIsPending(true)
    try {
      const { url } = await upload({
        typeKey: 'user.avatar', ownerType: 'user', ownerId: userId, file,
      })
      useAuthStore.getState().updateAvatarUrl(url)
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setIsPending(false)
    }
  }

  return (
    <label style={{ cursor: 'pointer' }}>
      <img
        src={currentUrl ?? '/default-avatar.svg'}
        style={{ width: 64, height: 64, borderRadius: '50%', objectFit: 'cover' }}
      />
      <input type="file" accept="image/*" hidden onChange={handleChange} />
      {isPending && <span>上传中...</span>}
    </label>
  )
}
```

#### 音效预加载 Hook

```typescript
// src/hooks/useSounds.ts
// 音效通过 /api/v1/sounds 拿到 URL，利用浏览器 HTTP 缓存（ETag）
// 解码成 AudioBuffer 存入 Map，击键时直接播放，延迟 <5ms

type SoundSlot = 'key' | 'error' | 'success'
const audioCtx  = new AudioContext()
const buffers   = new Map<SoundSlot, AudioBuffer>()

export function useSounds() {
  const enabled = useSettingsStore(s => s.getBool('user.practice.enable_sound'))

  useEffect(() => {
    if (!enabled) return
    request<Record<SoundSlot, { url: string } | null>>('/sounds').then(sounds => {
      Object.entries(sounds).forEach(([slot, info]) => {
        if (!info) return
        fetch(info.url)
          .then(r => r.arrayBuffer())
          .then(buf => audioCtx.decodeAudioData(buf))
          .then(decoded => buffers.set(slot as SoundSlot, decoded))
      })
    })
  }, [enabled])

  return useCallback((slot: SoundSlot) => {
    if (!enabled) return
    const buf = buffers.get(slot)
    if (!buf) return
    const src = audioCtx.createBufferSource()
    src.buffer = buf
    src.connect(audioCtx.destination)
    src.start(0)
  }, [enabled])
}
```

#### 媒体 URL 工具函数

```typescript
// src/utils/media.ts
// 统一从 file_id 生成 URL，不在数据库存完整 URL，换域名时无需迁移数据

export const mediaUrl = (fileId: string | null | undefined): string | null =>
  fileId ? `/api/v1/media/${fileId}` : null

export const avatarUrl = (fileId: string | null | undefined): string =>
  mediaUrl(fileId) ?? '/default-avatar.svg'
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
| ------ | ------ | --------- |
| Hook 单元测试 | Vitest + `@testing-library/react-hooks` | `useTyping` IME 处理；WPM 计算；错误字符标记 |
| 组件测试 | Vitest + Testing Library | `CharDisplay` 字符状态渲染；`StatsBar` 数据显示 |
| E2E | Playwright | 完整练习流程；登录注册；词库导入 |

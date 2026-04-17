# Phase 5 后端开发日志

**日期：** 2026-03-21  
**状态：** ✅ 已完成

---

## 完成内容

### 1. 数据库存储媒体服务

- 新增 `media_type_definitions` 与 `media_files` 两张表，文件二进制直接存数据库 BLOB
- 新增 `users.avatar_media_id` 字段，用于把用户头像与媒体文件解耦关联
- `system` 资源的 `owner_id` 在落库时统一规范为 `''`，避免 `NULL` 参与唯一索引时失效，保证 `(type_key, owner_type, owner_id, slot)` 的唯一约束和覆盖写入真正生效

### 2. 媒体类型定义驱动校验

- 新增 `MediaTypeDefinition` / `MediaFile` 实体
- `media.Service` 统一按定义表做上传校验：
  - 文件大小限制
  - MIME 白名单校验（服务端 sniff，不信任客户端上报）
  - `max_count` 数量上限
  - `slot` 维度覆盖写入
- 当前预置 4 种类型：
  - `user.avatar`
  - `system.sound`
  - `word.image`
  - `article.cover`

### 3. 媒体访问与权限控制

- 新增 `GET /api/v1/media/:id` 原始文件服务：
  - 元数据和 BLOB 分两次查询，先做 ETag 判断，再决定是否读取二进制
  - 支持 `If-None-Match`，命中返回 `304`
  - `is_public=1` 允许匿名访问
  - `is_public=0` 需要有效 access token
- 新增媒体归属校验：
  - 用户资源：本人或管理员
  - 系统资源：仅管理员
  - 内容资源（`word` / `sentence` / `article`）：校验内容所属库的 owner

### 4. 新增 API

#### 公共接口

- `GET /api/v1/media/types` — 获取媒体类型定义
- `GET /api/v1/media/:id` — 获取媒体文件内容（公开/受控）

#### 登录后接口

- `GET /api/v1/media?type_key=...&owner_type=...&owner_id=...` — 按 owner 列文件
- `POST /api/v1/media/upload` — 通用上传接口（multipart/form-data）
- `DELETE /api/v1/media/:id` — 删除媒体文件
- `POST /api/v1/users/me/avatar` — 上传当前用户头像
- `DELETE /api/v1/users/me/avatar` — 删除当前用户头像
- `GET /api/v1/sounds` — 获取系统音效 slot 到 URL 的映射

#### 管理员接口

- `POST /api/v1/admin/media/system.sound/:slot` — 上传系统音效

### 5. 认证返回补充头像字段

- 登录返回用户信息增加 `avatar_media_id`
- `GET /api/v1/auth/me` 返回增加 `avatar_media_id`
- `PUT /api/v1/auth/profile` 返回增加 `avatar_media_id`

### 6. 系统默认音频种子初始化

- 启动时自动从 `resource/sounds` 读取内置音频，幂等写入 `system.sound`：
  - `key` <- `sounds/click.wav`
  - `error` <- `sounds/beep.wav`
  - `success` <- `sounds/correct.wav`
- 启动时自动从 `resource/sounds/key-sound` 读取系统键盘音色，幂等写入 `system.keysound`（slot 规范化为 `kbd.xxx`）
- 采用服务层 `SeedSystemSounds` 执行，底层复用 `UploadSystemSound`，重复启动会覆盖同 slot 数据而非重复插入
- 种子初始化失败仅告警不阻断服务启动

### 7. 二进制元信息与标识符查询模型

- `media_files` 新增业务元信息字段：
  - `display_name`：显示名称
  - `remark`：备注/说明
- 上传接口支持携带 `display_name` / `remark`，不再依赖文件名作为业务标识
- 新增系统音效目录接口：
  - `GET /api/v1/sounds/system`
  - 返回系统音效与键盘音色目录，核心字段是 `identifier`（即 `file_id`）
- 保留通用二进制接口：
  - `GET /api/v1/media/:id` 按 identifier 拉取实际二进制内容
- `system.sound` 调整为公开资源（`is_public=1`），便于音效直接读取与缓存

### 8. 为后续站点配置与用户自定义预留类型

- 新增媒体类型定义：
  - `system.logo`（站点 logo，system scope）
  - `user.keysound`（用户自定义键盘音色，user scope）
- 以上类型复用同一套通用上传与二进制访问模型，无需新增独立文件服务

---

## 新增迁移

| 文件 | 说明 |
|------|------|
| `migrations/000009_add_media_storage.sql` | 建媒体表 + 用户头像字段 |
| `migrations/000010_seed_media_type_definitions.sql` | 预置媒体类型定义 |

---

## 新增文件清单

```
api/
└── media/
    ├── media.go
    └── v1/
        └── media.go

internal/model/entity/
└── media.go

internal/service/media/
├── media.go
└── media_impl.go

internal/controller/media/
├── media_new.go
├── media_v1.go
└── media_handler.go

log/
└── phase5-backend.md
```

### 修改的文件

```
internal/cmd/cmd.go
internal/model/entity/user.go
api/auth/v1/auth.go
internal/controller/auth/auth_v1.go
```

---

## 验证结果

```bash
$ go build ./...   # ✅ 通过
$ go test ./...    # ✅ 通过
```

---

## 技术要点

- **覆盖写入而非重复插入**：同 `(type_key, owner_type, owner_id, slot)` 再次上传时更新原记录，URL 稳定不变
- **头像联动**：上传/删除 `user.avatar` 时同步维护 `users.avatar_media_id`
- **ETag 缓存**：媒体读取先查 hash，再根据 `If-None-Match` 决定是否返回 `304`
- **权限边界收口到服务层**：控制器只转发参数，归属校验和 owner 解析都在 service 中统一处理
- **定义驱动扩展**：后续新增媒体类型优先通过新增 seed/迁移完成，尽量不改服务层分支
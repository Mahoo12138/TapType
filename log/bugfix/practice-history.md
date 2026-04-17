# 练习记录查看与未完成恢复功能开发日志

**日期：** 2026-04-23  
**状态：** ✅ 已完成

---

## 概览

本次实现补齐了练习记录的可查看能力，并为未完成练习提供了继续恢复与舍弃操作。改动覆盖后端会话内容持久化、前端历史详情页、`/history` 与 `/practice` 两处入口联动，以及浏览器本地进度恢复。

---

## 完成内容

### 1. 后端：补齐可恢复会话的数据基础

- 新增迁移 `000015_add_practice_session_items.sql`，增加 `practice_session_items` 表，持久化每个练习会话对应的练习内容顺序。
- 新增实体 `PracticeSessionItem`，用于记录会话 ID、内容类型、内容 ID、顺序索引。
- `CreateSession` 现在在创建练习时会同时把词条/句子列表顺序写入数据库，保证未完成会话后续可以恢复原始内容。
- `GetSession` 现在会额外返回 `words` / `sentences`，支持详情查看与恢复练习。

### 2. 后端：新增舍弃未完成练习接口

- 新增 `DELETE /api/v1/practice/sessions/{id}`。
- 仅允许舍弃未完成会话；已完成会话会返回错误。
- 舍弃时会级联删除会话内容项、击键统计、错误记录、练习结果和会话本身，避免残留脏数据。

### 3. 前端：练习记录支持点击查看

- 新增详情路由 `frontend/src/routes/history.$sessionId.tsx`。
- 详情页支持展示：
  - 会话状态、时长、WPM、准确率
  - 本轮练习内容列表（按原始顺序）
  - 键位统计
  - 错题记录
- `/history` 列表页和 `/practice` 页的最近练习卡片都新增了“查看”按钮，可直接进入详情。

### 4. 前端：未完成练习支持继续和舍弃

- `/history` 列表页中，未完成记录新增“继续”和“舍弃”按钮。
- `/practice` 页的最近练习中，未完成记录同样支持“继续”和“舍弃”。
- 详情页对未完成练习也提供了“继续练习”和“舍弃练习”操作。

### 5. 前端：增加本地恢复进度快照

- 新增 `frontend/src/lib/practiceSessionProgress.ts`，使用 `localStorage` 按 `sessionId` 持久化未完成练习的本地进度。
- `useWordTyping` 新增 `initialSnapshot` / `getResumeSnapshot` 能力，可恢复：
  - 当前词索引
  - 已累计时间
  - 正确/错误输入统计
  - 已完成词数
  - 击键统计聚合信息
  - 错词计数
- 这样用户点击“继续”时，不只是回到同一批内容，而是可以从上次停下的词继续练习。
- 当练习提交完成、主动舍弃或退出当前会话时，会同步清理本地恢复快照。

---

## 主要文件

### 新增文件

- `migrations/000015_add_practice_session_items.sql`
- `internal/model/entity/practice_session_item.go`
- `frontend/src/routes/history.$sessionId.tsx`
- `frontend/src/lib/practiceSessionProgress.ts`

### 修改文件

- `api/practice/practice.go`
- `api/practice/v1/practice.go`
- `internal/controller/practice/practice_v1.go`
- `internal/service/practice/practice.go`
- `frontend/src/types/api.ts`
- `frontend/src/api/practice.ts`
- `frontend/src/hooks/useWordTyping.ts`
- `frontend/src/routes/history.tsx`
- `frontend/src/routes/practice.tsx`
- `frontend/src/routes/errors.tsx`
- `frontend/src/routes/index.tsx`
- `frontend/src/routeTree.gen.ts`

---

## 验证结果

```bash
# 后端定向验证
$ go test ./api/practice/... ./internal/controller/practice ./internal/service/practice ./internal/model/entity
# ✅ 通过（相关包无测试文件，但编译成功）

$ go build ./...
# ✅ 通过

# 前端构建
$ cd frontend && npm run build
# ✅ 通过
# 提示：存在体积较大的 JS chunk 警告，但不影响本次功能交付
```

---

## 注意事项

- 未完成练习的“继续恢复”目前依赖两层数据：
  - 服务端持久化练习内容顺序，保证会话能重新打开
  - 浏览器本地快照保存进度，保证可从上次停下的位置继续
- 如果用户在不同浏览器或清空本地存储后恢复，会仍然打开原始练习内容，但本地进度无法跨设备同步。
- 上述限制不影响查看记录、继续进入未完成练习、以及舍弃未完成练习三项核心需求。

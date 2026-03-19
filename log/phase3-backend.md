# Phase 3 后端开发日志

**日期：** 2026-03-19  
**状态：** ✅ 已完成

---

## 完成内容

### 1. utility/sm2 — SM-2 间隔重复算法
- `sm2.Calculate(state, quality)` — 完整 SM-2 算法，支持 quality 0-5
  - quality < 3：重置间隔为 1 天，repetitions 归零
  - quality >= 3：按 1 → 6 → interval × EF 递增
  - E-Factor 最低不低于 1.3
- `sm2.ScoreFromTyping(errorCount, actualMs, avgMs)` — 打字表现映射为 SM-2 quality 分
  - ≥3 错 → 1，1-2 错 → 2，正确但慢 → 3，正确微慢 → 4，完美 → 5
- **15 个单元测试全部通过**

### 2. utility/wpm — WPM 计算模块
- `wpm.Calculate(totalChars, correctChars, errorCount, durationMs)` → Result
- 标准公式：raw_wpm = (chars/5)/minutes, net_wpm = raw_wpm - errors/minutes
- **5 个单元测试全部通过**

### 3. GORM 实体模型
新增 7 个实体文件，覆盖 Phase 3 所需的所有表：
- `practice_session.go` / `practice_result.go` / `keystroke_stat.go`
- `error_record.go` / `daily_record.go` / `content.go` (Word + Sentence)
- `achievement.go` (Achievement + UserAchievement)

### 4. 错题管理服务 (internal/service/errors)
- `ListErrors(userID, contentType, page, pageSize)` — 分页查询错题列表，JOIN 填充 content
- `GetReviewQueue(userID, limit)` — 查询 next_review_at ≤ now 的待复习项
- `CreateReviewSession(userID, itemCount)` — 从复习队列一键生成 mode=review 的练习会话
- `UpsertErrorRecord(...)` — 创建或更新错题，调用 SM-2 算法重算复习计划

### 5. 分析服务 (internal/service/analysis)
- `GetTrend(userID, period, days)` — 按日/周/月聚合 WPM、准确率趋势
- `GetKeymap(userID)` — 聚合所有 session 的键位统计（错误率、平均间隔）
- `GetSummary(userID)` — 综合概要：总 session 数、总时长、最高/平均 WPM、当前/最长 streak、错题数、待复习数

### 6. 每日记录服务 (internal/service/daily)
- `GetToday(userID)` — 获取今日记录
- `UpdateAfterPractice(userID, durationMs, wpm, accuracy)` — UPSERT 每日记录 + streak 计算
  - 新一天：检查昨天是否有记录来决定 streak+1 或重置为 1
  - 当天多次练习：累加 count/duration，重算 running average

### 7. 练习完成提交服务 (internal/service/practice)
- `CompletePractice(req)` — 事务中完成：标记 session ended_at、创建 result、批量写入 keystroke_stats
- `postCompletionHooks(req)` — 事务后触发：遍历 error_items 调用 SM-2 更新 + 更新 daily record

### 8. API 路由注册
所有新增 API 已在 cmd.go 注册到 JWT 保护的路由组中。

---

## 新增 API 端点

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/v1/errors` | 错题列表（分页，支持 content_type 筛选） |
| GET | `/api/v1/errors/review-queue` | 今日待复习列表 |
| POST | `/api/v1/errors/review-session` | 一键生成错题强化 Session |
| GET | `/api/v1/analysis/trend` | 历史趋势（day/week/month） |
| GET | `/api/v1/analysis/keymap` | 键位统计 |
| GET | `/api/v1/analysis/summary` | 综合概要 |
| GET | `/api/v1/daily` | 今日记录（含 streak） |
| PATCH | `/api/v1/practice/sessions/:id` | 完成练习提交结果（触发 SM-2 + daily 更新） |

## E2E 验证结果

所有端点返回 `{"code": 0, ...}` 成功响应，空数据状态正常。

---

## 文件清单

```
utility/
├── sm2/
│   ├── sm2.go                  # SM-2 算法 + ScoreFromTyping
│   └── sm2_test.go             # 15 个测试用例
├── wpm/
│   ├── wpm.go                  # WPM 计算
│   └── wpm_test.go             # 5 个测试用例

internal/model/entity/
├── practice_session.go
├── practice_result.go
├── keystroke_stat.go
├── error_record.go
├── daily_record.go
├── content.go                  # Word + Sentence
├── achievement.go              # Achievement + UserAchievement

internal/service/
├── errors/
│   ├── errors.go               # Service 接口
│   └── errors_impl.go          # 实现（含 SM-2 集成）
├── analysis/
│   ├── analysis.go             # Service 接口
│   └── analysis_impl.go        # 实现（SQL 聚合查询）
├── daily/
│   ├── daily.go                # Service 接口
│   └── daily_impl.go           # 实现（streak UPSERT）
├── practice/
│   └── practice.go             # Service + CompletePractice + SM-2 hooks

internal/controller/
├── errors.go                   # 错题 API 控制器
├── analysis.go                 # 分析 API 控制器
├── daily.go                    # 每日记录控制器
├── practice.go                 # 练习提交控制器

internal/cmd/
└── cmd.go                      # 新增路由注册
```

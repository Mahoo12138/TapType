# 文章库与句库释义改造日志

**日期：** 2026-03-21  
**状态：** ✅ 已完成  
**对应规格：** 第 6 节 sentences 释义字段 + 第 14 节文章库四层结构

---

## 本次核心设计

1. `sentences` 表新增 `translation` 与 `translation_source`。  
2. 文章库重构为四层结构：
	 - `articles`：文章元信息
	 - `article_paragraphs`：练习单位（段落）
	 - `article_sentences`：展示单位（段内句子 + 释义）
	 - `user_article_progress`：进度（按段落推进）

---

## 关键实现

### 数据库迁移

- `migrations/000006_add_article_library.sql`
	- 改为创建 `article_paragraphs` 与 `article_sentences`
	- `articles.section_count/split_strategy` -> `articles.paragraph_count`
	- `user_article_progress.completed_sections/total_sections` -> `completed_paragraphs/total_paragraphs`
- `migrations/000007_add_sentence_translation.sql`
	- `sentences` 新增：`translation TEXT`、`translation_source TEXT NOT NULL DEFAULT 'manual'`

### 后端模型与逻辑

- `internal/model/entity/content.go`
	- `Sentence` 新增 `translation` 与 `translation_source`
- `internal/model/entity/article.go`
	- `ArticleSection` 替换为 `ArticleParagraph` + `ArticleSentence`
	- 进度字段改为 paragraph 维度
- `utility/splitter/splitter.go`
	- 替换为 `SplitParagraphs` / `SplitSentences`
- `internal/service/article/article.go`
	- 导入文章时：自然段切分 -> 段内分句 -> 入库
	- 新增句子释义管理接口逻辑
	- 进度推进改为 `CompleteParagraph` / `NextParagraph`
- `internal/service/sentence/sentence.go`
	- 句子创建、更新、导入、导出支持 `translation` / `translation_source`
	- CSV 导入导出支持新增列

### API 与控制器

- `api/articlebank/v1/articlebank.go`
	- 新增：
		- `GET /articles/{articleId}/sentences`
		- `PUT /article-sentences/{sentenceId}`
		- `GET /articles/{articleId}/next-paragraph`
		- `POST /articles/{articleId}/paragraphs/{index}/complete`
	- 移除旧 section/resplit 语义
- `internal/controller/articlebank/articlebank_v1.go`
	- 对应更新为 paragraph/sentence 语义
- `api/sentencebank/v1/sentencebank.go`
	- create/update 请求新增 `translation` 与 `translation_source`
- `internal/controller/sentencebank/sentencebank_v1.go`
	- 透传新增释义字段

### 前端

- `frontend/src/types/api.ts`
	- Sentence 类型新增 `translation` / `translation_source`
	- 文章类型改为 paragraph/sentence 架构
- `frontend/src/api/sentenceBanks.ts`
	- create/update sentence hooks 支持释义字段
- `frontend/src/api/articleBanks.ts`
	- 改为 paragraph 端点
	- 新增文章句子释义 hooks
- `frontend/src/routes/articles.tsx`
	- 页面改为段落+句子释义管理视图
	- 展示按段落进度

---

## 验证

- 后端编译：`go build ./...` ✅ 通过
- 前端构建：`npm run build`（frontend）✅ 通过
- 分段测试：`go test ./utility/splitter/ -v` ✅ 通过


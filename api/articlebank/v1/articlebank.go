package v1

import (
	"github.com/gogf/gf/v2/frame/g"
)

// ─── Bank CRUD ───────────────────────────────────────────

type ListArticleBanksReq struct {
	g.Meta `path:"/article-banks" method:"get" tags:"ArticleBank" summary:"List article banks"`
}
type ListArticleBanksRes struct{}

type CreateArticleBankReq struct {
	g.Meta      `path:"/article-banks" method:"post" tags:"ArticleBank" summary:"Create article bank"`
	Name        string `json:"name"        v:"required#name is required"`
	Description string `json:"description"`
	Language    string `json:"language"`
	IsPublic    int    `json:"is_public"`
}
type CreateArticleBankRes struct{}

type GetArticleBankReq struct {
	g.Meta `path:"/article-banks/{id}" method:"get" tags:"ArticleBank" summary:"Get article bank"`
	Id     string `json:"id" in:"path"`
}
type GetArticleBankRes struct{}

type UpdateArticleBankReq struct {
	g.Meta      `path:"/article-banks/{id}" method:"put" tags:"ArticleBank" summary:"Update article bank"`
	Id          string  `json:"id" in:"path"`
	Name        *string `json:"name"`
	Description *string `json:"description"`
	Language    *string `json:"language"`
	IsPublic    *int    `json:"is_public"`
}
type UpdateArticleBankRes struct{}

type DeleteArticleBankReq struct {
	g.Meta `path:"/article-banks/{id}" method:"delete" tags:"ArticleBank" summary:"Delete article bank"`
	Id     string `json:"id" in:"path"`
}
type DeleteArticleBankRes struct{}

// ─── Article CRUD ────────────────────────────────────────

type ListArticlesReq struct {
	g.Meta   `path:"/article-banks/{id}/articles" method:"get" tags:"ArticleBank" summary:"List articles"`
	Id       string `json:"id"        in:"path"`
	Page     int    `json:"page"      in:"query" d:"1"`
	PageSize int    `json:"page_size" in:"query" d:"20"`
}
type ListArticlesRes struct {
	List     interface{} `json:"list"`
	Total    int64       `json:"total"`
	Page     int         `json:"page"`
	PageSize int         `json:"page_size"`
}

type CreateArticleReq struct {
	g.Meta               `path:"/article-banks/{id}/articles" method:"post" tags:"ArticleBank" summary:"Create article"`
	Id                   string            `json:"id"             in:"path"`
	Title                string            `json:"title"          v:"required#title is required"`
	Author               string            `json:"author"`
	SourceURL            string            `json:"source_url"`
	Content              string            `json:"content"        v:"required#content is required"`
	Difficulty           int               `json:"difficulty"`
	Tags                 string            `json:"tags"`
	SentencesTranslation map[string]string `json:"sentences_translation"`
}
type CreateArticleRes struct{}

type GetArticleReq struct {
	g.Meta    `path:"/articles/{articleId}" method:"get" tags:"ArticleBank" summary:"Get article detail"`
	ArticleId string `json:"articleId" in:"path"`
}
type GetArticleRes struct{}

type UpdateArticleReq struct {
	g.Meta     `path:"/articles/{articleId}" method:"put" tags:"ArticleBank" summary:"Update article"`
	ArticleId  string  `json:"articleId" in:"path"`
	Title      *string `json:"title"`
	Author     *string `json:"author"`
	SourceURL  *string `json:"source_url"`
	Difficulty *int    `json:"difficulty"`
	Tags       *string `json:"tags"`
}
type UpdateArticleRes struct{}

type DeleteArticleReq struct {
	g.Meta    `path:"/articles/{articleId}" method:"delete" tags:"ArticleBank" summary:"Delete article"`
	ArticleId string `json:"articleId" in:"path"`
}
type DeleteArticleRes struct{}

type ExportArticleBankReq struct {
	g.Meta `path:"/article-banks/{id}/export" method:"get" tags:"ArticleBank" summary:"Export article bank"`
	Id     string `json:"id" in:"path"`
}
type ExportArticleBankRes struct{}

// ─── Sentence Translation Management ─────────────────────

type ListArticleSentencesReq struct {
	g.Meta    `path:"/articles/{articleId}/sentences" method:"get" tags:"ArticleBank" summary:"List all article sentences"`
	ArticleId string `json:"articleId" in:"path"`
}
type ListArticleSentencesRes struct{}

type UpdateArticleSentenceReq struct {
	g.Meta            `path:"/article-sentences/{sentenceId}" method:"put" tags:"ArticleBank" summary:"Update article sentence translation"`
	SentenceId        string  `json:"sentenceId" in:"path"`
	Translation       *string `json:"translation"`
	TranslationSource *string `json:"translation_source"`
}
type UpdateArticleSentenceRes struct{}

// ─── Progress & Practice ─────────────────────────────────

type NextParagraphReq struct {
	g.Meta    `path:"/articles/{articleId}/next-paragraph" method:"get" tags:"ArticleBank" summary:"Get next paragraph"`
	ArticleId string `json:"articleId" in:"path"`
}
type NextParagraphRes struct{}

type CompleteParagraphReq struct {
	g.Meta    `path:"/articles/{articleId}/paragraphs/{index}/complete" method:"post" tags:"ArticleBank" summary:"Complete paragraph"`
	ArticleId string `json:"articleId" in:"path"`
	Index     int    `json:"index"     in:"path"`
}
type CompleteParagraphRes struct{}

type ListProgressReq struct {
	g.Meta `path:"/articles/progress" method:"get" tags:"ArticleBank" summary:"List progress"`
}
type ListProgressRes struct{}

type ResetProgressReq struct {
	g.Meta    `path:"/articles/{articleId}/progress" method:"delete" tags:"ArticleBank" summary:"Reset progress"`
	ArticleId string `json:"articleId" in:"path"`
}
type ResetProgressRes struct{}

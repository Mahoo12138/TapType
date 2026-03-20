package v1

import (
	"github.com/gogf/gf/v2/frame/g"
	"github.com/gogf/gf/v2/net/ghttp"
)

// ─── Bank CRUD ───────────────────────────────────────────

type ListSentenceBanksReq struct {
	g.Meta `path:"/sentence-banks" method:"get" tags:"SentenceBank" summary:"List sentence banks"`
}
type ListSentenceBanksRes struct{}

type CreateSentenceBankReq struct {
	g.Meta   `path:"/sentence-banks" method:"post" tags:"SentenceBank" summary:"Create sentence bank"`
	Name     string `json:"name"     v:"required#name is required"`
	Category string `json:"category"`
	IsPublic int    `json:"is_public"`
}
type CreateSentenceBankRes struct{}

type GetSentenceBankReq struct {
	g.Meta `path:"/sentence-banks/{id}" method:"get" tags:"SentenceBank" summary:"Get sentence bank"`
	Id     string `json:"id" in:"path"`
}
type GetSentenceBankRes struct{}

type UpdateSentenceBankReq struct {
	g.Meta   `path:"/sentence-banks/{id}" method:"put" tags:"SentenceBank" summary:"Update sentence bank"`
	Id       string  `json:"id" in:"path"`
	Name     *string `json:"name"`
	Category *string `json:"category"`
	IsPublic *int    `json:"is_public"`
}
type UpdateSentenceBankRes struct{}

type DeleteSentenceBankReq struct {
	g.Meta `path:"/sentence-banks/{id}" method:"delete" tags:"SentenceBank" summary:"Delete sentence bank"`
	Id     string `json:"id" in:"path"`
}
type DeleteSentenceBankRes struct{}

// ─── Sentence CRUD ───────────────────────────────────────

type ListSentencesReq struct {
	g.Meta     `path:"/sentence-banks/{id}/sentences" method:"get" tags:"SentenceBank" summary:"List sentences"`
	Id         string `json:"id"         in:"path"`
	Page       int    `json:"page"       in:"query" d:"1"`
	PageSize   int    `json:"page_size"  in:"query" d:"20"`
	Search     string `json:"search"     in:"query"`
	Difficulty int    `json:"difficulty" in:"query"`
}
type ListSentencesRes struct {
	List     interface{} `json:"list"`
	Total    int64       `json:"total"`
	Page     int         `json:"page"`
	PageSize int         `json:"page_size"`
}

type CreateSentenceReq struct {
	g.Meta            `path:"/sentence-banks/{id}/sentences" method:"post" tags:"SentenceBank" summary:"Create sentence"`
	Id                string `json:"id" in:"path"`
	Content           string `json:"content"    v:"required#content is required"`
	Translation       string `json:"translation"`
	TranslationSource string `json:"translation_source"`
	Source            string `json:"source"`
	Difficulty        int    `json:"difficulty"`
	Tags              string `json:"tags"`
}
type CreateSentenceRes struct{}

type UpdateSentenceReq struct {
	g.Meta            `path:"/sentences/{sentenceId}" method:"put" tags:"SentenceBank" summary:"Update sentence"`
	SentenceId        string  `json:"sentenceId" in:"path"`
	Content           *string `json:"content"`
	Translation       *string `json:"translation"`
	TranslationSource *string `json:"translation_source"`
	Source            *string `json:"source"`
	Difficulty        *int    `json:"difficulty"`
	Tags              *string `json:"tags"`
}
type UpdateSentenceRes struct{}

type DeleteSentenceReq struct {
	g.Meta     `path:"/sentences/{sentenceId}" method:"delete" tags:"SentenceBank" summary:"Delete sentence"`
	SentenceId string `json:"sentenceId" in:"path"`
}
type DeleteSentenceRes struct{}

// ─── Import / Export ─────────────────────────────────────

type ImportSentencesReq struct {
	g.Meta `path:"/sentence-banks/{id}/sentences/import" method:"post" tags:"SentenceBank" summary:"Import sentences" mime:"multipart/form-data"`
	Id     string            `json:"id"     in:"path"`
	File   *ghttp.UploadFile `json:"file"   type:"file"`
	Format string            `json:"format" in:"query" d:"json"`
}
type ImportSentencesRes struct {
	Imported int `json:"imported"`
}

type ExportSentencesReq struct {
	g.Meta `path:"/sentence-banks/{id}/export" method:"get" tags:"SentenceBank" summary:"Export sentences"`
	Id     string `json:"id"     in:"path"`
	Format string `json:"format" in:"query" d:"json"`
}
type ExportSentencesRes struct{}

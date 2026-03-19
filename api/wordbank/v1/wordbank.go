package v1

import (
	"github.com/gogf/gf/v2/frame/g"
	"github.com/gogf/gf/v2/net/ghttp"
)

// ─── Bank CRUD ───────────────────────────────────────────

type ListWordBanksReq struct {
	g.Meta `path:"/word-banks" method:"get" tags:"WordBank" summary:"List word banks"`
}
type ListWordBanksRes struct{}

type CreateWordBankReq struct {
	g.Meta      `path:"/word-banks" method:"post" tags:"WordBank" summary:"Create word bank"`
	Name        string `json:"name"        v:"required#name is required"`
	Description string `json:"description"`
	IsPublic    int    `json:"is_public"`
}
type CreateWordBankRes struct{}

type GetWordBankReq struct {
	g.Meta `path:"/word-banks/{id}" method:"get" tags:"WordBank" summary:"Get word bank"`
	Id     string `json:"id" in:"path"`
}
type GetWordBankRes struct{}

type UpdateWordBankReq struct {
	g.Meta      `path:"/word-banks/{id}" method:"put" tags:"WordBank" summary:"Update word bank"`
	Id          string  `json:"id" in:"path"`
	Name        *string `json:"name"`
	Description *string `json:"description"`
	IsPublic    *int    `json:"is_public"`
}
type UpdateWordBankRes struct{}

type DeleteWordBankReq struct {
	g.Meta `path:"/word-banks/{id}" method:"delete" tags:"WordBank" summary:"Delete word bank"`
	Id     string `json:"id" in:"path"`
}
type DeleteWordBankRes struct{}

// ─── Word CRUD ───────────────────────────────────────────

type ListWordsReq struct {
	g.Meta     `path:"/word-banks/{id}/words" method:"get" tags:"WordBank" summary:"List words in bank"`
	Id         string `json:"id"         in:"path"`
	Page       int    `json:"page"       in:"query" d:"1"`
	PageSize   int    `json:"page_size"  in:"query" d:"20"`
	Search     string `json:"search"     in:"query"`
	Difficulty int    `json:"difficulty" in:"query"`
}
type ListWordsRes struct {
	List     interface{} `json:"list"`
	Total    int64       `json:"total"`
	Page     int         `json:"page"`
	PageSize int         `json:"page_size"`
}

type CreateWordReq struct {
	g.Meta          `path:"/word-banks/{id}/words" method:"post" tags:"WordBank" summary:"Create word"`
	Id              string `json:"id" in:"path"`
	Content         string `json:"content"          v:"required#content is required"`
	Pronunciation   string `json:"pronunciation"`
	Definition      string `json:"definition"`
	ExampleSentence string `json:"example_sentence"`
	Difficulty      int    `json:"difficulty"`
	Tags            string `json:"tags"`
}
type CreateWordRes struct{}

type UpdateWordReq struct {
	g.Meta          `path:"/words/{wordId}" method:"put" tags:"WordBank" summary:"Update word"`
	WordId          string  `json:"wordId" in:"path"`
	Content         *string `json:"content"`
	Pronunciation   *string `json:"pronunciation"`
	Definition      *string `json:"definition"`
	ExampleSentence *string `json:"example_sentence"`
	Difficulty      *int    `json:"difficulty"`
	Tags            *string `json:"tags"`
}
type UpdateWordRes struct{}

type DeleteWordReq struct {
	g.Meta `path:"/words/{wordId}" method:"delete" tags:"WordBank" summary:"Delete word"`
	WordId string `json:"wordId" in:"path"`
}
type DeleteWordRes struct{}

// ─── Import / Export ─────────────────────────────────────

type ImportWordsReq struct {
	g.Meta `path:"/word-banks/{id}/words/import" method:"post" tags:"WordBank" summary:"Import words" mime:"multipart/form-data"`
	Id     string            `json:"id"     in:"path"`
	File   *ghttp.UploadFile `json:"file"   type:"file"`
	Format string            `json:"format" in:"query" d:"json"`
}
type ImportWordsRes struct {
	Imported int `json:"imported"`
}

type ExportWordsReq struct {
	g.Meta `path:"/word-banks/{id}/export" method:"get" tags:"WordBank" summary:"Export words"`
	Id     string `json:"id"     in:"path"`
	Format string `json:"format" in:"query" d:"json"`
}
type ExportWordsRes struct{}

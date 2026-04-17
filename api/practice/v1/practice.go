package v1

import (
	"github.com/gogf/gf/v2/frame/g"
)

type CreateSessionReq struct {
	g.Meta     `path:"/practice/sessions" method:"post" tags:"Practice" summary:"Create practice session"`
	Mode       string `json:"mode"        v:"required#mode is required"`
	SourceType string `json:"source_type" v:"required#source_type is required"`
	SourceID   string `json:"source_id"   v:"required#source_id is required"`
	ItemCount  int    `json:"item_count"  v:"min:1|max:200"`
}
type CreateSessionRes struct {
	Session   interface{} `json:"session"`
	Words     interface{} `json:"words,omitempty"`
	Sentences interface{} `json:"sentences,omitempty"`
}

type ListSessionsReq struct {
	g.Meta   `path:"/practice/sessions" method:"get" tags:"Practice" summary:"List practice sessions"`
	Page     int `json:"page"      in:"query" d:"1"`
	PageSize int `json:"page_size" in:"query" d:"10"`
}
type ListSessionsRes struct {
	List     interface{} `json:"list"`
	Total    int64       `json:"total"`
	Page     int         `json:"page"`
	PageSize int         `json:"page_size"`
}

type GetSessionReq struct {
	g.Meta `path:"/practice/sessions/{id}" method:"get" tags:"Practice" summary:"Get practice session detail"`
	Id     string `json:"id" in:"path"`
}
type GetSessionRes struct {
	Session        interface{} `json:"session"`
	Result         interface{} `json:"result,omitempty"`
	KeystrokeStats interface{} `json:"keystroke_stats"`
	ErrorItems     interface{} `json:"error_items"`
	Words          interface{} `json:"words,omitempty"`
	Sentences      interface{} `json:"sentences,omitempty"`
}

type DiscardSessionReq struct {
	g.Meta `path:"/practice/sessions/{id}" method:"delete" tags:"Practice" summary:"Discard unfinished practice session"`
	Id     string `json:"id" in:"path"`
}
type DiscardSessionRes struct{}

type CompleteSessionReq struct {
	g.Meta         `path:"/practice/sessions/{id}" method:"patch" tags:"Practice" summary:"Complete practice session"`
	Id             string        `json:"id" in:"path"`
	WPM            float64       `json:"wpm"`
	RawWPM         float64       `json:"raw_wpm"`
	Accuracy       float64       `json:"accuracy"`
	ErrorCount     int           `json:"error_count"`
	CharCount      int           `json:"char_count"`
	Consistency    float64       `json:"consistency"`
	DurationMs     int64         `json:"duration_ms"`
	KeystrokeStats []interface{} `json:"keystroke_stats"`
	ErrorItems     []interface{} `json:"error_items"`
}
type CompleteSessionRes struct {
	Result          interface{} `json:"result"`
	NewAchievements interface{} `json:"new_achievements"`
}

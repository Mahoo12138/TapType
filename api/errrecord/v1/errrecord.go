package v1

import (
	"github.com/gogf/gf/v2/frame/g"
)

type ListErrorsReq struct {
	g.Meta      `path:"/errors" method:"get" tags:"ErrorRecord" summary:"List error records"`
	ContentType string `json:"content_type" in:"query"`
	Page        int    `json:"page"         in:"query" d:"1"`
	PageSize    int    `json:"page_size"    in:"query" d:"20"`
}
type ListErrorsRes struct {
	List     interface{} `json:"list"`
	Total    int64       `json:"total"`
	Page     int         `json:"page"`
	PageSize int         `json:"page_size"`
}

type GetReviewQueueReq struct {
	g.Meta `path:"/errors/review-queue" method:"get" tags:"ErrorRecord" summary:"Get today's review queue"`
	Limit  int `json:"limit" in:"query" d:"50"`
}
type GetReviewQueueRes struct {
	List  interface{} `json:"list"`
	Total int         `json:"total"`
}

type CreateReviewSessionReq struct {
	g.Meta    `path:"/errors/review-session" method:"post" tags:"ErrorRecord" summary:"Create review practice session"`
	ItemCount int `json:"item_count"`
}
type CreateReviewSessionRes struct {
	Session   interface{} `json:"session"`
	Items     interface{} `json:"items"`
	ItemCount string      `json:"item_count"`
}

package v1

import (
	"github.com/gogf/gf/v2/frame/g"
)

type GetTrendReq struct {
	g.Meta `path:"/analysis/trend" method:"get" tags:"Analysis" summary:"Get historical trend"`
	Period string `json:"period" in:"query" d:"day"`
	Days   int    `json:"days"   in:"query" d:"30"`
}
type GetTrendRes struct{}

type GetKeymapReq struct {
	g.Meta `path:"/analysis/keymap" method:"get" tags:"Analysis" summary:"Get keystroke statistics"`
}
type GetKeymapRes struct{}

type GetSummaryReq struct {
	g.Meta `path:"/analysis/summary" method:"get" tags:"Analysis" summary:"Get practice summary"`
}
type GetSummaryRes struct{}

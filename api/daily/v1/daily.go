package v1

import (
	"github.com/gogf/gf/v2/frame/g"
)

type GetTodayReq struct {
	g.Meta `path:"/daily" method:"get" tags:"Daily" summary:"Get today's record"`
}
type GetTodayRes struct{}

package v1

import (
	"github.com/gogf/gf/v2/frame/g"
)

type ListAchievementsReq struct {
	g.Meta `path:"/achievements" method:"get" tags:"Achievement" summary:"List all achievements"`
}
type ListAchievementsRes struct{}

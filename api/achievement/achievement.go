package achievement

import (
	"context"

	v1 "taptype/api/achievement/v1"
)

type IAchievementV1 interface {
	ListAchievements(ctx context.Context, req *v1.ListAchievementsReq) (res *v1.ListAchievementsRes, err error)
}

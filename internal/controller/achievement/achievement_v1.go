package achievement

import (
	"context"

	"github.com/gogf/gf/v2/frame/g"

	v1 "taptype/api/achievement/v1"
)

func (c *ControllerV1) ListAchievements(ctx context.Context, req *v1.ListAchievementsReq) (res *v1.ListAchievementsRes, err error) {
	r := g.RequestFromCtx(ctx)
	userID := r.GetCtxVar("user_id").String()

	achievements, err := c.achievementSvc.ListAll(ctx, userID)
	if err != nil {
		return nil, err
	}

	r.Response.WriteJsonExit(g.Map{"code": 0, "message": "success", "data": achievements})
	return
}

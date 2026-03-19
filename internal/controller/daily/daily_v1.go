package daily

import (
	"context"

	"github.com/gogf/gf/v2/frame/g"

	v1 "taptype/api/daily/v1"
)

func (c *ControllerV1) GetToday(ctx context.Context, req *v1.GetTodayReq) (res *v1.GetTodayRes, err error) {
	r := g.RequestFromCtx(ctx)
	userID := r.GetCtxVar("user_id").String()

	record, err := c.dailySvc.GetToday(ctx, userID)
	if err != nil {
		return nil, err
	}

	r.Response.WriteJsonExit(g.Map{"code": 0, "message": "success", "data": record})
	return
}

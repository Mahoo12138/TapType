package analysis

import (
	"context"

	"github.com/gogf/gf/v2/frame/g"

	v1 "taptype/api/analysis/v1"
)

func (c *ControllerV1) GetTrend(ctx context.Context, req *v1.GetTrendReq) (res *v1.GetTrendRes, err error) {
	r := g.RequestFromCtx(ctx)
	userID := r.GetCtxVar("user_id").String()

	days := req.Days
	if days > 365 {
		days = 365
	}

	points, err := c.analysisSvc.GetTrend(ctx, userID, req.Period, days)
	if err != nil {
		return nil, err
	}

	r.Response.WriteJsonExit(g.Map{"code": 0, "message": "success", "data": points})
	return
}

func (c *ControllerV1) GetKeymap(ctx context.Context, req *v1.GetKeymapReq) (res *v1.GetKeymapRes, err error) {
	r := g.RequestFromCtx(ctx)
	userID := r.GetCtxVar("user_id").String()

	stats, err := c.analysisSvc.GetKeymap(ctx, userID)
	if err != nil {
		return nil, err
	}

	r.Response.WriteJsonExit(g.Map{"code": 0, "message": "success", "data": stats})
	return
}

func (c *ControllerV1) GetSummary(ctx context.Context, req *v1.GetSummaryReq) (res *v1.GetSummaryRes, err error) {
	r := g.RequestFromCtx(ctx)
	userID := r.GetCtxVar("user_id").String()

	summary, err := c.analysisSvc.GetSummary(ctx, userID)
	if err != nil {
		return nil, err
	}

	r.Response.WriteJsonExit(g.Map{"code": 0, "message": "success", "data": summary})
	return
}

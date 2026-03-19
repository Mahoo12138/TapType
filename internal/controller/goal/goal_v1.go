package goal

import (
	"context"

	"github.com/gogf/gf/v2/frame/g"

	v1 "taptype/api/goal/v1"
)

func (c *ControllerV1) ListGoals(ctx context.Context, req *v1.ListGoalsReq) (res *v1.ListGoalsRes, err error) {
	r := g.RequestFromCtx(ctx)
	userID := r.GetCtxVar("user_id").String()

	goals, err := c.goalSvc.ListGoals(ctx, userID)
	if err != nil {
		return nil, err
	}

	r.Response.WriteJsonExit(g.Map{"code": 0, "message": "success", "data": goals})
	return
}

func (c *ControllerV1) CreateGoal(ctx context.Context, req *v1.CreateGoalReq) (res *v1.CreateGoalRes, err error) {
	r := g.RequestFromCtx(ctx)
	userID := r.GetCtxVar("user_id").String()

	goal, err := c.goalSvc.CreateGoal(ctx, userID, req.GoalType, req.TargetValue, req.Period)
	if err != nil {
		return nil, err
	}

	r.Response.WriteJsonExit(g.Map{"code": 0, "message": "success", "data": goal})
	return
}

func (c *ControllerV1) UpdateGoal(ctx context.Context, req *v1.UpdateGoalReq) (res *v1.UpdateGoalRes, err error) {
	r := g.RequestFromCtx(ctx)
	userID := r.GetCtxVar("user_id").String()

	goal, err := c.goalSvc.UpdateGoal(ctx, userID, req.Id, req.TargetValue, req.IsActive)
	if err != nil {
		return nil, err
	}

	r.Response.WriteJsonExit(g.Map{"code": 0, "message": "success", "data": goal})
	return
}

func (c *ControllerV1) DeleteGoal(ctx context.Context, req *v1.DeleteGoalReq) (res *v1.DeleteGoalRes, err error) {
	r := g.RequestFromCtx(ctx)
	userID := r.GetCtxVar("user_id").String()

	if err = c.goalSvc.DeleteGoal(ctx, userID, req.Id); err != nil {
		return nil, err
	}

	r.Response.WriteJsonExit(g.Map{"code": 0, "message": "success", "data": nil})
	return
}

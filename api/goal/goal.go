package goal

import (
	"context"

	v1 "taptype/api/goal/v1"
)

type IGoalV1 interface {
	ListGoals(ctx context.Context, req *v1.ListGoalsReq) (res *v1.ListGoalsRes, err error)
	CreateGoal(ctx context.Context, req *v1.CreateGoalReq) (res *v1.CreateGoalRes, err error)
	UpdateGoal(ctx context.Context, req *v1.UpdateGoalReq) (res *v1.UpdateGoalRes, err error)
	DeleteGoal(ctx context.Context, req *v1.DeleteGoalReq) (res *v1.DeleteGoalRes, err error)
}

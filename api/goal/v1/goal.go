package v1

import (
	"github.com/gogf/gf/v2/frame/g"
)

type ListGoalsReq struct {
	g.Meta `path:"/goals" method:"get" tags:"Goal" summary:"List goals"`
}
type ListGoalsRes struct{}

type CreateGoalReq struct {
	g.Meta      `path:"/goals" method:"post" tags:"Goal" summary:"Create goal"`
	GoalType    string  `json:"goal_type"    v:"required#goal_type is required"`
	TargetValue float64 `json:"target_value" v:"required|min:0.01#target_value is required|target_value must be positive"`
	Period      string  `json:"period"`
}
type CreateGoalRes struct{}

type UpdateGoalReq struct {
	g.Meta      `path:"/goals/{id}" method:"put" tags:"Goal" summary:"Update goal"`
	Id          string   `json:"id" in:"path"`
	TargetValue *float64 `json:"target_value"`
	IsActive    *int     `json:"is_active"`
}
type UpdateGoalRes struct{}

type DeleteGoalReq struct {
	g.Meta `path:"/goals/{id}" method:"delete" tags:"Goal" summary:"Delete goal"`
	Id     string `json:"id" in:"path"`
}
type DeleteGoalRes struct{}

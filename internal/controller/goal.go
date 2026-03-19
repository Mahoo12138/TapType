package controller

import (
	"github.com/gogf/gf/v2/net/ghttp"

	goalService "taptype/internal/service/goal"
)

type GoalController struct {
	goalSvc goalService.Service
}

func NewGoalController(goalSvc goalService.Service) *GoalController {
	return &GoalController{goalSvc: goalSvc}
}

type createGoalReq struct {
	GoalType    string  `json:"goal_type"    v:"required#goal_type is required"`
	TargetValue float64 `json:"target_value" v:"required|min:0.01#target_value is required|target_value must be positive"`
	Period      string  `json:"period"`
}

type updateGoalReq struct {
	TargetValue *float64 `json:"target_value"`
	IsActive    *int     `json:"is_active"`
}

// ListGoals handles GET /api/v1/goals
func (c *GoalController) ListGoals(r *ghttp.Request) {
	userID := r.GetCtxVar("user_id").String()
	goals, err := c.goalSvc.ListGoals(r.Context(), userID)
	if err != nil {
		writeError(r, err)
		return
	}
	r.Response.WriteJsonExit(map[string]interface{}{
		"code":    0,
		"message": "success",
		"data":    goals,
	})
}

// CreateGoal handles POST /api/v1/goals
func (c *GoalController) CreateGoal(r *ghttp.Request) {
	userID := r.GetCtxVar("user_id").String()
	var req createGoalReq
	if err := r.Parse(&req); err != nil {
		r.Response.WriteJsonExit(map[string]interface{}{
			"code":    40001,
			"message": err.Error(),
			"data":    nil,
		})
		return
	}
	goal, err := c.goalSvc.CreateGoal(r.Context(), userID, req.GoalType, req.TargetValue, req.Period)
	if err != nil {
		writeError(r, err)
		return
	}
	r.Response.WriteJsonExit(map[string]interface{}{
		"code":    0,
		"message": "success",
		"data":    goal,
	})
}

// UpdateGoal handles PUT /api/v1/goals/:id
func (c *GoalController) UpdateGoal(r *ghttp.Request) {
	userID := r.GetCtxVar("user_id").String()
	goalID := r.Get("id").String()
	var req updateGoalReq
	if err := r.Parse(&req); err != nil {
		r.Response.WriteJsonExit(map[string]interface{}{
			"code":    40001,
			"message": err.Error(),
			"data":    nil,
		})
		return
	}
	goal, err := c.goalSvc.UpdateGoal(r.Context(), userID, goalID, req.TargetValue, req.IsActive)
	if err != nil {
		writeError(r, err)
		return
	}
	r.Response.WriteJsonExit(map[string]interface{}{
		"code":    0,
		"message": "success",
		"data":    goal,
	})
}

// DeleteGoal handles DELETE /api/v1/goals/:id
func (c *GoalController) DeleteGoal(r *ghttp.Request) {
	userID := r.GetCtxVar("user_id").String()
	goalID := r.Get("id").String()
	if err := c.goalSvc.DeleteGoal(r.Context(), userID, goalID); err != nil {
		writeError(r, err)
		return
	}
	r.Response.WriteJsonExit(map[string]interface{}{
		"code":    0,
		"message": "success",
		"data":    nil,
	})
}

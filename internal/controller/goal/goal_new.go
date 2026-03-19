package goal

import (
	"taptype/api/goal"
	goalService "taptype/internal/service/goal"
)

type ControllerV1 struct {
	goalSvc goalService.Service
}

func NewV1(goalSvc goalService.Service) goal.IGoalV1 {
	return &ControllerV1{goalSvc: goalSvc}
}

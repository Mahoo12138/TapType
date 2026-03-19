package achievement

import (
	"taptype/api/achievement"
	achievementService "taptype/internal/service/achievement"
)

type ControllerV1 struct {
	achievementSvc achievementService.Service
}

func NewV1(achievementSvc achievementService.Service) achievement.IAchievementV1 {
	return &ControllerV1{achievementSvc: achievementSvc}
}

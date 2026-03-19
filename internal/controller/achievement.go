package controller

import (
	"github.com/gogf/gf/v2/net/ghttp"

	achievementService "taptype/internal/service/achievement"
)

type AchievementController struct {
	achievementSvc achievementService.Service
}

func NewAchievementController(achievementSvc achievementService.Service) *AchievementController {
	return &AchievementController{achievementSvc: achievementSvc}
}

// ListAchievements handles GET /api/v1/achievements
func (c *AchievementController) ListAchievements(r *ghttp.Request) {
	userID := r.GetCtxVar("user_id").String()
	achievements, err := c.achievementSvc.ListAll(r.Context(), userID)
	if err != nil {
		writeError(r, err)
		return
	}
	r.Response.WriteJsonExit(map[string]interface{}{
		"code":    0,
		"message": "success",
		"data":    achievements,
	})
}

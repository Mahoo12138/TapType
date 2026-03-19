package controller

import (
	"github.com/gogf/gf/v2/net/ghttp"

	dailyService "taptype/internal/service/daily"
)

type DailyController struct {
	dailySvc dailyService.Service
}

func NewDailyController(dailySvc dailyService.Service) *DailyController {
	return &DailyController{dailySvc: dailySvc}
}

// GetToday handles GET /api/v1/daily
func (c *DailyController) GetToday(r *ghttp.Request) {
	userID := r.GetCtxVar("user_id").String()

	record, err := c.dailySvc.GetToday(r.Context(), userID)
	if err != nil {
		writeError(r, err)
		return
	}

	r.Response.WriteJsonExit(map[string]interface{}{
		"code":    0,
		"message": "success",
		"data":    record,
	})
}

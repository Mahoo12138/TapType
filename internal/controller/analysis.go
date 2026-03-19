package controller

import (
	"github.com/gogf/gf/v2/net/ghttp"

	analysisService "taptype/internal/service/analysis"
)

type AnalysisController struct {
	analysisSvc analysisService.Service
}

func NewAnalysisController(analysisSvc analysisService.Service) *AnalysisController {
	return &AnalysisController{analysisSvc: analysisSvc}
}

// GetTrend handles GET /api/v1/analysis/trend
func (c *AnalysisController) GetTrend(r *ghttp.Request) {
	userID := r.GetCtxVar("user_id").String()
	period := r.GetQuery("period", "day").String()
	days := r.GetQuery("days", 30).Int()

	if days > 365 {
		days = 365
	}

	points, err := c.analysisSvc.GetTrend(r.Context(), userID, period, days)
	if err != nil {
		writeError(r, err)
		return
	}

	r.Response.WriteJsonExit(map[string]interface{}{
		"code":    0,
		"message": "success",
		"data":    points,
	})
}

// GetKeymap handles GET /api/v1/analysis/keymap
func (c *AnalysisController) GetKeymap(r *ghttp.Request) {
	userID := r.GetCtxVar("user_id").String()

	stats, err := c.analysisSvc.GetKeymap(r.Context(), userID)
	if err != nil {
		writeError(r, err)
		return
	}

	r.Response.WriteJsonExit(map[string]interface{}{
		"code":    0,
		"message": "success",
		"data":    stats,
	})
}

// GetSummary handles GET /api/v1/analysis/summary
func (c *AnalysisController) GetSummary(r *ghttp.Request) {
	userID := r.GetCtxVar("user_id").String()

	summary, err := c.analysisSvc.GetSummary(r.Context(), userID)
	if err != nil {
		writeError(r, err)
		return
	}

	r.Response.WriteJsonExit(map[string]interface{}{
		"code":    0,
		"message": "success",
		"data":    summary,
	})
}

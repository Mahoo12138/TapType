package controller

import (
	"github.com/gogf/gf/v2/net/ghttp"

	practiceService "taptype/internal/service/practice"
)

type PracticeController struct {
	practiceSvc practiceService.Service
}

func NewPracticeController(practiceSvc practiceService.Service) *PracticeController {
	return &PracticeController{practiceSvc: practiceSvc}
}

// CompletePractice handles PATCH /api/v1/practice/sessions/:id
func (c *PracticeController) CompletePractice(r *ghttp.Request) {
	userID := r.GetCtxVar("user_id").String()
	sessionID := r.Get("id").String()

	var req practiceService.CompleteRequest
	if err := r.Parse(&req); err != nil {
		r.Response.WriteJsonExit(map[string]interface{}{
			"code":    40001,
			"message": err.Error(),
			"data":    nil,
		})
		return
	}

	req.SessionID = sessionID
	req.UserID = userID

	result, err := c.practiceSvc.CompletePractice(r.Context(), req)
	if err != nil {
		writeError(r, err)
		return
	}

	r.Response.WriteJsonExit(map[string]interface{}{
		"code":    0,
		"message": "success",
		"data":    result,
	})
}

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

// CreateSession handles POST /api/v1/practice/sessions
func (c *PracticeController) CreateSession(r *ghttp.Request) {
	userID := r.GetCtxVar("user_id").String()
	var req practiceService.CreateSessionRequest
	if err := r.Parse(&req); err != nil {
		r.Response.WriteJsonExit(map[string]interface{}{
			"code":    40001,
			"message": err.Error(),
			"data":    nil,
		})
		return
	}
	req.UserID = userID
	result, err := c.practiceSvc.CreateSession(r.Context(), req)
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

// ListSessions handles GET /api/v1/practice/sessions
func (c *PracticeController) ListSessions(r *ghttp.Request) {
	userID := r.GetCtxVar("user_id").String()
	page := r.GetQuery("page", 1).Int()
	pageSize := r.GetQuery("page_size", 10).Int()
	result, err := c.practiceSvc.ListSessions(r.Context(), userID, page, pageSize)
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

// GetSession handles GET /api/v1/practice/sessions/:id
func (c *PracticeController) GetSession(r *ghttp.Request) {
	userID := r.GetCtxVar("user_id").String()
	sessionID := r.Get("id").String()
	result, err := c.practiceSvc.GetSession(r.Context(), userID, sessionID)
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

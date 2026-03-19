package controller

import (
	"strconv"

	"github.com/gogf/gf/v2/net/ghttp"

	errorsService "taptype/internal/service/errors"
)

type ErrorsController struct {
	errorsSvc errorsService.Service
}

func NewErrorsController(errorsSvc errorsService.Service) *ErrorsController {
	return &ErrorsController{errorsSvc: errorsSvc}
}

// ListErrors handles GET /api/v1/errors
func (c *ErrorsController) ListErrors(r *ghttp.Request) {
	userID := r.GetCtxVar("user_id").String()
	contentType := r.GetQuery("content_type").String()
	page := r.GetQuery("page", 1).Int()
	pageSize := r.GetQuery("page_size", 20).Int()

	if pageSize > 100 {
		pageSize = 100
	}

	records, total, err := c.errorsSvc.ListErrors(r.Context(), userID, contentType, page, pageSize)
	if err != nil {
		writeError(r, err)
		return
	}

	r.Response.WriteJsonExit(map[string]interface{}{
		"code":    0,
		"message": "success",
		"data": map[string]interface{}{
			"list":      records,
			"total":     total,
			"page":      page,
			"page_size": pageSize,
		},
	})
}

// GetReviewQueue handles GET /api/v1/errors/review-queue
func (c *ErrorsController) GetReviewQueue(r *ghttp.Request) {
	userID := r.GetCtxVar("user_id").String()
	limit := r.GetQuery("limit", 50).Int()

	records, err := c.errorsSvc.GetReviewQueue(r.Context(), userID, limit)
	if err != nil {
		writeError(r, err)
		return
	}

	r.Response.WriteJsonExit(map[string]interface{}{
		"code":    0,
		"message": "success",
		"data": map[string]interface{}{
			"list":  records,
			"total": len(records),
		},
	})
}

// CreateReviewSession handles POST /api/v1/errors/review-session
func (c *ErrorsController) CreateReviewSession(r *ghttp.Request) {
	userID := r.GetCtxVar("user_id").String()

	var req struct {
		ItemCount int `json:"item_count"`
	}
	if err := r.Parse(&req); err != nil {
		r.Response.WriteJsonExit(map[string]interface{}{
			"code":    40001,
			"message": err.Error(),
			"data":    nil,
		})
		return
	}

	if req.ItemCount <= 0 {
		req.ItemCount = 20
	}

	session, items, err := c.errorsSvc.CreateReviewSession(r.Context(), userID, req.ItemCount)
	if err != nil {
		writeError(r, err)
		return
	}

	if session == nil {
		r.Response.WriteJsonExit(map[string]interface{}{
			"code":    0,
			"message": "no items due for review",
			"data": map[string]interface{}{
				"session": nil,
				"items":   []interface{}{},
			},
		})
		return
	}

	r.Response.WriteJsonExit(map[string]interface{}{
		"code":    0,
		"message": "success",
		"data": map[string]interface{}{
			"session": map[string]interface{}{
				"id":          session.ID,
				"mode":        session.Mode,
				"source_type": session.SourceType,
				"started_at":  session.StartedAt,
			},
			"items":      items,
			"item_count": strconv.Itoa(len(items)),
		},
	})
}

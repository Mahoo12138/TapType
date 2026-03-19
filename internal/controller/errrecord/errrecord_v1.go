package errrecord

import (
	"context"
	"strconv"

	"github.com/gogf/gf/v2/frame/g"

	v1 "taptype/api/errrecord/v1"
)

func (c *ControllerV1) ListErrors(ctx context.Context, req *v1.ListErrorsReq) (res *v1.ListErrorsRes, err error) {
	r := g.RequestFromCtx(ctx)
	userID := r.GetCtxVar("user_id").String()

	pageSize := req.PageSize
	if pageSize > 100 {
		pageSize = 100
	}

	records, total, err := c.errorsSvc.ListErrors(ctx, userID, req.ContentType, req.Page, pageSize)
	if err != nil {
		return nil, err
	}

	return &v1.ListErrorsRes{
		List:     records,
		Total:    total,
		Page:     req.Page,
		PageSize: pageSize,
	}, nil
}

func (c *ControllerV1) GetReviewQueue(ctx context.Context, req *v1.GetReviewQueueReq) (res *v1.GetReviewQueueRes, err error) {
	r := g.RequestFromCtx(ctx)
	userID := r.GetCtxVar("user_id").String()

	records, err := c.errorsSvc.GetReviewQueue(ctx, userID, req.Limit)
	if err != nil {
		return nil, err
	}

	return &v1.GetReviewQueueRes{
		List:  records,
		Total: len(records),
	}, nil
}

func (c *ControllerV1) CreateReviewSession(ctx context.Context, req *v1.CreateReviewSessionReq) (res *v1.CreateReviewSessionRes, err error) {
	r := g.RequestFromCtx(ctx)
	userID := r.GetCtxVar("user_id").String()

	itemCount := req.ItemCount
	if itemCount <= 0 {
		itemCount = 20
	}

	session, items, err := c.errorsSvc.CreateReviewSession(ctx, userID, itemCount)
	if err != nil {
		return nil, err
	}

	if session == nil {
		r.Response.WriteJsonExit(g.Map{
			"code":    0,
			"message": "no items due for review",
			"data": g.Map{
				"session": nil,
				"items":   []interface{}{},
			},
		})
		return
	}

	return &v1.CreateReviewSessionRes{
		Session: g.Map{
			"id":          session.ID,
			"mode":        session.Mode,
			"source_type": session.SourceType,
			"started_at":  session.StartedAt,
		},
		Items:     items,
		ItemCount: strconv.Itoa(len(items)),
	}, nil
}

package errrecord

import (
	"context"

	v1 "taptype/api/errrecord/v1"
)

type IErrRecordV1 interface {
	ListErrors(ctx context.Context, req *v1.ListErrorsReq) (res *v1.ListErrorsRes, err error)
	GetReviewQueue(ctx context.Context, req *v1.GetReviewQueueReq) (res *v1.GetReviewQueueRes, err error)
	CreateReviewSession(ctx context.Context, req *v1.CreateReviewSessionReq) (res *v1.CreateReviewSessionRes, err error)
}

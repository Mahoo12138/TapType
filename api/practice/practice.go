package practice

import (
	"context"

	v1 "taptype/api/practice/v1"
)

type IPracticeV1 interface {
	CreateSession(ctx context.Context, req *v1.CreateSessionReq) (res *v1.CreateSessionRes, err error)
	ListSessions(ctx context.Context, req *v1.ListSessionsReq) (res *v1.ListSessionsRes, err error)
	GetSession(ctx context.Context, req *v1.GetSessionReq) (res *v1.GetSessionRes, err error)
	DiscardSession(ctx context.Context, req *v1.DiscardSessionReq) (res *v1.DiscardSessionRes, err error)
	CompleteSession(ctx context.Context, req *v1.CompleteSessionReq) (res *v1.CompleteSessionRes, err error)
}

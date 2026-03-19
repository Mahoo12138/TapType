package auth

import (
	"context"

	v1 "taptype/api/auth/v1"
)

type IAuthPublicV1 interface {
	Register(ctx context.Context, req *v1.RegisterReq) (res *v1.RegisterRes, err error)
	Login(ctx context.Context, req *v1.LoginReq) (res *v1.LoginRes, err error)
	Refresh(ctx context.Context, req *v1.RefreshReq) (res *v1.RefreshRes, err error)
}

type IAuthV1 interface {
	Me(ctx context.Context, req *v1.MeReq) (res *v1.MeRes, err error)
}

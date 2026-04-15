package openapi

import (
	"context"

	v1 "taptype/api/openapi/v1"
)

type IOpenApiV1 interface {
	ListApiTokens(ctx context.Context, req *v1.ListApiTokensReq) (res *v1.ListApiTokensRes, err error)
	CreateApiToken(ctx context.Context, req *v1.CreateApiTokenReq) (res *v1.CreateApiTokenRes, err error)
	DeleteApiToken(ctx context.Context, req *v1.DeleteApiTokenReq) (res *v1.DeleteApiTokenRes, err error)
	UpdateApiToken(ctx context.Context, req *v1.UpdateApiTokenReq) (res *v1.UpdateApiTokenRes, err error)
}

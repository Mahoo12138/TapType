package openapi

import (
	"context"

	"github.com/gogf/gf/v2/errors/gerror"
	"github.com/gogf/gf/v2/frame/g"

	v1 "taptype/api/openapi/v1"
	"taptype/internal/model/code"
)

func (c *ControllerV1) ListApiTokens(ctx context.Context, req *v1.ListApiTokensReq) (res *v1.ListApiTokensRes, err error) {
	r := g.RequestFromCtx(ctx)
	userID := r.GetCtxVar("user_id").String()
	if userID == "" {
		return nil, gerror.NewCode(code.CodeUnauthorized, "unauthorized")
	}

	tokens, err := c.svc.ListTokens(ctx, userID)
	if err != nil {
		return nil, err
	}

	items := make([]v1.ApiTokenItem, 0, len(tokens))
	for _, t := range tokens {
		items = append(items, v1.ApiTokenItem{
			ID:         t.ID,
			Name:       t.Name,
			Prefix:     t.Prefix,
			Scopes:     t.Scopes,
			ExpiresAt:  t.ExpiresAt,
			LastUsedAt: t.LastUsedAt,
			IsActive:   t.IsActive,
			CreatedAt:  t.CreatedAt,
		})
	}

	return &v1.ListApiTokensRes{List: items}, nil
}

func (c *ControllerV1) CreateApiToken(ctx context.Context, req *v1.CreateApiTokenReq) (res *v1.CreateApiTokenRes, err error) {
	r := g.RequestFromCtx(ctx)
	userID := r.GetCtxVar("user_id").String()
	if userID == "" {
		return nil, gerror.NewCode(code.CodeUnauthorized, "unauthorized")
	}

	token, rawToken, err := c.svc.CreateToken(ctx, userID, req.Name, req.Scopes, req.ExpiresIn)
	if err != nil {
		return nil, err
	}

	return &v1.CreateApiTokenRes{
		Token: v1.ApiTokenItem{
			ID:         token.ID,
			Name:       token.Name,
			Prefix:     token.Prefix,
			Scopes:     token.Scopes,
			ExpiresAt:  token.ExpiresAt,
			LastUsedAt: token.LastUsedAt,
			IsActive:   token.IsActive,
			CreatedAt:  token.CreatedAt,
		},
		Raw: rawToken,
	}, nil
}

func (c *ControllerV1) DeleteApiToken(ctx context.Context, req *v1.DeleteApiTokenReq) (res *v1.DeleteApiTokenRes, err error) {
	r := g.RequestFromCtx(ctx)
	userID := r.GetCtxVar("user_id").String()
	if userID == "" {
		return nil, gerror.NewCode(code.CodeUnauthorized, "unauthorized")
	}

	if err := c.svc.DeleteToken(ctx, userID, req.ID); err != nil {
		return nil, err
	}
	return &v1.DeleteApiTokenRes{}, nil
}

func (c *ControllerV1) UpdateApiToken(ctx context.Context, req *v1.UpdateApiTokenReq) (res *v1.UpdateApiTokenRes, err error) {
	r := g.RequestFromCtx(ctx)
	userID := r.GetCtxVar("user_id").String()
	if userID == "" {
		return nil, gerror.NewCode(code.CodeUnauthorized, "unauthorized")
	}

	token, err := c.svc.UpdateToken(ctx, userID, req.ID, req.Name, req.Scopes, req.IsActive)
	if err != nil {
		return nil, err
	}

	return &v1.UpdateApiTokenRes{
		Token: v1.ApiTokenItem{
			ID:         token.ID,
			Name:       token.Name,
			Prefix:     token.Prefix,
			Scopes:     token.Scopes,
			ExpiresAt:  token.ExpiresAt,
			LastUsedAt: token.LastUsedAt,
			IsActive:   token.IsActive,
			CreatedAt:  token.CreatedAt,
		},
	}, nil
}

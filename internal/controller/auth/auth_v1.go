package auth

import (
	"context"
	"net/http"

	"github.com/gogf/gf/v2/errors/gerror"
	"github.com/gogf/gf/v2/frame/g"

	v1 "taptype/api/auth/v1"
	"taptype/internal/model/code"
)

func (c *ControllerV1Public) Register(ctx context.Context, req *v1.RegisterReq) (res *v1.RegisterRes, err error) {
	user, err := c.authSvc.Register(ctx, req.Username, req.Email, req.Password)
	if err != nil {
		return nil, err
	}
	return &v1.RegisterRes{
		ID:       user.ID,
		Username: user.Username,
		Email:    user.Email,
		Role:     user.Role,
	}, nil
}

func (c *ControllerV1Public) Login(ctx context.Context, req *v1.LoginReq) (res *v1.LoginRes, err error) {
	accessToken, refreshToken, user, err := c.authSvc.Login(ctx, req.Username, req.Password)
	if err != nil {
		return nil, err
	}

	r := g.RequestFromCtx(ctx)
	r.Cookie.SetHttpCookie(&http.Cookie{
		Name:     "refresh_token",
		Value:    refreshToken,
		Path:     "/api/v1/auth/refresh",
		HttpOnly: true,
		SameSite: http.SameSiteStrictMode,
		MaxAge:   7 * 24 * 3600,
	})

	return &v1.LoginRes{
		AccessToken: accessToken,
		ExpiresIn:   900,
		User: map[string]interface{}{
			"id":       user.ID,
			"username": user.Username,
			"email":    user.Email,
			"role":     user.Role,
		},
	}, nil
}

func (c *ControllerV1Public) Refresh(ctx context.Context, req *v1.RefreshReq) (res *v1.RefreshRes, err error) {
	r := g.RequestFromCtx(ctx)
	refreshToken := r.Cookie.Get("refresh_token").String()
	if refreshToken == "" {
		return nil, gerror.NewCode(code.CodeRefreshExpired, "refresh token expired")
	}

	newAccessToken, err := c.authSvc.RefreshAccessToken(ctx, refreshToken)
	if err != nil {
		return nil, err
	}

	return &v1.RefreshRes{
		AccessToken: newAccessToken,
		ExpiresIn:   900,
	}, nil
}

func (c *ControllerV1) Me(ctx context.Context, req *v1.MeReq) (res *v1.MeRes, err error) {
	r := g.RequestFromCtx(ctx)
	userID := r.GetCtxVar("user_id").String()
	if userID == "" {
		return nil, gerror.NewCode(code.CodeUnauthorized, "unauthorized")
	}

	user, err := c.authSvc.GetCurrentUser(ctx, userID)
	if err != nil {
		return nil, err
	}

	return &v1.MeRes{
		ID:        user.ID,
		Username:  user.Username,
		Email:     user.Email,
		Role:      user.Role,
		IsActive:  user.IsActive,
		CreatedAt: user.CreatedAt,
	}, nil
}

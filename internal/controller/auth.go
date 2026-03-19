package controller

import (
	"net/http"

	"github.com/gogf/gf/v2/net/ghttp"

	authService "taptype/internal/service/auth"
)

type AuthController struct {
	authSvc authService.Service
}

func NewAuthController(authSvc authService.Service) *AuthController {
	return &AuthController{authSvc: authSvc}
}

type registerReq struct {
	Username string `json:"username" v:"required|length:3,20|regex:^[a-zA-Z0-9_]+$#用户名必填|用户名长度3-20位|只允许字母数字下划线"`
	Email    string `json:"email"    v:"required|email#邮箱必填|邮箱格式不正确"`
	Password string `json:"password" v:"required|length:8,64#密码必填|密码长度8-64位"`
}

// Register handles POST /api/v1/auth/register
func (c *AuthController) Register(r *ghttp.Request) {
	var req registerReq
	if err := r.Parse(&req); err != nil {
		r.Response.WriteJsonExit(map[string]interface{}{
			"code":    40001,
			"message": err.Error(),
			"data":    nil,
		})
		return
	}

	user, err := c.authSvc.Register(r.Context(), req.Username, req.Email, req.Password)
	if err != nil {
		writeError(r, err)
		return
	}

	r.Response.WriteJsonExit(map[string]interface{}{
		"code":    0,
		"message": "success",
		"data": map[string]interface{}{
			"id":       user.ID,
			"username": user.Username,
			"email":    user.Email,
			"role":     user.Role,
		},
	})
}

type loginReq struct {
	Username string `json:"username" v:"required#用户名必填"`
	Password string `json:"password" v:"required#密码必填"`
}

// Login handles POST /api/v1/auth/login
func (c *AuthController) Login(r *ghttp.Request) {
	var req loginReq
	if err := r.Parse(&req); err != nil {
		r.Response.WriteJsonExit(map[string]interface{}{
			"code":    40001,
			"message": err.Error(),
			"data":    nil,
		})
		return
	}

	accessToken, refreshToken, user, err := c.authSvc.Login(r.Context(), req.Username, req.Password)
	if err != nil {
		writeError(r, err)
		return
	}

	// Set refresh_token as HttpOnly cookie
	r.Cookie.SetHttpCookie(&http.Cookie{
		Name:     "refresh_token",
		Value:    refreshToken,
		Path:     "/api/v1/auth/refresh",
		HttpOnly: true,
		SameSite: http.SameSiteStrictMode,
		MaxAge:   7 * 24 * 3600,
	})

	r.Response.WriteJsonExit(map[string]interface{}{
		"code":    0,
		"message": "success",
		"data": map[string]interface{}{
			"access_token": accessToken,
			"expires_in":   900,
			"user": map[string]interface{}{
				"id":       user.ID,
				"username": user.Username,
				"email":    user.Email,
				"role":     user.Role,
			},
		},
	})
}

// Refresh handles POST /api/v1/auth/refresh
func (c *AuthController) Refresh(r *ghttp.Request) {
	refreshToken := r.Cookie.Get("refresh_token").String()
	if refreshToken == "" {
		r.Response.WriteJsonExit(map[string]interface{}{
			"code":    40104,
			"message": "refresh token expired",
			"data":    nil,
		})
		return
	}

	newAccessToken, err := c.authSvc.RefreshAccessToken(r.Context(), refreshToken)
	if err != nil {
		writeError(r, err)
		return
	}

	r.Response.WriteJsonExit(map[string]interface{}{
		"code":    0,
		"message": "success",
		"data": map[string]interface{}{
			"access_token": newAccessToken,
			"expires_in":   900,
		},
	})
}

// Me handles GET /api/v1/auth/me
func (c *AuthController) Me(r *ghttp.Request) {
	userID := r.GetCtxVar("user_id").String()
	if userID == "" {
		r.Response.WriteJsonExit(map[string]interface{}{
			"code":    40101,
			"message": "unauthorized",
			"data":    nil,
		})
		return
	}

	user, err := c.authSvc.GetCurrentUser(r.Context(), userID)
	if err != nil {
		writeError(r, err)
		return
	}

	r.Response.WriteJsonExit(map[string]interface{}{
		"code":    0,
		"message": "success",
		"data": map[string]interface{}{
			"id":         user.ID,
			"username":   user.Username,
			"email":      user.Email,
			"role":       user.Role,
			"is_active":  user.IsActive,
			"created_at": user.CreatedAt,
		},
	})
}

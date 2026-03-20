package v1

import (
	"github.com/gogf/gf/v2/frame/g"
)

// ─── Public Auth (no JWT) ────────────────────────────────

type RegisterInitialAdminReq struct {
	g.Meta   `path:"/auth/register-initial-admin" method:"post" tags:"Auth" summary:"Register initial admin when system has no users"`
	Username string `json:"username" v:"required|length:3,20|regex:^[a-zA-Z0-9_]+$#用户名必填|用户名长度3-20位|只允许字母数字下划线"`
	Email    string `json:"email"    v:"required|email#邮箱必填|邮箱格式不正确"`
	Password string `json:"password" v:"required|length:8,64#密码必填|密码长度8-64位"`
}
type RegisterInitialAdminRes struct {
	ID       string `json:"id"`
	Username string `json:"username"`
	Email    string `json:"email"`
	Role     string `json:"role"`
}

type RegisterReq struct {
	g.Meta   `path:"/auth/register" method:"post" tags:"Auth" summary:"Register new user"`
	Username string `json:"username" v:"required|length:3,20|regex:^[a-zA-Z0-9_]+$#用户名必填|用户名长度3-20位|只允许字母数字下划线"`
	Email    string `json:"email"    v:"required|email#邮箱必填|邮箱格式不正确"`
	Password string `json:"password" v:"required|length:8,64#密码必填|密码长度8-64位"`
}
type RegisterRes struct {
	ID       string `json:"id"`
	Username string `json:"username"`
	Email    string `json:"email"`
	Role     string `json:"role"`
}

type LoginReq struct {
	g.Meta   `path:"/auth/login" method:"post" tags:"Auth" summary:"User login"`
	Username string `json:"username" v:"required#用户名必填"`
	Password string `json:"password" v:"required#密码必填"`
}
type LoginRes struct {
	AccessToken string      `json:"access_token"`
	ExpiresIn   int         `json:"expires_in"`
	User        interface{} `json:"user"`
}

type RefreshReq struct {
	g.Meta `path:"/auth/refresh" method:"post" tags:"Auth" summary:"Refresh access token"`
}
type RefreshRes struct {
	AccessToken string `json:"access_token"`
	ExpiresIn   int    `json:"expires_in"`
}

// ─── Protected Auth (JWT required) ───────────────────────

type MeReq struct {
	g.Meta `path:"/auth/me" method:"get" tags:"Auth" summary:"Get current user info"`
}
type MeRes struct {
	ID        string      `json:"id"`
	Username  string      `json:"username"`
	Email     string      `json:"email"`
	Role      string      `json:"role"`
	IsActive  int         `json:"is_active"`
	CreatedAt interface{} `json:"created_at"`
}

type UpdateProfileReq struct {
	g.Meta   `path:"/auth/profile" method:"put" tags:"Auth" summary:"Update current user profile"`
	Username string `json:"username" v:"required|length:3,20|regex:^[a-zA-Z0-9_]+$#用户名必填|用户名长度3-20位|只允许字母数字下划线"`
	Email    string `json:"email" v:"required|email#邮箱必填|邮箱格式不正确"`
}

type UpdateProfileRes struct {
	ID        string      `json:"id"`
	Username  string      `json:"username"`
	Email     string      `json:"email"`
	Role      string      `json:"role"`
	IsActive  int         `json:"is_active"`
	CreatedAt interface{} `json:"created_at"`
}

package v1

import "github.com/gogf/gf/v2/frame/g"

// ─── Open API Token Management (JWT required) ───────────

type ListApiTokensReq struct {
	g.Meta `path:"/openapi/tokens" method:"get" tags:"OpenAPI" summary:"List all API tokens for current user"`
}
type ListApiTokensRes struct {
	List []ApiTokenItem `json:"list"`
}

type ApiTokenItem struct {
	ID         string      `json:"id"`
	Name       string      `json:"name"`
	Prefix     string      `json:"prefix"`
	Scopes     string      `json:"scopes"`
	ExpiresAt  interface{} `json:"expires_at,omitempty"`
	LastUsedAt interface{} `json:"last_used_at,omitempty"`
	IsActive   int         `json:"is_active"`
	CreatedAt  interface{} `json:"created_at"`
}

type CreateApiTokenReq struct {
	g.Meta    `path:"/openapi/tokens" method:"post" tags:"OpenAPI" summary:"Create a new API token"`
	Name      string `json:"name" v:"required|length:1,64#名称必填|名称最长64位"`
	Scopes    string `json:"scopes"`
	ExpiresIn *int   `json:"expires_in"` // seconds, nil = never expires
}
type CreateApiTokenRes struct {
	Token ApiTokenItem `json:"token"`
	Raw   string       `json:"raw_token"` // only returned on creation
}

type DeleteApiTokenReq struct {
	g.Meta `path:"/openapi/tokens/{id}" method:"delete" tags:"OpenAPI" summary:"Delete an API token"`
	ID     string `json:"id" in:"path"`
}
type DeleteApiTokenRes struct{}

type UpdateApiTokenReq struct {
	g.Meta   `path:"/openapi/tokens/{id}" method:"put" tags:"OpenAPI" summary:"Update an API token"`
	ID       string `json:"id" in:"path"`
	Name     string `json:"name"`
	Scopes   string `json:"scopes"`
	IsActive *int   `json:"is_active"`
}
type UpdateApiTokenRes struct {
	Token ApiTokenItem `json:"token"`
}

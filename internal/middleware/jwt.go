package middleware

import (
	"context"
	"fmt"
	"strings"

	"github.com/gogf/gf/v2/net/ghttp"
	"github.com/golang-jwt/jwt/v5"
)

type Claims struct {
	jwt.RegisteredClaims
	UserID    string `json:"user_id"`
	Role      string `json:"role"`
	TokenType string `json:"token_type"`
}

// ApiTokenValidator is implemented by the openapi service to validate tp_ tokens.
type ApiTokenValidator interface {
	ValidateToken(ctx context.Context, rawToken string) (userID, role string, err error)
}

// JWTAuth validates the access token from Authorization header.
// It supports both JWT Bearer tokens and tp_ API tokens.
func JWTAuth(jwtSecret string, validators ...ApiTokenValidator) func(r *ghttp.Request) {
	var apiTokenValidator ApiTokenValidator
	if len(validators) > 0 {
		apiTokenValidator = validators[0]
	}

	return func(r *ghttp.Request) {
		authHeader := r.GetHeader("Authorization")
		if authHeader == "" {
			r.Response.WriteJsonExit(map[string]interface{}{
				"code":    40101,
				"message": "unauthorized",
				"data":    nil,
			})
			return
		}

		tokenString := strings.TrimPrefix(authHeader, "Bearer ")
		if tokenString == authHeader {
			r.Response.WriteJsonExit(map[string]interface{}{
				"code":    40101,
				"message": "unauthorized",
				"data":    nil,
			})
			return
		}

		// API token path: tp_ prefix
		if strings.HasPrefix(tokenString, "tp_") && apiTokenValidator != nil {
			userID, role, err := apiTokenValidator.ValidateToken(r.Context(), tokenString)
			if err != nil {
				r.Response.WriteJsonExit(map[string]interface{}{
					"code":    40105,
					"message": "api token invalid",
					"data":    nil,
				})
				return
			}
			r.SetCtxVar("user_id", userID)
			r.SetCtxVar("role", role)
			r.SetCtxVar("auth_type", "api_token")
			r.Middleware.Next()
			return
		}

		// JWT path
		token, err := jwt.ParseWithClaims(tokenString, &Claims{}, func(token *jwt.Token) (interface{}, error) {
			if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
				return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
			}
			return []byte(jwtSecret), nil
		})
		if err != nil {
			// Differentiate between expired and invalid
			if strings.Contains(err.Error(), "expired") {
				r.Response.WriteJsonExit(map[string]interface{}{
					"code":    40102,
					"message": "token expired",
					"data":    nil,
				})
			}
			r.Response.WriteJsonExit(map[string]interface{}{
				"code":    40103,
				"message": "token invalid",
				"data":    nil,
			})
			return
		}

		claims, ok := token.Claims.(*Claims)
		if !ok || !token.Valid || claims.TokenType != "access" {
			r.Response.WriteJsonExit(map[string]interface{}{
				"code":    40103,
				"message": "token invalid",
				"data":    nil,
			})
			return
		}

		// Store user info in context for downstream handlers
		r.SetCtxVar("user_id", claims.UserID)
		r.SetCtxVar("role", claims.Role)
		r.SetCtxVar("auth_type", "jwt")
		r.Middleware.Next()
	}
}

// AdminOnly ensures the current user has admin role.
func AdminOnly(r *ghttp.Request) {
	role := r.GetCtxVar("role").String()
	if role != "admin" {
		r.Response.WriteJsonExit(map[string]interface{}{
			"code":    40302,
			"message": "admin required",
			"data":    nil,
		})
		return
	}
	r.Middleware.Next()
}

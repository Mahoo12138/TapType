package media

import (
	"fmt"
	"net/http"
	"strconv"
	"strings"

	"github.com/gogf/gf/v2/errors/gerror"
	"github.com/gogf/gf/v2/net/ghttp"
	"github.com/golang-jwt/jwt/v5"

	"taptype/internal/middleware"
	"taptype/internal/model/code"
)

func (c *FileController) Serve(r *ghttp.Request) {
	fileID := r.Get("id").String()
	meta, err := c.mediaSvc.GetServeMeta(r.Context(), fileID)
	if err != nil {
		writeHTTPError(r, err)
		return
	}

	if meta.IsPublic == 0 {
		userID, _, err := c.parseAuthorization(r.GetHeader("Authorization"))
		if err != nil || userID == "" {
			r.Response.WriteStatus(http.StatusUnauthorized)
			return
		}
	}

	etag := `"` + meta.Hash + `"`
	if r.GetHeader("If-None-Match") == etag {
		r.Response.Header().Set("ETag", etag)
		r.Response.WriteStatus(http.StatusNotModified)
		return
	}

	data, err := c.mediaSvc.GetFileData(r.Context(), fileID)
	if err != nil {
		writeHTTPError(r, err)
		return
	}

	cacheControl := "public, max-age=604800, immutable"
	if meta.IsPublic == 0 {
		cacheControl = "private, max-age=604800"
	}

	r.Response.Header().Set("Content-Type", meta.ContentType)
	r.Response.Header().Set("ETag", etag)
	r.Response.Header().Set("Cache-Control", cacheControl)
	r.Response.Header().Set("Content-Length", strconv.Itoa(meta.SizeBytes))
	r.Response.Write(data)
}

func (c *FileController) parseAuthorization(header string) (string, string, error) {
	header = strings.TrimSpace(header)
	if header == "" {
		return "", "", nil
	}
	tokenString := strings.TrimPrefix(header, "Bearer ")
	if tokenString == header {
		return "", "", fmt.Errorf("invalid authorization header")
	}

	token, err := jwt.ParseWithClaims(tokenString, &middleware.Claims{}, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return c.jwtSecret, nil
	})
	if err != nil {
		return "", "", err
	}
	claims, ok := token.Claims.(*middleware.Claims)
	if !ok || !token.Valid || claims.TokenType != "access" {
		return "", "", fmt.Errorf("invalid token")
	}
	return claims.UserID, claims.Role, nil
}

func writeHTTPError(r *ghttp.Request, err error) {
	switch gerror.Code(err).Code() {
	case code.CodeNotFound.Code():
		r.Response.WriteStatus(http.StatusNotFound)
	default:
		r.Response.WriteStatus(http.StatusInternalServerError)
	}
}

package middleware

import "github.com/gogf/gf/v2/net/ghttp"

// CORS handles Cross-Origin Resource Sharing headers.
func CORS(r *ghttp.Request) {
	r.Response.CORSDefault()
	r.Middleware.Next()
}

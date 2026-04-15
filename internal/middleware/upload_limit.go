package middleware

import (
    "net/http"

    "github.com/gogf/gf/v2/net/ghttp"
)

// UploadSizeLimit limits the request body size to avoid OOM or proxy resets
// Use by adding middleware.UploadSizeLimit(maxBytes) to router groups.
func UploadSizeLimit(maxBytes int64) ghttp.HandlerFunc {
    return func(r *ghttp.Request) {
        if r.Request != nil && r.Request.Body != nil {
            r.Request.Body = http.MaxBytesReader(r.Response.RawWriter(), r.Request.Body, maxBytes)
        }
        r.Middleware.Next()
    }
}
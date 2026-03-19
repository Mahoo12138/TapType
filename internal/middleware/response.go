package middleware

import (
	"net/http"

	"github.com/gogf/gf/v2/errors/gcode"
	"github.com/gogf/gf/v2/errors/gerror"
	"github.com/gogf/gf/v2/net/ghttp"
)

// HandlerResponse is a custom response middleware that wraps handler results
// in the standard {"code": 0, "message": "success", "data": ...} format.
// It skips wrapping if the handler has already written to the response buffer
// (e.g. file downloads, manual WriteJsonExit calls).
func HandlerResponse(r *ghttp.Request) {
	r.Middleware.Next()

	// If handler already wrote content, don't wrap again
	if r.Response.BufferLength() > 0 {
		return
	}

	var (
		msg  = "success"
		err  = r.GetError()
		res  = r.GetHandlerResponse()
		c    = 0
	)

	if err != nil {
		gc := gerror.Code(err)
		if gc == gcode.CodeNil {
			c = 50001
			msg = "internal server error"
		} else {
			c = gc.Code()
			msg = err.Error()
		}
		res = nil
	} else if r.Response.Status > 0 && r.Response.Status != http.StatusOK {
		c = r.Response.Status
		msg = http.StatusText(r.Response.Status)
		res = nil
	}

	r.Response.WriteJson(map[string]interface{}{
		"code":    c,
		"message": msg,
		"data":    res,
	})
}

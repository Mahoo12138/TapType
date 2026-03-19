package controller

import (
	"github.com/gogf/gf/v2/errors/gcode"
	"github.com/gogf/gf/v2/errors/gerror"
	"github.com/gogf/gf/v2/net/ghttp"
)

// writeError extracts error code from gerror and writes JSON response.
func writeError(r *ghttp.Request, err error) {
	c := gerror.Code(err)
	if c == gcode.CodeNil {
		c = gcode.New(50001, "internal server error", nil)
	}
	r.Response.WriteJsonExit(map[string]interface{}{
		"code":    c.Code(),
		"message": c.Message(),
		"data":    nil,
	})
}

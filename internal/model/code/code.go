package code

import "github.com/gogf/gf/v2/errors/gcode"

var (
	CodeSuccess        = gcode.New(0, "success", nil)
	CodeBadRequest     = gcode.New(40001, "request parameter error", nil)
	CodeImportFormat   = gcode.New(40002, "import format error", nil)
	CodeUnauthorized   = gcode.New(40101, "unauthorized", nil)
	CodeTokenExpired   = gcode.New(40102, "token expired", nil)
	CodeTokenInvalid   = gcode.New(40103, "token invalid", nil)
	CodeRefreshExpired = gcode.New(40104, "refresh token expired", nil)
	CodeForbidden      = gcode.New(40301, "forbidden", nil)
	CodeAdminRequired  = gcode.New(40302, "admin required", nil)
	CodeNotFound       = gcode.New(40401, "resource not found", nil)
	CodeUsernameTaken  = gcode.New(40901, "username already exists", nil)
	CodeEmailTaken     = gcode.New(40902, "email already exists", nil)
	CodeWeakPassword   = gcode.New(42201, "password too weak", nil)
	CodeRateLimit          = gcode.New(42901, "too many requests", nil)
	CodeTokenLimitExceeded = gcode.New(42202, "api token limit exceeded", nil)
	CodeApiTokenInvalid    = gcode.New(40105, "api token invalid", nil)
	CodeInternalError      = gcode.New(50001, "internal server error", nil)
)

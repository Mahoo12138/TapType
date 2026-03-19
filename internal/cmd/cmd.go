package cmd

import (
	"context"
	"io/fs"
	"net/http"
	"strings"

	"github.com/gogf/gf/v2/frame/g"
	"github.com/gogf/gf/v2/net/ghttp"
	"github.com/gogf/gf/v2/os/gcmd"

	"taptype/internal/controller"
	"taptype/internal/middleware"
	"taptype/resource"
	authService "taptype/internal/service/auth"
	"taptype/utility/db"
)

var (
	Main = gcmd.Command{
		Name:  "main",
		Usage: "main",
		Brief: "start http server",
		Func: func(ctx context.Context, parser *gcmd.Parser) (err error) {
			// Read config
			dbDriver := g.Cfg().MustGet(ctx, "database.driver", "sqlite").String()
			dbDSN := g.Cfg().MustGet(ctx, "database.dsn", "./data/taptype.db").String()
			jwtSecret := g.Cfg().MustGet(ctx, "jwt.secret", "taptype-dev-secret-change-me-in-production").String()

			// Initialize database
			gormDB, err := db.Init(dbDriver, dbDSN)
			if err != nil {
				g.Log().Fatalf(ctx, "Failed to init database: %v", err)
			}
			_ = gormDB

			// Initialize services
			authSvc := authService.NewService(gormDB, jwtSecret)

			// Initialize controllers
			authCtrl := controller.NewAuthController(authSvc)

			s := g.Server()

			// Health check
			s.BindHandler("/health", func(r *ghttp.Request) {
				r.Response.WriteJsonExit(map[string]interface{}{
					"code":    0,
					"message": "ok",
					"data":    nil,
				})
			})

			// API routes
			s.Group("/api/v1", func(group *ghttp.RouterGroup) {
				group.Middleware(middleware.CORS)

				// Public auth routes (no JWT required)
				group.Group("/auth", func(authGroup *ghttp.RouterGroup) {
					authGroup.POST("/register", authCtrl.Register)
					authGroup.POST("/login", authCtrl.Login)
					authGroup.POST("/refresh", authCtrl.Refresh)
				})

				// Protected routes (JWT required)
				group.Group("/", func(protectedGroup *ghttp.RouterGroup) {
					protectedGroup.Middleware(middleware.JWTAuth(jwtSecret))

					protectedGroup.GET("/auth/me", authCtrl.Me)

					// Future Phase 2+ routes will be added here
				})
			})

			// SPA fallback: serve embedded frontend for all non-API paths
			frontendFS, _ := fs.Sub(resource.Frontend, "frontend/dist")
			fileServer := http.FileServer(http.FS(frontendFS))

			s.BindHandler("/*", func(r *ghttp.Request) {
				// Skip API and WebSocket paths
				if strings.HasPrefix(r.URL.Path, "/api") || strings.HasPrefix(r.URL.Path, "/ws") || r.URL.Path == "/health" {
					r.Response.WriteStatus(http.StatusNotFound)
					return
				}
				// Try to serve the actual file first
				if _, err := fs.Stat(frontendFS, strings.TrimPrefix(r.URL.Path, "/")); err == nil {
					fileServer.ServeHTTP(r.Response.RawWriter(), r.Request)
					return
				}
				// SPA fallback: return index.html for client-side routing
				indexHTML, _ := fs.ReadFile(resource.Frontend, "frontend/dist/index.html")
				r.Response.Header().Set("Content-Type", "text/html; charset=utf-8")
				r.Response.Write(indexHTML)
			})

			s.Run()
			return nil
		},
	}
)



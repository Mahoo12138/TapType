package cmd

import (
	"context"
	"io/fs"
	"net/http"
	"strings"
	"time"

	"github.com/gogf/gf/v2/frame/g"
	"github.com/gogf/gf/v2/net/ghttp"
	"github.com/gogf/gf/v2/os/gcmd"

	"taptype/internal/controller"
	achievementCtrl "taptype/internal/controller/achievement"
	adminCtrl "taptype/internal/controller/admin"
	analysisCtrl "taptype/internal/controller/analysis"
	authCtrl "taptype/internal/controller/auth"
	dailyCtrl "taptype/internal/controller/daily"
	errrecordCtrl "taptype/internal/controller/errrecord"
	goalCtrl "taptype/internal/controller/goal"
	practiceCtrl "taptype/internal/controller/practice"
	sentencebankCtrl "taptype/internal/controller/sentencebank"
	settingsCtrl "taptype/internal/controller/settings"
	wordbankCtrl "taptype/internal/controller/wordbank"
	"taptype/internal/middleware"
	"taptype/resource"
	achievementService "taptype/internal/service/achievement"
	analysisService "taptype/internal/service/analysis"
	authService "taptype/internal/service/auth"
	dailyService "taptype/internal/service/daily"
	errorsService "taptype/internal/service/errors"
	goalService "taptype/internal/service/goal"
	practiceService "taptype/internal/service/practice"
	sentenceService "taptype/internal/service/sentence"
	settingsService "taptype/internal/service/settings"
	wordService "taptype/internal/service/word"
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
			errorsSvc := errorsService.NewService(gormDB)
			analysisSvc := analysisService.NewService(gormDB)
			dailySvc := dailyService.NewService(gormDB)
			achievementSvc := achievementService.NewService(gormDB)
			goalSvc := goalService.NewService(gormDB)
			practiceSvc := practiceService.NewService(gormDB, errorsSvc, dailySvc, achievementSvc, goalSvc)
			wordSvc := wordService.NewService(gormDB)
			sentenceSvc := sentenceService.NewService(gormDB)
			settingsSvc := settingsService.NewService(gormDB)

			// WebSocket controller (manual handler, not GoFrame Bind pattern)
			wsPracticeController := controller.NewWSPracticeController()

			s := g.Server()

			// Health check
			s.BindHandler("/health", func(r *ghttp.Request) {
				r.Response.WriteJsonExit(map[string]interface{}{
					"code":    0,
					"message": "ok",
					"data":    nil,
				})
			})

			// API routes — GoFrame standard Bind pattern
			s.Group("/api/v1", func(group *ghttp.RouterGroup) {
				group.Middleware(middleware.CORS)
				group.Middleware(middleware.HandlerResponse)

				// Public auth routes (no JWT required) — stricter rate limit
				group.Group("/", func(publicGroup *ghttp.RouterGroup) {
					publicGroup.Middleware(middleware.RateLimit("auth", middleware.RateLimitConfig{MaxTokens: 5, RefillRate: 1}))
					publicGroup.Bind(authCtrl.NewV1Public(authSvc))
				})

				// Protected routes (JWT required)
				group.Group("/", func(protectedGroup *ghttp.RouterGroup) {
					protectedGroup.Middleware(middleware.JWTAuth(jwtSecret))
					protectedGroup.Middleware(middleware.RateLimit("general", middleware.RateLimitConfig{MaxTokens: 30, RefillRate: 10}))

					protectedGroup.Bind(
						authCtrl.NewV1(authSvc),
						practiceCtrl.NewV1(practiceSvc),
						wordbankCtrl.NewV1(wordSvc),
						sentencebankCtrl.NewV1(sentenceSvc),
						analysisCtrl.NewV1(analysisSvc),
						errrecordCtrl.NewV1(errorsSvc),
						goalCtrl.NewV1(goalSvc),
						dailyCtrl.NewV1(dailySvc),
						achievementCtrl.NewV1(achievementSvc),
						settingsCtrl.NewV1(settingsSvc),
					)

					// Admin routes (requires admin role)
					protectedGroup.Group("/", func(adminGroup *ghttp.RouterGroup) {
						adminGroup.Middleware(middleware.AdminOnly)
						adminGroup.Bind(
							adminCtrl.NewV1(gormDB),
							settingsCtrl.NewAdminV1(settingsSvc),
						)
					})
				})
			})

			// WebSocket route (outside API group, uses own auth check)
			s.BindHandler("/ws/practice", wsPracticeController.Handle)

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

			// Start periodic rate limiter cleanup
			go func() {
				ticker := time.NewTicker(10 * time.Minute)
				defer ticker.Stop()
				for range ticker.C {
					middleware.CleanupExpiredBuckets()
				}
			}()

			s.Run()
			return nil
		},
	}
)



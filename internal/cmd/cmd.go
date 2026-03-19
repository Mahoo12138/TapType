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

			// Initialize controllers
			authCtrl := controller.NewAuthController(authSvc)
			errorsCtrl := controller.NewErrorsController(errorsSvc)
			analysisCtrl := controller.NewAnalysisController(analysisSvc)
			dailyCtrl := controller.NewDailyController(dailySvc)
			practiceCtrl := controller.NewPracticeController(practiceSvc)
			wordBankCtrl := controller.NewWordBankController(wordSvc)
			sentenceBankCtrl := controller.NewSentenceBankController(sentenceSvc)
			wsPracticeCtrl := controller.NewWSPracticeController()
			goalCtrl := controller.NewGoalController(goalSvc)
			achievementCtrl := controller.NewAchievementController(achievementSvc)
			adminCtrl := controller.NewAdminController(gormDB)

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

				// Public auth routes (no JWT required) — stricter rate limit
				group.Group("/auth", func(authGroup *ghttp.RouterGroup) {
					authGroup.Middleware(middleware.RateLimit("auth", middleware.RateLimitConfig{MaxTokens: 5, RefillRate: 1}))
					authGroup.POST("/register", authCtrl.Register)
					authGroup.POST("/login", authCtrl.Login)
					authGroup.POST("/refresh", authCtrl.Refresh)
				})

				// Protected routes (JWT required)
				group.Group("/", func(protectedGroup *ghttp.RouterGroup) {
					protectedGroup.Middleware(middleware.JWTAuth(jwtSecret))
					protectedGroup.Middleware(middleware.RateLimit("general", middleware.RateLimitConfig{MaxTokens: 30, RefillRate: 10}))

					protectedGroup.GET("/auth/me", authCtrl.Me)

					// Practice routes
					protectedGroup.POST("/practice/sessions", practiceCtrl.CreateSession)
					protectedGroup.GET("/practice/sessions", practiceCtrl.ListSessions)
					protectedGroup.GET("/practice/sessions/{id}", practiceCtrl.GetSession)
					protectedGroup.PATCH("/practice/sessions/{id}", practiceCtrl.CompletePractice)

					// Word bank routes
					protectedGroup.GET("/word-banks", wordBankCtrl.ListBanks)
					protectedGroup.POST("/word-banks", wordBankCtrl.CreateBank)
					protectedGroup.GET("/word-banks/{id}", wordBankCtrl.GetBank)
					protectedGroup.PUT("/word-banks/{id}", wordBankCtrl.UpdateBank)
					protectedGroup.DELETE("/word-banks/{id}", wordBankCtrl.DeleteBank)
					protectedGroup.GET("/word-banks/{id}/words", wordBankCtrl.ListWords)
					protectedGroup.POST("/word-banks/{id}/words", wordBankCtrl.CreateWord)
					protectedGroup.POST("/word-banks/{id}/words/import", wordBankCtrl.ImportWords)
					protectedGroup.GET("/word-banks/{id}/export", wordBankCtrl.ExportWords)
					protectedGroup.PUT("/words/{wordId}", wordBankCtrl.UpdateWord)
					protectedGroup.DELETE("/words/{wordId}", wordBankCtrl.DeleteWord)

					// Sentence bank routes
					protectedGroup.GET("/sentence-banks", sentenceBankCtrl.ListBanks)
					protectedGroup.POST("/sentence-banks", sentenceBankCtrl.CreateBank)
					protectedGroup.GET("/sentence-banks/{id}", sentenceBankCtrl.GetBank)
					protectedGroup.PUT("/sentence-banks/{id}", sentenceBankCtrl.UpdateBank)
					protectedGroup.DELETE("/sentence-banks/{id}", sentenceBankCtrl.DeleteBank)
					protectedGroup.GET("/sentence-banks/{id}/sentences", sentenceBankCtrl.ListSentences)
					protectedGroup.POST("/sentence-banks/{id}/sentences", sentenceBankCtrl.CreateSentence)
					protectedGroup.POST("/sentence-banks/{id}/sentences/import", sentenceBankCtrl.ImportSentences)
					protectedGroup.GET("/sentence-banks/{id}/export", sentenceBankCtrl.ExportSentences)
					protectedGroup.PUT("/sentences/{sentenceId}", sentenceBankCtrl.UpdateSentence)
					protectedGroup.DELETE("/sentences/{sentenceId}", sentenceBankCtrl.DeleteSentence)

					// Error records & review
					protectedGroup.GET("/errors", errorsCtrl.ListErrors)
					protectedGroup.GET("/errors/review-queue", errorsCtrl.GetReviewQueue)
					protectedGroup.POST("/errors/review-session", errorsCtrl.CreateReviewSession)

					// Analysis routes
					protectedGroup.GET("/analysis/trend", analysisCtrl.GetTrend)
					protectedGroup.GET("/analysis/keymap", analysisCtrl.GetKeymap)
					protectedGroup.GET("/analysis/summary", analysisCtrl.GetSummary)

					// Daily record
					protectedGroup.GET("/daily", dailyCtrl.GetToday)

					// Goals CRUD
					protectedGroup.GET("/goals", goalCtrl.ListGoals)
					protectedGroup.POST("/goals", goalCtrl.CreateGoal)
					protectedGroup.PUT("/goals/{id}", goalCtrl.UpdateGoal)
					protectedGroup.DELETE("/goals/{id}", goalCtrl.DeleteGoal)

					// Achievements
					protectedGroup.GET("/achievements", achievementCtrl.ListAchievements)

					// Admin routes (requires admin role)
					protectedGroup.Group("/admin", func(adminGroup *ghttp.RouterGroup) {
						adminGroup.Middleware(middleware.AdminOnly)
						adminGroup.GET("/users", adminCtrl.ListUsers)
						adminGroup.PUT("/users/{id}", adminCtrl.UpdateUser)
						adminGroup.GET("/word-banks", adminCtrl.ListPublicWordBanks)
						adminGroup.GET("/sentence-banks", adminCtrl.ListPublicSentenceBanks)
					})
				})
			})

			// WebSocket route (outside API group, uses own auth check)
			s.BindHandler("/ws/practice", wsPracticeCtrl.Handle)

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



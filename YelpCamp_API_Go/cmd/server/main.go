package main

import (
	"context"
	"errors"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/sangnn2012/yelpcamp-api-go/internal/config"
	"github.com/sangnn2012/yelpcamp-api-go/internal/handlers"
	"github.com/sangnn2012/yelpcamp-api-go/internal/logger"
	mw "github.com/sangnn2012/yelpcamp-api-go/internal/middleware"
	"github.com/sangnn2012/yelpcamp-api-go/pkg/database"
)

func main() {
	ctx, stop := signal.NotifyContext(context.Background(), syscall.SIGINT, syscall.SIGTERM)
	defer stop()

	// Load configuration
	cfg, err := config.LoadConfig()
	if err != nil {
		logger.L().Error("failed to load config", "error", err)
		os.Exit(1)
	}

	// Connect to database
	db, err := database.Connect(cfg.Database.URL)
	if err != nil {
		logger.L().Error("failed to connect to database", "error", err)
		os.Exit(1)
	}

	// Initialize handlers
	authHandler := handlers.NewAuthHandler(db, cfg.Jwt.Secret)
	campgroundHandler := handlers.NewCampgroundHandler(db)
	commentHandler := handlers.NewCommentHandler(db)

	// Setup Gin engine
	engine := gin.New()
	engine.RedirectTrailingSlash = false
	engine.Use(gin.Recovery(), ginLogMiddleware())
	engine.Use(cors.New(cors.Config{
		AllowOrigins:     cfg.CORS.AllowedOrigins,
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Accept", "Authorization", "Content-Type"},
		AllowCredentials: true,
	}))

	// Health check
	engine.GET("/api/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"status":  "ok",
			"service": "YelpCamp API (Go)",
		})
	})

	api := engine.Group("/api")

	// Auth routes
	auth := api.Group("/auth")
	{
		auth.POST("/register", authHandler.Register)
		auth.POST("/login", authHandler.Login)
		auth.POST("/logout", authHandler.Logout)
		auth.GET("/me", mw.RequireAuth(cfg.Jwt.Secret), authHandler.Me)
	}

	// Campground routes
	campgrounds := api.Group("/campgrounds")
	{
		campgrounds.GET("", campgroundHandler.List)
		campgrounds.GET("/:id", campgroundHandler.GetByID)

		protected := campgrounds.Group("")
		protected.Use(mw.RequireAuth(cfg.Jwt.Secret))
		{
			protected.POST("", campgroundHandler.Create)
			protected.PUT("/:id", campgroundHandler.Update)
			protected.DELETE("/:id", campgroundHandler.Delete)
		}
	}

	// Comment routes (nested under campgrounds)
	campgroundComments := api.Group("/campgrounds/:campgroundId/comments")
	campgroundComments.Use(mw.RequireAuth(cfg.Jwt.Secret))
	{
		campgroundComments.POST("", commentHandler.Create)
	}

	// Comment routes (standalone)
	comments := api.Group("/comments")
	comments.Use(mw.RequireAuth(cfg.Jwt.Secret))
	{
		comments.PUT("/:id", commentHandler.Update)
		comments.DELETE("/:id", commentHandler.Delete)
	}

	// Start server with graceful shutdown
	srv := &http.Server{
		Addr:    cfg.HTTPServer.Address(),
		Handler: engine,
	}

	serverErrCh := make(chan error, 1)

	go func() {
		logger.L().Info("server starting", "addr", cfg.HTTPServer.Address())
		if err := srv.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			logger.L().Error("server failed to start", "error", err)
			serverErrCh <- err
		}
	}()

	select {
	case <-ctx.Done():
		logger.L().Info("shutting down server...")
	case err := <-serverErrCh:
		logger.L().Error("server startup failed", "error", err)
		os.Exit(1)
	}

	shutdownCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	if err := srv.Shutdown(shutdownCtx); err != nil {
		logger.L().Error("server shutdown error", "error", err)
	}

	db.Close()
	logger.L().Info("server stopped cleanly")
}

// ginLogMiddleware returns a Gin middleware that logs requests using slog.
func ginLogMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		start := time.Now()

		c.Next()

		latency := time.Since(start)
		status := c.Writer.Status()
		method := c.Request.Method
		path := c.Request.URL.Path
		clientIP := c.ClientIP()
		userAgent := c.Request.UserAgent()

		var level slog.Level
		switch {
		case status >= 500:
			level = slog.LevelError
		case status >= 400:
			level = slog.LevelWarn
		default:
			level = slog.LevelInfo
		}

		logger.L().LogAttrs(c.Request.Context(), level, "incoming request",
			slog.Int("status", status),
			slog.String("method", method),
			slog.String("path", path),
			slog.String("ip", clientIP),
			slog.String("user_agent", userAgent),
			slog.Duration("latency", latency),
		)
	}
}

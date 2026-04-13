//go:build integration

package tests

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/sangnn2012/yelpcamp-api-go/internal/handlers"
	"github.com/sangnn2012/yelpcamp-api-go/internal/middleware"
	"github.com/sangnn2012/yelpcamp-api-go/tests/mock"
)

const testJWTSecret = mock.TestJWTSecret

func init() {
	gin.SetMode(gin.TestMode)
}

// setupRouter creates a full Gin engine with all routes wired up to a mocked DB.
func setupRouter(db *mock.MockDB) *gin.Engine {
	authHandler := handlers.NewAuthHandler(db, testJWTSecret)
	campgroundHandler := handlers.NewCampgroundHandler(db)
	commentHandler := handlers.NewCommentHandler(db)

	engine := gin.New()
	engine.Use(gin.Recovery())
	engine.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:3000"},
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Accept", "Authorization", "Content-Type"},
		AllowCredentials: true,
	}))

	engine.GET("/api/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "ok", "service": "YelpCamp API (Go)"})
	})

	api := engine.Group("/api")

	auth := api.Group("/auth")
	{
		auth.POST("/register", authHandler.Register)
		auth.POST("/login", authHandler.Login)
		auth.POST("/logout", authHandler.Logout)
		auth.GET("/me", middleware.RequireAuth(testJWTSecret), authHandler.Me)
	}

	campgrounds := api.Group("/campgrounds")
	{
		campgrounds.GET("/", campgroundHandler.List)
		campgrounds.GET("/:id", campgroundHandler.GetByID)

		protected := campgrounds.Group("/")
		protected.Use(middleware.RequireAuth(testJWTSecret))
		{
			protected.POST("/", campgroundHandler.Create)
			protected.PUT("/:id", campgroundHandler.Update)
			protected.DELETE("/:id", campgroundHandler.Delete)
		}
	}

	campgroundComments := api.Group("/campgrounds/:campgroundId/comments")
	campgroundComments.Use(middleware.RequireAuth(testJWTSecret))
	{
		campgroundComments.POST("/", commentHandler.Create)
	}

	comments := api.Group("/comments")
	comments.Use(middleware.RequireAuth(testJWTSecret))
	{
		comments.PUT("/:id", commentHandler.Update)
		comments.DELETE("/:id", commentHandler.Delete)
	}

	return engine
}

func TestHealthCheck(t *testing.T) {
	router := setupRouter(&mock.MockDB{})

	w := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodGet, "/api/health", nil)
	router.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("Expected status 200, got %d", w.Code)
	}

	var resp map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &resp)
	if resp["status"] != "ok" {
		t.Errorf("Expected status 'ok', got '%v'", resp["status"])
	}
	if resp["service"] != "YelpCamp API (Go)" {
		t.Errorf("Expected service name, got '%v'", resp["service"])
	}
}

func TestRegisterLoginMeFlow(t *testing.T) {
	hashedPw := mock.TestHashedPassword()
	queryRowCallCount := 0

	db := &mock.MockDB{
		QueryRowFunc: func(ctx context.Context, sql string, args ...any) pgx.Row {
			queryRowCallCount++
			switch {
			case queryRowCallCount == 1:
				// Register: EXISTS check
				return &mock.MockRow{ScanFunc: func(dest ...any) error {
					*dest[0].(*bool) = false
					return nil
				}}
			case queryRowCallCount == 2:
				// Login: SELECT user
				return &mock.MockRow{ScanFunc: func(dest ...any) error {
					*dest[0].(*string) = mock.TestUserID
					*dest[1].(*string) = mock.TestUsername
					*dest[2].(*string) = mock.TestEmail
					*dest[3].(*string) = hashedPw
					*dest[4].(*time.Time) = mock.TestTime
					*dest[5].(*time.Time) = mock.TestTime
					return nil
				}}
			case queryRowCallCount == 3:
				// Me: SELECT user by ID
				return &mock.MockRow{ScanFunc: func(dest ...any) error {
					*dest[0].(*string) = mock.TestUserID
					*dest[1].(*string) = mock.TestUsername
					*dest[2].(*string) = mock.TestEmail
					*dest[3].(*time.Time) = mock.TestTime
					*dest[4].(*time.Time) = mock.TestTime
					return nil
				}}
			default:
				return &mock.MockRow{ScanFunc: func(dest ...any) error {
					return fmt.Errorf("unexpected query")
				}}
			}
		},
		ExecFunc: func(ctx context.Context, sql string, args ...any) (pgconn.CommandTag, error) {
			return pgconn.NewCommandTag("INSERT 0 1"), nil
		},
	}

	router := setupRouter(db)

	// Step 1: Register
	regBody, _ := json.Marshal(mock.GetMockRegisterRequest())
	w := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodPost, "/api/auth/register", bytes.NewReader(regBody))
	req.Header.Set("Content-Type", "application/json")
	router.ServeHTTP(w, req)

	if w.Code != http.StatusCreated {
		t.Fatalf("Register: expected 201, got %d: %s", w.Code, w.Body.String())
	}

	// Step 2: Login
	loginBody, _ := json.Marshal(mock.GetMockLoginRequest())
	w = httptest.NewRecorder()
	req = httptest.NewRequest(http.MethodPost, "/api/auth/login", bytes.NewReader(loginBody))
	req.Header.Set("Content-Type", "application/json")
	router.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("Login: expected 200, got %d: %s", w.Code, w.Body.String())
	}

	// Extract token from Set-Cookie
	var tokenCookie string
	for _, cookie := range w.Result().Cookies() {
		if cookie.Name == "token" {
			tokenCookie = cookie.Value
		}
	}
	if tokenCookie == "" {
		t.Fatal("Login: expected 'token' cookie in response")
	}

	// Step 3: Get /me using the token
	w = httptest.NewRecorder()
	req = httptest.NewRequest(http.MethodGet, "/api/auth/me", nil)
	req.AddCookie(&http.Cookie{Name: "token", Value: tokenCookie})
	router.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("Me: expected 200, got %d: %s", w.Code, w.Body.String())
	}

	var user map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &user)
	if user["username"] != mock.TestUsername {
		t.Errorf("Me: expected username '%s', got '%v'", mock.TestUsername, user["username"])
	}
}

func TestUnauthorizedAccess(t *testing.T) {
	router := setupRouter(&mock.MockDB{})

	protectedEndpoints := []struct {
		method string
		path   string
	}{
		{http.MethodGet, "/api/auth/me"},
		{http.MethodPost, "/api/campgrounds/"},
		{http.MethodPut, "/api/campgrounds/1"},
		{http.MethodDelete, "/api/campgrounds/1"},
		{http.MethodPost, "/api/campgrounds/1/comments/"},
		{http.MethodPut, "/api/comments/1"},
		{http.MethodDelete, "/api/comments/1"},
	}

	for _, ep := range protectedEndpoints {
		t.Run(ep.method+" "+ep.path, func(t *testing.T) {
			w := httptest.NewRecorder()
			req := httptest.NewRequest(ep.method, ep.path, nil)
			router.ServeHTTP(w, req)

			if w.Code != http.StatusUnauthorized {
				t.Errorf("Expected 401 for %s %s, got %d", ep.method, ep.path, w.Code)
			}
		})
	}
}

func TestPublicEndpointsAccessible(t *testing.T) {
	db := &mock.MockDB{
		QueryRowFunc: func(ctx context.Context, sql string, args ...any) pgx.Row {
			return &mock.MockRow{ScanFunc: func(dest ...any) error {
				// For count query
				if p, ok := dest[0].(*int); ok {
					*p = 0
					return nil
				}
				return fmt.Errorf("not found")
			}}
		},
		QueryFunc: func(ctx context.Context, sql string, args ...any) (pgx.Rows, error) {
			return mock.NewMockRows(), nil
		},
	}

	router := setupRouter(db)

	publicEndpoints := []struct {
		method       string
		path         string
		expectedCode int
	}{
		{http.MethodGet, "/api/health", http.StatusOK},
		{http.MethodGet, "/api/campgrounds/", http.StatusOK},
		{http.MethodGet, "/api/campgrounds/999", http.StatusOK}, // returns 200 with empty data since mock doesn't distinguish queries
	}

	for _, ep := range publicEndpoints {
		t.Run(ep.method+" "+ep.path, func(t *testing.T) {
			w := httptest.NewRecorder()
			req := httptest.NewRequest(ep.method, ep.path, nil)
			router.ServeHTTP(w, req)

			if w.Code != ep.expectedCode {
				t.Errorf("Expected %d for %s %s, got %d", ep.expectedCode, ep.method, ep.path, w.Code)
			}
		})
	}
}

func TestCORSPreflight(t *testing.T) {
	router := setupRouter(&mock.MockDB{})

	w := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodOptions, "/api/campgrounds/", nil)
	req.Header.Set("Origin", "http://localhost:3000")
	req.Header.Set("Access-Control-Request-Method", "POST")
	req.Header.Set("Access-Control-Request-Headers", "Content-Type, Authorization")
	router.ServeHTTP(w, req)

	if w.Header().Get("Access-Control-Allow-Origin") != "http://localhost:3000" {
		t.Errorf("Expected CORS origin header, got '%s'", w.Header().Get("Access-Control-Allow-Origin"))
	}
}

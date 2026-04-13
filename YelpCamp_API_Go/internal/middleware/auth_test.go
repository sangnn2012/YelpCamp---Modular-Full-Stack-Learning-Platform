//go:build unit

package middleware

import (
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

const testSecret = "test-jwt-secret-key-for-testing"

func init() {
	gin.SetMode(gin.TestMode)
}

func generateTestToken(userID string, secret string, expiry time.Duration) string {
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"sub": userID,
		"exp": time.Now().Add(expiry).Unix(),
	})
	tokenString, _ := token.SignedString([]byte(secret))
	return tokenString
}

func TestRequireAuth_ValidBearerToken(t *testing.T) {
	w := httptest.NewRecorder()
	c, engine := gin.CreateTestContext(w)

	token := generateTestToken("user-123", testSecret, time.Hour)

	engine.GET("/test", RequireAuth(testSecret), func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"userID": GetUserID(c)})
	})

	c.Request = httptest.NewRequest(http.MethodGet, "/test", nil)
	c.Request.Header.Set("Authorization", "Bearer "+token)
	engine.ServeHTTP(w, c.Request)

	if w.Code != http.StatusOK {
		t.Errorf("Expected status 200, got %d", w.Code)
	}
}

func TestRequireAuth_ValidCookieToken(t *testing.T) {
	w := httptest.NewRecorder()
	_, engine := gin.CreateTestContext(w)

	token := generateTestToken("user-456", testSecret, time.Hour)

	engine.GET("/test", RequireAuth(testSecret), func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"userID": GetUserID(c)})
	})

	req := httptest.NewRequest(http.MethodGet, "/test", nil)
	req.AddCookie(&http.Cookie{Name: "token", Value: token})
	engine.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("Expected status 200, got %d", w.Code)
	}
}

func TestRequireAuth_MissingToken(t *testing.T) {
	w := httptest.NewRecorder()
	_, engine := gin.CreateTestContext(w)

	engine.GET("/test", RequireAuth(testSecret), func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"ok": true})
	})

	req := httptest.NewRequest(http.MethodGet, "/test", nil)
	engine.ServeHTTP(w, req)

	if w.Code != http.StatusUnauthorized {
		t.Errorf("Expected status 401, got %d", w.Code)
	}
}

func TestRequireAuth_InvalidToken(t *testing.T) {
	w := httptest.NewRecorder()
	_, engine := gin.CreateTestContext(w)

	engine.GET("/test", RequireAuth(testSecret), func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"ok": true})
	})

	req := httptest.NewRequest(http.MethodGet, "/test", nil)
	req.Header.Set("Authorization", "Bearer invalid-token-string")
	engine.ServeHTTP(w, req)

	if w.Code != http.StatusUnauthorized {
		t.Errorf("Expected status 401, got %d", w.Code)
	}
}

func TestRequireAuth_ExpiredToken(t *testing.T) {
	w := httptest.NewRecorder()
	_, engine := gin.CreateTestContext(w)

	token := generateTestToken("user-expired", testSecret, -time.Hour)

	engine.GET("/test", RequireAuth(testSecret), func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"ok": true})
	})

	req := httptest.NewRequest(http.MethodGet, "/test", nil)
	req.Header.Set("Authorization", "Bearer "+token)
	engine.ServeHTTP(w, req)

	if w.Code != http.StatusUnauthorized {
		t.Errorf("Expected status 401, got %d", w.Code)
	}
}

func TestRequireAuth_WrongSecret(t *testing.T) {
	w := httptest.NewRecorder()
	_, engine := gin.CreateTestContext(w)

	token := generateTestToken("user-123", "wrong-secret", time.Hour)

	engine.GET("/test", RequireAuth(testSecret), func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"ok": true})
	})

	req := httptest.NewRequest(http.MethodGet, "/test", nil)
	req.Header.Set("Authorization", "Bearer "+token)
	engine.ServeHTTP(w, req)

	if w.Code != http.StatusUnauthorized {
		t.Errorf("Expected status 401, got %d", w.Code)
	}
}

func TestRequireAuth_MalformedHeader(t *testing.T) {
	tests := []struct {
		name   string
		header string
	}{
		{"no bearer prefix", "token-without-bearer"},
		{"empty bearer", "Bearer "},
		{"basic auth instead", "Basic dXNlcjpwYXNz"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			w := httptest.NewRecorder()
			_, engine := gin.CreateTestContext(w)

			engine.GET("/test", RequireAuth(testSecret), func(c *gin.Context) {
				c.JSON(http.StatusOK, gin.H{"ok": true})
			})

			req := httptest.NewRequest(http.MethodGet, "/test", nil)
			req.Header.Set("Authorization", tt.header)
			engine.ServeHTTP(w, req)

			if w.Code != http.StatusUnauthorized {
				t.Errorf("[%s] Expected status 401, got %d", tt.name, w.Code)
			}
		})
	}
}

func TestGetUserID_ReturnsValue(t *testing.T) {
	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Set("userID", "user-789")

	got := GetUserID(c)
	if got != "user-789" {
		t.Errorf("Expected 'user-789', got '%s'", got)
	}
}

func TestGetUserID_ReturnsEmptyWhenNotSet(t *testing.T) {
	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)

	got := GetUserID(c)
	if got != "" {
		t.Errorf("Expected empty string, got '%s'", got)
	}
}

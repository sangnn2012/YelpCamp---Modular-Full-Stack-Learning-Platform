//go:build unit

package models

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
)

func init() {
	gin.SetMode(gin.TestMode)
}

// bindJSON simulates Gin's ShouldBindJSON to test binding tags.
func bindJSON(target any, body any) error {
	jsonBytes, _ := json.Marshal(body)
	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request = httptest.NewRequest(http.MethodPost, "/", bytes.NewReader(jsonBytes))
	c.Request.Header.Set("Content-Type", "application/json")
	return c.ShouldBindJSON(target)
}

func TestRegisterRequest_Validation(t *testing.T) {
	tests := []struct {
		name      string
		body      map[string]string
		expectErr bool
	}{
		{"valid", map[string]string{"username": "john", "email": "john@test.com", "password": "secret123"}, false},
		{"missing username", map[string]string{"email": "john@test.com", "password": "secret123"}, true},
		{"short username", map[string]string{"username": "ab", "email": "john@test.com", "password": "secret123"}, true},
		{"non-alphanum username", map[string]string{"username": "john doe", "email": "john@test.com", "password": "secret123"}, true},
		{"missing email", map[string]string{"username": "john", "password": "secret123"}, true},
		{"invalid email", map[string]string{"username": "john", "email": "not-email", "password": "secret123"}, true},
		{"missing password", map[string]string{"username": "john", "email": "john@test.com"}, true},
		{"short password", map[string]string{"username": "john", "email": "john@test.com", "password": "12345"}, true},
		{"exact min username (3)", map[string]string{"username": "abc", "email": "a@b.com", "password": "123456"}, false},
		{"exact min password (6)", map[string]string{"username": "abc", "email": "a@b.com", "password": "123456"}, false},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			var req RegisterRequest
			err := bindJSON(&req, tt.body)
			if tt.expectErr && err == nil {
				t.Errorf("Expected validation error for %v, got nil", tt.body)
			}
			if !tt.expectErr && err != nil {
				t.Errorf("Expected no error for %v, got: %v", tt.body, err)
			}
		})
	}
}

func TestLoginRequest_Validation(t *testing.T) {
	tests := []struct {
		name      string
		body      map[string]string
		expectErr bool
	}{
		{"valid", map[string]string{"username": "john", "password": "secret"}, false},
		{"missing username", map[string]string{"password": "secret"}, true},
		{"missing password", map[string]string{"username": "john"}, true},
		{"both empty", map[string]string{}, true},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			var req LoginRequest
			err := bindJSON(&req, tt.body)
			if tt.expectErr && err == nil {
				t.Errorf("Expected validation error, got nil")
			}
			if !tt.expectErr && err != nil {
				t.Errorf("Expected no error, got: %v", err)
			}
		})
	}
}

func TestCreateCampgroundRequest_Validation(t *testing.T) {
	valid := map[string]string{
		"name": "Camp", "price": "25.00",
		"image": "https://example.com/img.jpg", "description": "A great campground",
	}

	tests := []struct {
		name      string
		body      map[string]string
		expectErr bool
	}{
		{"valid with all fields", valid, false},
		{"missing name", map[string]string{"price": "25.00", "image": "https://example.com/img.jpg", "description": "desc"}, true},
		{"missing price", map[string]string{"name": "Camp", "image": "https://example.com/img.jpg", "description": "desc"}, true},
		{"missing image", map[string]string{"name": "Camp", "price": "25.00", "description": "desc"}, true},
		{"invalid image URL", map[string]string{"name": "Camp", "price": "25.00", "image": "not-a-url", "description": "desc"}, true},
		{"missing description", map[string]string{"name": "Camp", "price": "25.00", "image": "https://example.com/img.jpg"}, true},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			var req CreateCampgroundRequest
			err := bindJSON(&req, tt.body)
			if tt.expectErr && err == nil {
				t.Errorf("Expected validation error, got nil")
			}
			if !tt.expectErr && err != nil {
				t.Errorf("Expected no error, got: %v", err)
			}
		})
	}
}

func TestCreateCommentRequest_Validation(t *testing.T) {
	tests := []struct {
		name      string
		body      map[string]string
		expectErr bool
	}{
		{"valid", map[string]string{"text": "Nice place!"}, false},
		{"empty text", map[string]string{"text": ""}, true},
		{"missing text", map[string]string{}, true},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			var req CreateCommentRequest
			err := bindJSON(&req, tt.body)
			if tt.expectErr && err == nil {
				t.Errorf("Expected validation error, got nil")
			}
			if !tt.expectErr && err != nil {
				t.Errorf("Expected no error, got: %v", err)
			}
		})
	}
}

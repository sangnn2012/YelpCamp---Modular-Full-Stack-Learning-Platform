//go:build unit

package handlers

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/sangnn2012/yelpcamp-api-go/tests/mock"
)

func TestAuthHandler_Register_Success(t *testing.T) {
	db := &mock.MockDB{
		QueryRowFunc: func(ctx context.Context, sql string, args ...any) pgx.Row {
			// EXISTS check — return false (user doesn't exist)
			return &mock.MockRow{ScanFunc: func(dest ...any) error {
				*dest[0].(*bool) = false
				return nil
			}}
		},
		ExecFunc: func(ctx context.Context, sql string, args ...any) (pgconn.CommandTag, error) {
			return pgconn.NewCommandTag("INSERT 0 1"), nil
		},
	}

	handler := NewAuthHandler(db, mock.TestJWTSecret)

	w := httptest.NewRecorder()
	c, _ := mock.NewTestGinContext(w)
	mock.SetJSONBody(c, mock.GetMockRegisterRequest())

	handler.Register(c)

	if w.Code != http.StatusCreated {
		t.Errorf("Expected status 201, got %d", w.Code)
	}

	var resp map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &resp)
	if resp["username"] != mock.TestUsername {
		t.Errorf("Expected username '%s', got '%v'", mock.TestUsername, resp["username"])
	}
	if resp["email"] != mock.TestEmail {
		t.Errorf("Expected email '%s', got '%v'", mock.TestEmail, resp["email"])
	}
}

func TestAuthHandler_Register_DuplicateUser(t *testing.T) {
	db := &mock.MockDB{
		QueryRowFunc: func(ctx context.Context, sql string, args ...any) pgx.Row {
			return &mock.MockRow{ScanFunc: func(dest ...any) error {
				*dest[0].(*bool) = true // user exists
				return nil
			}}
		},
	}

	handler := NewAuthHandler(db, mock.TestJWTSecret)

	w := httptest.NewRecorder()
	c, _ := mock.NewTestGinContext(w)
	mock.SetJSONBody(c, mock.GetMockRegisterRequest())

	handler.Register(c)

	if w.Code != http.StatusConflict {
		t.Errorf("Expected status 409, got %d", w.Code)
	}
}

func TestAuthHandler_Register_InvalidBody(t *testing.T) {
	handler := NewAuthHandler(&mock.MockDB{}, mock.TestJWTSecret)

	w := httptest.NewRecorder()
	c, _ := mock.NewTestGinContext(w)
	// Send invalid JSON — short password
	mock.SetJSONBody(c, map[string]string{
		"username": "ab",
		"email":    "bad",
		"password": "12345",
	})

	handler.Register(c)

	if w.Code != http.StatusBadRequest {
		t.Errorf("Expected status 400, got %d", w.Code)
	}
}

func TestAuthHandler_Login_Success(t *testing.T) {
	hashedPw := mock.TestHashedPassword()

	db := &mock.MockDB{
		QueryRowFunc: func(ctx context.Context, sql string, args ...any) pgx.Row {
			return &mock.MockRow{ScanFunc: func(dest ...any) error {
				*dest[0].(*string) = mock.TestUserID
				*dest[1].(*string) = mock.TestUsername
				*dest[2].(*string) = mock.TestEmail
				*dest[3].(*string) = hashedPw
				*dest[4].(*time.Time) = mock.TestTime
				*dest[5].(*time.Time) = mock.TestTime
				return nil
			}}
		},
	}

	handler := NewAuthHandler(db, mock.TestJWTSecret)

	w := httptest.NewRecorder()
	c, _ := mock.NewTestGinContext(w)
	mock.SetJSONBody(c, mock.GetMockLoginRequest())

	handler.Login(c)

	if w.Code != http.StatusOK {
		t.Errorf("Expected status 200, got %d", w.Code)
	}

	var resp map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &resp)
	if resp["username"] != mock.TestUsername {
		t.Errorf("Expected username '%s', got '%v'", mock.TestUsername, resp["username"])
	}
}

func TestAuthHandler_Login_WrongPassword(t *testing.T) {
	hashedPw := mock.TestHashedPassword()

	db := &mock.MockDB{
		QueryRowFunc: func(ctx context.Context, sql string, args ...any) pgx.Row {
			return &mock.MockRow{ScanFunc: func(dest ...any) error {
				*dest[0].(*string) = mock.TestUserID
				*dest[1].(*string) = mock.TestUsername
				*dest[2].(*string) = mock.TestEmail
				*dest[3].(*string) = hashedPw
				*dest[4].(*time.Time) = mock.TestTime
				*dest[5].(*time.Time) = mock.TestTime
				return nil
			}}
		},
	}

	handler := NewAuthHandler(db, mock.TestJWTSecret)

	w := httptest.NewRecorder()
	c, _ := mock.NewTestGinContext(w)
	mock.SetJSONBody(c, map[string]string{
		"username": mock.TestUsername,
		"password": "wrong-password",
	})

	handler.Login(c)

	if w.Code != http.StatusUnauthorized {
		t.Errorf("Expected status 401, got %d", w.Code)
	}
}

func TestAuthHandler_Login_UserNotFound(t *testing.T) {
	db := &mock.MockDB{
		QueryRowFunc: func(ctx context.Context, sql string, args ...any) pgx.Row {
			return &mock.MockRow{ScanFunc: func(dest ...any) error {
				return fmt.Errorf("no rows in result set")
			}}
		},
	}

	handler := NewAuthHandler(db, mock.TestJWTSecret)

	w := httptest.NewRecorder()
	c, _ := mock.NewTestGinContext(w)
	mock.SetJSONBody(c, mock.GetMockLoginRequest())

	handler.Login(c)

	if w.Code != http.StatusUnauthorized {
		t.Errorf("Expected status 401, got %d", w.Code)
	}
}

func TestAuthHandler_Logout(t *testing.T) {
	handler := NewAuthHandler(&mock.MockDB{}, mock.TestJWTSecret)

	w := httptest.NewRecorder()
	c, _ := mock.NewTestGinContext(w)

	handler.Logout(c)

	if w.Code != http.StatusOK {
		t.Errorf("Expected status 200, got %d", w.Code)
	}

	// Check cookie is cleared
	cookies := w.Result().Cookies()
	found := false
	for _, cookie := range cookies {
		if cookie.Name == "token" && cookie.MaxAge < 0 {
			found = true
		}
	}
	if !found {
		t.Errorf("Expected expired 'token' cookie in response")
	}
}

func TestAuthHandler_Me_Success(t *testing.T) {
	db := &mock.MockDB{
		QueryRowFunc: func(ctx context.Context, sql string, args ...any) pgx.Row {
			return &mock.MockRow{ScanFunc: func(dest ...any) error {
				*dest[0].(*string) = mock.TestUserID
				*dest[1].(*string) = mock.TestUsername
				*dest[2].(*string) = mock.TestEmail
				*dest[3].(*time.Time) = mock.TestTime
				*dest[4].(*time.Time) = mock.TestTime
				return nil
			}}
		},
	}

	handler := NewAuthHandler(db, mock.TestJWTSecret)

	w := httptest.NewRecorder()
	c, _ := mock.NewTestGinContext(w)
	mock.SetAuthContext(c, mock.TestUserID)

	handler.Me(c)

	if w.Code != http.StatusOK {
		t.Errorf("Expected status 200, got %d", w.Code)
	}
}

func TestAuthHandler_Me_NotFound(t *testing.T) {
	db := &mock.MockDB{
		QueryRowFunc: func(ctx context.Context, sql string, args ...any) pgx.Row {
			return &mock.MockRow{ScanFunc: func(dest ...any) error {
				return fmt.Errorf("no rows in result set")
			}}
		},
	}

	handler := NewAuthHandler(db, mock.TestJWTSecret)

	w := httptest.NewRecorder()
	c, _ := mock.NewTestGinContext(w)
	mock.SetAuthContext(c, "nonexistent-user")

	handler.Me(c)

	if w.Code != http.StatusNotFound {
		t.Errorf("Expected status 404, got %d", w.Code)
	}
}

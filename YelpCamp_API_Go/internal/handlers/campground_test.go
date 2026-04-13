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

func TestCampgroundHandler_List_Default(t *testing.T) {
	callCount := 0
	db := &mock.MockDB{
		QueryRowFunc: func(ctx context.Context, sql string, args ...any) pgx.Row {
			// COUNT query
			return &mock.MockRow{ScanFunc: func(dest ...any) error {
				*dest[0].(*int) = 0
				return nil
			}}
		},
		QueryFunc: func(ctx context.Context, sql string, args ...any) (pgx.Rows, error) {
			callCount++
			return mock.NewMockRows(), nil // empty result set
		},
	}

	handler := NewCampgroundHandler(db)

	w := httptest.NewRecorder()
	c, _ := mock.NewTestGinContext(w)

	handler.List(c)

	if w.Code != http.StatusOK {
		t.Errorf("Expected status 200, got %d", w.Code)
	}

	var resp map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &resp)

	pagination, ok := resp["pagination"].(map[string]interface{})
	if !ok {
		t.Fatal("Expected pagination in response")
	}
	if pagination["page"].(float64) != 1 {
		t.Errorf("Expected page 1, got %v", pagination["page"])
	}
	if pagination["limit"].(float64) != 12 {
		t.Errorf("Expected limit 12, got %v", pagination["limit"])
	}
}

func TestCampgroundHandler_List_WithSearch(t *testing.T) {
	db := &mock.MockDB{
		QueryRowFunc: func(ctx context.Context, sql string, args ...any) pgx.Row {
			return &mock.MockRow{ScanFunc: func(dest ...any) error {
				*dest[0].(*int) = 0
				return nil
			}}
		},
		QueryFunc: func(ctx context.Context, sql string, args ...any) (pgx.Rows, error) {
			return mock.NewMockRows(), nil
		},
	}

	handler := NewCampgroundHandler(db)

	w := httptest.NewRecorder()
	c, _ := mock.NewTestGinContext(w)
	mock.SetQueryParams(c, map[string]string{"search": "mountain", "page": "2"})

	handler.List(c)

	if w.Code != http.StatusOK {
		t.Errorf("Expected status 200, got %d", w.Code)
	}
}

func TestCampgroundHandler_GetByID_NotFound(t *testing.T) {
	db := &mock.MockDB{
		QueryRowFunc: func(ctx context.Context, sql string, args ...any) pgx.Row {
			return &mock.MockRow{ScanFunc: func(dest ...any) error {
				return fmt.Errorf("no rows in result set")
			}}
		},
	}

	handler := NewCampgroundHandler(db)

	w := httptest.NewRecorder()
	c, _ := mock.NewTestGinContext(w)
	mock.SetURLParams(c, map[string]string{"id": "999"})

	handler.GetByID(c)

	if w.Code != http.StatusNotFound {
		t.Errorf("Expected status 404, got %d", w.Code)
	}
}

func TestCampgroundHandler_GetByID_InvalidID(t *testing.T) {
	handler := NewCampgroundHandler(&mock.MockDB{})

	w := httptest.NewRecorder()
	c, _ := mock.NewTestGinContext(w)
	mock.SetURLParams(c, map[string]string{"id": "abc"})

	handler.GetByID(c)

	if w.Code != http.StatusBadRequest {
		t.Errorf("Expected status 400, got %d", w.Code)
	}
}

func TestCampgroundHandler_Create_Success(t *testing.T) {
	db := &mock.MockDB{
		QueryRowFunc: func(ctx context.Context, sql string, args ...any) pgx.Row {
			// INSERT RETURNING id
			return &mock.MockRow{ScanFunc: func(dest ...any) error {
				*dest[0].(*int) = 42
				return nil
			}}
		},
	}

	handler := NewCampgroundHandler(db)

	w := httptest.NewRecorder()
	c, _ := mock.NewTestGinContext(w)
	mock.SetAuthContext(c, mock.TestUserID)
	mock.SetJSONBody(c, mock.GetMockCreateCampgroundRequest())

	handler.Create(c)

	if w.Code != http.StatusCreated {
		t.Errorf("Expected status 201, got %d", w.Code)
	}

	var resp map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &resp)
	if resp["name"] != "Test Campground" {
		t.Errorf("Expected name 'Test Campground', got '%v'", resp["name"])
	}
}

func TestCampgroundHandler_Create_ValidationError(t *testing.T) {
	handler := NewCampgroundHandler(&mock.MockDB{})

	w := httptest.NewRecorder()
	c, _ := mock.NewTestGinContext(w)
	mock.SetAuthContext(c, mock.TestUserID)
	mock.SetJSONBody(c, map[string]string{"name": ""}) // missing required fields

	handler.Create(c)

	if w.Code != http.StatusBadRequest {
		t.Errorf("Expected status 400, got %d", w.Code)
	}
}

func TestCampgroundHandler_Update_Success(t *testing.T) {
	authorID := mock.TestUserID
	db := &mock.MockDB{
		QueryRowFunc: func(ctx context.Context, sql string, args ...any) pgx.Row {
			// Ownership check
			return &mock.MockRow{ScanFunc: func(dest ...any) error {
				*dest[0].(**string) = &authorID
				return nil
			}}
		},
		ExecFunc: func(ctx context.Context, sql string, args ...any) (pgconn.CommandTag, error) {
			return pgconn.NewCommandTag("UPDATE 1"), nil
		},
	}

	handler := NewCampgroundHandler(db)

	w := httptest.NewRecorder()
	c, _ := mock.NewTestGinContext(w)
	mock.SetAuthContext(c, mock.TestUserID)
	mock.SetURLParams(c, map[string]string{"id": "1"})
	name := "Updated"
	mock.SetJSONBody(c, map[string]*string{"name": &name})

	handler.Update(c)

	if w.Code != http.StatusOK {
		t.Errorf("Expected status 200, got %d", w.Code)
	}
}

func TestCampgroundHandler_Update_NotFound(t *testing.T) {
	db := &mock.MockDB{
		QueryRowFunc: func(ctx context.Context, sql string, args ...any) pgx.Row {
			return &mock.MockRow{ScanFunc: func(dest ...any) error {
				return fmt.Errorf("no rows in result set")
			}}
		},
	}

	handler := NewCampgroundHandler(db)

	w := httptest.NewRecorder()
	c, _ := mock.NewTestGinContext(w)
	mock.SetAuthContext(c, mock.TestUserID)
	mock.SetURLParams(c, map[string]string{"id": "999"})

	handler.Update(c)

	if w.Code != http.StatusNotFound {
		t.Errorf("Expected status 404, got %d", w.Code)
	}
}

func TestCampgroundHandler_Update_NotOwner(t *testing.T) {
	otherUser := "other-user-id"
	db := &mock.MockDB{
		QueryRowFunc: func(ctx context.Context, sql string, args ...any) pgx.Row {
			return &mock.MockRow{ScanFunc: func(dest ...any) error {
				*dest[0].(**string) = &otherUser
				return nil
			}}
		},
	}

	handler := NewCampgroundHandler(db)

	w := httptest.NewRecorder()
	c, _ := mock.NewTestGinContext(w)
	mock.SetAuthContext(c, mock.TestUserID)
	mock.SetURLParams(c, map[string]string{"id": "1"})

	handler.Update(c)

	if w.Code != http.StatusForbidden {
		t.Errorf("Expected status 403, got %d", w.Code)
	}
}

func TestCampgroundHandler_Delete_NotFound(t *testing.T) {
	db := &mock.MockDB{
		QueryRowFunc: func(ctx context.Context, sql string, args ...any) pgx.Row {
			return &mock.MockRow{ScanFunc: func(dest ...any) error {
				return fmt.Errorf("no rows in result set")
			}}
		},
	}

	handler := NewCampgroundHandler(db)

	w := httptest.NewRecorder()
	c, _ := mock.NewTestGinContext(w)
	mock.SetAuthContext(c, mock.TestUserID)
	mock.SetURLParams(c, map[string]string{"id": "999"})

	handler.Delete(c)

	if w.Code != http.StatusNotFound {
		t.Errorf("Expected status 404, got %d", w.Code)
	}
}

func TestCampgroundHandler_Delete_Success(t *testing.T) {
	authorID := mock.TestUserID
	db := &mock.MockDB{
		QueryRowFunc: func(ctx context.Context, sql string, args ...any) pgx.Row {
			return &mock.MockRow{ScanFunc: func(dest ...any) error {
				*dest[0].(**string) = &authorID
				return nil
			}}
		},
		ExecFunc: func(ctx context.Context, sql string, args ...any) (pgconn.CommandTag, error) {
			return pgconn.NewCommandTag("DELETE 1"), nil
		},
	}

	handler := NewCampgroundHandler(db)

	w := httptest.NewRecorder()
	c, _ := mock.NewTestGinContext(w)
	mock.SetAuthContext(c, mock.TestUserID)
	mock.SetURLParams(c, map[string]string{"id": "1"})

	handler.Delete(c)

	if w.Code != http.StatusOK {
		t.Errorf("Expected status 200, got %d", w.Code)
	}
}

func TestCampgroundHandler_Delete_NotOwner(t *testing.T) {
	otherUser := "other-user-id"
	db := &mock.MockDB{
		QueryRowFunc: func(ctx context.Context, sql string, args ...any) pgx.Row {
			return &mock.MockRow{ScanFunc: func(dest ...any) error {
				*dest[0].(**string) = &otherUser
				return nil
			}}
		},
	}

	handler := NewCampgroundHandler(db)

	w := httptest.NewRecorder()
	c, _ := mock.NewTestGinContext(w)
	mock.SetAuthContext(c, mock.TestUserID)
	mock.SetURLParams(c, map[string]string{"id": "1"})

	handler.Delete(c)

	if w.Code != http.StatusForbidden {
		t.Errorf("Expected status 403, got %d", w.Code)
	}
}

func TestCampgroundHandler_GetByID_Found(t *testing.T) {
	authorID := mock.TestUserID
	authorUsername := mock.TestUsername
	queryRowCallCount := 0
	db := &mock.MockDB{
		QueryRowFunc: func(ctx context.Context, sql string, args ...any) pgx.Row {
			queryRowCallCount++
			return &mock.MockRow{ScanFunc: func(dest ...any) error {
				*dest[0].(*int) = 1
				*dest[1].(*string) = "Test Camp"
				*dest[2].(*string) = "25.00"
				*dest[3].(*string) = "https://example.com/img.jpg"
				*dest[4].(*string) = "A great place"
				*dest[5].(**string) = ptrStr("Location")
				*dest[6].(**string) = &authorID
				*dest[7].(*time.Time) = mock.TestTime
				*dest[8].(*time.Time) = mock.TestTime
				*dest[9].(**string) = &authorID
				*dest[10].(**string) = &authorUsername
				return nil
			}}
		},
		QueryFunc: func(ctx context.Context, sql string, args ...any) (pgx.Rows, error) {
			return mock.NewMockRows(), nil // no comments
		},
	}

	handler := NewCampgroundHandler(db)

	w := httptest.NewRecorder()
	c, _ := mock.NewTestGinContext(w)
	mock.SetURLParams(c, map[string]string{"id": "1"})

	handler.GetByID(c)

	if w.Code != http.StatusOK {
		t.Errorf("Expected status 200, got %d", w.Code)
	}

	var resp map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &resp)
	if resp["name"] != "Test Camp" {
		t.Errorf("Expected name 'Test Camp', got '%v'", resp["name"])
	}
}

func ptrStr(s string) *string {
	return &s
}

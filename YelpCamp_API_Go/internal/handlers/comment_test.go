//go:build unit

package handlers

import (
	"context"
	"fmt"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/sangnn2012/yelpcamp-api-go/tests/mock"
)

func TestCommentHandler_Create_Success(t *testing.T) {
	queryRowCallCount := 0
	db := &mock.MockDB{
		QueryRowFunc: func(ctx context.Context, sql string, args ...any) pgx.Row {
			queryRowCallCount++
			if queryRowCallCount == 1 {
				// EXISTS check for campground
				return &mock.MockRow{ScanFunc: func(dest ...any) error {
					*dest[0].(*bool) = true
					return nil
				}}
			}
			// INSERT RETURNING id
			return &mock.MockRow{ScanFunc: func(dest ...any) error {
				*dest[0].(*int) = 1
				return nil
			}}
		},
	}

	handler := NewCommentHandler(db)

	w := httptest.NewRecorder()
	c, _ := mock.NewTestGinContext(w)
	mock.SetAuthContext(c, mock.TestUserID)
	mock.SetURLParams(c, map[string]string{"campgroundId": "1"})
	mock.SetJSONBody(c, mock.GetMockCreateCommentRequest())

	handler.Create(c)

	if w.Code != http.StatusCreated {
		t.Errorf("Expected status 201, got %d", w.Code)
	}
}

func TestCommentHandler_Create_CampgroundNotFound(t *testing.T) {
	db := &mock.MockDB{
		QueryRowFunc: func(ctx context.Context, sql string, args ...any) pgx.Row {
			return &mock.MockRow{ScanFunc: func(dest ...any) error {
				*dest[0].(*bool) = false // campground doesn't exist
				return nil
			}}
		},
	}

	handler := NewCommentHandler(db)

	w := httptest.NewRecorder()
	c, _ := mock.NewTestGinContext(w)
	mock.SetAuthContext(c, mock.TestUserID)
	mock.SetURLParams(c, map[string]string{"campgroundId": "999"})
	mock.SetJSONBody(c, mock.GetMockCreateCommentRequest())

	handler.Create(c)

	if w.Code != http.StatusNotFound {
		t.Errorf("Expected status 404, got %d", w.Code)
	}
}

func TestCommentHandler_Create_ValidationError(t *testing.T) {
	db := &mock.MockDB{
		QueryRowFunc: func(ctx context.Context, sql string, args ...any) pgx.Row {
			return &mock.MockRow{ScanFunc: func(dest ...any) error {
				*dest[0].(*bool) = true
				return nil
			}}
		},
	}

	handler := NewCommentHandler(db)

	w := httptest.NewRecorder()
	c, _ := mock.NewTestGinContext(w)
	mock.SetAuthContext(c, mock.TestUserID)
	mock.SetURLParams(c, map[string]string{"campgroundId": "1"})
	mock.SetJSONBody(c, map[string]string{"text": ""}) // empty text

	handler.Create(c)

	if w.Code != http.StatusBadRequest {
		t.Errorf("Expected status 400, got %d", w.Code)
	}
}

func TestCommentHandler_Update_Success(t *testing.T) {
	authorID := mock.TestUserID
	db := &mock.MockDB{
		QueryRowFunc: func(ctx context.Context, sql string, args ...any) pgx.Row {
			return &mock.MockRow{ScanFunc: func(dest ...any) error {
				*dest[0].(**string) = &authorID
				return nil
			}}
		},
		ExecFunc: func(ctx context.Context, sql string, args ...any) (pgconn.CommandTag, error) {
			return pgconn.NewCommandTag("UPDATE 1"), nil
		},
	}

	handler := NewCommentHandler(db)

	w := httptest.NewRecorder()
	c, _ := mock.NewTestGinContext(w)
	mock.SetAuthContext(c, mock.TestUserID)
	mock.SetURLParams(c, map[string]string{"id": "1"})
	mock.SetJSONBody(c, map[string]string{"text": "Updated comment"})

	handler.Update(c)

	if w.Code != http.StatusOK {
		t.Errorf("Expected status 200, got %d", w.Code)
	}
}

func TestCommentHandler_Update_NotOwner(t *testing.T) {
	otherUser := "other-user"
	db := &mock.MockDB{
		QueryRowFunc: func(ctx context.Context, sql string, args ...any) pgx.Row {
			return &mock.MockRow{ScanFunc: func(dest ...any) error {
				*dest[0].(**string) = &otherUser
				return nil
			}}
		},
	}

	handler := NewCommentHandler(db)

	w := httptest.NewRecorder()
	c, _ := mock.NewTestGinContext(w)
	mock.SetAuthContext(c, mock.TestUserID)
	mock.SetURLParams(c, map[string]string{"id": "1"})
	mock.SetJSONBody(c, map[string]string{"text": "Updated"})

	handler.Update(c)

	if w.Code != http.StatusForbidden {
		t.Errorf("Expected status 403, got %d", w.Code)
	}
}

func TestCommentHandler_Delete_Success(t *testing.T) {
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

	handler := NewCommentHandler(db)

	w := httptest.NewRecorder()
	c, _ := mock.NewTestGinContext(w)
	mock.SetAuthContext(c, mock.TestUserID)
	mock.SetURLParams(c, map[string]string{"id": "1"})

	handler.Delete(c)

	if w.Code != http.StatusOK {
		t.Errorf("Expected status 200, got %d", w.Code)
	}
}

func TestCommentHandler_Delete_NotOwner(t *testing.T) {
	otherUser := "other-user"
	db := &mock.MockDB{
		QueryRowFunc: func(ctx context.Context, sql string, args ...any) pgx.Row {
			return &mock.MockRow{ScanFunc: func(dest ...any) error {
				*dest[0].(**string) = &otherUser
				return nil
			}}
		},
	}

	handler := NewCommentHandler(db)

	w := httptest.NewRecorder()
	c, _ := mock.NewTestGinContext(w)
	mock.SetAuthContext(c, mock.TestUserID)
	mock.SetURLParams(c, map[string]string{"id": "1"})

	handler.Delete(c)

	if w.Code != http.StatusForbidden {
		t.Errorf("Expected status 403, got %d", w.Code)
	}
}

func TestCommentHandler_Create_InvalidCampgroundID(t *testing.T) {
	handler := NewCommentHandler(&mock.MockDB{})

	w := httptest.NewRecorder()
	c, _ := mock.NewTestGinContext(w)
	mock.SetAuthContext(c, mock.TestUserID)
	mock.SetURLParams(c, map[string]string{"campgroundId": "abc"})

	handler.Create(c)

	if w.Code != http.StatusBadRequest {
		t.Errorf("Expected status 400, got %d", w.Code)
	}
}

func TestCommentHandler_Create_DBError(t *testing.T) {
	queryRowCallCount := 0
	db := &mock.MockDB{
		QueryRowFunc: func(ctx context.Context, sql string, args ...any) pgx.Row {
			queryRowCallCount++
			if queryRowCallCount == 1 {
				return &mock.MockRow{ScanFunc: func(dest ...any) error {
					*dest[0].(*bool) = true
					return nil
				}}
			}
			return &mock.MockRow{ScanFunc: func(dest ...any) error {
				return fmt.Errorf("database error")
			}}
		},
	}

	handler := NewCommentHandler(db)

	w := httptest.NewRecorder()
	c, _ := mock.NewTestGinContext(w)
	mock.SetAuthContext(c, mock.TestUserID)
	mock.SetURLParams(c, map[string]string{"campgroundId": "1"})
	mock.SetJSONBody(c, mock.GetMockCreateCommentRequest())

	handler.Create(c)

	if w.Code != http.StatusInternalServerError {
		t.Errorf("Expected status 500, got %d", w.Code)
	}
}

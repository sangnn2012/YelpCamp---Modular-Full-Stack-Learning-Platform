package mock

import (
	"time"

	"github.com/sangnn2012/yelpcamp-api-go/internal/models"
	"golang.org/x/crypto/bcrypt"
)

const (
	TestUserID       = "test-user-id-123"
	TestUsername      = "testuser"
	TestEmail        = "test@example.com"
	TestPassword     = "password123"
	TestJWTSecret    = "test-jwt-secret-key-for-testing"
	TestCampgroundID = 1
	TestCommentID    = 1
)

var TestTime = time.Date(2026, 1, 1, 0, 0, 0, 0, time.UTC)

func TestHashedPassword() string {
	hashed, _ := bcrypt.GenerateFromPassword([]byte(TestPassword), bcrypt.DefaultCost)
	return string(hashed)
}

func GetMockUser() models.User {
	return models.User{
		ID:        TestUserID,
		Username:  TestUsername,
		Email:     TestEmail,
		CreatedAt: TestTime,
		UpdatedAt: TestTime,
	}
}

func GetMockRegisterRequest() models.RegisterRequest {
	return models.RegisterRequest{
		Username: TestUsername,
		Email:    TestEmail,
		Password: TestPassword,
	}
}

func GetMockLoginRequest() models.LoginRequest {
	return models.LoginRequest{
		Username: TestUsername,
		Password: TestPassword,
	}
}

func GetMockCampground() models.Campground {
	authorID := TestUserID
	return models.Campground{
		ID:          TestCampgroundID,
		Name:        "Test Campground",
		Price:       "25.00",
		Image:       "https://example.com/image.jpg",
		Description: "A beautiful campground",
		Location:    strPtr("Test Location"),
		AuthorID:    &authorID,
		CreatedAt:   TestTime,
		UpdatedAt:   TestTime,
	}
}

func GetMockCreateCampgroundRequest() models.CreateCampgroundRequest {
	return models.CreateCampgroundRequest{
		Name:        "Test Campground",
		Price:       "25.00",
		Image:       "https://example.com/image.jpg",
		Description: "A beautiful campground",
		Location:    strPtr("Test Location"),
	}
}

func GetMockComment() models.Comment {
	authorID := TestUserID
	return models.Comment{
		ID:           TestCommentID,
		Text:         "Great campground!",
		CampgroundID: TestCampgroundID,
		AuthorID:     &authorID,
		CreatedAt:    TestTime,
		UpdatedAt:    TestTime,
	}
}

func GetMockCreateCommentRequest() models.CreateCommentRequest {
	return models.CreateCommentRequest{
		Text: "Great campground!",
	}
}

func strPtr(s string) *string {
	return &s
}

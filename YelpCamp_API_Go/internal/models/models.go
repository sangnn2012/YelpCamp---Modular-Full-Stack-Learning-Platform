package models

import "time"

type User struct {
	ID        string    `json:"id"`
	Username  string    `json:"username" validate:"required,min=3,max=30,alphanum"`
	Email     string    `json:"email" validate:"required,email"`
	Password  string    `json:"-"`
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
}

type Campground struct {
	ID          int       `json:"id"`
	Name        string    `json:"name" validate:"required,max=100"`
	Price       string    `json:"price" validate:"required"`
	Image       string    `json:"image" validate:"required,url"`
	Description string    `json:"description" validate:"required,max=5000"`
	Location    *string   `json:"location,omitempty" validate:"omitempty,max=200"`
	AuthorID    *string   `json:"authorId,omitempty"`
	Author      *Author   `json:"author,omitempty"`
	Comments    []Comment `json:"comments,omitempty"`
	CreatedAt   time.Time `json:"createdAt"`
	UpdatedAt   time.Time `json:"updatedAt"`
}

type Comment struct {
	ID           int       `json:"id"`
	Text         string    `json:"text" validate:"required,max=500"`
	CampgroundID int       `json:"campgroundId"`
	AuthorID     *string   `json:"authorId,omitempty"`
	Author       *Author   `json:"author,omitempty"`
	CreatedAt    time.Time `json:"createdAt"`
	UpdatedAt    time.Time `json:"updatedAt"`
}

type Author struct {
	ID       string `json:"id"`
	Username string `json:"username"`
}

// Request/Response types
type RegisterRequest struct {
	Username string `json:"username" binding:"required,min=3,max=30,alphanum"`
	Email    string `json:"email" binding:"omitempty,email"`
	Password string `json:"password" binding:"required,min=6"`
}

type LoginRequest struct {
	Username string `json:"username" binding:"required"`
	Password string `json:"password" binding:"required"`
}

type CreateCampgroundRequest struct {
	Name        string  `json:"name" binding:"required,max=100"`
	Price       string  `json:"price" binding:"required"`
	Image       string  `json:"image" binding:"required,url"`
	Description string  `json:"description" binding:"required,max=5000"`
	Location    *string `json:"location,omitempty" binding:"omitempty,max=200"`
}

type UpdateCampgroundRequest struct {
	Name        *string `json:"name,omitempty" binding:"omitempty,max=100"`
	Price       *string `json:"price,omitempty"`
	Image       *string `json:"image,omitempty" binding:"omitempty,url"`
	Description *string `json:"description,omitempty" binding:"omitempty,max=5000"`
	Location    *string `json:"location,omitempty" binding:"omitempty,max=200"`
}

type CreateCommentRequest struct {
	Text string `json:"text" binding:"required,max=500"`
}

type UpdateCommentRequest struct {
	Text string `json:"text" binding:"required,max=500"`
}

type PaginatedResponse struct {
	Data       interface{} `json:"data"`
	Pagination Pagination  `json:"pagination"`
}

type Pagination struct {
	Page       int  `json:"page"`
	Limit      int  `json:"limit"`
	Total      int  `json:"total"`
	TotalPages int  `json:"totalPages"`
	HasMore    bool `json:"hasMore"`
}

type ErrorResponse struct {
	Error   string `json:"error"`
	Message string `json:"message,omitempty"`
}

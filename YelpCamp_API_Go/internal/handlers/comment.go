package handlers

import (
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/sangnn2012/yelpcamp-api-go/internal/middleware"
	"github.com/sangnn2012/yelpcamp-api-go/internal/models"
	"github.com/sangnn2012/yelpcamp-api-go/pkg/database"
)

type CommentHandler struct {
	db database.DB
}

func NewCommentHandler(db database.DB) *CommentHandler {
	return &CommentHandler{db: db}
}

func (h *CommentHandler) Create(c *gin.Context) {
	userID := middleware.GetUserID(c)
	campgroundID, err := strconv.Atoi(c.Param("campgroundId"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid campground ID"})
		return
	}

	// Check campground exists
	var exists bool
	h.db.QueryRow(c.Request.Context(), "SELECT EXISTS(SELECT 1 FROM campgrounds WHERE id = $1)", campgroundID).Scan(&exists)
	if !exists {
		c.JSON(http.StatusNotFound, gin.H{"error": "Campground not found"})
		return
	}

	var req models.CreateCommentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	now := time.Now()
	var id int
	err = h.db.QueryRow(c.Request.Context(), `
		INSERT INTO comments (text, campground_id, author_id, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5)
		RETURNING id
	`, req.Text, campgroundID, userID, now, now).Scan(&id)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create comment"})
		return
	}

	c.JSON(http.StatusCreated, models.Comment{
		ID:           id,
		Text:         req.Text,
		CampgroundID: campgroundID,
		AuthorID:     &userID,
		CreatedAt:    now,
		UpdatedAt:    now,
	})
}

func (h *CommentHandler) Update(c *gin.Context) {
	userID := middleware.GetUserID(c)
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid comment ID"})
		return
	}

	// Check ownership
	var authorID *string
	h.db.QueryRow(c.Request.Context(), "SELECT author_id FROM comments WHERE id = $1", id).Scan(&authorID)
	if authorID == nil || *authorID != userID {
		c.JSON(http.StatusForbidden, gin.H{"error": "You do not have permission to do that"})
		return
	}

	var req models.UpdateCommentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	_, err = h.db.Exec(c.Request.Context(), `
		UPDATE comments SET text = $1, updated_at = $2 WHERE id = $3
	`, req.Text, time.Now(), id)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update comment"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Comment updated"})
}

func (h *CommentHandler) Delete(c *gin.Context) {
	userID := middleware.GetUserID(c)
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid comment ID"})
		return
	}

	// Check ownership
	var authorID *string
	h.db.QueryRow(c.Request.Context(), "SELECT author_id FROM comments WHERE id = $1", id).Scan(&authorID)
	if authorID == nil || *authorID != userID {
		c.JSON(http.StatusForbidden, gin.H{"error": "You do not have permission to do that"})
		return
	}

	_, err = h.db.Exec(c.Request.Context(), "DELETE FROM comments WHERE id = $1", id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete comment"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Comment deleted"})
}

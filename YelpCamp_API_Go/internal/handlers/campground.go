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

type CampgroundHandler struct {
	db database.DB
}

func NewCampgroundHandler(db database.DB) *CampgroundHandler {
	return &CampgroundHandler{db: db}
}

func (h *CampgroundHandler) List(c *gin.Context) {
	page, _ := strconv.Atoi(c.Query("page"))
	if page < 1 {
		page = 1
	}
	limit := 12
	offset := (page - 1) * limit
	search := c.Query("search")

	// Count total
	var total int
	countQuery := "SELECT COUNT(*) FROM campgrounds"
	args := []interface{}{}
	if search != "" {
		countQuery += " WHERE name ILIKE $1 OR description ILIKE $1 OR location ILIKE $1"
		args = append(args, "%"+search+"%")
	}
	h.db.QueryRow(c.Request.Context(), countQuery, args...).Scan(&total)

	// Get campgrounds
	query := `
		SELECT c.id, c.name, c.price, c.image, c.description, c.location, c.author_id,
			   c.created_at, c.updated_at, u.id, u.username
		FROM campgrounds c
		LEFT JOIN users u ON c.author_id = u.id
	`
	if search != "" {
		query += " WHERE c.name ILIKE $1 OR c.description ILIKE $1 OR c.location ILIKE $1"
		query += " ORDER BY c.created_at DESC LIMIT $2 OFFSET $3"
		args = append(args, limit, offset)
	} else {
		query += " ORDER BY c.created_at DESC LIMIT $1 OFFSET $2"
		args = []interface{}{limit, offset}
	}

	rows, err := h.db.Query(c.Request.Context(), query, args...)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error"})
		return
	}
	defer rows.Close()

	campgrounds := []models.Campground{}
	for rows.Next() {
		var cg models.Campground
		var authorID, authorUsername *string
		err := rows.Scan(&cg.ID, &cg.Name, &cg.Price, &cg.Image, &cg.Description, &cg.Location,
			&cg.AuthorID, &cg.CreatedAt, &cg.UpdatedAt, &authorID, &authorUsername)
		if err != nil {
			continue
		}
		if authorID != nil && authorUsername != nil {
			cg.Author = &models.Author{ID: *authorID, Username: *authorUsername}
		}
		campgrounds = append(campgrounds, cg)
	}

	totalPages := (total + limit - 1) / limit
	c.JSON(http.StatusOK, models.PaginatedResponse{
		Data: campgrounds,
		Pagination: models.Pagination{
			Page:       page,
			Limit:      limit,
			Total:      total,
			TotalPages: totalPages,
			HasMore:    page < totalPages,
		},
	})
}

func (h *CampgroundHandler) GetByID(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid campground ID"})
		return
	}

	var cg models.Campground
	var authorID, authorUsername *string
	err = h.db.QueryRow(c.Request.Context(), `
		SELECT c.id, c.name, c.price, c.image, c.description, c.location, c.author_id,
			   c.created_at, c.updated_at, u.id, u.username
		FROM campgrounds c
		LEFT JOIN users u ON c.author_id = u.id
		WHERE c.id = $1
	`, id).Scan(&cg.ID, &cg.Name, &cg.Price, &cg.Image, &cg.Description, &cg.Location,
		&cg.AuthorID, &cg.CreatedAt, &cg.UpdatedAt, &authorID, &authorUsername)

	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Campground not found"})
		return
	}

	if authorID != nil && authorUsername != nil {
		cg.Author = &models.Author{ID: *authorID, Username: *authorUsername}
	}

	// Get comments
	rows, _ := h.db.Query(c.Request.Context(), `
		SELECT c.id, c.text, c.campground_id, c.author_id, c.created_at, c.updated_at,
			   u.id, u.username
		FROM comments c
		LEFT JOIN users u ON c.author_id = u.id
		WHERE c.campground_id = $1
		ORDER BY c.created_at DESC
	`, id)
	defer rows.Close()

	cg.Comments = []models.Comment{}
	for rows.Next() {
		var comment models.Comment
		var aID, aUsername *string
		rows.Scan(&comment.ID, &comment.Text, &comment.CampgroundID, &comment.AuthorID,
			&comment.CreatedAt, &comment.UpdatedAt, &aID, &aUsername)
		if aID != nil && aUsername != nil {
			comment.Author = &models.Author{ID: *aID, Username: *aUsername}
		}
		cg.Comments = append(cg.Comments, comment)
	}

	c.JSON(http.StatusOK, cg)
}

func (h *CampgroundHandler) Create(c *gin.Context) {
	userID := middleware.GetUserID(c)

	var req models.CreateCampgroundRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	now := time.Now()
	var id int
	err := h.db.QueryRow(c.Request.Context(), `
		INSERT INTO campgrounds (name, price, image, description, location, author_id, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
		RETURNING id
	`, req.Name, req.Price, req.Image, req.Description, req.Location, userID, now, now).Scan(&id)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create campground"})
		return
	}

	c.JSON(http.StatusCreated, models.Campground{
		ID:          id,
		Name:        req.Name,
		Price:       req.Price,
		Image:       req.Image,
		Description: req.Description,
		Location:    req.Location,
		AuthorID:    &userID,
		CreatedAt:   now,
		UpdatedAt:   now,
	})
}

func (h *CampgroundHandler) Update(c *gin.Context) {
	userID := middleware.GetUserID(c)
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid campground ID"})
		return
	}

	// Check ownership
	var authorID *string
	err = h.db.QueryRow(c.Request.Context(), "SELECT author_id FROM campgrounds WHERE id = $1", id).Scan(&authorID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Campground not found"})
		return
	}
	if authorID == nil || *authorID != userID {
		c.JSON(http.StatusForbidden, gin.H{"error": "You don't have permission to do that"})
		return
	}

	var req models.UpdateCampgroundRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	_, err = h.db.Exec(c.Request.Context(), `
		UPDATE campgrounds SET
			name = COALESCE($1, name),
			price = COALESCE($2, price),
			image = COALESCE($3, image),
			description = COALESCE($4, description),
			location = COALESCE($5, location),
			updated_at = $6
		WHERE id = $7
	`, req.Name, req.Price, req.Image, req.Description, req.Location, time.Now(), id)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update campground"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Campground updated"})
}

func (h *CampgroundHandler) Delete(c *gin.Context) {
	userID := middleware.GetUserID(c)
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid campground ID"})
		return
	}

	// Check ownership
	var authorID *string
	err = h.db.QueryRow(c.Request.Context(), "SELECT author_id FROM campgrounds WHERE id = $1", id).Scan(&authorID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Campground not found"})
		return
	}
	if authorID == nil || *authorID != userID {
		c.JSON(http.StatusForbidden, gin.H{"error": "You don't have permission to do that"})
		return
	}

	_, err = h.db.Exec(c.Request.Context(), "DELETE FROM campgrounds WHERE id = $1", id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete campground"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Campground deleted"})
}

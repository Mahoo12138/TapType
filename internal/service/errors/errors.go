package errors

import (
	"context"
	"time"

	"taptype/internal/model/entity"
)

// Service defines the error records and review queue operations.
type Service interface {
	// ListErrors returns the user's error records with optional content_type filter.
	ListErrors(ctx context.Context, userID, contentType string, page, pageSize int) ([]entity.ErrorRecord, int64, error)

	// GetReviewQueue returns items where next_review_at <= now for the user.
	GetReviewQueue(ctx context.Context, userID string, limit int) ([]entity.ErrorRecord, error)

	// CreateReviewSession generates a practice session from the user's review queue.
	CreateReviewSession(ctx context.Context, userID string, itemCount int) (*entity.PracticeSession, []ReviewItem, error)

	// UpsertErrorRecord creates or updates an error record and recalculates SM-2 scheduling.
	UpsertErrorRecord(ctx context.Context, userID, sessionID, contentType, contentID string, errorCount int, avgTimeMs int64) error
}

// ReviewItem represents a single item in a review session.
type ReviewItem struct {
	ContentType string    `json:"content_type"`
	ContentID   string    `json:"content_id"`
	Content     string    `json:"content"`
	NextReview  time.Time `json:"next_review_at"`
	ErrorCount  int       `json:"error_count"`
}

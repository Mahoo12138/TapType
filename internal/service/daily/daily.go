package daily

import (
	"context"

	"taptype/internal/model/entity"
)

// Service manages daily records and streak tracking.
type Service interface {
	// GetToday returns today's daily record for the user, creating one if not exists.
	GetToday(ctx context.Context, userID string) (*entity.DailyRecord, error)

	// UpdateAfterPractice updates the daily record after a practice session completes.
	// It handles UPSERT logic and streak calculation.
	UpdateAfterPractice(ctx context.Context, userID string, durationMs int64, wpm, accuracy float64) error
}

package daily

import (
	"context"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"

	"taptype/internal/model/entity"
)

type serviceImpl struct {
	db *gorm.DB
}

func NewService(db *gorm.DB) Service {
	return &serviceImpl{db: db}
}

func (s *serviceImpl) GetToday(ctx context.Context, userID string) (*entity.DailyRecord, error) {
	today := time.Now().Format("2006-01-02")

	var record entity.DailyRecord
	err := s.db.WithContext(ctx).
		Where("user_id = ? AND record_date = ?", userID, today).
		First(&record).Error

	if err == gorm.ErrRecordNotFound {
		// Return a placeholder for today
		return &entity.DailyRecord{
			UserID:     userID,
			RecordDate: today,
			StreakDay:  0,
		}, nil
	}
	if err != nil {
		return nil, err
	}
	return &record, nil
}

func (s *serviceImpl) UpdateAfterPractice(ctx context.Context, userID string, durationMs int64, wpm, accuracy float64) error {
	today := time.Now().Format("2006-01-02")
	yesterday := time.Now().AddDate(0, 0, -1).Format("2006-01-02")
	now := time.Now()

	return s.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		var existing entity.DailyRecord
		err := tx.Where("user_id = ? AND record_date = ?", userID, today).
			First(&existing).Error

		if err == gorm.ErrRecordNotFound {
			// New day — calculate streak
			streakDay := 1
			var yesterdayRecord entity.DailyRecord
			if err := tx.Where("user_id = ? AND record_date = ?", userID, yesterday).
				First(&yesterdayRecord).Error; err == nil {
				streakDay = yesterdayRecord.StreakDay + 1
			}

			record := entity.DailyRecord{
				ID:              uuid.New().String(),
				UserID:          userID,
				RecordDate:      today,
				PracticeCount:   1,
				TotalDurationMs: durationMs,
				AvgWpm:          wpm,
				AvgAccuracy:     accuracy,
				StreakDay:       streakDay,
				CreatedAt:       now,
				UpdatedAt:       now,
			}
			return tx.Create(&record).Error
		}
		if err != nil {
			return err
		}

		// Update existing today record — recalculate running averages
		newCount := existing.PracticeCount + 1
		newDuration := existing.TotalDurationMs + durationMs
		newAvgWpm := (existing.AvgWpm*float64(existing.PracticeCount) + wpm) / float64(newCount)
		newAvgAcc := (existing.AvgAccuracy*float64(existing.PracticeCount) + accuracy) / float64(newCount)

		return tx.Model(&existing).Updates(map[string]interface{}{
			"practice_count":    newCount,
			"total_duration_ms": newDuration,
			"avg_wpm":           newAvgWpm,
			"avg_accuracy":      newAvgAcc,
			"updated_at":        now,
		}).Error
	})
}

package goal

import (
	"context"
	"time"

	"github.com/gogf/gf/v2/errors/gerror"
	"github.com/google/uuid"
	"gorm.io/gorm"

	"taptype/internal/model/code"
	"taptype/internal/model/entity"
)

type serviceImpl struct {
	db *gorm.DB
}

func NewService(db *gorm.DB) Service {
	return &serviceImpl{db: db}
}

func (s *serviceImpl) ListGoals(ctx context.Context, userID string) ([]entity.UserGoal, error) {
	var goals []entity.UserGoal
	if err := s.db.WithContext(ctx).
		Where("user_id = ?", userID).
		Order("created_at DESC").
		Find(&goals).Error; err != nil {
		return nil, gerror.NewCode(code.CodeInternalError, err.Error())
	}
	return goals, nil
}

func (s *serviceImpl) CreateGoal(ctx context.Context, userID string, goalType string, targetValue float64, period string) (*entity.UserGoal, error) {
	validTypes := map[string]bool{"duration": true, "wpm": true, "accuracy": true, "practice_count": true}
	if !validTypes[goalType] {
		return nil, gerror.NewCode(code.CodeBadRequest, "invalid goal_type, must be one of: duration, wpm, accuracy, practice_count")
	}
	if targetValue <= 0 {
		return nil, gerror.NewCode(code.CodeBadRequest, "target_value must be positive")
	}
	if period == "" {
		period = "daily"
	}

	now := time.Now()
	goal := &entity.UserGoal{
		ID:          uuid.New().String(),
		UserID:      userID,
		GoalType:    goalType,
		TargetValue: targetValue,
		Period:      period,
		StartDate:   now.Format("2006-01-02"),
		IsActive:    1,
		CreatedAt:   now,
		UpdatedAt:   now,
	}

	if err := s.db.WithContext(ctx).Create(goal).Error; err != nil {
		return nil, gerror.NewCode(code.CodeInternalError, err.Error())
	}
	return goal, nil
}

func (s *serviceImpl) UpdateGoal(ctx context.Context, userID, goalID string, targetValue *float64, isActive *int) (*entity.UserGoal, error) {
	var goal entity.UserGoal
	if err := s.db.WithContext(ctx).Where("id = ? AND user_id = ?", goalID, userID).First(&goal).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, gerror.NewCode(code.CodeNotFound, "goal not found")
		}
		return nil, gerror.NewCode(code.CodeInternalError, err.Error())
	}

	updates := map[string]interface{}{"updated_at": time.Now()}
	if targetValue != nil {
		if *targetValue <= 0 {
			return nil, gerror.NewCode(code.CodeBadRequest, "target_value must be positive")
		}
		updates["target_value"] = *targetValue
	}
	if isActive != nil {
		updates["is_active"] = *isActive
	}

	if err := s.db.WithContext(ctx).Model(&goal).Updates(updates).Error; err != nil {
		return nil, gerror.NewCode(code.CodeInternalError, err.Error())
	}

	// Reload
	s.db.WithContext(ctx).First(&goal, "id = ?", goalID)
	return &goal, nil
}

func (s *serviceImpl) DeleteGoal(ctx context.Context, userID, goalID string) error {
	result := s.db.WithContext(ctx).Where("id = ? AND user_id = ?", goalID, userID).Delete(&entity.UserGoal{})
	if result.Error != nil {
		return gerror.NewCode(code.CodeInternalError, result.Error.Error())
	}
	if result.RowsAffected == 0 {
		return gerror.NewCode(code.CodeNotFound, "goal not found")
	}
	return nil
}

func (s *serviceImpl) RefreshDailyProgress(ctx context.Context, userID string) error {
	var goals []entity.UserGoal
	if err := s.db.WithContext(ctx).
		Where("user_id = ? AND is_active = 1 AND period = 'daily'", userID).
		Find(&goals).Error; err != nil {
		return gerror.NewCode(code.CodeInternalError, err.Error())
	}
	if len(goals) == 0 {
		return nil
	}

	// Fetch today's daily record
	today := time.Now().Format("2006-01-02")
	var daily entity.DailyRecord
	hasDailyRecord := true
	if err := s.db.WithContext(ctx).Where("user_id = ? AND record_date = ?", userID, today).
		First(&daily).Error; err != nil {
		hasDailyRecord = false
	}

	for _, g := range goals {
		var currentValue float64
		if hasDailyRecord {
			switch g.GoalType {
			case "duration":
				currentValue = float64(daily.TotalDurationMs) / 60000.0 // convert ms to minutes
			case "wpm":
				currentValue = daily.AvgWpm
			case "accuracy":
				currentValue = daily.AvgAccuracy * 100 // percentage
			case "practice_count":
				currentValue = float64(daily.PracticeCount)
			}
		}
		s.db.WithContext(ctx).Model(&entity.UserGoal{}).
			Where("id = ?", g.ID).
			Update("current_value", currentValue)
	}
	return nil
}

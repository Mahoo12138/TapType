package goal

import (
	"context"

	"taptype/internal/model/entity"
)

type Service interface {
	ListGoals(ctx context.Context, userID string) ([]entity.UserGoal, error)
	CreateGoal(ctx context.Context, userID string, goalType string, targetValue float64, period string) (*entity.UserGoal, error)
	UpdateGoal(ctx context.Context, userID, goalID string, targetValue *float64, isActive *int) (*entity.UserGoal, error)
	DeleteGoal(ctx context.Context, userID, goalID string) error
	// RefreshDailyProgress recomputes current_value for all active daily goals of a user.
	RefreshDailyProgress(ctx context.Context, userID string) error
}

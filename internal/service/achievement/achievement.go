package achievement

import (
	"context"

	"taptype/internal/model/entity"
)

// UnlockedAchievement pairs the achievement definition with unlock time for response.
type UnlockedAchievement struct {
	entity.Achievement
	UnlockedAt string `json:"unlocked_at,omitempty"`
	Unlocked   bool   `json:"unlocked"`
}

type Service interface {
	// ListAll returns all achievement definitions with user unlock status.
	ListAll(ctx context.Context, userID string) ([]UnlockedAchievement, error)
	// DetectAndUnlock checks all achievements and unlocks any newly met conditions.
	// Returns the list of newly unlocked achievements (empty if none).
	DetectAndUnlock(ctx context.Context, userID string) ([]entity.Achievement, error)
}

package achievement

import (
	"context"
	"encoding/json"
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

func (s *serviceImpl) ListAll(ctx context.Context, userID string) ([]UnlockedAchievement, error) {
	var achievements []entity.Achievement
	if err := s.db.WithContext(ctx).Order("created_at ASC").Find(&achievements).Error; err != nil {
		return nil, gerror.NewCode(code.CodeInternalError, err.Error())
	}

	// Fetch user's unlocked achievements
	var unlocked []entity.UserAchievement
	s.db.WithContext(ctx).Where("user_id = ?", userID).Find(&unlocked)
	unlockedMap := make(map[string]time.Time, len(unlocked))
	for _, ua := range unlocked {
		unlockedMap[ua.AchievementID] = ua.UnlockedAt
	}

	result := make([]UnlockedAchievement, len(achievements))
	for i, a := range achievements {
		ua := UnlockedAchievement{Achievement: a}
		if t, ok := unlockedMap[a.ID]; ok {
			ua.Unlocked = true
			ua.UnlockedAt = t.Format(time.RFC3339)
		}
		result[i] = ua
	}
	return result, nil
}

// conditionSpec represents the JSON structure in achievements.condition
type conditionSpec struct {
	Type  string  `json:"type"`
	Value float64 `json:"value"`
}

func (s *serviceImpl) DetectAndUnlock(ctx context.Context, userID string) ([]entity.Achievement, error) {
	// 1. Get all achievements
	var achievements []entity.Achievement
	if err := s.db.WithContext(ctx).Find(&achievements).Error; err != nil {
		return nil, gerror.NewCode(code.CodeInternalError, err.Error())
	}

	// 2. Get already unlocked
	var unlocked []entity.UserAchievement
	s.db.WithContext(ctx).Where("user_id = ?", userID).Find(&unlocked)
	unlockedSet := make(map[string]bool, len(unlocked))
	for _, ua := range unlocked {
		unlockedSet[ua.AchievementID] = true
	}

	// 3. Gather user stats lazily
	stats := s.gatherStats(ctx, userID)

	// 4. Check each achievement
	var newlyUnlocked []entity.Achievement
	now := time.Now()
	for _, a := range achievements {
		if unlockedSet[a.ID] {
			continue
		}
		var cond conditionSpec
		if err := json.Unmarshal([]byte(a.Condition), &cond); err != nil {
			continue
		}
		if s.checkCondition(cond, stats) {
			ua := entity.UserAchievement{
				ID:            uuid.New().String(),
				UserID:        userID,
				AchievementID: a.ID,
				UnlockedAt:    now,
			}
			if err := s.db.WithContext(ctx).Create(&ua).Error; err != nil {
				continue // skip duplicate or error
			}
			newlyUnlocked = append(newlyUnlocked, a)
		}
	}
	return newlyUnlocked, nil
}

// userStats holds the aggregated data needed for achievement condition checks.
type userStats struct {
	PracticeCount  int64
	CurrentStreak  int
	LongestStreak  int
	BestWPM        float64
	BestAccuracy   float64
	TotalWordCount int64
}

func (s *serviceImpl) gatherStats(ctx context.Context, userID string) userStats {
	var stats userStats

	// Total practice sessions completed
	s.db.WithContext(ctx).Model(&entity.PracticeSession{}).
		Where("user_id = ? AND ended_at IS NOT NULL", userID).
		Count(&stats.PracticeCount)

	// Streak from daily records
	var dailyRecords []entity.DailyRecord
	s.db.WithContext(ctx).
		Where("user_id = ?", userID).
		Order("record_date DESC").
		Find(&dailyRecords)
	if len(dailyRecords) > 0 {
		stats.CurrentStreak = dailyRecords[0].StreakDay
		for _, dr := range dailyRecords {
			if dr.StreakDay > stats.LongestStreak {
				stats.LongestStreak = dr.StreakDay
			}
		}
	}

	// Best WPM and accuracy from practice results
	var bestResult struct {
		BestWPM      float64
		BestAccuracy float64
	}
	s.db.WithContext(ctx).Model(&entity.PracticeResult{}).
		Select("MAX(wpm) as best_wpm, MAX(accuracy) as best_accuracy").
		Joins("JOIN practice_sessions ON practice_sessions.id = practice_results.session_id").
		Where("practice_sessions.user_id = ?", userID).
		Scan(&bestResult)
	stats.BestWPM = bestResult.BestWPM
	stats.BestAccuracy = bestResult.BestAccuracy

	// Total word/char count
	var totalChars struct{ Total int64 }
	s.db.WithContext(ctx).Model(&entity.PracticeResult{}).
		Select("COALESCE(SUM(char_count), 0) as total").
		Joins("JOIN practice_sessions ON practice_sessions.id = practice_results.session_id").
		Where("practice_sessions.user_id = ?", userID).
		Scan(&totalChars)
	stats.TotalWordCount = totalChars.Total / 5 // approximate words = chars / 5

	return stats
}

func (s *serviceImpl) checkCondition(cond conditionSpec, stats userStats) bool {
	switch cond.Type {
	case "practice_count":
		return float64(stats.PracticeCount) >= cond.Value
	case "streak":
		return float64(stats.CurrentStreak) >= cond.Value || float64(stats.LongestStreak) >= cond.Value
	case "best_wpm":
		return stats.BestWPM >= cond.Value
	case "accuracy":
		return stats.BestAccuracy >= cond.Value
	case "word_count":
		return float64(stats.TotalWordCount) >= cond.Value
	default:
		return false
	}
}

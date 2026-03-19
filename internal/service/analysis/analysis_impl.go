package analysis

import (
	"context"
	"fmt"
	"time"

	"gorm.io/gorm"

	"taptype/internal/model/entity"
)

type serviceImpl struct {
	db *gorm.DB
}

func NewService(db *gorm.DB) Service {
	return &serviceImpl{db: db}
}

func (s *serviceImpl) GetTrend(ctx context.Context, userID, period string, days int) ([]TrendPoint, error) {
	if days <= 0 {
		days = 30
	}

	since := time.Now().AddDate(0, 0, -days)
	var groupExpr string

	switch period {
	case "week":
		// Group by ISO week — use strftime for SQLite compatibility
		groupExpr = "strftime('%Y-W%W', ps.started_at)"
	case "month":
		groupExpr = "strftime('%Y-%m', ps.started_at)"
	default: // "day"
		groupExpr = "strftime('%Y-%m-%d', ps.started_at)"
	}

	query := fmt.Sprintf(`
		SELECT %s as date,
			AVG(pr.wpm) as wpm,
			AVG(pr.raw_wpm) as raw_wpm,
			AVG(pr.accuracy) as accuracy,
			COUNT(*) as count
		FROM practice_sessions ps
		JOIN practice_results pr ON pr.session_id = ps.id
		WHERE ps.user_id = ? AND ps.started_at >= ? AND ps.ended_at IS NOT NULL
		GROUP BY date
		ORDER BY date ASC
	`, groupExpr)

	var points []TrendPoint
	if err := s.db.WithContext(ctx).Raw(query, userID, since).Scan(&points).Error; err != nil {
		return nil, err
	}

	return points, nil
}

func (s *serviceImpl) GetKeymap(ctx context.Context, userID string) ([]KeyStat, error) {
	var stats []KeyStat

	query := `
		SELECT 
			ks.key_char,
			SUM(ks.hit_count) as total_hits,
			SUM(ks.error_count) as total_errors,
			CASE WHEN SUM(ks.hit_count) > 0 
				THEN CAST(SUM(ks.error_count) AS REAL) / SUM(ks.hit_count) 
				ELSE 0 
			END as error_rate,
			AVG(ks.avg_interval_ms) as avg_interval_ms
		FROM keystroke_stats ks
		JOIN practice_sessions ps ON ps.id = ks.session_id
		WHERE ps.user_id = ?
		GROUP BY ks.key_char
		ORDER BY total_errors DESC
	`

	if err := s.db.WithContext(ctx).Raw(query, userID).Scan(&stats).Error; err != nil {
		return nil, err
	}

	return stats, nil
}

func (s *serviceImpl) GetSummary(ctx context.Context, userID string) (*Summary, error) {
	summary := &Summary{}

	// Total sessions + duration
	s.db.WithContext(ctx).Raw(`
		SELECT COUNT(*) as total_sessions, 
			COALESCE(SUM(duration_ms), 0) as total_duration_ms
		FROM practice_sessions 
		WHERE user_id = ? AND ended_at IS NOT NULL
	`, userID).Scan(summary)

	// Best WPM, avg WPM, avg accuracy, total chars
	s.db.WithContext(ctx).Raw(`
		SELECT COALESCE(MAX(pr.wpm), 0) as best_wpm,
			COALESCE(AVG(pr.wpm), 0) as avg_wpm,
			COALESCE(AVG(pr.accuracy), 0) as avg_accuracy,
			COALESCE(SUM(pr.char_count), 0) as total_chars
		FROM practice_results pr
		JOIN practice_sessions ps ON ps.id = pr.session_id
		WHERE ps.user_id = ?
	`, userID).Scan(summary)

	// Current streak
	var latestDaily entity.DailyRecord
	if err := s.db.WithContext(ctx).
		Where("user_id = ?", userID).
		Order("record_date DESC").
		First(&latestDaily).Error; err == nil {
		summary.CurrentStreak = latestDaily.StreakDay
	}

	// Longest streak
	s.db.WithContext(ctx).Raw(`
		SELECT COALESCE(MAX(streak_day), 0) as longest_streak 
		FROM daily_records 
		WHERE user_id = ?
	`, userID).Scan(summary)

	// Error word count
	var errCount int64
	s.db.WithContext(ctx).Model(&entity.ErrorRecord{}).
		Where("user_id = ?", userID).Count(&errCount)
	summary.ErrorWordCount = int(errCount)

	// Review due count
	now := time.Now()
	var dueCount int64
	s.db.WithContext(ctx).Model(&entity.ErrorRecord{}).
		Where("user_id = ? AND next_review_at <= ?", userID, now).Count(&dueCount)
	summary.ReviewDueCount = int(dueCount)

	return summary, nil
}

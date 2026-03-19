package analysis

import "context"

// Service defines the analysis and statistics operations.
type Service interface {
	// GetTrend returns historical WPM/accuracy data points aggregated by period.
	GetTrend(ctx context.Context, userID, period string, days int) ([]TrendPoint, error)

	// GetKeymap returns aggregated keystroke statistics across all sessions.
	GetKeymap(ctx context.Context, userID string) ([]KeyStat, error)

	// GetSummary returns an overall summary of the user's practice history.
	GetSummary(ctx context.Context, userID string) (*Summary, error)
}

// TrendPoint represents a single data point in a historical trend.
type TrendPoint struct {
	Date     string  `json:"date"`
	WPM      float64 `json:"wpm"`
	RawWPM   float64 `json:"raw_wpm"`
	Accuracy float64 `json:"accuracy"`
	Count    int     `json:"count"` // number of sessions
}

// KeyStat represents aggregated statistics for a single key character.
type KeyStat struct {
	KeyChar       string  `json:"key_char"`
	TotalHits     int     `json:"total_hits"`
	TotalErrors   int     `json:"total_errors"`
	ErrorRate     float64 `json:"error_rate"` // computed
	AvgIntervalMs int     `json:"avg_interval_ms"`
}

// Summary represents an overall practice summary for a user.
type Summary struct {
	TotalSessions   int     `json:"total_sessions"`
	TotalDurationMs int64   `json:"total_duration_ms"`
	TotalChars      int     `json:"total_chars"`
	BestWPM         float64 `json:"best_wpm"`
	AvgWPM          float64 `json:"avg_wpm"`
	AvgAccuracy     float64 `json:"avg_accuracy"`
	CurrentStreak   int     `json:"current_streak"`
	LongestStreak   int     `json:"longest_streak"`
	ErrorWordCount  int     `json:"error_word_count"`
	ReviewDueCount  int     `json:"review_due_count"`
}

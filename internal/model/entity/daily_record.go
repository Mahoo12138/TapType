package entity

import "time"

type DailyRecord struct {
	ID              string    `gorm:"primaryKey;type:text" json:"id"`
	UserID          string    `gorm:"type:text;not null" json:"user_id"`
	RecordDate      string    `gorm:"type:text;not null" json:"record_date"`
	PracticeCount   int       `gorm:"type:integer;not null;default:0" json:"practice_count"`
	TotalDurationMs int64     `gorm:"type:integer;not null;default:0" json:"total_duration_ms"`
	AvgWpm          float64   `gorm:"type:real;not null;default:0" json:"avg_wpm"`
	AvgAccuracy     float64   `gorm:"type:real;not null;default:0" json:"avg_accuracy"`
	StreakDay       int       `gorm:"type:integer;not null;default:1" json:"streak_day"`
	CreatedAt       time.Time `json:"created_at"`
	UpdatedAt       time.Time `json:"updated_at"`
}

func (DailyRecord) TableName() string { return "daily_records" }

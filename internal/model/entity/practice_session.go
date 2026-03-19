package entity

import "time"

type PracticeSession struct {
	ID         string     `gorm:"primaryKey;type:text" json:"id"`
	UserID     string     `gorm:"type:text;not null;index" json:"user_id"`
	Mode       string     `gorm:"type:text;not null" json:"mode"`
	SourceType string     `gorm:"type:text;not null" json:"source_type"`
	SourceID   string     `gorm:"type:text" json:"source_id"`
	ItemCount  int        `gorm:"default:0" json:"item_count"`
	StartedAt  time.Time  `gorm:"not null" json:"started_at"`
	EndedAt    *time.Time `json:"ended_at"`
	DurationMs *int64     `json:"duration_ms"`
	CreatedAt  time.Time  `json:"created_at"`
}

func (PracticeSession) TableName() string { return "practice_sessions" }

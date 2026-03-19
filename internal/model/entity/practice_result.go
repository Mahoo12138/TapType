package entity

import "time"

type PracticeResult struct {
	ID          string    `gorm:"primaryKey;type:text" json:"id"`
	SessionID   string    `gorm:"type:text;not null;uniqueIndex" json:"session_id"`
	Wpm         float64   `gorm:"type:real;not null" json:"wpm"`
	RawWpm      float64   `gorm:"type:real;not null" json:"raw_wpm"`
	Accuracy    float64   `gorm:"type:real;not null" json:"accuracy"`
	ErrorCount  int       `gorm:"type:integer;not null;default:0" json:"error_count"`
	CharCount   int       `gorm:"type:integer;not null;default:0" json:"char_count"`
	Consistency float64   `gorm:"type:real;not null;default:0" json:"consistency"`
	CreatedAt   time.Time `json:"created_at"`
}

func (PracticeResult) TableName() string { return "practice_results" }

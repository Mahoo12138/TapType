package entity

import "time"

type ErrorRecord struct {
	ID             string    `gorm:"primaryKey;type:text" json:"id"`
	UserID         string    `gorm:"type:text;not null" json:"user_id"`
	SessionID      string    `gorm:"type:text;not null" json:"session_id"`
	ContentType    string    `gorm:"type:text;not null" json:"content_type"`
	ContentID      string    `gorm:"type:text;not null" json:"content_id"`
	ErrorCount     int       `gorm:"type:integer;not null;default:1" json:"error_count"`
	AvgTimeMs      int       `gorm:"type:integer;not null;default:0" json:"avg_time_ms"`
	LastSeenAt     time.Time `gorm:"not null" json:"last_seen_at"`
	NextReviewAt   time.Time `gorm:"not null;index" json:"next_review_at"`
	ReviewInterval int       `gorm:"type:integer;not null;default:1" json:"review_interval"`
	EasinessFactor float64   `gorm:"type:real;not null;default:2.5" json:"easiness_factor"`
	CreatedAt      time.Time `json:"created_at"`
	UpdatedAt      time.Time `json:"updated_at"`

	// Virtual fields populated by joins
	Content string `gorm:"-" json:"content,omitempty"`
}

func (ErrorRecord) TableName() string { return "error_records" }

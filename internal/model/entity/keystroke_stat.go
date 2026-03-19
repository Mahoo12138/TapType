package entity

import "time"

type KeystrokeStat struct {
	ID            string    `gorm:"primaryKey;type:text" json:"id"`
	SessionID     string    `gorm:"type:text;not null;index" json:"session_id"`
	KeyChar       string    `gorm:"type:text;not null" json:"key_char"`
	HitCount      int       `gorm:"type:integer;not null;default:0" json:"hit_count"`
	ErrorCount    int       `gorm:"type:integer;not null;default:0" json:"error_count"`
	AvgIntervalMs int       `gorm:"type:integer;not null;default:0" json:"avg_interval_ms"`
	CreatedAt     time.Time `json:"created_at"`
}

func (KeystrokeStat) TableName() string { return "keystroke_stats" }

package entity

import "time"

type PracticeSessionItem struct {
	ID          string    `gorm:"primaryKey;type:text" json:"id"`
	SessionID   string    `gorm:"type:text;not null;index" json:"session_id"`
	ItemOrder   int       `gorm:"type:integer;not null" json:"item_order"`
	ContentType string    `gorm:"type:text;not null" json:"content_type"`
	ContentID   string    `gorm:"type:text;not null" json:"content_id"`
	CreatedAt   time.Time `json:"created_at"`
}

func (PracticeSessionItem) TableName() string { return "practice_session_items" }
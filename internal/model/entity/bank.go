package entity

import (
	"time"

	"gorm.io/gorm"
)

type WordBank struct {
	ID          string         `gorm:"primaryKey;type:text" json:"id"`
	OwnerID     string         `gorm:"type:text;not null" json:"owner_id"`
	Name        string         `gorm:"type:text;not null" json:"name"`
	Description string         `gorm:"type:text" json:"description"`
	IsPublic    int            `gorm:"type:integer;not null;default:0" json:"is_public"`
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
	DeletedAt   gorm.DeletedAt `gorm:"index" json:"-"`
	WordCount   int64          `gorm:"-" json:"word_count,omitempty"`
}

func (WordBank) TableName() string { return "word_banks" }

type SentenceBank struct {
	ID            string         `gorm:"primaryKey;type:text" json:"id"`
	OwnerID       string         `gorm:"type:text;not null" json:"owner_id"`
	Name          string         `gorm:"type:text;not null" json:"name"`
	Category      string         `gorm:"type:text" json:"category"`
	IsPublic      int            `gorm:"type:integer;not null;default:0" json:"is_public"`
	CreatedAt     time.Time      `json:"created_at"`
	UpdatedAt     time.Time      `json:"updated_at"`
	DeletedAt     gorm.DeletedAt `gorm:"index" json:"-"`
	SentenceCount int64          `gorm:"-" json:"sentence_count,omitempty"`
}

func (SentenceBank) TableName() string { return "sentence_banks" }

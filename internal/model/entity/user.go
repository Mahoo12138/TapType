package entity

import (
	"time"

	"gorm.io/gorm"
)

type User struct {
	ID            string         `gorm:"primaryKey;type:text" json:"id"`
	Username      string         `gorm:"uniqueIndex;type:text;not null" json:"username"`
	Email         string         `gorm:"uniqueIndex;type:text;not null" json:"email"`
	PasswordHash  string         `gorm:"type:text;not null" json:"-"`
	AvatarMediaID *string        `gorm:"type:text" json:"avatar_media_id,omitempty"`
	Role          string         `gorm:"type:text;not null;default:user" json:"role"`
	IsActive      int            `gorm:"type:integer;not null;default:1" json:"is_active"`
	CreatedAt     time.Time      `json:"created_at"`
	UpdatedAt     time.Time      `json:"updated_at"`
	DeletedAt     gorm.DeletedAt `gorm:"index" json:"-"`
}

func (User) TableName() string { return "users" }

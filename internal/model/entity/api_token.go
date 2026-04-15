package entity

import "time"

type ApiToken struct {
	ID         string     `gorm:"primaryKey;type:text" json:"id"`
	UserID     string     `gorm:"type:text;not null;index" json:"user_id"`
	Name       string     `gorm:"type:text;not null" json:"name"`
	TokenHash  string     `gorm:"type:text;not null;uniqueIndex" json:"-"`
	Prefix     string     `gorm:"type:text;not null" json:"prefix"`
	Scopes     string     `gorm:"type:text;not null;default:*" json:"scopes"`
	ExpiresAt  *time.Time `json:"expires_at,omitempty"`
	LastUsedAt *time.Time `json:"last_used_at,omitempty"`
	IsActive   int        `gorm:"type:integer;not null;default:1" json:"is_active"`
	CreatedAt  time.Time  `json:"created_at"`
	UpdatedAt  time.Time  `json:"updated_at"`
}

func (ApiToken) TableName() string { return "api_tokens" }

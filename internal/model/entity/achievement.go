package entity

import "time"

type Achievement struct {
	ID          string    `gorm:"primaryKey;type:text" json:"id"`
	Key         string    `gorm:"type:text;not null;uniqueIndex" json:"key"`
	Name        string    `gorm:"type:text;not null" json:"name"`
	Description string    `gorm:"type:text;not null" json:"description"`
	Icon        string    `gorm:"type:text" json:"icon"`
	Condition   string    `gorm:"type:text;not null" json:"condition"`
	CreatedAt   time.Time `json:"created_at"`
}

func (Achievement) TableName() string { return "achievements" }

type UserAchievement struct {
	ID            string    `gorm:"primaryKey;type:text" json:"id"`
	UserID        string    `gorm:"type:text;not null" json:"user_id"`
	AchievementID string    `gorm:"type:text;not null" json:"achievement_id"`
	UnlockedAt    time.Time `gorm:"not null" json:"unlocked_at"`
}

func (UserAchievement) TableName() string { return "user_achievements" }

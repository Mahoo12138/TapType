package entity

import "time"

type UserGoal struct {
	ID           string    `gorm:"primaryKey;type:text" json:"id"`
	UserID       string    `gorm:"type:text;not null" json:"user_id"`
	GoalType     string    `gorm:"type:text;not null" json:"goal_type"` // "duration", "wpm", "accuracy", "practice_count"
	TargetValue  float64   `gorm:"type:real;not null" json:"target_value"`
	CurrentValue float64   `gorm:"type:real;not null;default:0" json:"current_value"`
	Period       string    `gorm:"type:text;not null;default:daily" json:"period"` // "daily"
	StartDate    string    `gorm:"type:text;not null" json:"start_date"`
	IsActive     int       `gorm:"type:integer;not null;default:1" json:"is_active"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

func (UserGoal) TableName() string { return "user_goals" }

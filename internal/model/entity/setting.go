package entity

import "time"

type SettingDefinition struct {
	Key            string    `gorm:"primaryKey;type:text" json:"key"`
	Scope          string    `gorm:"type:text;not null" json:"scope"`
	Type           string    `gorm:"type:text;not null" json:"type"`
	GroupKey       string    `gorm:"type:text;not null;default:general" json:"group_key"`
	Label          string    `gorm:"type:text;not null" json:"label"`
	Description    string    `gorm:"type:text" json:"description"`
	DefaultValue   string    `gorm:"type:text;not null" json:"default_value"`
	EnumOptions    string    `gorm:"type:text" json:"enum_options"`
	ValidationRule string    `gorm:"type:text" json:"validation_rule"`
	IsPublic       int       `gorm:"type:integer;not null;default:1" json:"is_public"`
	SortOrder      int       `gorm:"type:integer;not null;default:0" json:"sort_order"`
	CreatedAt      time.Time `json:"created_at"`
	UpdatedAt      time.Time `json:"updated_at"`
}

func (SettingDefinition) TableName() string { return "setting_definitions" }

type SystemSetting struct {
	ID            string    `gorm:"primaryKey;type:text" json:"id"`
	DefinitionKey string    `gorm:"type:text;not null;uniqueIndex" json:"definition_key"`
	Value         string    `gorm:"type:text;not null" json:"value"`
	UpdatedBy     string    `gorm:"type:text;not null" json:"updated_by"`
	UpdatedAt     time.Time `json:"updated_at"`
}

func (SystemSetting) TableName() string { return "system_settings" }

type UserSetting struct {
	ID            string    `gorm:"primaryKey;type:text" json:"id"`
	UserID        string    `gorm:"type:text;not null;index" json:"user_id"`
	DefinitionKey string    `gorm:"type:text;not null" json:"definition_key"`
	Value         string    `gorm:"type:text;not null" json:"value"`
	UpdatedAt     time.Time `json:"updated_at"`
}

func (UserSetting) TableName() string { return "user_settings" }

type SettingControl struct {
	ID            string    `gorm:"primaryKey;type:text" json:"id"`
	DefinitionKey string    `gorm:"type:text;not null;uniqueIndex" json:"definition_key"`
	IsVisible     int       `gorm:"type:integer;not null;default:1" json:"is_visible"`
	IsEditable    int       `gorm:"type:integer;not null;default:1" json:"is_editable"`
	UpdatedBy     string    `gorm:"type:text;not null" json:"updated_by"`
	UpdatedAt     time.Time `json:"updated_at"`
}

func (SettingControl) TableName() string { return "setting_controls" }

package entity

import "time"

type MediaTypeDefinition struct {
	Key              string    `gorm:"primaryKey;type:text" json:"key"`
	Label            string    `gorm:"type:text;not null" json:"label"`
	Description      string    `gorm:"type:text" json:"description"`
	OwnerScope       string    `gorm:"type:text;not null" json:"owner_scope"`
	AllowedMimeTypes string    `gorm:"type:text;not null" json:"allowed_mime_types"`
	MaxSizeBytes     int       `gorm:"type:integer;not null;default:262144" json:"max_size_bytes"`
	MaxCount         int       `gorm:"type:integer;not null;default:1" json:"max_count"`
	IsPublic         int       `gorm:"type:integer;not null;default:1" json:"is_public"`
	SortOrder        int       `gorm:"type:integer;not null;default:0" json:"sort_order"`
	CreatedAt        time.Time `json:"created_at"`
}

func (MediaTypeDefinition) TableName() string { return "media_type_definitions" }

type MediaFile struct {
	ID          string    `gorm:"primaryKey;type:text" json:"id"`
	TypeKey     string    `gorm:"type:text;not null;index" json:"type_key"`
	OwnerType   string    `gorm:"type:text;not null;index" json:"owner_type"`
	OwnerID     string    `gorm:"type:text;not null;default:'';index" json:"owner_id"`
	Slot        string    `gorm:"type:text;not null;default:default" json:"slot"`
	DisplayName string    `gorm:"type:text;not null;default:''" json:"display_name"`
	Remark      string    `gorm:"type:text;not null;default:''" json:"remark"`
	Filename    string    `gorm:"type:text;not null" json:"filename"`
	ContentType string    `gorm:"type:text;not null" json:"content_type"`
	Data        []byte    `gorm:"not null" json:"-"`
	SizeBytes   int       `gorm:"type:integer;not null" json:"size_bytes"`
	Hash        string    `gorm:"type:text;not null;index" json:"hash"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

func (MediaFile) TableName() string { return "media_files" }

package media

import (
	"context"
	"io/fs"
	"time"

	"taptype/internal/model/entity"
)

type Service interface {
	Upload(ctx context.Context, req UploadReq) (*UploadResult, error)
	Delete(ctx context.Context, fileID, operatorID, operatorRole string) error
	ListByOwner(ctx context.Context, typeKey, ownerType, ownerID, operatorID, operatorRole string) ([]MediaFileMeta, error)
	GetDefinitions(ctx context.Context) ([]*entity.MediaTypeDefinition, error)
	GetServeMeta(ctx context.Context, fileID string) (*ServeMeta, error)
	GetFileData(ctx context.Context, fileID string) ([]byte, error)
	UploadUserAvatar(ctx context.Context, userID, filename string, data []byte) (*UploadResult, error)
	DeleteUserAvatar(ctx context.Context, userID string) error
	UploadSystemSound(ctx context.Context, slot, filename, displayName, remark string, data []byte) (*UploadResult, error)
	GetSystemSounds(ctx context.Context) (*SystemSoundCatalog, error)
	SeedSystemSounds(ctx context.Context, soundFS fs.FS) error
}

type UploadReq struct {
	TypeKey      string
	OwnerType    string
	OwnerID      string
	Slot         string
	DisplayName  string
	Remark       string
	Filename     string
	Data         []byte
	OperatorID   string
	OperatorRole string
}

type UploadResult struct {
	FileID string `json:"file_id"`
	URL    string `json:"url"`
}

type MediaFileMeta struct {
	ID          string    `json:"id"`
	TypeKey     string    `json:"type_key"`
	OwnerType   string    `json:"owner_type"`
	OwnerID     string    `json:"owner_id"`
	Slot        string    `json:"slot"`
	DisplayName string    `json:"display_name"`
	Remark      string    `json:"remark"`
	Filename    string    `json:"filename"`
	ContentType string    `json:"content_type"`
	SizeBytes   int       `json:"size_bytes"`
	Hash        string    `json:"hash"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

type MediaLink struct {
	Identifier  string `json:"identifier"`
	FileID      string `json:"file_id"`
	URL         string `json:"url"`
	DisplayName string `json:"display_name"`
	Remark      string `json:"remark"`
}

type SystemSoundCatalog struct {
	Effects   map[string]*MediaLink `json:"effects"`
	Keyboards []*MediaLink          `json:"keyboards"`
}

type ServeMeta struct {
	Hash        string
	ContentType string
	Filename    string
	TypeKey     string
	SizeBytes   int
	IsPublic    int
}

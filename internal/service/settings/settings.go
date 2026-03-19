package settings

import (
	"context"

	"taptype/internal/model/entity"
)

type Service interface {
	// System settings (admin only)
	GetSystemSetting(ctx context.Context, key string) (string, error)
	GetSystemSettingBool(ctx context.Context, key string) (bool, error)
	GetSystemSettingInt(ctx context.Context, key string) (int, error)
	SetSystemSetting(ctx context.Context, key, value, adminID string) error
	GetAllSystemSettings(ctx context.Context) (map[string]string, error)

	// User settings
	GetUserSetting(ctx context.Context, userID, key string) (string, error)
	GetUserSettingBool(ctx context.Context, userID, key string) (bool, error)
	GetAllUserSettings(ctx context.Context, userID string) (map[string]string, error)
	SetUserSetting(ctx context.Context, userID, key, value string) error
	BatchSetUserSettings(ctx context.Context, userID string, kvs map[string]string) error

	// Setting definitions (frontend self-description)
	GetDefinitions(ctx context.Context, scope string, isPublic bool) ([]*entity.SettingDefinition, error)

	// Setting controls (admin only)
	SetSettingControl(ctx context.Context, key string, isVisible, isEditable bool, adminID string) error
	GetSettingControls(ctx context.Context) (map[string]*entity.SettingControl, error)
}

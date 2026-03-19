package settings

import (
	"context"

	v1 "taptype/api/settings/v1"
)

type ISettingsV1 interface {
	// User settings
	GetUserSettings(ctx context.Context, req *v1.GetUserSettingsReq) (res *v1.GetUserSettingsRes, err error)
	GetSettingDefinitions(ctx context.Context, req *v1.GetSettingDefinitionsReq) (res *v1.GetSettingDefinitionsRes, err error)
	SetUserSetting(ctx context.Context, req *v1.SetUserSettingReq) (res *v1.SetUserSettingRes, err error)
	BatchSetUserSettings(ctx context.Context, req *v1.BatchSetUserSettingsReq) (res *v1.BatchSetUserSettingsRes, err error)
}

type IAdminSettingsV1 interface {
	// System settings (admin only)
	GetSystemSettings(ctx context.Context, req *v1.GetSystemSettingsReq) (res *v1.GetSystemSettingsRes, err error)
	SetSystemSetting(ctx context.Context, req *v1.SetSystemSettingReq) (res *v1.SetSystemSettingRes, err error)
	GetUserControls(ctx context.Context, req *v1.GetUserControlsReq) (res *v1.GetUserControlsRes, err error)
	SetUserControl(ctx context.Context, req *v1.SetUserControlReq) (res *v1.SetUserControlRes, err error)
}

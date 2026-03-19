package v1

import (
	"github.com/gogf/gf/v2/frame/g"
)

// ---- User settings ----

type GetUserSettingsReq struct {
	g.Meta `path:"/settings" method:"get" tags:"Settings" summary:"Get all user settings (with defaults)"`
}
type GetUserSettingsRes struct{}

type GetSettingDefinitionsReq struct {
	g.Meta `path:"/settings/definitions" method:"get" tags:"Settings" summary:"Get visible setting definitions for current user"`
}
type GetSettingDefinitionsRes struct{}

type SetUserSettingReq struct {
	g.Meta `path:"/settings/{key}" method:"put" tags:"Settings" summary:"Set a single user setting"`
	Key    string `json:"key" in:"path"`
	Value  string `json:"value" v:"required#value is required"`
}
type SetUserSettingRes struct{}

type BatchSetUserSettingsReq struct {
	g.Meta   `path:"/settings" method:"put" tags:"Settings" summary:"Batch update user settings"`
	Settings map[string]string `json:"settings" v:"required#settings map is required"`
}
type BatchSetUserSettingsRes struct{}

// ---- Admin system settings ----

type GetSystemSettingsReq struct {
	g.Meta `path:"/admin/settings" method:"get" tags:"Admin Settings" summary:"Get all system settings (admin only)"`
}
type GetSystemSettingsRes struct{}

type SetSystemSettingReq struct {
	g.Meta `path:"/admin/settings/{key}" method:"put" tags:"Admin Settings" summary:"Set a system setting (admin only)"`
	Key    string `json:"key" in:"path"`
	Value  string `json:"value" v:"required#value is required"`
}
type SetSystemSettingRes struct{}

type GetUserControlsReq struct {
	g.Meta `path:"/admin/settings/user-controls" method:"get" tags:"Admin Settings" summary:"Get user setting controls (admin only)"`
}
type GetUserControlsRes struct{}

type SetUserControlReq struct {
	g.Meta     `path:"/admin/settings/user-controls/{key}" method:"put" tags:"Admin Settings" summary:"Set user setting control (admin only)"`
	Key        string `json:"key" in:"path"`
	IsVisible  *bool  `json:"is_visible"`
	IsEditable *bool  `json:"is_editable"`
}
type SetUserControlRes struct{}

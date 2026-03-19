package settings

import (
	apisettings "taptype/api/settings"
	settingsService "taptype/internal/service/settings"
)

type ControllerV1 struct {
	settingsSvc settingsService.Service
}

type PublicControllerV1 struct {
	settingsSvc settingsService.Service
}

type AdminControllerV1 struct {
	settingsSvc settingsService.Service
}

func NewV1(svc settingsService.Service) apisettings.ISettingsV1 {
	return &ControllerV1{settingsSvc: svc}
}

func NewPublicV1(svc settingsService.Service) apisettings.ISettingsPublicV1 {
	return &PublicControllerV1{settingsSvc: svc}
}

func NewAdminV1(svc settingsService.Service) apisettings.IAdminSettingsV1 {
	return &AdminControllerV1{settingsSvc: svc}
}

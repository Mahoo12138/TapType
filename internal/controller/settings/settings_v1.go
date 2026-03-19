package settings

import (
	"context"
	"encoding/json"

	"github.com/gogf/gf/v2/frame/g"

	v1 "taptype/api/settings/v1"
	"taptype/internal/model/entity"
)

// ---- User settings controller ----

func (c *ControllerV1) GetUserSettings(ctx context.Context, req *v1.GetUserSettingsReq) (res *v1.GetUserSettingsRes, err error) {
	r := g.RequestFromCtx(ctx)
	userID := r.GetCtxVar("user_id").String()

	settings, err := c.settingsSvc.GetAllUserSettings(ctx, userID)
	if err != nil {
		return nil, err
	}

	r.Response.WriteJsonExit(g.Map{"code": 0, "message": "success", "data": settings})
	return
}

func (c *ControllerV1) GetSettingDefinitions(ctx context.Context, req *v1.GetSettingDefinitionsReq) (res *v1.GetSettingDefinitionsRes, err error) {
	r := g.RequestFromCtx(ctx)
	userID := r.GetCtxVar("user_id").String()

	defs, err := c.settingsSvc.GetDefinitions(ctx, "user", true)
	if err != nil {
		return nil, err
	}

	// Get user's current settings to embed current_value
	userSettings, _ := c.settingsSvc.GetAllUserSettings(ctx, userID)

	// Get admin controls
	controls, _ := c.settingsSvc.GetSettingControls(ctx)

	// Group definitions and apply controls
	groups := buildDefinitionGroups(defs, userSettings, controls)

	r.Response.WriteJsonExit(g.Map{"code": 0, "message": "success", "data": g.Map{"groups": groups}})
	return
}

func (c *ControllerV1) SetUserSetting(ctx context.Context, req *v1.SetUserSettingReq) (res *v1.SetUserSettingRes, err error) {
	r := g.RequestFromCtx(ctx)
	userID := r.GetCtxVar("user_id").String()

	if err = c.settingsSvc.SetUserSetting(ctx, userID, req.Key, req.Value); err != nil {
		return nil, err
	}

	r.Response.WriteJsonExit(g.Map{"code": 0, "message": "success", "data": nil})
	return
}

func (c *ControllerV1) BatchSetUserSettings(ctx context.Context, req *v1.BatchSetUserSettingsReq) (res *v1.BatchSetUserSettingsRes, err error) {
	r := g.RequestFromCtx(ctx)
	userID := r.GetCtxVar("user_id").String()

	if err = c.settingsSvc.BatchSetUserSettings(ctx, userID, req.Settings); err != nil {
		return nil, err
	}

	r.Response.WriteJsonExit(g.Map{"code": 0, "message": "success", "data": nil})
	return
}

// ---- Admin settings controller ----

func (c *AdminControllerV1) GetSystemSettings(ctx context.Context, req *v1.GetSystemSettingsReq) (res *v1.GetSystemSettingsRes, err error) {
	r := g.RequestFromCtx(ctx)

	defs, err := c.settingsSvc.GetDefinitions(ctx, "system", false)
	if err != nil {
		return nil, err
	}

	systemValues, err := c.settingsSvc.GetAllSystemSettings(ctx)
	if err != nil {
		return nil, err
	}

	type settingItem struct {
		Key            string   `json:"key"`
		Type           string   `json:"type"`
		GroupKey       string   `json:"group_key"`
		Label          string   `json:"label"`
		Description    string   `json:"description"`
		DefaultValue   string   `json:"default_value"`
		CurrentValue   string   `json:"current_value"`
		EnumOptions    []string `json:"enum_options,omitempty"`
		ValidationRule string   `json:"validation_rule,omitempty"`
	}

	items := make([]settingItem, 0, len(defs))
	for _, d := range defs {
		item := settingItem{
			Key:            d.Key,
			Type:           d.Type,
			GroupKey:       d.GroupKey,
			Label:          d.Label,
			Description:    d.Description,
			DefaultValue:   d.DefaultValue,
			CurrentValue:   systemValues[d.Key],
			ValidationRule: d.ValidationRule,
		}
		if d.EnumOptions != "" {
			_ = json.Unmarshal([]byte(d.EnumOptions), &item.EnumOptions)
		}
		items = append(items, item)
	}

	r.Response.WriteJsonExit(g.Map{"code": 0, "message": "success", "data": items})
	return
}

func (c *AdminControllerV1) SetSystemSetting(ctx context.Context, req *v1.SetSystemSettingReq) (res *v1.SetSystemSettingRes, err error) {
	r := g.RequestFromCtx(ctx)
	adminID := r.GetCtxVar("user_id").String()

	if err = c.settingsSvc.SetSystemSetting(ctx, req.Key, req.Value, adminID); err != nil {
		return nil, err
	}

	r.Response.WriteJsonExit(g.Map{"code": 0, "message": "success", "data": nil})
	return
}

func (c *AdminControllerV1) GetUserControls(ctx context.Context, req *v1.GetUserControlsReq) (res *v1.GetUserControlsRes, err error) {
	r := g.RequestFromCtx(ctx)

	defs, err := c.settingsSvc.GetDefinitions(ctx, "user", false)
	if err != nil {
		return nil, err
	}

	controls, err := c.settingsSvc.GetSettingControls(ctx)
	if err != nil {
		return nil, err
	}

	type controlItem struct {
		Key        string `json:"key"`
		Label      string `json:"label"`
		IsVisible  bool   `json:"is_visible"`
		IsEditable bool   `json:"is_editable"`
	}

	items := make([]controlItem, 0, len(defs))
	for _, d := range defs {
		item := controlItem{
			Key:        d.Key,
			Label:      d.Label,
			IsVisible:  true,
			IsEditable: true,
		}
		if ctrl, ok := controls[d.Key]; ok {
			item.IsVisible = ctrl.IsVisible == 1
			item.IsEditable = ctrl.IsEditable == 1
		}
		items = append(items, item)
	}

	r.Response.WriteJsonExit(g.Map{"code": 0, "message": "success", "data": items})
	return
}

func (c *AdminControllerV1) SetUserControl(ctx context.Context, req *v1.SetUserControlReq) (res *v1.SetUserControlRes, err error) {
	r := g.RequestFromCtx(ctx)
	adminID := r.GetCtxVar("user_id").String()

	isVisible := true
	isEditable := true
	if req.IsVisible != nil {
		isVisible = *req.IsVisible
	}
	if req.IsEditable != nil {
		isEditable = *req.IsEditable
	}

	if err = c.settingsSvc.SetSettingControl(ctx, req.Key, isVisible, isEditable, adminID); err != nil {
		return nil, err
	}

	r.Response.WriteJsonExit(g.Map{"code": 0, "message": "success", "data": nil})
	return
}

// ---- Helpers ----

type definitionGroup struct {
	Key   string           `json:"key"`
	Items []definitionItem `json:"items"`
}

type definitionItem struct {
	Key          string   `json:"key"`
	Type         string   `json:"type"`
	Label        string   `json:"label"`
	Description  string   `json:"description,omitempty"`
	DefaultValue string   `json:"default_value"`
	CurrentValue string   `json:"current_value"`
	EnumOptions  []string `json:"enum_options,omitempty"`
	IsEditable   bool     `json:"is_editable"`
}

func buildDefinitionGroups(
	defs []*entity.SettingDefinition,
	userSettings map[string]string,
	controls map[string]*entity.SettingControl,
) []definitionGroup {
	groupOrder := []string{}
	groupMap := map[string]*definitionGroup{}

	for _, d := range defs {
		// Check visibility control
		if ctrl, ok := controls[d.Key]; ok && ctrl.IsVisible == 0 {
			continue
		}

		isEditable := true
		if ctrl, ok := controls[d.Key]; ok {
			isEditable = ctrl.IsEditable == 1
		}

		item := definitionItem{
			Key:          d.Key,
			Type:         d.Type,
			Label:        d.Label,
			Description:  d.Description,
			DefaultValue: d.DefaultValue,
			CurrentValue: userSettings[d.Key],
			IsEditable:   isEditable,
		}
		if d.EnumOptions != "" {
			_ = json.Unmarshal([]byte(d.EnumOptions), &item.EnumOptions)
		}

		if _, exists := groupMap[d.GroupKey]; !exists {
			groupOrder = append(groupOrder, d.GroupKey)
			groupMap[d.GroupKey] = &definitionGroup{Key: d.GroupKey, Items: []definitionItem{}}
		}
		groupMap[d.GroupKey].Items = append(groupMap[d.GroupKey].Items, item)
	}

	groups := make([]definitionGroup, 0, len(groupOrder))
	for _, key := range groupOrder {
		groups = append(groups, *groupMap[key])
	}
	return groups
}

package settings

import (
	"context"
	"encoding/json"
	"fmt"
	"regexp"
	"strconv"
	"time"

	"github.com/gogf/gf/v2/errors/gerror"
	"github.com/google/uuid"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"

	"taptype/internal/model/code"
	"taptype/internal/model/entity"
)

type serviceImpl struct {
	db *gorm.DB
}

func NewService(db *gorm.DB) Service {
	return &serviceImpl{db: db}
}

// ---- System settings ----

func (s *serviceImpl) GetSystemSetting(ctx context.Context, key string) (string, error) {
	var ss entity.SystemSetting
	err := s.db.WithContext(ctx).Where("definition_key = ?", key).First(&ss).Error
	if err == gorm.ErrRecordNotFound {
		return s.getDefaultValue(ctx, key)
	}
	if err != nil {
		return "", gerror.NewCode(code.CodeInternalError, err.Error())
	}
	return ss.Value, nil
}

func (s *serviceImpl) GetSystemSettingBool(ctx context.Context, key string) (bool, error) {
	v, err := s.GetSystemSetting(ctx, key)
	if err != nil {
		return false, err
	}
	return v == "true", nil
}

func (s *serviceImpl) GetSystemSettingInt(ctx context.Context, key string) (int, error) {
	v, err := s.GetSystemSetting(ctx, key)
	if err != nil {
		return 0, err
	}
	n, err2 := strconv.Atoi(v)
	if err2 != nil {
		return 0, gerror.NewCode(code.CodeInternalError, fmt.Sprintf("setting %s is not an integer", key))
	}
	return n, nil
}

func (s *serviceImpl) SetSystemSetting(ctx context.Context, key, value, adminID string) error {
	def, err := s.getDefinition(ctx, key)
	if err != nil {
		return err
	}
	if def.Scope != "system" {
		return gerror.NewCode(code.CodeNotFound, "system setting not found")
	}
	if err = s.validate(def, value); err != nil {
		return err
	}

	now := time.Now()
	result := s.db.WithContext(ctx).
		Where(entity.SystemSetting{DefinitionKey: key}).
		Assign(entity.SystemSetting{Value: value, UpdatedBy: adminID, UpdatedAt: now}).
		FirstOrCreate(&entity.SystemSetting{ID: uuid.New().String(), DefinitionKey: key})
	if result.Error != nil {
		return gerror.NewCode(code.CodeInternalError, result.Error.Error())
	}
	// If record already existed, update it
	return s.db.WithContext(ctx).Model(&entity.SystemSetting{}).
		Where("definition_key = ?", key).
		Updates(map[string]interface{}{"value": value, "updated_by": adminID, "updated_at": now}).Error
}

func (s *serviceImpl) GetAllSystemSettings(ctx context.Context) (map[string]string, error) {
	var defs []entity.SettingDefinition
	if err := s.db.WithContext(ctx).Where("scope = ?", "system").Order("sort_order").Find(&defs).Error; err != nil {
		return nil, gerror.NewCode(code.CodeInternalError, err.Error())
	}

	result := make(map[string]string, len(defs))
	for _, d := range defs {
		result[d.Key] = d.DefaultValue
	}

	var settings []entity.SystemSetting
	s.db.WithContext(ctx).Find(&settings)
	for _, ss := range settings {
		result[ss.DefinitionKey] = ss.Value
	}
	return result, nil
}

// ---- User settings ----

func (s *serviceImpl) GetUserSetting(ctx context.Context, userID, key string) (string, error) {
	var us entity.UserSetting
	err := s.db.WithContext(ctx).Where("user_id = ? AND definition_key = ?", userID, key).First(&us).Error
	if err == gorm.ErrRecordNotFound {
		return s.getDefaultValue(ctx, key)
	}
	if err != nil {
		return "", gerror.NewCode(code.CodeInternalError, err.Error())
	}
	return us.Value, nil
}

func (s *serviceImpl) GetUserSettingBool(ctx context.Context, userID, key string) (bool, error) {
	v, err := s.GetUserSetting(ctx, userID, key)
	if err != nil {
		return false, err
	}
	return v == "true", nil
}

func (s *serviceImpl) GetAllUserSettings(ctx context.Context, userID string) (map[string]string, error) {
	var defs []entity.SettingDefinition
	if err := s.db.WithContext(ctx).Where("scope = ?", "user").Order("sort_order").Find(&defs).Error; err != nil {
		return nil, gerror.NewCode(code.CodeInternalError, err.Error())
	}

	result := make(map[string]string, len(defs))
	for _, d := range defs {
		result[d.Key] = d.DefaultValue
	}

	var settings []entity.UserSetting
	s.db.WithContext(ctx).Where("user_id = ?", userID).Find(&settings)
	for _, us := range settings {
		result[us.DefinitionKey] = us.Value
	}
	return result, nil
}

func (s *serviceImpl) SetUserSetting(ctx context.Context, userID, key, value string) error {
	def, err := s.getDefinition(ctx, key)
	if err != nil {
		return err
	}
	if def.Scope != "user" {
		return gerror.NewCode(code.CodeNotFound, "user setting not found")
	}
	// Check editability control
	var ctrl entity.SettingControl
	if err2 := s.db.WithContext(ctx).Where("definition_key = ?", key).First(&ctrl).Error; err2 == nil {
		if ctrl.IsEditable == 0 {
			return gerror.NewCode(code.CodeForbidden, "this setting is not editable")
		}
	}
	if err = s.validate(def, value); err != nil {
		return err
	}

	now := time.Now()
	us := entity.UserSetting{
		ID:            uuid.New().String(),
		UserID:        userID,
		DefinitionKey: key,
		Value:         value,
		UpdatedAt:     now,
	}
	return s.db.WithContext(ctx).
		Clauses(clause.OnConflict{
			Columns:   []clause.Column{{Name: "user_id"}, {Name: "definition_key"}},
			DoUpdates: clause.AssignmentColumns([]string{"value", "updated_at"}),
		}).
		Create(&us).Error
}

func (s *serviceImpl) BatchSetUserSettings(ctx context.Context, userID string, kvs map[string]string) error {
	for key, value := range kvs {
		if err := s.SetUserSetting(ctx, userID, key, value); err != nil {
			return err
		}
	}
	return nil
}

// ---- Definitions ----

func (s *serviceImpl) GetDefinitions(ctx context.Context, scope string, isPublic bool) ([]*entity.SettingDefinition, error) {
	q := s.db.WithContext(ctx).Order("sort_order")
	if scope != "" {
		q = q.Where("scope = ?", scope)
	}
	if isPublic {
		q = q.Where("is_public = 1")
	}
	var defs []*entity.SettingDefinition
	if err := q.Find(&defs).Error; err != nil {
		return nil, gerror.NewCode(code.CodeInternalError, err.Error())
	}
	return defs, nil
}

// ---- Setting controls ----

func (s *serviceImpl) SetSettingControl(ctx context.Context, key string, isVisible, isEditable bool, adminID string) error {
	def, err := s.getDefinition(ctx, key)
	if err != nil {
		return err
	}
	if def.Scope != "user" {
		return gerror.NewCode(code.CodeBadRequest, "setting controls only apply to user-scope settings")
	}

	isVisibleVal := 0
	if isVisible {
		isVisibleVal = 1
	}
	isEditableVal := 0
	if isEditable {
		isEditableVal = 1
	}
	now := time.Now()

	ctrl := entity.SettingControl{
		ID:            uuid.New().String(),
		DefinitionKey: key,
		IsVisible:     isVisibleVal,
		IsEditable:    isEditableVal,
		UpdatedBy:     adminID,
		UpdatedAt:     now,
	}
	return s.db.WithContext(ctx).
		Clauses(clause.OnConflict{
			Columns:   []clause.Column{{Name: "definition_key"}},
			DoUpdates: clause.AssignmentColumns([]string{"is_visible", "is_editable", "updated_by", "updated_at"}),
		}).
		Create(&ctrl).Error
}

func (s *serviceImpl) GetSettingControls(ctx context.Context) (map[string]*entity.SettingControl, error) {
	var controls []*entity.SettingControl
	if err := s.db.WithContext(ctx).Find(&controls).Error; err != nil {
		return nil, gerror.NewCode(code.CodeInternalError, err.Error())
	}
	result := make(map[string]*entity.SettingControl, len(controls))
	for _, c := range controls {
		result[c.DefinitionKey] = c
	}
	return result, nil
}

// ---- Helpers ----

func (s *serviceImpl) getDefinition(ctx context.Context, key string) (*entity.SettingDefinition, error) {
	var def entity.SettingDefinition
	if err := s.db.WithContext(ctx).Where("key = ?", key).First(&def).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, gerror.NewCode(code.CodeNotFound, fmt.Sprintf("setting '%s' not found", key))
		}
		return nil, gerror.NewCode(code.CodeInternalError, err.Error())
	}
	return &def, nil
}

func (s *serviceImpl) getDefaultValue(ctx context.Context, key string) (string, error) {
	def, err := s.getDefinition(ctx, key)
	if err != nil {
		return "", err
	}
	return def.DefaultValue, nil
}

func (s *serviceImpl) validate(def *entity.SettingDefinition, value string) error {
	switch def.Type {
	case "bool":
		if value != "true" && value != "false" {
			return gerror.NewCode(code.CodeBadRequest, "value must be 'true' or 'false'")
		}
	case "int":
		n, err := strconv.Atoi(value)
		if err != nil {
			return gerror.NewCode(code.CodeBadRequest, "value must be an integer")
		}
		if def.ValidationRule != "" {
			var rule struct {
				Min *int `json:"min"`
				Max *int `json:"max"`
			}
			_ = json.Unmarshal([]byte(def.ValidationRule), &rule)
			if rule.Min != nil && n < *rule.Min {
				return gerror.NewCode(code.CodeBadRequest, fmt.Sprintf("value must be >= %d", *rule.Min))
			}
			if rule.Max != nil && n > *rule.Max {
				return gerror.NewCode(code.CodeBadRequest, fmt.Sprintf("value must be <= %d", *rule.Max))
			}
		}
	case "float":
		if _, err := strconv.ParseFloat(value, 64); err != nil {
			return gerror.NewCode(code.CodeBadRequest, "value must be a number")
		}
	case "enum":
		var opts []string
		_ = json.Unmarshal([]byte(def.EnumOptions), &opts)
		for _, o := range opts {
			if o == value {
				return nil
			}
		}
		return gerror.NewCode(code.CodeBadRequest, fmt.Sprintf("value must be one of %v", opts))
	case "string":
		if def.ValidationRule != "" {
			var rule struct {
				Regex     string `json:"regex"`
				MaxLength *int   `json:"max_length"`
			}
			_ = json.Unmarshal([]byte(def.ValidationRule), &rule)
			if rule.Regex != "" {
				matched, _ := regexp.MatchString(rule.Regex, value)
				if !matched {
					return gerror.NewCode(code.CodeBadRequest, "value format invalid")
				}
			}
			if rule.MaxLength != nil && len(value) > *rule.MaxLength {
				return gerror.NewCode(code.CodeBadRequest, fmt.Sprintf("value must be <= %d characters", *rule.MaxLength))
			}
		}
	}
	return nil
}

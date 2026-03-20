package auth

import (
	"context"
	"fmt"
	"strconv"
	"strings"
	"time"

	"github.com/gogf/gf/v2/errors/gerror"
	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"

	"taptype/internal/model/code"
	"taptype/internal/model/entity"
	"taptype/utility/crypto"
)

type serviceImpl struct {
	db              *gorm.DB
	jwtSecret       []byte
	accessExpiry    time.Duration
	refreshExpiry   time.Duration
}

func NewService(db *gorm.DB, jwtSecret string) Service {
	return &serviceImpl{
		db:            db,
		jwtSecret:     []byte(jwtSecret),
		accessExpiry:  15 * time.Minute,
		refreshExpiry: 7 * 24 * time.Hour,
	}
}

func (s *serviceImpl) Register(ctx context.Context, username, email, password string) (*entity.User, error) {
	return s.registerWithRole(ctx, username, email, password, "user")
}

func (s *serviceImpl) RegisterInitialAdmin(ctx context.Context, username, email, password string) (*entity.User, error) {
	var user *entity.User
	err := s.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		needSetup, err := s.needInitialAdminSetupTx(ctx, tx)
		if err != nil {
			return err
		}
		if !needSetup {
			return gerror.NewCode(code.CodeForbidden, "initial admin already exists")
		}

		hash, err := crypto.HashPassword(password)
		if err != nil {
			return gerror.NewCode(code.CodeInternalError)
		}

		u := &entity.User{
			ID:           uuid.New().String(),
			Username:     username,
			Email:        email,
			PasswordHash: hash,
			Role:         "admin",
			IsActive:     1,
		}
		if err = tx.Create(u).Error; err != nil {
			return gerror.NewCode(code.CodeInternalError)
		}

		now := time.Now()
		owner := entity.SystemSetting{
			ID:            uuid.New().String(),
			DefinitionKey: "system.owner_user_id",
			Value:         u.ID,
			UpdatedBy:     u.ID,
			UpdatedAt:     now,
		}
		if err = tx.Clauses(clause.OnConflict{
			Columns:   []clause.Column{{Name: "definition_key"}},
			DoUpdates: clause.AssignmentColumns([]string{"value", "updated_by", "updated_at"}),
		}).Create(&owner).Error; err != nil {
			return gerror.NewCode(code.CodeInternalError)
		}
		user = u
		return nil
	})
	if err != nil {
		return nil, err
	}
	return user, nil
}

func (s *serviceImpl) NeedInitialAdminSetup(ctx context.Context) (bool, error) {
	return s.needInitialAdminSetupTx(ctx, s.db.WithContext(ctx))
}

func (s *serviceImpl) needInitialAdminSetupTx(ctx context.Context, tx *gorm.DB) (bool, error) {
	var owner entity.SystemSetting
	err := tx.Where("definition_key = ?", "system.owner_user_id").First(&owner).Error
	if err == nil {
		if strings.TrimSpace(owner.Value) != "" {
			return false, nil
		}
		var userCount int64
		if err = tx.Model(&entity.User{}).Count(&userCount).Error; err != nil {
			return false, gerror.NewCode(code.CodeInternalError)
		}
		return userCount == 0, nil
	}
	if err != nil && err != gorm.ErrRecordNotFound {
		return false, gerror.NewCode(code.CodeInternalError)
	}

	// Backward compatibility: for old databases without owner setting value yet.
	var userCount int64
	if err = tx.Model(&entity.User{}).Count(&userCount).Error; err != nil {
		return false, gerror.NewCode(code.CodeInternalError)
	}
	return userCount == 0, nil
}

func (s *serviceImpl) registerWithRole(ctx context.Context, username, email, password, role string) (*entity.User, error) {
	// Check username uniqueness
	var count int64
	s.db.WithContext(ctx).Model(&entity.User{}).Where("username = ?", username).Count(&count)
	if count > 0 {
		return nil, gerror.NewCode(code.CodeUsernameTaken)
	}

	// Check email uniqueness
	s.db.WithContext(ctx).Model(&entity.User{}).Where("email = ?", email).Count(&count)
	if count > 0 {
		return nil, gerror.NewCode(code.CodeEmailTaken)
	}

	// Validate password strength: min 8 chars
	if len(password) < 8 {
		return nil, gerror.NewCode(code.CodeWeakPassword)
	}

	hash, err := crypto.HashPassword(password)
	if err != nil {
		return nil, gerror.NewCode(code.CodeInternalError)
	}

	user := &entity.User{
		ID:           uuid.New().String(),
		Username:     username,
		Email:        email,
		PasswordHash: hash,
		Role:         role,
		IsActive:     1,
	}

	if err := s.db.WithContext(ctx).Create(user).Error; err != nil {
		return nil, gerror.NewCode(code.CodeInternalError)
	}

	return user, nil
}

func (s *serviceImpl) Login(ctx context.Context, username, password string) (string, string, *entity.User, error) {
	var user entity.User
	if err := s.db.Where("username = ? OR email = ?", username, username).First(&user).Error; err != nil {
		return "", "", nil, gerror.NewCode(code.CodeUnauthorized, "invalid credentials")
	}

	if !crypto.CheckPassword(password, user.PasswordHash) {
		return "", "", nil, gerror.NewCode(code.CodeUnauthorized, "invalid credentials")
	}

	if user.IsActive != 1 {
		return "", "", nil, gerror.NewCode(code.CodeForbidden, "account disabled")
	}

	accessToken, err := s.generateToken(user.ID, user.Role, s.accessExpiry, "access")
	if err != nil {
		return "", "", nil, gerror.NewCode(code.CodeInternalError)
	}

	refreshToken, err := s.generateToken(user.ID, user.Role, s.refreshExpiry, "refresh")
	if err != nil {
		return "", "", nil, gerror.NewCode(code.CodeInternalError)
	}

	return accessToken, refreshToken, &user, nil
}

func (s *serviceImpl) RefreshAccessToken(ctx context.Context, refreshToken string) (string, error) {
	claims, err := s.parseToken(refreshToken)
	if err != nil {
		return "", gerror.NewCode(code.CodeRefreshExpired)
	}

	if claims.TokenType != "refresh" {
		return "", gerror.NewCode(code.CodeRefreshExpired)
	}

	// Verify user still exists and is active
	var user entity.User
	if err := s.db.Where("id = ? AND is_active = 1", claims.UserID).First(&user).Error; err != nil {
		return "", gerror.NewCode(code.CodeRefreshExpired)
	}

	accessToken, err := s.generateToken(user.ID, user.Role, s.accessExpiry, "access")
	if err != nil {
		return "", gerror.NewCode(code.CodeInternalError)
	}

	return accessToken, nil
}

func (s *serviceImpl) GetCurrentUser(ctx context.Context, userID string) (*entity.User, error) {
	var user entity.User
	if err := s.db.Where("id = ?", userID).First(&user).Error; err != nil {
		return nil, gerror.NewCode(code.CodeNotFound)
	}
	return &user, nil
}

func (s *serviceImpl) UpdateCurrentUser(ctx context.Context, userID, username, email string) (*entity.User, error) {
	var user entity.User
	if err := s.db.WithContext(ctx).Where("id = ?", userID).First(&user).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, gerror.NewCode(code.CodeNotFound, "user not found")
		}
		return nil, gerror.NewCode(code.CodeInternalError)
	}

	if user.Role != "admin" && username != user.Username {
		allowUsernameChange, err := s.getSystemBoolSetting(ctx, "system.allow_username_change", true)
		if err != nil {
			return nil, err
		}
		if !allowUsernameChange {
			return nil, gerror.NewCode(code.CodeForbidden, "username change is disabled by administrator")
		}
	}

	var count int64
	if err := s.db.WithContext(ctx).Model(&entity.User{}).
		Where("username = ? AND id <> ?", username, userID).
		Count(&count).Error; err != nil {
		return nil, gerror.NewCode(code.CodeInternalError)
	}
	if count > 0 {
		return nil, gerror.NewCode(code.CodeUsernameTaken)
	}

	if err := s.db.WithContext(ctx).Model(&entity.User{}).
		Where("email = ? AND id <> ?", email, userID).
		Count(&count).Error; err != nil {
		return nil, gerror.NewCode(code.CodeInternalError)
	}
	if count > 0 {
		return nil, gerror.NewCode(code.CodeEmailTaken)
	}

	if err := s.db.WithContext(ctx).Model(&user).Updates(map[string]interface{}{
		"username": username,
		"email":    email,
	}).Error; err != nil {
		return nil, gerror.NewCode(code.CodeInternalError)
	}

	if err := s.db.WithContext(ctx).Where("id = ?", userID).First(&user).Error; err != nil {
		return nil, gerror.NewCode(code.CodeInternalError)
	}
	return &user, nil
}

func (s *serviceImpl) getSystemBoolSetting(ctx context.Context, key string, defaultValue bool) (bool, error) {
	var def entity.SettingDefinition
	err := s.db.WithContext(ctx).
		Where("key = ? AND scope = ?", key, "system").
		First(&def).Error
	if err != nil && err != gorm.ErrRecordNotFound {
		return false, gerror.NewCode(code.CodeInternalError)
	}

	value := ""
	if err == nil {
		value = strings.TrimSpace(def.DefaultValue)
	}

	var ss entity.SystemSetting
	err = s.db.WithContext(ctx).
		Where("definition_key = ?", key).
		First(&ss).Error
	if err == nil {
		value = strings.TrimSpace(ss.Value)
	} else if err != gorm.ErrRecordNotFound {
		return false, gerror.NewCode(code.CodeInternalError)
	}

	if value == "" {
		if defaultValue {
			return true, nil
		}
		return false, nil
	}

	if b, parseErr := strconv.ParseBool(strings.ToLower(value)); parseErr == nil {
		return b, nil
	}
	if value == "1" {
		return true, nil
	}
	if value == "0" {
		return false, nil
	}

	if defaultValue {
		return true, nil
	}
	return false, nil
}

// JWT Claims

type Claims struct {
	jwt.RegisteredClaims
	UserID    string `json:"user_id"`
	Role      string `json:"role"`
	TokenType string `json:"token_type"`
}

func (s *serviceImpl) generateToken(userID, role string, expiry time.Duration, tokenType string) (string, error) {
	claims := Claims{
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(expiry)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			Issuer:    "taptype",
		},
		UserID:    userID,
		Role:      role,
		TokenType: tokenType,
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(s.jwtSecret)
}

func (s *serviceImpl) parseToken(tokenString string) (*Claims, error) {
	token, err := jwt.ParseWithClaims(tokenString, &Claims{}, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return s.jwtSecret, nil
	})
	if err != nil {
		return nil, err
	}
	claims, ok := token.Claims.(*Claims)
	if !ok || !token.Valid {
		return nil, fmt.Errorf("invalid token")
	}
	return claims, nil
}

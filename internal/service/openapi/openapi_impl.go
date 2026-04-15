package openapi

import (
	"context"
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"strings"
	"time"

	"github.com/gogf/gf/v2/errors/gerror"
	"github.com/google/uuid"
	"gorm.io/gorm"

	"taptype/internal/model/code"
	"taptype/internal/model/entity"
)

const (
	maxTokensPerUser = 10
	tokenPrefix      = "tp_"
	tokenRawLength   = 32 // 32 bytes = 64 hex chars
)

type serviceImpl struct {
	db *gorm.DB
}

func NewService(db *gorm.DB) Service {
	return &serviceImpl{db: db}
}

func (s *serviceImpl) ListTokens(ctx context.Context, userID string) ([]entity.ApiToken, error) {
	var tokens []entity.ApiToken
	if err := s.db.WithContext(ctx).
		Where("user_id = ?", userID).
		Order("created_at DESC").
		Find(&tokens).Error; err != nil {
		return nil, gerror.NewCode(code.CodeInternalError)
	}
	return tokens, nil
}

func (s *serviceImpl) CreateToken(ctx context.Context, userID, name, scopes string, expiresInSec *int) (*entity.ApiToken, string, error) {
	// Check token count limit
	var count int64
	if err := s.db.WithContext(ctx).Model(&entity.ApiToken{}).
		Where("user_id = ?", userID).
		Count(&count).Error; err != nil {
		return nil, "", gerror.NewCode(code.CodeInternalError)
	}
	if count >= maxTokensPerUser {
		return nil, "", gerror.NewCode(code.CodeTokenLimitExceeded,
			fmt.Sprintf("maximum %d API tokens allowed per user", maxTokensPerUser))
	}

	// Generate random token
	rawBytes := make([]byte, tokenRawLength)
	if _, err := rand.Read(rawBytes); err != nil {
		return nil, "", gerror.NewCode(code.CodeInternalError)
	}
	rawHex := hex.EncodeToString(rawBytes)
	rawToken := tokenPrefix + rawHex
	prefix := rawToken[:len(tokenPrefix)+8] // tp_ + first 8 hex chars

	// Hash for storage
	hash := sha256.Sum256([]byte(rawToken))
	tokenHash := hex.EncodeToString(hash[:])

	if strings.TrimSpace(scopes) == "" {
		scopes = "*"
	}

	token := &entity.ApiToken{
		ID:        uuid.New().String(),
		UserID:    userID,
		Name:      name,
		TokenHash: tokenHash,
		Prefix:    prefix,
		Scopes:    scopes,
		IsActive:  1,
	}

	if expiresInSec != nil && *expiresInSec > 0 {
		t := time.Now().Add(time.Duration(*expiresInSec) * time.Second)
		token.ExpiresAt = &t
	}

	if err := s.db.WithContext(ctx).Create(token).Error; err != nil {
		return nil, "", gerror.NewCode(code.CodeInternalError)
	}

	return token, rawToken, nil
}

func (s *serviceImpl) DeleteToken(ctx context.Context, userID, tokenID string) error {
	result := s.db.WithContext(ctx).
		Where("id = ? AND user_id = ?", tokenID, userID).
		Delete(&entity.ApiToken{})
	if result.Error != nil {
		return gerror.NewCode(code.CodeInternalError)
	}
	if result.RowsAffected == 0 {
		return gerror.NewCode(code.CodeNotFound, "token not found")
	}
	return nil
}

func (s *serviceImpl) UpdateToken(ctx context.Context, userID, tokenID, name, scopes string, isActive *int) (*entity.ApiToken, error) {
	var token entity.ApiToken
	if err := s.db.WithContext(ctx).
		Where("id = ? AND user_id = ?", tokenID, userID).
		First(&token).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, gerror.NewCode(code.CodeNotFound, "token not found")
		}
		return nil, gerror.NewCode(code.CodeInternalError)
	}

	updates := map[string]interface{}{}
	if name != "" {
		updates["name"] = name
	}
	if scopes != "" {
		updates["scopes"] = scopes
	}
	if isActive != nil {
		updates["is_active"] = *isActive
	}

	if len(updates) > 0 {
		if err := s.db.WithContext(ctx).Model(&token).Updates(updates).Error; err != nil {
			return nil, gerror.NewCode(code.CodeInternalError)
		}
	}

	// Re-read
	if err := s.db.WithContext(ctx).Where("id = ?", tokenID).First(&token).Error; err != nil {
		return nil, gerror.NewCode(code.CodeInternalError)
	}
	return &token, nil
}

func (s *serviceImpl) ValidateToken(ctx context.Context, rawToken string) (string, string, error) {
	if !strings.HasPrefix(rawToken, tokenPrefix) {
		return "", "", gerror.NewCode(code.CodeApiTokenInvalid)
	}

	hash := sha256.Sum256([]byte(rawToken))
	tokenHash := hex.EncodeToString(hash[:])

	var token entity.ApiToken
	if err := s.db.WithContext(ctx).
		Where("token_hash = ? AND is_active = 1", tokenHash).
		First(&token).Error; err != nil {
		return "", "", gerror.NewCode(code.CodeApiTokenInvalid)
	}

	// Check expiration
	if token.ExpiresAt != nil && token.ExpiresAt.Before(time.Now()) {
		return "", "", gerror.NewCode(code.CodeApiTokenInvalid, "token expired")
	}

	// Update last_used_at (fire-and-forget)
	now := time.Now()
	_ = s.db.WithContext(ctx).Model(&token).Update("last_used_at", now).Error

	// Get user role
	var user entity.User
	if err := s.db.WithContext(ctx).
		Where("id = ? AND is_active = 1", token.UserID).
		First(&user).Error; err != nil {
		return "", "", gerror.NewCode(code.CodeApiTokenInvalid, "user not found or disabled")
	}

	return token.UserID, user.Role, nil
}

package auth

import (
	"context"
	"fmt"
	"time"

	"github.com/gogf/gf/v2/errors/gerror"
	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"gorm.io/gorm"

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
	// Check username uniqueness
	var count int64
	s.db.Model(&entity.User{}).Where("username = ?", username).Count(&count)
	if count > 0 {
		return nil, gerror.NewCode(code.CodeUsernameTaken)
	}

	// Check email uniqueness
	s.db.Model(&entity.User{}).Where("email = ?", email).Count(&count)
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
		Role:         "user",
		IsActive:     1,
	}

	if err := s.db.Create(user).Error; err != nil {
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

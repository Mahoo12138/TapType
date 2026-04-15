package openapi

import (
	"context"

	"taptype/internal/model/entity"
)

type Service interface {
	ListTokens(ctx context.Context, userID string) ([]entity.ApiToken, error)
	CreateToken(ctx context.Context, userID, name, scopes string, expiresInSec *int) (*entity.ApiToken, string, error)
	DeleteToken(ctx context.Context, userID, tokenID string) error
	UpdateToken(ctx context.Context, userID, tokenID, name, scopes string, isActive *int) (*entity.ApiToken, error)
	ValidateToken(ctx context.Context, rawToken string) (userID, role string, err error)
}

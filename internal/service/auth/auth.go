package auth

import (
	"context"

	"taptype/internal/model/entity"
)

type Service interface {
	Register(ctx context.Context, username, email, password string) (*entity.User, error)
	Login(ctx context.Context, username, password string) (accessToken, refreshToken string, user *entity.User, err error)
	RefreshAccessToken(ctx context.Context, refreshToken string) (string, error)
	GetCurrentUser(ctx context.Context, userID string) (*entity.User, error)
}

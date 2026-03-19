package auth

import (
	"taptype/api/auth"
	authService "taptype/internal/service/auth"
)

type ControllerV1Public struct {
	authSvc authService.Service
}

func NewV1Public(authSvc authService.Service) auth.IAuthPublicV1 {
	return &ControllerV1Public{authSvc: authSvc}
}

type ControllerV1 struct {
	authSvc authService.Service
}

func NewV1(authSvc authService.Service) auth.IAuthV1 {
	return &ControllerV1{authSvc: authSvc}
}

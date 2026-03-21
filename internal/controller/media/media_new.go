package media

import (
	apimedia "taptype/api/media"
	mediaService "taptype/internal/service/media"
)

type ControllerV1 struct {
	mediaSvc mediaService.Service
}

type PublicControllerV1 struct {
	mediaSvc mediaService.Service
}

type AdminControllerV1 struct {
	mediaSvc mediaService.Service
}

type FileController struct {
	mediaSvc  mediaService.Service
	jwtSecret []byte
}

func NewV1(svc mediaService.Service) apimedia.IMediaV1 {
	return &ControllerV1{mediaSvc: svc}
}

func NewPublicV1(svc mediaService.Service) apimedia.IMediaPublicV1 {
	return &PublicControllerV1{mediaSvc: svc}
}

func NewAdminV1(svc mediaService.Service) apimedia.IAdminMediaV1 {
	return &AdminControllerV1{mediaSvc: svc}
}

func NewFileHandler(svc mediaService.Service, jwtSecret string) *FileController {
	return &FileController{mediaSvc: svc, jwtSecret: []byte(jwtSecret)}
}

package openapi

import (
	"taptype/api/openapi"
	openapiService "taptype/internal/service/openapi"
)

type ControllerV1 struct {
	svc openapiService.Service
}

func NewV1(svc openapiService.Service) openapi.IOpenApiV1 {
	return &ControllerV1{svc: svc}
}

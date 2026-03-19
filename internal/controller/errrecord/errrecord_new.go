package errrecord

import (
	"taptype/api/errrecord"
	errorsService "taptype/internal/service/errors"
)

type ControllerV1 struct {
	errorsSvc errorsService.Service
}

func NewV1(errorsSvc errorsService.Service) errrecord.IErrRecordV1 {
	return &ControllerV1{errorsSvc: errorsSvc}
}

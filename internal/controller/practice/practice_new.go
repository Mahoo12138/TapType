package practice

import (
	"taptype/api/practice"
	practiceService "taptype/internal/service/practice"
)

type ControllerV1 struct {
	practiceSvc practiceService.Service
}

func NewV1(practiceSvc practiceService.Service) practice.IPracticeV1 {
	return &ControllerV1{practiceSvc: practiceSvc}
}

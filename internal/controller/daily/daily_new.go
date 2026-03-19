package daily

import (
	"taptype/api/daily"
	dailyService "taptype/internal/service/daily"
)

type ControllerV1 struct {
	dailySvc dailyService.Service
}

func NewV1(dailySvc dailyService.Service) daily.IDailyV1 {
	return &ControllerV1{dailySvc: dailySvc}
}

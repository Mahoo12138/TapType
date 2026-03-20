package articlebank

import (
	"taptype/api/articlebank"
	articleService "taptype/internal/service/article"
)

type ControllerV1 struct {
	articleSvc articleService.Service
}

func NewV1(articleSvc articleService.Service) articlebank.IArticleBankV1 {
	return &ControllerV1{articleSvc: articleSvc}
}

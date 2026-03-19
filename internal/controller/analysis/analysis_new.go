package analysis

import (
	"taptype/api/analysis"
	analysisService "taptype/internal/service/analysis"
)

type ControllerV1 struct {
	analysisSvc analysisService.Service
}

func NewV1(analysisSvc analysisService.Service) analysis.IAnalysisV1 {
	return &ControllerV1{analysisSvc: analysisSvc}
}

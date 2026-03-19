package sentencebank

import (
	"taptype/api/sentencebank"
	sentenceService "taptype/internal/service/sentence"
)

type ControllerV1 struct {
	sentenceSvc sentenceService.Service
}

func NewV1(sentenceSvc sentenceService.Service) sentencebank.ISentenceBankV1 {
	return &ControllerV1{sentenceSvc: sentenceSvc}
}

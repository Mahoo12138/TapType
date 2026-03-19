package wordbank

import (
	"taptype/api/wordbank"
	wordService "taptype/internal/service/word"
)

type ControllerV1 struct {
	wordSvc wordService.Service
}

func NewV1(wordSvc wordService.Service) wordbank.IWordBankV1 {
	return &ControllerV1{wordSvc: wordSvc}
}

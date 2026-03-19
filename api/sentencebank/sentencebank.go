package sentencebank

import (
	"context"

	v1 "taptype/api/sentencebank/v1"
)

type ISentenceBankV1 interface {
	ListSentenceBanks(ctx context.Context, req *v1.ListSentenceBanksReq) (res *v1.ListSentenceBanksRes, err error)
	CreateSentenceBank(ctx context.Context, req *v1.CreateSentenceBankReq) (res *v1.CreateSentenceBankRes, err error)
	GetSentenceBank(ctx context.Context, req *v1.GetSentenceBankReq) (res *v1.GetSentenceBankRes, err error)
	UpdateSentenceBank(ctx context.Context, req *v1.UpdateSentenceBankReq) (res *v1.UpdateSentenceBankRes, err error)
	DeleteSentenceBank(ctx context.Context, req *v1.DeleteSentenceBankReq) (res *v1.DeleteSentenceBankRes, err error)

	ListSentences(ctx context.Context, req *v1.ListSentencesReq) (res *v1.ListSentencesRes, err error)
	CreateSentence(ctx context.Context, req *v1.CreateSentenceReq) (res *v1.CreateSentenceRes, err error)
	UpdateSentence(ctx context.Context, req *v1.UpdateSentenceReq) (res *v1.UpdateSentenceRes, err error)
	DeleteSentence(ctx context.Context, req *v1.DeleteSentenceReq) (res *v1.DeleteSentenceRes, err error)

	ImportSentences(ctx context.Context, req *v1.ImportSentencesReq) (res *v1.ImportSentencesRes, err error)
	ExportSentences(ctx context.Context, req *v1.ExportSentencesReq) (res *v1.ExportSentencesRes, err error)
}

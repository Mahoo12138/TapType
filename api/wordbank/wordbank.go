package wordbank

import (
	"context"

	v1 "taptype/api/wordbank/v1"
)

type IWordBankV1 interface {
	ListWordBanks(ctx context.Context, req *v1.ListWordBanksReq) (res *v1.ListWordBanksRes, err error)
	CreateWordBank(ctx context.Context, req *v1.CreateWordBankReq) (res *v1.CreateWordBankRes, err error)
	GetWordBank(ctx context.Context, req *v1.GetWordBankReq) (res *v1.GetWordBankRes, err error)
	UpdateWordBank(ctx context.Context, req *v1.UpdateWordBankReq) (res *v1.UpdateWordBankRes, err error)
	DeleteWordBank(ctx context.Context, req *v1.DeleteWordBankReq) (res *v1.DeleteWordBankRes, err error)

	ListWords(ctx context.Context, req *v1.ListWordsReq) (res *v1.ListWordsRes, err error)
	CreateWord(ctx context.Context, req *v1.CreateWordReq) (res *v1.CreateWordRes, err error)
	UpdateWord(ctx context.Context, req *v1.UpdateWordReq) (res *v1.UpdateWordRes, err error)
	DeleteWord(ctx context.Context, req *v1.DeleteWordReq) (res *v1.DeleteWordRes, err error)

	ImportWords(ctx context.Context, req *v1.ImportWordsReq) (res *v1.ImportWordsRes, err error)
	ExportWords(ctx context.Context, req *v1.ExportWordsReq) (res *v1.ExportWordsRes, err error)
}

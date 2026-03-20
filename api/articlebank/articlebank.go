package articlebank

import (
	"context"

	v1 "taptype/api/articlebank/v1"
)

type IArticleBankV1 interface {
	// Bank CRUD
	ListArticleBanks(ctx context.Context, req *v1.ListArticleBanksReq) (res *v1.ListArticleBanksRes, err error)
	CreateArticleBank(ctx context.Context, req *v1.CreateArticleBankReq) (res *v1.CreateArticleBankRes, err error)
	GetArticleBank(ctx context.Context, req *v1.GetArticleBankReq) (res *v1.GetArticleBankRes, err error)
	UpdateArticleBank(ctx context.Context, req *v1.UpdateArticleBankReq) (res *v1.UpdateArticleBankRes, err error)
	DeleteArticleBank(ctx context.Context, req *v1.DeleteArticleBankReq) (res *v1.DeleteArticleBankRes, err error)

	// Article CRUD
	ListArticles(ctx context.Context, req *v1.ListArticlesReq) (res *v1.ListArticlesRes, err error)
	CreateArticle(ctx context.Context, req *v1.CreateArticleReq) (res *v1.CreateArticleRes, err error)
	GetArticle(ctx context.Context, req *v1.GetArticleReq) (res *v1.GetArticleRes, err error)
	UpdateArticle(ctx context.Context, req *v1.UpdateArticleReq) (res *v1.UpdateArticleRes, err error)
	DeleteArticle(ctx context.Context, req *v1.DeleteArticleReq) (res *v1.DeleteArticleRes, err error)
	ExportArticleBank(ctx context.Context, req *v1.ExportArticleBankReq) (res *v1.ExportArticleBankRes, err error)

	// Sentence translation management
	ListArticleSentences(ctx context.Context, req *v1.ListArticleSentencesReq) (res *v1.ListArticleSentencesRes, err error)
	UpdateArticleSentence(ctx context.Context, req *v1.UpdateArticleSentenceReq) (res *v1.UpdateArticleSentenceRes, err error)

	// Progress & Practice
	NextParagraph(ctx context.Context, req *v1.NextParagraphReq) (res *v1.NextParagraphRes, err error)
	CompleteParagraph(ctx context.Context, req *v1.CompleteParagraphReq) (res *v1.CompleteParagraphRes, err error)
	ListProgress(ctx context.Context, req *v1.ListProgressReq) (res *v1.ListProgressRes, err error)
	ResetProgress(ctx context.Context, req *v1.ResetProgressReq) (res *v1.ResetProgressRes, err error)
}

package articlebank

import (
	"context"
	"strconv"

	"github.com/gogf/gf/v2/frame/g"

	v1 "taptype/api/articlebank/v1"
	articleService "taptype/internal/service/article"
)

// ─── Bank CRUD ───────────────────────────────────────────

func (c *ControllerV1) ListArticleBanks(ctx context.Context, req *v1.ListArticleBanksReq) (res *v1.ListArticleBanksRes, err error) {
	r := g.RequestFromCtx(ctx)
	userID := r.GetCtxVar("user_id").String()

	banks, err := c.articleSvc.ListBanks(ctx, userID)
	if err != nil {
		return nil, err
	}

	r.Response.WriteJsonExit(g.Map{"code": 0, "message": "success", "data": banks})
	return
}

func (c *ControllerV1) CreateArticleBank(ctx context.Context, req *v1.CreateArticleBankReq) (res *v1.CreateArticleBankRes, err error) {
	r := g.RequestFromCtx(ctx)
	userID := r.GetCtxVar("user_id").String()

	bank, err := c.articleSvc.CreateBank(ctx, userID, articleService.CreateBankReq{
		Name:        req.Name,
		Description: req.Description,
		Language:    req.Language,
		IsPublic:    req.IsPublic,
	})
	if err != nil {
		return nil, err
	}

	r.Response.WriteJsonExit(g.Map{"code": 0, "message": "success", "data": bank})
	return
}

func (c *ControllerV1) GetArticleBank(ctx context.Context, req *v1.GetArticleBankReq) (res *v1.GetArticleBankRes, err error) {
	r := g.RequestFromCtx(ctx)
	userID := r.GetCtxVar("user_id").String()

	bank, err := c.articleSvc.GetBank(ctx, userID, req.Id)
	if err != nil {
		return nil, err
	}

	r.Response.WriteJsonExit(g.Map{"code": 0, "message": "success", "data": bank})
	return
}

func (c *ControllerV1) UpdateArticleBank(ctx context.Context, req *v1.UpdateArticleBankReq) (res *v1.UpdateArticleBankRes, err error) {
	r := g.RequestFromCtx(ctx)
	userID := r.GetCtxVar("user_id").String()

	bank, err := c.articleSvc.UpdateBank(ctx, userID, req.Id, articleService.UpdateBankReq{
		Name:        req.Name,
		Description: req.Description,
		Language:    req.Language,
		IsPublic:    req.IsPublic,
	})
	if err != nil {
		return nil, err
	}

	r.Response.WriteJsonExit(g.Map{"code": 0, "message": "success", "data": bank})
	return
}

func (c *ControllerV1) DeleteArticleBank(ctx context.Context, req *v1.DeleteArticleBankReq) (res *v1.DeleteArticleBankRes, err error) {
	r := g.RequestFromCtx(ctx)
	userID := r.GetCtxVar("user_id").String()

	if err = c.articleSvc.DeleteBank(ctx, userID, req.Id); err != nil {
		return nil, err
	}

	r.Response.WriteJsonExit(g.Map{"code": 0, "message": "success", "data": nil})
	return
}

// ─── Article CRUD ────────────────────────────────────────

func (c *ControllerV1) ListArticles(ctx context.Context, req *v1.ListArticlesReq) (res *v1.ListArticlesRes, err error) {
	r := g.RequestFromCtx(ctx)
	userID := r.GetCtxVar("user_id").String()

	result, err := c.articleSvc.ListArticles(ctx, userID, req.Id, req.Page, req.PageSize)
	if err != nil {
		return nil, err
	}

	return &v1.ListArticlesRes{
		List:     result.List,
		Total:    result.Total,
		Page:     result.Page,
		PageSize: result.PageSize,
	}, nil
}

func (c *ControllerV1) CreateArticle(ctx context.Context, req *v1.CreateArticleReq) (res *v1.CreateArticleRes, err error) {
	r := g.RequestFromCtx(ctx)
	userID := r.GetCtxVar("user_id").String()

	article, err := c.articleSvc.CreateArticle(ctx, userID, req.Id, articleService.CreateArticleReq{
		Title:                req.Title,
		Author:               req.Author,
		SourceURL:            req.SourceURL,
		Content:              req.Content,
		Difficulty:           req.Difficulty,
		Tags:                 req.Tags,
		SentencesTranslation: req.SentencesTranslation,
	})
	if err != nil {
		return nil, err
	}

	r.Response.WriteJsonExit(g.Map{"code": 0, "message": "success", "data": article})
	return
}

func (c *ControllerV1) GetArticle(ctx context.Context, req *v1.GetArticleReq) (res *v1.GetArticleRes, err error) {
	r := g.RequestFromCtx(ctx)
	userID := r.GetCtxVar("user_id").String()

	detail, err := c.articleSvc.GetArticle(ctx, userID, req.ArticleId)
	if err != nil {
		return nil, err
	}

	r.Response.WriteJsonExit(g.Map{"code": 0, "message": "success", "data": detail})
	return
}

func (c *ControllerV1) UpdateArticle(ctx context.Context, req *v1.UpdateArticleReq) (res *v1.UpdateArticleRes, err error) {
	r := g.RequestFromCtx(ctx)
	userID := r.GetCtxVar("user_id").String()

	article, err := c.articleSvc.UpdateArticle(ctx, userID, req.ArticleId, articleService.UpdateArticleReq{
		Title:      req.Title,
		Author:     req.Author,
		SourceURL:  req.SourceURL,
		Difficulty: req.Difficulty,
		Tags:       req.Tags,
	})
	if err != nil {
		return nil, err
	}

	r.Response.WriteJsonExit(g.Map{"code": 0, "message": "success", "data": article})
	return
}

func (c *ControllerV1) DeleteArticle(ctx context.Context, req *v1.DeleteArticleReq) (res *v1.DeleteArticleRes, err error) {
	r := g.RequestFromCtx(ctx)
	userID := r.GetCtxVar("user_id").String()

	if err = c.articleSvc.DeleteArticle(ctx, userID, req.ArticleId); err != nil {
		return nil, err
	}

	r.Response.WriteJsonExit(g.Map{"code": 0, "message": "success", "data": nil})
	return
}

func (c *ControllerV1) ListArticleSentences(ctx context.Context, req *v1.ListArticleSentencesReq) (res *v1.ListArticleSentencesRes, err error) {
	r := g.RequestFromCtx(ctx)
	userID := r.GetCtxVar("user_id").String()

	sentences, err := c.articleSvc.ListArticleSentences(ctx, userID, req.ArticleId)
	if err != nil {
		return nil, err
	}

	r.Response.WriteJsonExit(g.Map{"code": 0, "message": "success", "data": sentences})
	return
}

func (c *ControllerV1) UpdateArticleSentence(ctx context.Context, req *v1.UpdateArticleSentenceReq) (res *v1.UpdateArticleSentenceRes, err error) {
	r := g.RequestFromCtx(ctx)
	userID := r.GetCtxVar("user_id").String()

	sentence, err := c.articleSvc.UpdateArticleSentence(ctx, userID, req.SentenceId, articleService.UpdateArticleSentenceReq{
		Translation:       req.Translation,
		TranslationSource: req.TranslationSource,
	})
	if err != nil {
		return nil, err
	}

	r.Response.WriteJsonExit(g.Map{"code": 0, "message": "success", "data": sentence})
	return
}

func (c *ControllerV1) ExportArticleBank(ctx context.Context, req *v1.ExportArticleBankReq) (res *v1.ExportArticleBankRes, err error) {
	r := g.RequestFromCtx(ctx)
	userID := r.GetCtxVar("user_id").String()

	data, err := c.articleSvc.ExportBank(ctx, userID, req.Id)
	if err != nil {
		return nil, err
	}

	r.Response.Header().Set("Content-Type", "application/json")
	r.Response.Header().Set("Content-Disposition", "attachment; filename=article_bank_"+req.Id+".json")
	r.Response.Header().Set("Content-Length", strconv.Itoa(len(data)))
	r.Response.Write(data)
	return
}

// ─── Progress & Practice ─────────────────────────────────

func (c *ControllerV1) NextParagraph(ctx context.Context, req *v1.NextParagraphReq) (res *v1.NextParagraphRes, err error) {
	r := g.RequestFromCtx(ctx)
	userID := r.GetCtxVar("user_id").String()

	paragraph, err := c.articleSvc.NextParagraph(ctx, userID, req.ArticleId)
	if err != nil {
		return nil, err
	}

	r.Response.WriteJsonExit(g.Map{"code": 0, "message": "success", "data": paragraph})
	return
}

func (c *ControllerV1) CompleteParagraph(ctx context.Context, req *v1.CompleteParagraphReq) (res *v1.CompleteParagraphRes, err error) {
	r := g.RequestFromCtx(ctx)
	userID := r.GetCtxVar("user_id").String()

	progress, err := c.articleSvc.CompleteParagraph(ctx, userID, req.ArticleId, req.Index)
	if err != nil {
		return nil, err
	}

	r.Response.WriteJsonExit(g.Map{"code": 0, "message": "success", "data": progress})
	return
}

func (c *ControllerV1) ListProgress(ctx context.Context, req *v1.ListProgressReq) (res *v1.ListProgressRes, err error) {
	r := g.RequestFromCtx(ctx)
	userID := r.GetCtxVar("user_id").String()

	list, err := c.articleSvc.ListProgress(ctx, userID)
	if err != nil {
		return nil, err
	}

	r.Response.WriteJsonExit(g.Map{"code": 0, "message": "success", "data": list})
	return
}

func (c *ControllerV1) ResetProgress(ctx context.Context, req *v1.ResetProgressReq) (res *v1.ResetProgressRes, err error) {
	r := g.RequestFromCtx(ctx)
	userID := r.GetCtxVar("user_id").String()

	if err = c.articleSvc.ResetProgress(ctx, userID, req.ArticleId); err != nil {
		return nil, err
	}

	r.Response.WriteJsonExit(g.Map{"code": 0, "message": "success", "data": nil})
	return
}

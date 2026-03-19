package sentencebank

import (
	"bytes"
	"context"
	"strconv"

	"github.com/gogf/gf/v2/frame/g"

	v1 "taptype/api/sentencebank/v1"
	sentenceService "taptype/internal/service/sentence"
)

// ─── Bank CRUD ───────────────────────────────────────────

func (c *ControllerV1) ListSentenceBanks(ctx context.Context, req *v1.ListSentenceBanksReq) (res *v1.ListSentenceBanksRes, err error) {
	r := g.RequestFromCtx(ctx)
	userID := r.GetCtxVar("user_id").String()

	banks, err := c.sentenceSvc.ListBanks(ctx, userID)
	if err != nil {
		return nil, err
	}

	r.Response.WriteJsonExit(g.Map{"code": 0, "message": "success", "data": banks})
	return
}

func (c *ControllerV1) CreateSentenceBank(ctx context.Context, req *v1.CreateSentenceBankReq) (res *v1.CreateSentenceBankRes, err error) {
	r := g.RequestFromCtx(ctx)
	userID := r.GetCtxVar("user_id").String()

	bank, err := c.sentenceSvc.CreateBank(ctx, userID, sentenceService.CreateBankReq{
		Name:     req.Name,
		Category: req.Category,
		IsPublic: req.IsPublic,
	})
	if err != nil {
		return nil, err
	}

	r.Response.WriteJsonExit(g.Map{"code": 0, "message": "success", "data": bank})
	return
}

func (c *ControllerV1) GetSentenceBank(ctx context.Context, req *v1.GetSentenceBankReq) (res *v1.GetSentenceBankRes, err error) {
	r := g.RequestFromCtx(ctx)
	userID := r.GetCtxVar("user_id").String()

	bank, err := c.sentenceSvc.GetBank(ctx, userID, req.Id)
	if err != nil {
		return nil, err
	}

	r.Response.WriteJsonExit(g.Map{"code": 0, "message": "success", "data": bank})
	return
}

func (c *ControllerV1) UpdateSentenceBank(ctx context.Context, req *v1.UpdateSentenceBankReq) (res *v1.UpdateSentenceBankRes, err error) {
	r := g.RequestFromCtx(ctx)
	userID := r.GetCtxVar("user_id").String()

	bank, err := c.sentenceSvc.UpdateBank(ctx, userID, req.Id, sentenceService.UpdateBankReq{
		Name:     req.Name,
		Category: req.Category,
		IsPublic: req.IsPublic,
	})
	if err != nil {
		return nil, err
	}

	r.Response.WriteJsonExit(g.Map{"code": 0, "message": "success", "data": bank})
	return
}

func (c *ControllerV1) DeleteSentenceBank(ctx context.Context, req *v1.DeleteSentenceBankReq) (res *v1.DeleteSentenceBankRes, err error) {
	r := g.RequestFromCtx(ctx)
	userID := r.GetCtxVar("user_id").String()

	if err = c.sentenceSvc.DeleteBank(ctx, userID, req.Id); err != nil {
		return nil, err
	}

	r.Response.WriteJsonExit(g.Map{"code": 0, "message": "success", "data": nil})
	return
}

// ─── Sentence CRUD ───────────────────────────────────────

func (c *ControllerV1) ListSentences(ctx context.Context, req *v1.ListSentencesReq) (res *v1.ListSentencesRes, err error) {
	r := g.RequestFromCtx(ctx)
	userID := r.GetCtxVar("user_id").String()

	result, err := c.sentenceSvc.ListSentences(ctx, userID, req.Id, req.Page, req.PageSize, req.Search, req.Difficulty)
	if err != nil {
		return nil, err
	}

	return &v1.ListSentencesRes{
		List:     result.List,
		Total:    result.Total,
		Page:     result.Page,
		PageSize: result.PageSize,
	}, nil
}

func (c *ControllerV1) CreateSentence(ctx context.Context, req *v1.CreateSentenceReq) (res *v1.CreateSentenceRes, err error) {
	r := g.RequestFromCtx(ctx)
	userID := r.GetCtxVar("user_id").String()

	sent, err := c.sentenceSvc.CreateSentence(ctx, userID, req.Id, sentenceService.CreateSentenceReq{
		Content:    req.Content,
		Source:     req.Source,
		Difficulty: req.Difficulty,
		Tags:       req.Tags,
	})
	if err != nil {
		return nil, err
	}

	r.Response.WriteJsonExit(g.Map{"code": 0, "message": "success", "data": sent})
	return
}

func (c *ControllerV1) UpdateSentence(ctx context.Context, req *v1.UpdateSentenceReq) (res *v1.UpdateSentenceRes, err error) {
	r := g.RequestFromCtx(ctx)
	userID := r.GetCtxVar("user_id").String()

	sent, err := c.sentenceSvc.UpdateSentence(ctx, userID, req.SentenceId, sentenceService.UpdateSentenceReq{
		Content:    req.Content,
		Source:     req.Source,
		Difficulty: req.Difficulty,
		Tags:       req.Tags,
	})
	if err != nil {
		return nil, err
	}

	r.Response.WriteJsonExit(g.Map{"code": 0, "message": "success", "data": sent})
	return
}

func (c *ControllerV1) DeleteSentence(ctx context.Context, req *v1.DeleteSentenceReq) (res *v1.DeleteSentenceRes, err error) {
	r := g.RequestFromCtx(ctx)
	userID := r.GetCtxVar("user_id").String()

	if err = c.sentenceSvc.DeleteSentence(ctx, userID, req.SentenceId); err != nil {
		return nil, err
	}

	r.Response.WriteJsonExit(g.Map{"code": 0, "message": "success", "data": nil})
	return
}

// ─── Import / Export ─────────────────────────────────────

func (c *ControllerV1) ImportSentences(ctx context.Context, req *v1.ImportSentencesReq) (res *v1.ImportSentencesRes, err error) {
	r := g.RequestFromCtx(ctx)
	userID := r.GetCtxVar("user_id").String()

	file := r.GetUploadFile("file")
	if file == nil {
		r.Response.WriteJsonExit(g.Map{"code": 40001, "message": "file required", "data": nil})
		return
	}

	f, err := file.Open()
	if err != nil {
		r.Response.WriteJsonExit(g.Map{"code": 40001, "message": "cannot read file", "data": nil})
		return nil, nil
	}
	defer f.Close()

	count, err := c.sentenceSvc.ImportSentences(ctx, userID, req.Id, req.Format, f)
	if err != nil {
		return nil, err
	}

	return &v1.ImportSentencesRes{Imported: count}, nil
}

func (c *ControllerV1) ExportSentences(ctx context.Context, req *v1.ExportSentencesReq) (res *v1.ExportSentencesRes, err error) {
	r := g.RequestFromCtx(ctx)
	userID := r.GetCtxVar("user_id").String()

	data, err := c.sentenceSvc.ExportSentences(ctx, userID, req.Id, req.Format)
	if err != nil {
		return nil, err
	}

	contentType := "application/json"
	ext := "json"
	if req.Format == "csv" {
		contentType = "text/csv"
		ext = "csv"
	}
	r.Response.Header().Set("Content-Type", contentType)
	r.Response.Header().Set("Content-Disposition", "attachment; filename=sentences_"+req.Id+"."+ext)
	r.Response.Header().Set("Content-Length", strconv.Itoa(len(data)))
	r.Response.Write(bytes.NewReader(data))
	return
}

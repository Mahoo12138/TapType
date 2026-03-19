package wordbank

import (
	"bytes"
	"context"
	"strconv"

	"github.com/gogf/gf/v2/frame/g"

	v1 "taptype/api/wordbank/v1"
	wordService "taptype/internal/service/word"
)

// ─── Bank CRUD ───────────────────────────────────────────

func (c *ControllerV1) ListWordBanks(ctx context.Context, req *v1.ListWordBanksReq) (res *v1.ListWordBanksRes, err error) {
	r := g.RequestFromCtx(ctx)
	userID := r.GetCtxVar("user_id").String()

	banks, err := c.wordSvc.ListBanks(ctx, userID)
	if err != nil {
		return nil, err
	}

	r.Response.WriteJsonExit(g.Map{"code": 0, "message": "success", "data": banks})
	return
}

func (c *ControllerV1) CreateWordBank(ctx context.Context, req *v1.CreateWordBankReq) (res *v1.CreateWordBankRes, err error) {
	r := g.RequestFromCtx(ctx)
	userID := r.GetCtxVar("user_id").String()

	bank, err := c.wordSvc.CreateBank(ctx, userID, wordService.CreateBankReq{
		Name:        req.Name,
		Description: req.Description,
		IsPublic:    req.IsPublic,
	})
	if err != nil {
		return nil, err
	}

	// Write bank directly as response data
	r.Response.WriteJsonExit(g.Map{"code": 0, "message": "success", "data": bank})
	return
}

func (c *ControllerV1) GetWordBank(ctx context.Context, req *v1.GetWordBankReq) (res *v1.GetWordBankRes, err error) {
	r := g.RequestFromCtx(ctx)
	userID := r.GetCtxVar("user_id").String()

	bank, err := c.wordSvc.GetBank(ctx, userID, req.Id)
	if err != nil {
		return nil, err
	}

	r.Response.WriteJsonExit(g.Map{"code": 0, "message": "success", "data": bank})
	return
}

func (c *ControllerV1) UpdateWordBank(ctx context.Context, req *v1.UpdateWordBankReq) (res *v1.UpdateWordBankRes, err error) {
	r := g.RequestFromCtx(ctx)
	userID := r.GetCtxVar("user_id").String()

	bank, err := c.wordSvc.UpdateBank(ctx, userID, req.Id, wordService.UpdateBankReq{
		Name:        req.Name,
		Description: req.Description,
		IsPublic:    req.IsPublic,
	})
	if err != nil {
		return nil, err
	}

	r.Response.WriteJsonExit(g.Map{"code": 0, "message": "success", "data": bank})
	return
}

func (c *ControllerV1) DeleteWordBank(ctx context.Context, req *v1.DeleteWordBankReq) (res *v1.DeleteWordBankRes, err error) {
	r := g.RequestFromCtx(ctx)
	userID := r.GetCtxVar("user_id").String()

	if err = c.wordSvc.DeleteBank(ctx, userID, req.Id); err != nil {
		return nil, err
	}

	r.Response.WriteJsonExit(g.Map{"code": 0, "message": "success", "data": nil})
	return
}

// ─── Word CRUD ───────────────────────────────────────────

func (c *ControllerV1) ListWords(ctx context.Context, req *v1.ListWordsReq) (res *v1.ListWordsRes, err error) {
	r := g.RequestFromCtx(ctx)
	userID := r.GetCtxVar("user_id").String()

	result, err := c.wordSvc.ListWords(ctx, userID, req.Id, req.Page, req.PageSize, req.Search, req.Difficulty)
	if err != nil {
		return nil, err
	}

	return &v1.ListWordsRes{
		List:     result.List,
		Total:    result.Total,
		Page:     result.Page,
		PageSize: result.PageSize,
	}, nil
}

func (c *ControllerV1) CreateWord(ctx context.Context, req *v1.CreateWordReq) (res *v1.CreateWordRes, err error) {
	r := g.RequestFromCtx(ctx)
	userID := r.GetCtxVar("user_id").String()

	word, err := c.wordSvc.CreateWord(ctx, userID, req.Id, wordService.CreateWordReq{
		Content:         req.Content,
		Pronunciation:   req.Pronunciation,
		Definition:      req.Definition,
		ExampleSentence: req.ExampleSentence,
		Difficulty:      req.Difficulty,
		Tags:            req.Tags,
	})
	if err != nil {
		return nil, err
	}

	r.Response.WriteJsonExit(g.Map{"code": 0, "message": "success", "data": word})
	return
}

func (c *ControllerV1) UpdateWord(ctx context.Context, req *v1.UpdateWordReq) (res *v1.UpdateWordRes, err error) {
	r := g.RequestFromCtx(ctx)
	userID := r.GetCtxVar("user_id").String()

	word, err := c.wordSvc.UpdateWord(ctx, userID, req.WordId, wordService.UpdateWordReq{
		Content:         req.Content,
		Pronunciation:   req.Pronunciation,
		Definition:      req.Definition,
		ExampleSentence: req.ExampleSentence,
		Difficulty:      req.Difficulty,
		Tags:            req.Tags,
	})
	if err != nil {
		return nil, err
	}

	r.Response.WriteJsonExit(g.Map{"code": 0, "message": "success", "data": word})
	return
}

func (c *ControllerV1) DeleteWord(ctx context.Context, req *v1.DeleteWordReq) (res *v1.DeleteWordRes, err error) {
	r := g.RequestFromCtx(ctx)
	userID := r.GetCtxVar("user_id").String()

	if err = c.wordSvc.DeleteWord(ctx, userID, req.WordId); err != nil {
		return nil, err
	}

	r.Response.WriteJsonExit(g.Map{"code": 0, "message": "success", "data": nil})
	return
}

// ─── Import / Export ─────────────────────────────────────

func (c *ControllerV1) ImportWords(ctx context.Context, req *v1.ImportWordsReq) (res *v1.ImportWordsRes, err error) {
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

	count, err := c.wordSvc.ImportWords(ctx, userID, req.Id, req.Format, f)
	if err != nil {
		return nil, err
	}

	return &v1.ImportWordsRes{Imported: count}, nil
}

func (c *ControllerV1) ExportWords(ctx context.Context, req *v1.ExportWordsReq) (res *v1.ExportWordsRes, err error) {
	r := g.RequestFromCtx(ctx)
	userID := r.GetCtxVar("user_id").String()

	data, err := c.wordSvc.ExportWords(ctx, userID, req.Id, req.Format)
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
	r.Response.Header().Set("Content-Disposition", "attachment; filename=words_"+req.Id+"."+ext)
	r.Response.Header().Set("Content-Length", strconv.Itoa(len(data)))
	r.Response.Write(bytes.NewReader(data))
	return
}

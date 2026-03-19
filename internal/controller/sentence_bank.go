package controller

import (
	"bytes"
	"strconv"

	"github.com/gogf/gf/v2/net/ghttp"

	sentenceService "taptype/internal/service/sentence"
)

type SentenceBankController struct {
	sentenceSvc sentenceService.Service
}

func NewSentenceBankController(sentenceSvc sentenceService.Service) *SentenceBankController {
	return &SentenceBankController{sentenceSvc: sentenceSvc}
}

// ─── Bank CRUD ───────────────────────────────────────────

func (c *SentenceBankController) ListBanks(r *ghttp.Request) {
	userID := r.GetCtxVar("user_id").String()
	banks, err := c.sentenceSvc.ListBanks(r.Context(), userID)
	if err != nil {
		writeError(r, err)
		return
	}
	r.Response.WriteJsonExit(map[string]interface{}{"code": 0, "message": "success", "data": banks})
}

func (c *SentenceBankController) CreateBank(r *ghttp.Request) {
	userID := r.GetCtxVar("user_id").String()
	var req sentenceService.CreateBankReq
	if err := r.Parse(&req); err != nil {
		r.Response.WriteJsonExit(map[string]interface{}{"code": 40001, "message": err.Error(), "data": nil})
		return
	}
	bank, err := c.sentenceSvc.CreateBank(r.Context(), userID, req)
	if err != nil {
		writeError(r, err)
		return
	}
	r.Response.WriteJsonExit(map[string]interface{}{"code": 0, "message": "success", "data": bank})
}

func (c *SentenceBankController) GetBank(r *ghttp.Request) {
	userID := r.GetCtxVar("user_id").String()
	bankID := r.Get("id").String()
	bank, err := c.sentenceSvc.GetBank(r.Context(), userID, bankID)
	if err != nil {
		writeError(r, err)
		return
	}
	r.Response.WriteJsonExit(map[string]interface{}{"code": 0, "message": "success", "data": bank})
}

func (c *SentenceBankController) UpdateBank(r *ghttp.Request) {
	userID := r.GetCtxVar("user_id").String()
	bankID := r.Get("id").String()
	var req sentenceService.UpdateBankReq
	if err := r.Parse(&req); err != nil {
		r.Response.WriteJsonExit(map[string]interface{}{"code": 40001, "message": err.Error(), "data": nil})
		return
	}
	bank, err := c.sentenceSvc.UpdateBank(r.Context(), userID, bankID, req)
	if err != nil {
		writeError(r, err)
		return
	}
	r.Response.WriteJsonExit(map[string]interface{}{"code": 0, "message": "success", "data": bank})
}

func (c *SentenceBankController) DeleteBank(r *ghttp.Request) {
	userID := r.GetCtxVar("user_id").String()
	bankID := r.Get("id").String()
	if err := c.sentenceSvc.DeleteBank(r.Context(), userID, bankID); err != nil {
		writeError(r, err)
		return
	}
	r.Response.WriteJsonExit(map[string]interface{}{"code": 0, "message": "success", "data": nil})
}

// ─── Sentence CRUD ───────────────────────────────────────

func (c *SentenceBankController) ListSentences(r *ghttp.Request) {
	userID := r.GetCtxVar("user_id").String()
	bankID := r.Get("id").String()
	page := r.GetQuery("page", 1).Int()
	pageSize := r.GetQuery("page_size", 20).Int()
	search := r.GetQuery("search", "").String()
	difficulty := r.GetQuery("difficulty", 0).Int()
	result, err := c.sentenceSvc.ListSentences(r.Context(), userID, bankID, page, pageSize, search, difficulty)
	if err != nil {
		writeError(r, err)
		return
	}
	r.Response.WriteJsonExit(map[string]interface{}{"code": 0, "message": "success", "data": result})
}

func (c *SentenceBankController) CreateSentence(r *ghttp.Request) {
	userID := r.GetCtxVar("user_id").String()
	bankID := r.Get("id").String()
	var req sentenceService.CreateSentenceReq
	if err := r.Parse(&req); err != nil {
		r.Response.WriteJsonExit(map[string]interface{}{"code": 40001, "message": err.Error(), "data": nil})
		return
	}
	sent, err := c.sentenceSvc.CreateSentence(r.Context(), userID, bankID, req)
	if err != nil {
		writeError(r, err)
		return
	}
	r.Response.WriteJsonExit(map[string]interface{}{"code": 0, "message": "success", "data": sent})
}

func (c *SentenceBankController) UpdateSentence(r *ghttp.Request) {
	userID := r.GetCtxVar("user_id").String()
	sentenceID := r.Get("sentenceId").String()
	var req sentenceService.UpdateSentenceReq
	if err := r.Parse(&req); err != nil {
		r.Response.WriteJsonExit(map[string]interface{}{"code": 40001, "message": err.Error(), "data": nil})
		return
	}
	sent, err := c.sentenceSvc.UpdateSentence(r.Context(), userID, sentenceID, req)
	if err != nil {
		writeError(r, err)
		return
	}
	r.Response.WriteJsonExit(map[string]interface{}{"code": 0, "message": "success", "data": sent})
}

func (c *SentenceBankController) DeleteSentence(r *ghttp.Request) {
	userID := r.GetCtxVar("user_id").String()
	sentenceID := r.Get("sentenceId").String()
	if err := c.sentenceSvc.DeleteSentence(r.Context(), userID, sentenceID); err != nil {
		writeError(r, err)
		return
	}
	r.Response.WriteJsonExit(map[string]interface{}{"code": 0, "message": "success", "data": nil})
}

// ─── Import / Export ─────────────────────────────────────

func (c *SentenceBankController) ImportSentences(r *ghttp.Request) {
	userID := r.GetCtxVar("user_id").String()
	bankID := r.Get("id").String()

	file := r.GetUploadFile("file")
	if file == nil {
		r.Response.WriteJsonExit(map[string]interface{}{"code": 40001, "message": "file required", "data": nil})
		return
	}
	format := r.GetQuery("format", "json").String()

	f, err := file.Open()
	if err != nil {
		r.Response.WriteJsonExit(map[string]interface{}{"code": 40001, "message": "cannot read file", "data": nil})
		return
	}
	defer f.Close()

	count, err := c.sentenceSvc.ImportSentences(r.Context(), userID, bankID, format, f)
	if err != nil {
		writeError(r, err)
		return
	}
	r.Response.WriteJsonExit(map[string]interface{}{
		"code": 0, "message": "success",
		"data": map[string]interface{}{"imported": count},
	})
}

func (c *SentenceBankController) ExportSentences(r *ghttp.Request) {
	userID := r.GetCtxVar("user_id").String()
	bankID := r.Get("id").String()
	format := r.GetQuery("format", "json").String()

	data, err := c.sentenceSvc.ExportSentences(r.Context(), userID, bankID, format)
	if err != nil {
		writeError(r, err)
		return
	}
	contentType := "application/json"
	ext := "json"
	if format == "csv" {
		contentType = "text/csv"
		ext = "csv"
	}
	r.Response.Header().Set("Content-Type", contentType)
	r.Response.Header().Set("Content-Disposition", "attachment; filename=sentences_"+bankID+"."+ext)
	r.Response.Header().Set("Content-Length", strconv.Itoa(len(data)))
	r.Response.Write(bytes.NewReader(data))
}

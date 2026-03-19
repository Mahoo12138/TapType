package controller

import (
	"bytes"
	"strconv"

	"github.com/gogf/gf/v2/net/ghttp"

	wordService "taptype/internal/service/word"
)

type WordBankController struct {
	wordSvc wordService.Service
}

func NewWordBankController(wordSvc wordService.Service) *WordBankController {
	return &WordBankController{wordSvc: wordSvc}
}

// ─── Bank CRUD ───────────────────────────────────────────

func (c *WordBankController) ListBanks(r *ghttp.Request) {
	userID := r.GetCtxVar("user_id").String()
	banks, err := c.wordSvc.ListBanks(r.Context(), userID)
	if err != nil {
		writeError(r, err)
		return
	}
	r.Response.WriteJsonExit(map[string]interface{}{"code": 0, "message": "success", "data": banks})
}

func (c *WordBankController) CreateBank(r *ghttp.Request) {
	userID := r.GetCtxVar("user_id").String()
	var req wordService.CreateBankReq
	if err := r.Parse(&req); err != nil {
		r.Response.WriteJsonExit(map[string]interface{}{"code": 40001, "message": err.Error(), "data": nil})
		return
	}
	bank, err := c.wordSvc.CreateBank(r.Context(), userID, req)
	if err != nil {
		writeError(r, err)
		return
	}
	r.Response.WriteJsonExit(map[string]interface{}{"code": 0, "message": "success", "data": bank})
}

func (c *WordBankController) GetBank(r *ghttp.Request) {
	userID := r.GetCtxVar("user_id").String()
	bankID := r.Get("id").String()
	bank, err := c.wordSvc.GetBank(r.Context(), userID, bankID)
	if err != nil {
		writeError(r, err)
		return
	}
	r.Response.WriteJsonExit(map[string]interface{}{"code": 0, "message": "success", "data": bank})
}

func (c *WordBankController) UpdateBank(r *ghttp.Request) {
	userID := r.GetCtxVar("user_id").String()
	bankID := r.Get("id").String()
	var req wordService.UpdateBankReq
	if err := r.Parse(&req); err != nil {
		r.Response.WriteJsonExit(map[string]interface{}{"code": 40001, "message": err.Error(), "data": nil})
		return
	}
	bank, err := c.wordSvc.UpdateBank(r.Context(), userID, bankID, req)
	if err != nil {
		writeError(r, err)
		return
	}
	r.Response.WriteJsonExit(map[string]interface{}{"code": 0, "message": "success", "data": bank})
}

func (c *WordBankController) DeleteBank(r *ghttp.Request) {
	userID := r.GetCtxVar("user_id").String()
	bankID := r.Get("id").String()
	if err := c.wordSvc.DeleteBank(r.Context(), userID, bankID); err != nil {
		writeError(r, err)
		return
	}
	r.Response.WriteJsonExit(map[string]interface{}{"code": 0, "message": "success", "data": nil})
}

// ─── Word CRUD ───────────────────────────────────────────

func (c *WordBankController) ListWords(r *ghttp.Request) {
	userID := r.GetCtxVar("user_id").String()
	bankID := r.Get("id").String()
	page := r.GetQuery("page", 1).Int()
	pageSize := r.GetQuery("page_size", 20).Int()
	search := r.GetQuery("search", "").String()
	difficulty := r.GetQuery("difficulty", 0).Int()
	result, err := c.wordSvc.ListWords(r.Context(), userID, bankID, page, pageSize, search, difficulty)
	if err != nil {
		writeError(r, err)
		return
	}
	r.Response.WriteJsonExit(map[string]interface{}{"code": 0, "message": "success", "data": result})
}

func (c *WordBankController) CreateWord(r *ghttp.Request) {
	userID := r.GetCtxVar("user_id").String()
	bankID := r.Get("id").String()
	var req wordService.CreateWordReq
	if err := r.Parse(&req); err != nil {
		r.Response.WriteJsonExit(map[string]interface{}{"code": 40001, "message": err.Error(), "data": nil})
		return
	}
	word, err := c.wordSvc.CreateWord(r.Context(), userID, bankID, req)
	if err != nil {
		writeError(r, err)
		return
	}
	r.Response.WriteJsonExit(map[string]interface{}{"code": 0, "message": "success", "data": word})
}

func (c *WordBankController) UpdateWord(r *ghttp.Request) {
	userID := r.GetCtxVar("user_id").String()
	wordID := r.Get("wordId").String()
	var req wordService.UpdateWordReq
	if err := r.Parse(&req); err != nil {
		r.Response.WriteJsonExit(map[string]interface{}{"code": 40001, "message": err.Error(), "data": nil})
		return
	}
	word, err := c.wordSvc.UpdateWord(r.Context(), userID, wordID, req)
	if err != nil {
		writeError(r, err)
		return
	}
	r.Response.WriteJsonExit(map[string]interface{}{"code": 0, "message": "success", "data": word})
}

func (c *WordBankController) DeleteWord(r *ghttp.Request) {
	userID := r.GetCtxVar("user_id").String()
	wordID := r.Get("wordId").String()
	if err := c.wordSvc.DeleteWord(r.Context(), userID, wordID); err != nil {
		writeError(r, err)
		return
	}
	r.Response.WriteJsonExit(map[string]interface{}{"code": 0, "message": "success", "data": nil})
}

// ─── Import / Export ─────────────────────────────────────

func (c *WordBankController) ImportWords(r *ghttp.Request) {
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

	count, err := c.wordSvc.ImportWords(r.Context(), userID, bankID, format, f)
	if err != nil {
		writeError(r, err)
		return
	}
	r.Response.WriteJsonExit(map[string]interface{}{
		"code": 0, "message": "success",
		"data": map[string]interface{}{"imported": count},
	})
}

func (c *WordBankController) ExportWords(r *ghttp.Request) {
	userID := r.GetCtxVar("user_id").String()
	bankID := r.Get("id").String()
	format := r.GetQuery("format", "json").String()

	data, err := c.wordSvc.ExportWords(r.Context(), userID, bankID, format)
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
	r.Response.Header().Set("Content-Disposition", "attachment; filename=words_"+bankID+"."+ext)
	r.Response.Header().Set("Content-Length", strconv.Itoa(len(data)))
	r.Response.Write(bytes.NewReader(data))
}

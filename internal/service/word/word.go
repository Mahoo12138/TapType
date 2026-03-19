package word

import (
	"context"
	"encoding/csv"
	"encoding/json"
	"fmt"
	"io"
	"strings"
	"time"

	"github.com/gogf/gf/v2/errors/gerror"
	"github.com/google/uuid"
	"gorm.io/gorm"

	"taptype/internal/model/code"
	"taptype/internal/model/entity"
)

type Service interface {
	// Bank CRUD
	ListBanks(ctx context.Context, userID string) ([]entity.WordBank, error)
	CreateBank(ctx context.Context, userID string, req CreateBankReq) (*entity.WordBank, error)
	GetBank(ctx context.Context, userID, bankID string) (*entity.WordBank, error)
	UpdateBank(ctx context.Context, userID, bankID string, req UpdateBankReq) (*entity.WordBank, error)
	DeleteBank(ctx context.Context, userID, bankID string) error

	// Word CRUD
	ListWords(ctx context.Context, userID, bankID string, page, pageSize int, search string, difficulty int) (*WordListResult, error)
	CreateWord(ctx context.Context, userID, bankID string, req CreateWordReq) (*entity.Word, error)
	UpdateWord(ctx context.Context, userID, wordID string, req UpdateWordReq) (*entity.Word, error)
	DeleteWord(ctx context.Context, userID, wordID string) error

	// Import / Export
	ImportWords(ctx context.Context, userID, bankID string, format string, data io.Reader) (int, error)
	ExportWords(ctx context.Context, userID, bankID string, format string) ([]byte, error)
}

type CreateBankReq struct {
	Name        string `json:"name"`
	Description string `json:"description"`
	IsPublic    int    `json:"is_public"`
}

type UpdateBankReq struct {
	Name        *string `json:"name"`
	Description *string `json:"description"`
	IsPublic    *int    `json:"is_public"`
}

type CreateWordReq struct {
	Content         string `json:"content"`
	Pronunciation   string `json:"pronunciation"`
	Definition      string `json:"definition"`
	ExampleSentence string `json:"example_sentence"`
	Difficulty      int    `json:"difficulty"`
	Tags            string `json:"tags"`
}

type UpdateWordReq struct {
	Content         *string `json:"content"`
	Pronunciation   *string `json:"pronunciation"`
	Definition      *string `json:"definition"`
	ExampleSentence *string `json:"example_sentence"`
	Difficulty      *int    `json:"difficulty"`
	Tags            *string `json:"tags"`
}

type WordListResult struct {
	List     []entity.Word `json:"list"`
	Total    int64         `json:"total"`
	Page     int           `json:"page"`
	PageSize int           `json:"page_size"`
}

type serviceImpl struct {
	db *gorm.DB
}

func NewService(db *gorm.DB) Service {
	return &serviceImpl{db: db}
}

// ─── Bank CRUD ───────────────────────────────────────────

func (s *serviceImpl) ListBanks(ctx context.Context, userID string) ([]entity.WordBank, error) {
	var banks []entity.WordBank
	if err := s.db.WithContext(ctx).
		Where("owner_id = ? OR is_public = 1", userID).
		Order("created_at DESC").
		Find(&banks).Error; err != nil {
		return nil, gerror.NewCode(code.CodeInternalError, err.Error())
	}
	// Populate word counts
	for i := range banks {
		var count int64
		s.db.WithContext(ctx).Model(&entity.Word{}).Where("bank_id = ?", banks[i].ID).Count(&count)
		banks[i].WordCount = count
	}
	return banks, nil
}

func (s *serviceImpl) CreateBank(ctx context.Context, userID string, req CreateBankReq) (*entity.WordBank, error) {
	now := time.Now()
	bank := &entity.WordBank{
		ID:          uuid.New().String(),
		OwnerID:     userID,
		Name:        req.Name,
		Description: req.Description,
		IsPublic:    req.IsPublic,
		CreatedAt:   now,
		UpdatedAt:   now,
	}
	if err := s.db.WithContext(ctx).Create(bank).Error; err != nil {
		return nil, gerror.NewCode(code.CodeInternalError, err.Error())
	}
	return bank, nil
}

func (s *serviceImpl) GetBank(ctx context.Context, userID, bankID string) (*entity.WordBank, error) {
	var bank entity.WordBank
	if err := s.db.WithContext(ctx).
		Where("id = ? AND (owner_id = ? OR is_public = 1)", bankID, userID).
		First(&bank).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, gerror.NewCode(code.CodeNotFound, "word bank not found")
		}
		return nil, gerror.NewCode(code.CodeInternalError, err.Error())
	}
	var count int64
	s.db.WithContext(ctx).Model(&entity.Word{}).Where("bank_id = ?", bankID).Count(&count)
	bank.WordCount = count
	return &bank, nil
}

func (s *serviceImpl) UpdateBank(ctx context.Context, userID, bankID string, req UpdateBankReq) (*entity.WordBank, error) {
	var bank entity.WordBank
	if err := s.db.WithContext(ctx).Where("id = ? AND owner_id = ?", bankID, userID).First(&bank).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, gerror.NewCode(code.CodeNotFound, "word bank not found or no permission")
		}
		return nil, gerror.NewCode(code.CodeInternalError, err.Error())
	}
	updates := map[string]interface{}{"updated_at": time.Now()}
	if req.Name != nil {
		updates["name"] = *req.Name
	}
	if req.Description != nil {
		updates["description"] = *req.Description
	}
	if req.IsPublic != nil {
		updates["is_public"] = *req.IsPublic
	}
	if err := s.db.WithContext(ctx).Model(&bank).Updates(updates).Error; err != nil {
		return nil, gerror.NewCode(code.CodeInternalError, err.Error())
	}
	return &bank, nil
}

func (s *serviceImpl) DeleteBank(ctx context.Context, userID, bankID string) error {
	result := s.db.WithContext(ctx).Where("id = ? AND owner_id = ?", bankID, userID).Delete(&entity.WordBank{})
	if result.Error != nil {
		return gerror.NewCode(code.CodeInternalError, result.Error.Error())
	}
	if result.RowsAffected == 0 {
		return gerror.NewCode(code.CodeNotFound, "word bank not found or no permission")
	}
	return nil
}

// ─── Word CRUD ───────────────────────────────────────────

func (s *serviceImpl) ListWords(ctx context.Context, userID, bankID string, page, pageSize int, search string, difficulty int) (*WordListResult, error) {
	// Verify bank access
	if _, err := s.GetBank(ctx, userID, bankID); err != nil {
		return nil, err
	}
	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 20
	}
	query := s.db.WithContext(ctx).Model(&entity.Word{}).Where("bank_id = ?", bankID)
	if search != "" {
		query = query.Where("content LIKE ? OR definition LIKE ?", "%"+search+"%", "%"+search+"%")
	}
	if difficulty > 0 {
		query = query.Where("difficulty = ?", difficulty)
	}
	var total int64
	query.Count(&total)
	var words []entity.Word
	if err := query.Order("created_at DESC").Offset((page - 1) * pageSize).Limit(pageSize).Find(&words).Error; err != nil {
		return nil, gerror.NewCode(code.CodeInternalError, err.Error())
	}
	return &WordListResult{List: words, Total: total, Page: page, PageSize: pageSize}, nil
}

func (s *serviceImpl) CreateWord(ctx context.Context, userID, bankID string, req CreateWordReq) (*entity.Word, error) {
	// Verify ownership
	var bank entity.WordBank
	if err := s.db.WithContext(ctx).Where("id = ? AND owner_id = ?", bankID, userID).First(&bank).Error; err != nil {
		return nil, gerror.NewCode(code.CodeNotFound, "word bank not found or no permission")
	}
	if req.Difficulty < 1 {
		req.Difficulty = 1
	}
	if req.Difficulty > 5 {
		req.Difficulty = 5
	}
	now := time.Now()
	w := &entity.Word{
		ID:              uuid.New().String(),
		BankID:          bankID,
		Content:         req.Content,
		Pronunciation:   req.Pronunciation,
		Definition:      req.Definition,
		ExampleSentence: req.ExampleSentence,
		Difficulty:      req.Difficulty,
		Tags:            req.Tags,
		CreatedAt:       now,
		UpdatedAt:       now,
	}
	if err := s.db.WithContext(ctx).Create(w).Error; err != nil {
		return nil, gerror.NewCode(code.CodeInternalError, err.Error())
	}
	return w, nil
}

func (s *serviceImpl) UpdateWord(ctx context.Context, userID, wordID string, req UpdateWordReq) (*entity.Word, error) {
	var w entity.Word
	if err := s.db.WithContext(ctx).First(&w, "id = ?", wordID).Error; err != nil {
		return nil, gerror.NewCode(code.CodeNotFound, "word not found")
	}
	// Verify bank ownership
	var bank entity.WordBank
	if err := s.db.WithContext(ctx).Where("id = ? AND owner_id = ?", w.BankID, userID).First(&bank).Error; err != nil {
		return nil, gerror.NewCode(code.CodeForbidden, "no permission")
	}
	updates := map[string]interface{}{"updated_at": time.Now()}
	if req.Content != nil {
		updates["content"] = *req.Content
	}
	if req.Pronunciation != nil {
		updates["pronunciation"] = *req.Pronunciation
	}
	if req.Definition != nil {
		updates["definition"] = *req.Definition
	}
	if req.ExampleSentence != nil {
		updates["example_sentence"] = *req.ExampleSentence
	}
	if req.Difficulty != nil {
		d := *req.Difficulty
		if d < 1 {
			d = 1
		}
		if d > 5 {
			d = 5
		}
		updates["difficulty"] = d
	}
	if req.Tags != nil {
		updates["tags"] = *req.Tags
	}
	if err := s.db.WithContext(ctx).Model(&w).Updates(updates).Error; err != nil {
		return nil, gerror.NewCode(code.CodeInternalError, err.Error())
	}
	return &w, nil
}

func (s *serviceImpl) DeleteWord(ctx context.Context, userID, wordID string) error {
	var w entity.Word
	if err := s.db.WithContext(ctx).First(&w, "id = ?", wordID).Error; err != nil {
		return gerror.NewCode(code.CodeNotFound, "word not found")
	}
	var bank entity.WordBank
	if err := s.db.WithContext(ctx).Where("id = ? AND owner_id = ?", w.BankID, userID).First(&bank).Error; err != nil {
		return gerror.NewCode(code.CodeForbidden, "no permission")
	}
	return s.db.WithContext(ctx).Delete(&w).Error
}

// ─── Import / Export ─────────────────────────────────────

type jsonWord struct {
	Content         string `json:"content"`
	Pronunciation   string `json:"pronunciation,omitempty"`
	Definition      string `json:"definition,omitempty"`
	ExampleSentence string `json:"example_sentence,omitempty"`
	Difficulty      int    `json:"difficulty,omitempty"`
	Tags            string `json:"tags,omitempty"`
}

func (s *serviceImpl) ImportWords(ctx context.Context, userID, bankID string, format string, data io.Reader) (int, error) {
	// Verify bank ownership
	var bank entity.WordBank
	if err := s.db.WithContext(ctx).Where("id = ? AND owner_id = ?", bankID, userID).First(&bank).Error; err != nil {
		return 0, gerror.NewCode(code.CodeNotFound, "word bank not found or no permission")
	}

	var items []jsonWord
	switch strings.ToLower(format) {
	case "json":
		if err := json.NewDecoder(data).Decode(&items); err != nil {
			return 0, gerror.NewCode(code.CodeImportFormat, "invalid JSON: "+err.Error())
		}
	case "csv":
		parsed, err := parseCSVWords(data)
		if err != nil {
			return 0, gerror.NewCode(code.CodeImportFormat, err.Error())
		}
		items = parsed
	default:
		return 0, gerror.NewCode(code.CodeBadRequest, "unsupported format: "+format)
	}

	if len(items) == 0 {
		return 0, nil
	}

	now := time.Now()
	words := make([]entity.Word, 0, len(items))
	for _, item := range items {
		d := item.Difficulty
		if d < 1 {
			d = 1
		}
		if d > 5 {
			d = 5
		}
		words = append(words, entity.Word{
			ID:              uuid.New().String(),
			BankID:          bankID,
			Content:         item.Content,
			Pronunciation:   item.Pronunciation,
			Definition:      item.Definition,
			ExampleSentence: item.ExampleSentence,
			Difficulty:      d,
			Tags:            item.Tags,
			CreatedAt:       now,
			UpdatedAt:       now,
		})
	}

	if err := s.db.WithContext(ctx).CreateInBatches(words, 100).Error; err != nil {
		return 0, gerror.NewCode(code.CodeInternalError, err.Error())
	}
	return len(words), nil
}

func (s *serviceImpl) ExportWords(ctx context.Context, userID, bankID string, format string) ([]byte, error) {
	if _, err := s.GetBank(ctx, userID, bankID); err != nil {
		return nil, err
	}
	var words []entity.Word
	if err := s.db.WithContext(ctx).Where("bank_id = ?", bankID).Order("created_at").Find(&words).Error; err != nil {
		return nil, gerror.NewCode(code.CodeInternalError, err.Error())
	}

	items := make([]jsonWord, len(words))
	for i, w := range words {
		items[i] = jsonWord{
			Content:         w.Content,
			Pronunciation:   w.Pronunciation,
			Definition:      w.Definition,
			ExampleSentence: w.ExampleSentence,
			Difficulty:      w.Difficulty,
			Tags:            w.Tags,
		}
	}

	switch strings.ToLower(format) {
	case "json":
		return json.MarshalIndent(items, "", "  ")
	case "csv":
		return marshalCSVWords(items)
	default:
		return nil, gerror.NewCode(code.CodeBadRequest, "unsupported format: "+format)
	}
}

func parseCSVWords(r io.Reader) ([]jsonWord, error) {
	reader := csv.NewReader(r)
	header, err := reader.Read()
	if err != nil {
		return nil, fmt.Errorf("failed to read CSV header: %w", err)
	}
	colIndex := make(map[string]int)
	for i, h := range header {
		colIndex[strings.TrimSpace(strings.ToLower(h))] = i
	}
	contentIdx, ok := colIndex["content"]
	if !ok {
		return nil, fmt.Errorf("CSV must have a 'content' column")
	}

	var items []jsonWord
	for {
		record, err := reader.Read()
		if err == io.EOF {
			break
		}
		if err != nil {
			return nil, fmt.Errorf("CSV read error: %w", err)
		}
		item := jsonWord{Content: strings.TrimSpace(record[contentIdx])}
		if item.Content == "" {
			continue
		}
		if idx, ok := colIndex["pronunciation"]; ok && idx < len(record) {
			item.Pronunciation = strings.TrimSpace(record[idx])
		}
		if idx, ok := colIndex["definition"]; ok && idx < len(record) {
			item.Definition = strings.TrimSpace(record[idx])
		}
		if idx, ok := colIndex["example_sentence"]; ok && idx < len(record) {
			item.ExampleSentence = strings.TrimSpace(record[idx])
		}
		if idx, ok := colIndex["tags"]; ok && idx < len(record) {
			item.Tags = strings.TrimSpace(record[idx])
		}
		items = append(items, item)
	}
	return items, nil
}

func marshalCSVWords(items []jsonWord) ([]byte, error) {
	var buf strings.Builder
	w := csv.NewWriter(&buf)
	_ = w.Write([]string{"content", "pronunciation", "definition", "example_sentence", "difficulty", "tags"})
	for _, item := range items {
		_ = w.Write([]string{item.Content, item.Pronunciation, item.Definition, item.ExampleSentence, fmt.Sprintf("%d", item.Difficulty), item.Tags})
	}
	w.Flush()
	return []byte(buf.String()), nil
}

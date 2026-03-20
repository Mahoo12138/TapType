package sentence

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
	ListBanks(ctx context.Context, userID string) ([]entity.SentenceBank, error)
	CreateBank(ctx context.Context, userID string, req CreateBankReq) (*entity.SentenceBank, error)
	GetBank(ctx context.Context, userID, bankID string) (*entity.SentenceBank, error)
	UpdateBank(ctx context.Context, userID, bankID string, req UpdateBankReq) (*entity.SentenceBank, error)
	DeleteBank(ctx context.Context, userID, bankID string) error

	// Sentence CRUD
	ListSentences(ctx context.Context, userID, bankID string, page, pageSize int, search string, difficulty int) (*SentenceListResult, error)
	CreateSentence(ctx context.Context, userID, bankID string, req CreateSentenceReq) (*entity.Sentence, error)
	UpdateSentence(ctx context.Context, userID, sentenceID string, req UpdateSentenceReq) (*entity.Sentence, error)
	DeleteSentence(ctx context.Context, userID, sentenceID string) error

	// Import / Export
	ImportSentences(ctx context.Context, userID, bankID string, format string, data io.Reader) (int, error)
	ExportSentences(ctx context.Context, userID, bankID string, format string) ([]byte, error)
}

type CreateBankReq struct {
	Name     string `json:"name"`
	Category string `json:"category"`
	IsPublic int    `json:"is_public"`
}

type UpdateBankReq struct {
	Name     *string `json:"name"`
	Category *string `json:"category"`
	IsPublic *int    `json:"is_public"`
}

type CreateSentenceReq struct {
	Content           string `json:"content"`
	Translation       string `json:"translation"`
	TranslationSource string `json:"translation_source"`
	Source            string `json:"source"`
	Difficulty        int    `json:"difficulty"`
	Tags              string `json:"tags"`
}

type UpdateSentenceReq struct {
	Content           *string `json:"content"`
	Translation       *string `json:"translation"`
	TranslationSource *string `json:"translation_source"`
	Source            *string `json:"source"`
	Difficulty        *int    `json:"difficulty"`
	Tags              *string `json:"tags"`
}

type SentenceListResult struct {
	List     []entity.Sentence `json:"list"`
	Total    int64             `json:"total"`
	Page     int               `json:"page"`
	PageSize int               `json:"page_size"`
}

type serviceImpl struct {
	db *gorm.DB
}

func NewService(db *gorm.DB) Service {
	return &serviceImpl{db: db}
}

// ─── Bank CRUD ───────────────────────────────────────────

func (s *serviceImpl) ListBanks(ctx context.Context, userID string) ([]entity.SentenceBank, error) {
	var banks []entity.SentenceBank
	if err := s.db.WithContext(ctx).
		Where("owner_id = ? OR is_public = 1", userID).
		Order("created_at DESC").
		Find(&banks).Error; err != nil {
		return nil, gerror.NewCode(code.CodeInternalError, err.Error())
	}
	for i := range banks {
		var count int64
		s.db.WithContext(ctx).Model(&entity.Sentence{}).Where("bank_id = ?", banks[i].ID).Count(&count)
		banks[i].SentenceCount = count
	}
	return banks, nil
}

func (s *serviceImpl) CreateBank(ctx context.Context, userID string, req CreateBankReq) (*entity.SentenceBank, error) {
	now := time.Now()
	bank := &entity.SentenceBank{
		ID:        uuid.New().String(),
		OwnerID:   userID,
		Name:      req.Name,
		Category:  req.Category,
		IsPublic:  req.IsPublic,
		CreatedAt: now,
		UpdatedAt: now,
	}
	if err := s.db.WithContext(ctx).Create(bank).Error; err != nil {
		return nil, gerror.NewCode(code.CodeInternalError, err.Error())
	}
	return bank, nil
}

func (s *serviceImpl) GetBank(ctx context.Context, userID, bankID string) (*entity.SentenceBank, error) {
	var bank entity.SentenceBank
	if err := s.db.WithContext(ctx).
		Where("id = ? AND (owner_id = ? OR is_public = 1)", bankID, userID).
		First(&bank).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, gerror.NewCode(code.CodeNotFound, "sentence bank not found")
		}
		return nil, gerror.NewCode(code.CodeInternalError, err.Error())
	}
	var count int64
	s.db.WithContext(ctx).Model(&entity.Sentence{}).Where("bank_id = ?", bankID).Count(&count)
	bank.SentenceCount = count
	return &bank, nil
}

func (s *serviceImpl) UpdateBank(ctx context.Context, userID, bankID string, req UpdateBankReq) (*entity.SentenceBank, error) {
	var bank entity.SentenceBank
	if err := s.db.WithContext(ctx).Where("id = ? AND owner_id = ?", bankID, userID).First(&bank).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, gerror.NewCode(code.CodeNotFound, "sentence bank not found or no permission")
		}
		return nil, gerror.NewCode(code.CodeInternalError, err.Error())
	}
	updates := map[string]interface{}{"updated_at": time.Now()}
	if req.Name != nil {
		updates["name"] = *req.Name
	}
	if req.Category != nil {
		updates["category"] = *req.Category
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
	result := s.db.WithContext(ctx).Where("id = ? AND owner_id = ?", bankID, userID).Delete(&entity.SentenceBank{})
	if result.Error != nil {
		return gerror.NewCode(code.CodeInternalError, result.Error.Error())
	}
	if result.RowsAffected == 0 {
		return gerror.NewCode(code.CodeNotFound, "sentence bank not found or no permission")
	}
	return nil
}

// ─── Sentence CRUD ───────────────────────────────────────

func (s *serviceImpl) ListSentences(ctx context.Context, userID, bankID string, page, pageSize int, search string, difficulty int) (*SentenceListResult, error) {
	if _, err := s.GetBank(ctx, userID, bankID); err != nil {
		return nil, err
	}
	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 20
	}
	query := s.db.WithContext(ctx).Model(&entity.Sentence{}).Where("bank_id = ?", bankID)
	if search != "" {
		query = query.Where("content LIKE ?", "%"+search+"%")
	}
	if difficulty > 0 {
		query = query.Where("difficulty = ?", difficulty)
	}
	var total int64
	query.Count(&total)
	var sentences []entity.Sentence
	if err := query.Order("created_at DESC").Offset((page - 1) * pageSize).Limit(pageSize).Find(&sentences).Error; err != nil {
		return nil, gerror.NewCode(code.CodeInternalError, err.Error())
	}
	return &SentenceListResult{List: sentences, Total: total, Page: page, PageSize: pageSize}, nil
}

func (s *serviceImpl) CreateSentence(ctx context.Context, userID, bankID string, req CreateSentenceReq) (*entity.Sentence, error) {
	var bank entity.SentenceBank
	if err := s.db.WithContext(ctx).Where("id = ? AND owner_id = ?", bankID, userID).First(&bank).Error; err != nil {
		return nil, gerror.NewCode(code.CodeNotFound, "sentence bank not found or no permission")
	}
	if req.Difficulty < 1 {
		req.Difficulty = 1
	}
	if req.Difficulty > 5 {
		req.Difficulty = 5
	}
	now := time.Now()
	translationSource := req.TranslationSource
	if translationSource == "" {
		translationSource = "manual"
	}
	sent := &entity.Sentence{
		ID:                uuid.New().String(),
		BankID:            bankID,
		Content:           req.Content,
		Translation:       req.Translation,
		TranslationSource: translationSource,
		Source:            req.Source,
		Difficulty:        req.Difficulty,
		Tags:              req.Tags,
		CreatedAt:         now,
		UpdatedAt:         now,
	}
	if err := s.db.WithContext(ctx).Create(sent).Error; err != nil {
		return nil, gerror.NewCode(code.CodeInternalError, err.Error())
	}
	return sent, nil
}

func (s *serviceImpl) UpdateSentence(ctx context.Context, userID, sentenceID string, req UpdateSentenceReq) (*entity.Sentence, error) {
	var sent entity.Sentence
	if err := s.db.WithContext(ctx).First(&sent, "id = ?", sentenceID).Error; err != nil {
		return nil, gerror.NewCode(code.CodeNotFound, "sentence not found")
	}
	var bank entity.SentenceBank
	if err := s.db.WithContext(ctx).Where("id = ? AND owner_id = ?", sent.BankID, userID).First(&bank).Error; err != nil {
		return nil, gerror.NewCode(code.CodeForbidden, "no permission")
	}
	updates := map[string]interface{}{"updated_at": time.Now()}
	if req.Content != nil {
		updates["content"] = *req.Content
	}
	if req.Translation != nil {
		updates["translation"] = *req.Translation
		if req.TranslationSource == nil {
			updates["translation_source"] = "manual"
		}
	}
	if req.TranslationSource != nil {
		updates["translation_source"] = *req.TranslationSource
	}
	if req.Source != nil {
		updates["source"] = *req.Source
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
	if err := s.db.WithContext(ctx).Model(&sent).Updates(updates).Error; err != nil {
		return nil, gerror.NewCode(code.CodeInternalError, err.Error())
	}
	return &sent, nil
}

func (s *serviceImpl) DeleteSentence(ctx context.Context, userID, sentenceID string) error {
	var sent entity.Sentence
	if err := s.db.WithContext(ctx).First(&sent, "id = ?", sentenceID).Error; err != nil {
		return gerror.NewCode(code.CodeNotFound, "sentence not found")
	}
	var bank entity.SentenceBank
	if err := s.db.WithContext(ctx).Where("id = ? AND owner_id = ?", sent.BankID, userID).First(&bank).Error; err != nil {
		return gerror.NewCode(code.CodeForbidden, "no permission")
	}
	return s.db.WithContext(ctx).Delete(&sent).Error
}

// ─── Import / Export ─────────────────────────────────────

type jsonSentence struct {
	Content           string `json:"content"`
	Translation       string `json:"translation,omitempty"`
	TranslationSource string `json:"translation_source,omitempty"`
	Source            string `json:"source,omitempty"`
	Difficulty        int    `json:"difficulty,omitempty"`
	Tags              string `json:"tags,omitempty"`
}

func (s *serviceImpl) ImportSentences(ctx context.Context, userID, bankID string, format string, data io.Reader) (int, error) {
	var bank entity.SentenceBank
	if err := s.db.WithContext(ctx).Where("id = ? AND owner_id = ?", bankID, userID).First(&bank).Error; err != nil {
		return 0, gerror.NewCode(code.CodeNotFound, "sentence bank not found or no permission")
	}

	var items []jsonSentence
	switch strings.ToLower(format) {
	case "json":
		if err := json.NewDecoder(data).Decode(&items); err != nil {
			return 0, gerror.NewCode(code.CodeImportFormat, "invalid JSON: "+err.Error())
		}
	case "csv":
		parsed, err := parseCSVSentences(data)
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
	sentences := make([]entity.Sentence, 0, len(items))
	for _, item := range items {
		d := item.Difficulty
		if d < 1 {
			d = 1
		}
		if d > 5 {
			d = 5
		}
		ts := item.TranslationSource
		if ts == "" {
			ts = "manual"
		}
		sentences = append(sentences, entity.Sentence{
			ID:                uuid.New().String(),
			BankID:            bankID,
			Content:           item.Content,
			Translation:       item.Translation,
			TranslationSource: ts,
			Source:            item.Source,
			Difficulty:        d,
			Tags:              item.Tags,
			CreatedAt:         now,
			UpdatedAt:         now,
		})
	}

	if err := s.db.WithContext(ctx).CreateInBatches(sentences, 100).Error; err != nil {
		return 0, gerror.NewCode(code.CodeInternalError, err.Error())
	}
	return len(sentences), nil
}

func (s *serviceImpl) ExportSentences(ctx context.Context, userID, bankID string, format string) ([]byte, error) {
	if _, err := s.GetBank(ctx, userID, bankID); err != nil {
		return nil, err
	}
	var sentences []entity.Sentence
	if err := s.db.WithContext(ctx).Where("bank_id = ?", bankID).Order("created_at").Find(&sentences).Error; err != nil {
		return nil, gerror.NewCode(code.CodeInternalError, err.Error())
	}

	items := make([]jsonSentence, len(sentences))
	for i, s := range sentences {
		items[i] = jsonSentence{
			Content:           s.Content,
			Translation:       s.Translation,
			TranslationSource: s.TranslationSource,
			Source:            s.Source,
			Difficulty:        s.Difficulty,
			Tags:              s.Tags,
		}
	}

	switch strings.ToLower(format) {
	case "json":
		return json.MarshalIndent(items, "", "  ")
	case "csv":
		return marshalCSVSentences(items)
	default:
		return nil, gerror.NewCode(code.CodeBadRequest, "unsupported format: "+format)
	}
}

func parseCSVSentences(r io.Reader) ([]jsonSentence, error) {
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

	var items []jsonSentence
	for {
		record, err := reader.Read()
		if err == io.EOF {
			break
		}
		if err != nil {
			return nil, fmt.Errorf("CSV read error: %w", err)
		}
		item := jsonSentence{Content: strings.TrimSpace(record[contentIdx])}
		if item.Content == "" {
			continue
		}
		if idx, ok := colIndex["source"]; ok && idx < len(record) {
			item.Source = strings.TrimSpace(record[idx])
		}
		if idx, ok := colIndex["translation"]; ok && idx < len(record) {
			item.Translation = strings.TrimSpace(record[idx])
		}
		if idx, ok := colIndex["translation_source"]; ok && idx < len(record) {
			item.TranslationSource = strings.TrimSpace(record[idx])
		}
		if idx, ok := colIndex["tags"]; ok && idx < len(record) {
			item.Tags = strings.TrimSpace(record[idx])
		}
		items = append(items, item)
	}
	return items, nil
}

func marshalCSVSentences(items []jsonSentence) ([]byte, error) {
	var buf strings.Builder
	w := csv.NewWriter(&buf)
	_ = w.Write([]string{"content", "translation", "translation_source", "source", "difficulty", "tags"})
	for _, item := range items {
		_ = w.Write([]string{item.Content, item.Translation, item.TranslationSource, item.Source, fmt.Sprintf("%d", item.Difficulty), item.Tags})
	}
	w.Flush()
	return []byte(buf.String()), nil
}

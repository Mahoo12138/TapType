package article

import (
	"context"
	"encoding/json"
	"errors"
	"time"
	"unicode/utf8"

	"github.com/gogf/gf/v2/errors/gerror"
	"github.com/google/uuid"
	"gorm.io/gorm"

	"taptype/internal/model/code"
	"taptype/internal/model/entity"
	"taptype/utility/splitter"
)

type Service interface {
	// Bank CRUD
	ListBanks(ctx context.Context, userID string) ([]entity.ArticleBank, error)
	CreateBank(ctx context.Context, userID string, req CreateBankReq) (*entity.ArticleBank, error)
	GetBank(ctx context.Context, userID, bankID string) (*entity.ArticleBank, error)
	UpdateBank(ctx context.Context, userID, bankID string, req UpdateBankReq) (*entity.ArticleBank, error)
	DeleteBank(ctx context.Context, userID, bankID string) error

	// Article CRUD
	ListArticles(ctx context.Context, userID, bankID string, page, pageSize int) (*ArticleListResult, error)
	CreateArticle(ctx context.Context, userID, bankID string, req CreateArticleReq) (*entity.Article, error)
	GetArticle(ctx context.Context, userID, articleID string) (*ArticleDetail, error)
	UpdateArticle(ctx context.Context, userID, articleID string, req UpdateArticleReq) (*entity.Article, error)
	DeleteArticle(ctx context.Context, userID, articleID string) error
	ExportBank(ctx context.Context, userID, bankID string) ([]byte, error)

	// Sentence translation management
	ListArticleSentences(ctx context.Context, userID, articleID string) ([]entity.ArticleSentence, error)
	UpdateArticleSentence(ctx context.Context, userID, sentenceID string, req UpdateArticleSentenceReq) (*entity.ArticleSentence, error)

	// Progress & Practice
	NextParagraph(ctx context.Context, userID, articleID string) (*ParagraphDetail, error)
	CompleteParagraph(ctx context.Context, userID, articleID string, paragraphIndex int) (*entity.UserArticleProgress, error)
	ListProgress(ctx context.Context, userID string) ([]ProgressItem, error)
	ResetProgress(ctx context.Context, userID, articleID string) error
}

type CreateBankReq struct {
	Name        string `json:"name"`
	Description string `json:"description"`
	Language    string `json:"language"`
	IsPublic    int    `json:"is_public"`
}

type UpdateBankReq struct {
	Name        *string `json:"name"`
	Description *string `json:"description"`
	Language    *string `json:"language"`
	IsPublic    *int    `json:"is_public"`
}

type CreateArticleReq struct {
	Title                string            `json:"title"`
	Author               string            `json:"author"`
	SourceURL            string            `json:"source_url"`
	Content              string            `json:"content"`
	Difficulty           int               `json:"difficulty"`
	Tags                 string            `json:"tags"`
	SentencesTranslation map[string]string `json:"sentences_translation"`
}

type UpdateArticleReq struct {
	Title      *string `json:"title"`
	Author     *string `json:"author"`
	SourceURL  *string `json:"source_url"`
	Difficulty *int    `json:"difficulty"`
	Tags       *string `json:"tags"`
}

type UpdateArticleSentenceReq struct {
	Translation       *string `json:"translation"`
	TranslationSource *string `json:"translation_source"`
}

type ArticleListResult struct {
	List     []entity.Article `json:"list"`
	Total    int64            `json:"total"`
	Page     int              `json:"page"`
	PageSize int              `json:"page_size"`
}

type ArticleDetail struct {
	entity.Article
	Paragraphs []entity.ArticleParagraph   `json:"paragraphs"`
	Progress   *entity.UserArticleProgress `json:"progress"`
}

type ParagraphDetail struct {
	Paragraph entity.ArticleParagraph     `json:"paragraph"`
	Sentences []entity.ArticleSentence    `json:"sentences"`
	Progress  *entity.UserArticleProgress `json:"progress"`
}

type ProgressItem struct {
	entity.UserArticleProgress
	ArticleTitle string `json:"article_title"`
}

type ExportData struct {
	Bank     ExportBank      `json:"bank"`
	Articles []ExportArticle `json:"articles"`
}

type ExportBank struct {
	Name        string `json:"name"`
	Description string `json:"description"`
	Language    string `json:"language"`
}

type ExportArticle struct {
	Title                string            `json:"title"`
	Author               string            `json:"author"`
	SourceURL            string            `json:"source_url"`
	Content              string            `json:"content"`
	Difficulty           int               `json:"difficulty"`
	Tags                 string            `json:"tags"`
	SentencesTranslation map[string]string `json:"sentences_translation,omitempty"`
}

type serviceImpl struct {
	db *gorm.DB
}

func NewService(db *gorm.DB) Service {
	return &serviceImpl{db: db}
}

func (s *serviceImpl) ListBanks(ctx context.Context, userID string) ([]entity.ArticleBank, error) {
	var banks []entity.ArticleBank
	if err := s.db.WithContext(ctx).
		Where("owner_id = ? OR is_public = 1", userID).
		Order("created_at DESC").
		Find(&banks).Error; err != nil {
		return nil, gerror.NewCode(code.CodeInternalError, err.Error())
	}
	for i := range banks {
		var count int64
		s.db.WithContext(ctx).Model(&entity.Article{}).Where("bank_id = ?", banks[i].ID).Count(&count)
		banks[i].ArticleCount = count
	}
	return banks, nil
}

func (s *serviceImpl) CreateBank(ctx context.Context, userID string, req CreateBankReq) (*entity.ArticleBank, error) {
	now := time.Now()
	lang := req.Language
	if lang == "" {
		lang = "en"
	}
	bank := &entity.ArticleBank{
		ID:          uuid.New().String(),
		OwnerID:     userID,
		Name:        req.Name,
		Description: req.Description,
		Language:    lang,
		IsPublic:    req.IsPublic,
		CreatedAt:   now,
		UpdatedAt:   now,
	}
	if err := s.db.WithContext(ctx).Create(bank).Error; err != nil {
		return nil, gerror.NewCode(code.CodeInternalError, err.Error())
	}
	return bank, nil
}

func (s *serviceImpl) GetBank(ctx context.Context, userID, bankID string) (*entity.ArticleBank, error) {
	var bank entity.ArticleBank
	if err := s.db.WithContext(ctx).First(&bank, "id = ?", bankID).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, gerror.NewCode(code.CodeNotFound, "article bank not found")
		}
		return nil, gerror.NewCode(code.CodeInternalError, err.Error())
	}
	if bank.OwnerID != userID && bank.IsPublic == 0 {
		return nil, gerror.NewCode(code.CodeForbidden, "access denied")
	}
	var count int64
	s.db.WithContext(ctx).Model(&entity.Article{}).Where("bank_id = ?", bank.ID).Count(&count)
	bank.ArticleCount = count
	return &bank, nil
}

func (s *serviceImpl) UpdateBank(ctx context.Context, userID, bankID string, req UpdateBankReq) (*entity.ArticleBank, error) {
	var bank entity.ArticleBank
	if err := s.db.WithContext(ctx).First(&bank, "id = ?", bankID).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, gerror.NewCode(code.CodeNotFound, "article bank not found")
		}
		return nil, gerror.NewCode(code.CodeInternalError, err.Error())
	}
	if bank.OwnerID != userID {
		return nil, gerror.NewCode(code.CodeForbidden, "access denied")
	}
	if req.Name != nil {
		bank.Name = *req.Name
	}
	if req.Description != nil {
		bank.Description = *req.Description
	}
	if req.Language != nil {
		bank.Language = *req.Language
	}
	if req.IsPublic != nil {
		bank.IsPublic = *req.IsPublic
	}
	bank.UpdatedAt = time.Now()
	if err := s.db.WithContext(ctx).Save(&bank).Error; err != nil {
		return nil, gerror.NewCode(code.CodeInternalError, err.Error())
	}
	return &bank, nil
}

func (s *serviceImpl) DeleteBank(ctx context.Context, userID, bankID string) error {
	var bank entity.ArticleBank
	if err := s.db.WithContext(ctx).First(&bank, "id = ?", bankID).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return gerror.NewCode(code.CodeNotFound, "article bank not found")
		}
		return gerror.NewCode(code.CodeInternalError, err.Error())
	}
	if bank.OwnerID != userID {
		return gerror.NewCode(code.CodeForbidden, "access denied")
	}

	return s.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		var articleIDs []string
		tx.Model(&entity.Article{}).Where("bank_id = ?", bankID).Pluck("id", &articleIDs)
		if len(articleIDs) > 0 {
			var paragraphIDs []string
			tx.Model(&entity.ArticleParagraph{}).Where("article_id IN ?", articleIDs).Pluck("id", &paragraphIDs)
			if len(paragraphIDs) > 0 {
				tx.Where("paragraph_id IN ?", paragraphIDs).Delete(&entity.ArticleSentence{})
			}
			tx.Where("article_id IN ?", articleIDs).Delete(&entity.ArticleParagraph{})
			tx.Where("article_id IN ?", articleIDs).Delete(&entity.UserArticleProgress{})
		}
		tx.Where("bank_id = ?", bankID).Delete(&entity.Article{})
		return tx.Delete(&bank).Error
	})
}

func (s *serviceImpl) ListArticles(ctx context.Context, userID, bankID string, page, pageSize int) (*ArticleListResult, error) {
	if _, err := s.GetBank(ctx, userID, bankID); err != nil {
		return nil, err
	}
	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 20
	}

	var total int64
	s.db.WithContext(ctx).Model(&entity.Article{}).Where("bank_id = ?", bankID).Count(&total)

	var articles []entity.Article
	if err := s.db.WithContext(ctx).
		Where("bank_id = ?", bankID).
		Order("created_at DESC").
		Offset((page - 1) * pageSize).
		Limit(pageSize).
		Find(&articles).Error; err != nil {
		return nil, gerror.NewCode(code.CodeInternalError, err.Error())
	}
	for i := range articles {
		articles[i].Content = ""
	}

	return &ArticleListResult{List: articles, Total: total, Page: page, PageSize: pageSize}, nil
}

func (s *serviceImpl) CreateArticle(ctx context.Context, userID, bankID string, req CreateArticleReq) (*entity.Article, error) {
	var bank entity.ArticleBank
	if err := s.db.WithContext(ctx).First(&bank, "id = ?", bankID).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, gerror.NewCode(code.CodeNotFound, "article bank not found")
		}
		return nil, gerror.NewCode(code.CodeInternalError, err.Error())
	}
	if bank.OwnerID != userID {
		return nil, gerror.NewCode(code.CodeForbidden, "access denied")
	}

	difficulty := req.Difficulty
	if difficulty < 1 {
		difficulty = 1
	}
	if difficulty > 5 {
		difficulty = 5
	}

	paragraphTexts := splitter.SplitParagraphs(req.Content)
	if len(paragraphTexts) == 0 {
		return nil, gerror.NewCode(code.CodeBadRequest, "article content has no valid paragraphs")
	}

	totalChars := utf8.RuneCountInString(req.Content)
	now := time.Now()
	article := &entity.Article{
		ID:             uuid.New().String(),
		BankID:         bankID,
		Title:          req.Title,
		Author:         req.Author,
		SourceURL:      req.SourceURL,
		Content:        req.Content,
		ParagraphCount: len(paragraphTexts),
		TotalCharCount: totalChars,
		Difficulty:     difficulty,
		Tags:           req.Tags,
		CreatedAt:      now,
		UpdatedAt:      now,
	}

	err := s.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		if err := tx.Create(article).Error; err != nil {
			return err
		}
		return createParagraphsAndSentences(tx, article.ID, paragraphTexts, req.SentencesTranslation, now)
	})
	if err != nil {
		return nil, gerror.NewCode(code.CodeInternalError, err.Error())
	}
	return article, nil
}

func (s *serviceImpl) GetArticle(ctx context.Context, userID, articleID string) (*ArticleDetail, error) {
	var article entity.Article
	if err := s.db.WithContext(ctx).First(&article, "id = ?", articleID).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, gerror.NewCode(code.CodeNotFound, "article not found")
		}
		return nil, gerror.NewCode(code.CodeInternalError, err.Error())
	}

	var bank entity.ArticleBank
	if err := s.db.WithContext(ctx).First(&bank, "id = ?", article.BankID).Error; err != nil {
		return nil, gerror.NewCode(code.CodeInternalError, err.Error())
	}
	if bank.OwnerID != userID && bank.IsPublic == 0 {
		return nil, gerror.NewCode(code.CodeForbidden, "access denied")
	}

	var paragraphs []entity.ArticleParagraph
	s.db.WithContext(ctx).Where("article_id = ?", articleID).Order("paragraph_index ASC").Find(&paragraphs)

	var progress entity.UserArticleProgress
	err := s.db.WithContext(ctx).Where("user_id = ? AND article_id = ?", userID, articleID).First(&progress).Error
	var progressPtr *entity.UserArticleProgress
	if err == nil {
		progressPtr = &progress
	}

	return &ArticleDetail{
		Article:    article,
		Paragraphs: paragraphs,
		Progress:   progressPtr,
	}, nil
}

func (s *serviceImpl) UpdateArticle(ctx context.Context, userID, articleID string, req UpdateArticleReq) (*entity.Article, error) {
	var article entity.Article
	if err := s.db.WithContext(ctx).First(&article, "id = ?", articleID).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, gerror.NewCode(code.CodeNotFound, "article not found")
		}
		return nil, gerror.NewCode(code.CodeInternalError, err.Error())
	}

	var bank entity.ArticleBank
	if err := s.db.WithContext(ctx).First(&bank, "id = ?", article.BankID).Error; err != nil {
		return nil, gerror.NewCode(code.CodeInternalError, err.Error())
	}
	if bank.OwnerID != userID {
		return nil, gerror.NewCode(code.CodeForbidden, "access denied")
	}

	if req.Title != nil {
		article.Title = *req.Title
	}
	if req.Author != nil {
		article.Author = *req.Author
	}
	if req.SourceURL != nil {
		article.SourceURL = *req.SourceURL
	}
	if req.Difficulty != nil {
		d := *req.Difficulty
		if d < 1 {
			d = 1
		}
		if d > 5 {
			d = 5
		}
		article.Difficulty = d
	}
	if req.Tags != nil {
		article.Tags = *req.Tags
	}
	article.UpdatedAt = time.Now()

	if err := s.db.WithContext(ctx).Save(&article).Error; err != nil {
		return nil, gerror.NewCode(code.CodeInternalError, err.Error())
	}
	return &article, nil
}

func (s *serviceImpl) DeleteArticle(ctx context.Context, userID, articleID string) error {
	var article entity.Article
	if err := s.db.WithContext(ctx).First(&article, "id = ?", articleID).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return gerror.NewCode(code.CodeNotFound, "article not found")
		}
		return gerror.NewCode(code.CodeInternalError, err.Error())
	}

	var bank entity.ArticleBank
	if err := s.db.WithContext(ctx).First(&bank, "id = ?", article.BankID).Error; err != nil {
		return gerror.NewCode(code.CodeInternalError, err.Error())
	}
	if bank.OwnerID != userID {
		return gerror.NewCode(code.CodeForbidden, "access denied")
	}

	return s.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		var paragraphIDs []string
		tx.Model(&entity.ArticleParagraph{}).Where("article_id = ?", articleID).Pluck("id", &paragraphIDs)
		if len(paragraphIDs) > 0 {
			tx.Where("paragraph_id IN ?", paragraphIDs).Delete(&entity.ArticleSentence{})
		}
		tx.Where("article_id = ?", articleID).Delete(&entity.ArticleParagraph{})
		tx.Where("article_id = ?", articleID).Delete(&entity.UserArticleProgress{})
		return tx.Delete(&article).Error
	})
}

func (s *serviceImpl) ExportBank(ctx context.Context, userID, bankID string) ([]byte, error) {
	bank, err := s.GetBank(ctx, userID, bankID)
	if err != nil {
		return nil, err
	}

	var articles []entity.Article
	s.db.WithContext(ctx).Where("bank_id = ?", bankID).Order("created_at ASC").Find(&articles)

	export := ExportData{
		Bank: ExportBank{
			Name:        bank.Name,
			Description: bank.Description,
			Language:    bank.Language,
		},
	}

	for _, a := range articles {
		item := ExportArticle{
			Title:      a.Title,
			Author:     a.Author,
			SourceURL:  a.SourceURL,
			Content:    a.Content,
			Difficulty: a.Difficulty,
			Tags:       a.Tags,
		}

		var paragraphs []entity.ArticleParagraph
		s.db.WithContext(ctx).Where("article_id = ?", a.ID).Order("paragraph_index ASC").Find(&paragraphs)
		if len(paragraphs) > 0 {
			trans := map[string]string{}
			for _, p := range paragraphs {
				var sents []entity.ArticleSentence
				s.db.WithContext(ctx).Where("paragraph_id = ?", p.ID).Order("sentence_index ASC").Find(&sents)
				for _, st := range sents {
					if st.Translation != "" {
						trans[st.Content] = st.Translation
					}
				}
			}
			if len(trans) > 0 {
				item.SentencesTranslation = trans
			}
		}

		export.Articles = append(export.Articles, item)
	}

	return json.MarshalIndent(export, "", "  ")
}

func (s *serviceImpl) ListArticleSentences(ctx context.Context, userID, articleID string) ([]entity.ArticleSentence, error) {
	var article entity.Article
	if err := s.db.WithContext(ctx).First(&article, "id = ?", articleID).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, gerror.NewCode(code.CodeNotFound, "article not found")
		}
		return nil, gerror.NewCode(code.CodeInternalError, err.Error())
	}

	var bank entity.ArticleBank
	if err := s.db.WithContext(ctx).First(&bank, "id = ?", article.BankID).Error; err != nil {
		return nil, gerror.NewCode(code.CodeInternalError, err.Error())
	}
	if bank.OwnerID != userID && bank.IsPublic == 0 {
		return nil, gerror.NewCode(code.CodeForbidden, "access denied")
	}

	var paragraphIDs []string
	s.db.WithContext(ctx).Model(&entity.ArticleParagraph{}).Where("article_id = ?", articleID).Order("paragraph_index ASC").Pluck("id", &paragraphIDs)
	if len(paragraphIDs) == 0 {
		return []entity.ArticleSentence{}, nil
	}

	var sentences []entity.ArticleSentence
	if err := s.db.WithContext(ctx).Where("paragraph_id IN ?", paragraphIDs).Order("paragraph_id ASC, sentence_index ASC").Find(&sentences).Error; err != nil {
		return nil, gerror.NewCode(code.CodeInternalError, err.Error())
	}
	return sentences, nil
}

func (s *serviceImpl) UpdateArticleSentence(ctx context.Context, userID, sentenceID string, req UpdateArticleSentenceReq) (*entity.ArticleSentence, error) {
	var sent entity.ArticleSentence
	if err := s.db.WithContext(ctx).First(&sent, "id = ?", sentenceID).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, gerror.NewCode(code.CodeNotFound, "article sentence not found")
		}
		return nil, gerror.NewCode(code.CodeInternalError, err.Error())
	}

	var para entity.ArticleParagraph
	if err := s.db.WithContext(ctx).First(&para, "id = ?", sent.ParagraphID).Error; err != nil {
		return nil, gerror.NewCode(code.CodeInternalError, err.Error())
	}
	var article entity.Article
	if err := s.db.WithContext(ctx).First(&article, "id = ?", para.ArticleID).Error; err != nil {
		return nil, gerror.NewCode(code.CodeInternalError, err.Error())
	}
	var bank entity.ArticleBank
	if err := s.db.WithContext(ctx).First(&bank, "id = ?", article.BankID).Error; err != nil {
		return nil, gerror.NewCode(code.CodeInternalError, err.Error())
	}
	if bank.OwnerID != userID {
		return nil, gerror.NewCode(code.CodeForbidden, "access denied")
	}

	if req.Translation != nil {
		sent.Translation = *req.Translation
	}
	if req.TranslationSource != nil {
		sent.TranslationSource = *req.TranslationSource
	} else if req.Translation != nil {
		sent.TranslationSource = "manual"
	}
	sent.UpdatedAt = time.Now()

	if err := s.db.WithContext(ctx).Save(&sent).Error; err != nil {
		return nil, gerror.NewCode(code.CodeInternalError, err.Error())
	}
	return &sent, nil
}

func (s *serviceImpl) NextParagraph(ctx context.Context, userID, articleID string) (*ParagraphDetail, error) {
	var article entity.Article
	if err := s.db.WithContext(ctx).First(&article, "id = ?", articleID).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, gerror.NewCode(code.CodeNotFound, "article not found")
		}
		return nil, gerror.NewCode(code.CodeInternalError, err.Error())
	}

	var prog entity.UserArticleProgress
	err := s.db.WithContext(ctx).Where("user_id = ? AND article_id = ?", userID, articleID).First(&prog).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		prog = entity.UserArticleProgress{
			CompletedParagraphs: 0,
			TotalParagraphs:     article.ParagraphCount,
			Status:              "not_started",
		}
	} else if err != nil {
		return nil, gerror.NewCode(code.CodeInternalError, err.Error())
	}

	var para entity.ArticleParagraph
	err = s.db.WithContext(ctx).
		Where("article_id = ? AND paragraph_index = ?", articleID, prog.CompletedParagraphs).
		First(&para).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, gerror.NewCode(code.CodeNotFound, "article already completed")
	}
	if err != nil {
		return nil, gerror.NewCode(code.CodeInternalError, err.Error())
	}

	var sents []entity.ArticleSentence
	if err := s.db.WithContext(ctx).Where("paragraph_id = ?", para.ID).Order("sentence_index ASC").Find(&sents).Error; err != nil {
		return nil, gerror.NewCode(code.CodeInternalError, err.Error())
	}

	var progressPtr *entity.UserArticleProgress
	if prog.ID != "" {
		progressPtr = &prog
	}

	return &ParagraphDetail{Paragraph: para, Sentences: sents, Progress: progressPtr}, nil
}

func (s *serviceImpl) CompleteParagraph(ctx context.Context, userID, articleID string, paragraphIndex int) (*entity.UserArticleProgress, error) {
	var article entity.Article
	if err := s.db.WithContext(ctx).First(&article, "id = ?", articleID).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, gerror.NewCode(code.CodeNotFound, "article not found")
		}
		return nil, gerror.NewCode(code.CodeInternalError, err.Error())
	}

	now := time.Now()
	var prog entity.UserArticleProgress
	err := s.db.WithContext(ctx).Where("user_id = ? AND article_id = ?", userID, articleID).First(&prog).Error

	if errors.Is(err, gorm.ErrRecordNotFound) {
		prog = entity.UserArticleProgress{
			ID:                  uuid.New().String(),
			UserID:              userID,
			ArticleID:           articleID,
			TotalParagraphs:     article.ParagraphCount,
			Status:              "in_progress",
			CreatedAt:           now,
			UpdatedAt:           now,
			CompletedParagraphs: 0,
		}
	} else if err != nil {
		return nil, gerror.NewCode(code.CodeInternalError, err.Error())
	}

	if paragraphIndex != prog.CompletedParagraphs {
		return nil, gerror.NewCode(code.CodeBadRequest, "paragraph index out of order")
	}

	prog.CompletedParagraphs++
	prog.LastPracticedAt = &now
	prog.UpdatedAt = now

	if prog.CompletedParagraphs >= prog.TotalParagraphs {
		prog.Status = "completed"
		prog.CompletedAt = &now
	} else {
		prog.Status = "in_progress"
	}

	if err := s.db.WithContext(ctx).Save(&prog).Error; err != nil {
		return nil, gerror.NewCode(code.CodeInternalError, err.Error())
	}
	return &prog, nil
}

func (s *serviceImpl) ListProgress(ctx context.Context, userID string) ([]ProgressItem, error) {
	var progList []entity.UserArticleProgress
	if err := s.db.WithContext(ctx).
		Where("user_id = ?", userID).
		Order("updated_at DESC").
		Find(&progList).Error; err != nil {
		return nil, gerror.NewCode(code.CodeInternalError, err.Error())
	}

	result := make([]ProgressItem, 0, len(progList))
	for _, p := range progList {
		var article entity.Article
		if err := s.db.WithContext(ctx).Select("title").First(&article, "id = ?", p.ArticleID).Error; err == nil {
			result = append(result, ProgressItem{UserArticleProgress: p, ArticleTitle: article.Title})
		}
	}
	return result, nil
}

func (s *serviceImpl) ResetProgress(ctx context.Context, userID, articleID string) error {
	result := s.db.WithContext(ctx).Where("user_id = ? AND article_id = ?", userID, articleID).Delete(&entity.UserArticleProgress{})
	if result.Error != nil {
		return gerror.NewCode(code.CodeInternalError, result.Error.Error())
	}
	return nil
}

func createParagraphsAndSentences(tx *gorm.DB, articleID string, paragraphs []string, sentenceTranslations map[string]string, now time.Time) error {
	if len(paragraphs) == 0 {
		return nil
	}

	paragraphEntities := make([]entity.ArticleParagraph, 0, len(paragraphs))
	for i, p := range paragraphs {
		sentences := splitter.SplitSentences(p)
		paragraphEntities = append(paragraphEntities, entity.ArticleParagraph{
			ID:             uuid.New().String(),
			ArticleID:      articleID,
			ParagraphIndex: i,
			Content:        p,
			CharCount:      utf8.RuneCountInString(p),
			SentenceCount:  len(sentences),
			CreatedAt:      now,
		})
	}

	if err := tx.CreateInBatches(paragraphEntities, 100).Error; err != nil {
		return err
	}

	var sentenceEntities []entity.ArticleSentence
	for _, para := range paragraphEntities {
		sentences := splitter.SplitSentences(para.Content)
		for i, st := range sentences {
			translation := ""
			source := "manual"
			if sentenceTranslations != nil {
				if t, ok := sentenceTranslations[st]; ok {
					translation = t
				}
			}
			sentenceEntities = append(sentenceEntities, entity.ArticleSentence{
				ID:                uuid.New().String(),
				ParagraphID:       para.ID,
				SentenceIndex:     i,
				Content:           st,
				Translation:       translation,
				TranslationSource: source,
				CreatedAt:         now,
				UpdatedAt:         now,
			})
		}
	}

	if len(sentenceEntities) == 0 {
		return nil
	}
	return tx.CreateInBatches(sentenceEntities, 200).Error
}

package practice

import (
	"context"
	"time"

	"github.com/gogf/gf/v2/errors/gerror"
	"github.com/google/uuid"
	"gorm.io/gorm"

	"taptype/internal/model/code"
	"taptype/internal/model/entity"
	dailyService "taptype/internal/service/daily"
	errorsService "taptype/internal/service/errors"
)

// Service handles practice session lifecycle and result submission.
type Service interface {
	// CreateSession creates a new practice session and returns it with the content list.
	CreateSession(ctx context.Context, req CreateSessionRequest) (*SessionWithContent, error)
	// ListSessions returns paginated practice sessions for a user.
	ListSessions(ctx context.Context, userID string, page, pageSize int) (*SessionListResult, error)
	// GetSession returns a single session with its result and keystroke stats.
	GetSession(ctx context.Context, userID, sessionID string) (*SessionDetail, error)
	// CompletePractice records a practice result, triggers SM-2 updates for errors,
	// and updates the daily streak record.
	CompletePractice(ctx context.Context, req CompleteRequest) (*entity.PracticeResult, error)
}

type CreateSessionRequest struct {
	UserID     string `json:"-"`
	Mode       string `json:"mode"`        // "word" or "sentence"
	SourceType string `json:"source_type"` // "word_bank" or "sentence_bank"
	SourceID   string `json:"source_id"`
	ItemCount  int    `json:"item_count"`
}

type SessionWithContent struct {
	Session   entity.PracticeSession `json:"session"`
	Words     []entity.Word          `json:"words,omitempty"`
	Sentences []entity.Sentence      `json:"sentences,omitempty"`
}

type SessionListResult struct {
	List     []SessionListItem `json:"list"`
	Total    int64             `json:"total"`
	Page     int               `json:"page"`
	PageSize int               `json:"page_size"`
}

type SessionListItem struct {
	entity.PracticeSession
	Result *entity.PracticeResult `json:"result,omitempty"`
}

type SessionDetail struct {
	Session        entity.PracticeSession  `json:"session"`
	Result         *entity.PracticeResult  `json:"result,omitempty"`
	KeystrokeStats []entity.KeystrokeStat  `json:"keystroke_stats"`
	ErrorItems     []entity.ErrorRecord    `json:"error_items"`
}

// CompleteRequest holds the data submitted when a practice session finishes.
type CompleteRequest struct {
	SessionID      string            `json:"session_id"`
	UserID         string            `json:"-"` // from JWT context
	WPM            float64           `json:"wpm"`
	RawWPM         float64           `json:"raw_wpm"`
	Accuracy       float64           `json:"accuracy"`
	ErrorCount     int               `json:"error_count"`
	CharCount      int               `json:"char_count"`
	Consistency    float64           `json:"consistency"`
	DurationMs     int64             `json:"duration_ms"`
	KeystrokeStats []KeystrokeInput  `json:"keystroke_stats"`
	ErrorItems     []ErrorItemInput  `json:"error_items"`
}

type KeystrokeInput struct {
	KeyChar       string `json:"key_char"`
	HitCount      int    `json:"hit_count"`
	ErrorCount    int    `json:"error_count"`
	AvgIntervalMs int    `json:"avg_interval_ms"`
}

type ErrorItemInput struct {
	ContentType string `json:"content_type"` // "word" or "sentence"
	ContentID   string `json:"content_id"`
	ErrorCount  int    `json:"error_count"`
	AvgTimeMs   int64  `json:"avg_time_ms"`
}

type serviceImpl struct {
	db        *gorm.DB
	errorsSvc errorsService.Service
	dailySvc  dailyService.Service
}

func NewService(db *gorm.DB, errorsSvc errorsService.Service, dailySvc dailyService.Service) Service {
	return &serviceImpl{db: db, errorsSvc: errorsSvc, dailySvc: dailySvc}
}

func (s *serviceImpl) CreateSession(ctx context.Context, req CreateSessionRequest) (*SessionWithContent, error) {
	if req.ItemCount < 1 {
		req.ItemCount = 20
	}
	if req.ItemCount > 200 {
		req.ItemCount = 200
	}

	now := time.Now()
	session := entity.PracticeSession{
		ID:         uuid.New().String(),
		UserID:     req.UserID,
		Mode:       req.Mode,
		SourceType: req.SourceType,
		SourceID:   req.SourceID,
		ItemCount:  req.ItemCount,
		StartedAt:  now,
		CreatedAt:  now,
	}

	result := &SessionWithContent{Session: session}

	// Fetch content from bank
	switch req.SourceType {
	case "word_bank":
		var words []entity.Word
		if err := s.db.WithContext(ctx).
			Where("bank_id = ?", req.SourceID).
			Order("RANDOM()").
			Limit(req.ItemCount).
			Find(&words).Error; err != nil {
			return nil, gerror.NewCode(code.CodeInternalError, err.Error())
		}
		if len(words) == 0 {
			return nil, gerror.NewCode(code.CodeNotFound, "no words found in bank")
		}
		session.ItemCount = len(words)
		result.Session = session
		result.Words = words
	case "sentence_bank":
		var sentences []entity.Sentence
		if err := s.db.WithContext(ctx).
			Where("bank_id = ?", req.SourceID).
			Order("RANDOM()").
			Limit(req.ItemCount).
			Find(&sentences).Error; err != nil {
			return nil, gerror.NewCode(code.CodeInternalError, err.Error())
		}
		if len(sentences) == 0 {
			return nil, gerror.NewCode(code.CodeNotFound, "no sentences found in bank")
		}
		session.ItemCount = len(sentences)
		result.Session = session
		result.Sentences = sentences
	default:
		return nil, gerror.NewCode(code.CodeBadRequest, "invalid source_type")
	}

	if err := s.db.WithContext(ctx).Create(&result.Session).Error; err != nil {
		return nil, gerror.NewCode(code.CodeInternalError, err.Error())
	}

	return result, nil
}

func (s *serviceImpl) ListSessions(ctx context.Context, userID string, page, pageSize int) (*SessionListResult, error) {
	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 50 {
		pageSize = 10
	}

	var total int64
	s.db.WithContext(ctx).Model(&entity.PracticeSession{}).Where("user_id = ?", userID).Count(&total)

	var sessions []entity.PracticeSession
	if err := s.db.WithContext(ctx).
		Where("user_id = ?", userID).
		Order("created_at DESC").
		Offset((page - 1) * pageSize).
		Limit(pageSize).
		Find(&sessions).Error; err != nil {
		return nil, gerror.NewCode(code.CodeInternalError, err.Error())
	}

	items := make([]SessionListItem, len(sessions))
	for i, sess := range sessions {
		items[i] = SessionListItem{PracticeSession: sess}
		var result entity.PracticeResult
		if err := s.db.WithContext(ctx).Where("session_id = ?", sess.ID).First(&result).Error; err == nil {
			items[i].Result = &result
		}
	}

	return &SessionListResult{
		List:     items,
		Total:    total,
		Page:     page,
		PageSize: pageSize,
	}, nil
}

func (s *serviceImpl) GetSession(ctx context.Context, userID, sessionID string) (*SessionDetail, error) {
	var session entity.PracticeSession
	if err := s.db.WithContext(ctx).Where("id = ? AND user_id = ?", sessionID, userID).
		First(&session).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, gerror.NewCode(code.CodeNotFound, "session not found")
		}
		return nil, gerror.NewCode(code.CodeInternalError, err.Error())
	}

	detail := &SessionDetail{Session: session}

	var result entity.PracticeResult
	if err := s.db.WithContext(ctx).Where("session_id = ?", sessionID).First(&result).Error; err == nil {
		detail.Result = &result
	}

	s.db.WithContext(ctx).Where("session_id = ?", sessionID).Find(&detail.KeystrokeStats)
	s.db.WithContext(ctx).Where("session_id = ?", sessionID).Find(&detail.ErrorItems)

	return detail, nil
}

func (s *serviceImpl) CompletePractice(ctx context.Context, req CompleteRequest) (*entity.PracticeResult, error) {
	// Verify session exists and belongs to user
	var session entity.PracticeSession
	if err := s.db.WithContext(ctx).Where("id = ? AND user_id = ?", req.SessionID, req.UserID).
		First(&session).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, gerror.NewCode(code.CodeNotFound, "session not found")
		}
		return nil, gerror.NewCode(code.CodeInternalError, err.Error())
	}

	// Check session not already completed
	if session.EndedAt != nil {
		return nil, gerror.NewCode(code.CodeBadRequest, "session already completed")
	}

	now := time.Now()
	result := &entity.PracticeResult{
		ID:          uuid.New().String(),
		SessionID:   req.SessionID,
		Wpm:         req.WPM,
		RawWpm:      req.RawWPM,
		Accuracy:    req.Accuracy,
		ErrorCount:  req.ErrorCount,
		CharCount:   req.CharCount,
		Consistency: req.Consistency,
		CreatedAt:   now,
	}

	err := s.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		// 1. Update session with end time
		if err := tx.Model(&session).Updates(map[string]interface{}{
			"ended_at":    now,
			"duration_ms": req.DurationMs,
		}).Error; err != nil {
			return err
		}

		// 2. Create practice result
		if err := tx.Create(result).Error; err != nil {
			return err
		}

		// 3. Save keystroke stats
		for _, ks := range req.KeystrokeStats {
			stat := entity.KeystrokeStat{
				ID:            uuid.New().String(),
				SessionID:     req.SessionID,
				KeyChar:       ks.KeyChar,
				HitCount:      ks.HitCount,
				ErrorCount:    ks.ErrorCount,
				AvgIntervalMs: ks.AvgIntervalMs,
				CreatedAt:     now,
			}
			if err := tx.Create(&stat).Error; err != nil {
				return err
			}
		}

		return nil
	})

	if err != nil {
		return nil, gerror.NewCode(code.CodeInternalError, err.Error())
	}

	// Post-completion hooks: SM-2 updates + daily record (non-blocking for response)
	s.postCompletionHooks(ctx, req)

	return result, nil
}

// postCompletionHooks runs SM-2 updates and daily record updates after practice completion.
func (s *serviceImpl) postCompletionHooks(ctx context.Context, req CompleteRequest) {
	// Update error records with SM-2
	for _, item := range req.ErrorItems {
		_ = s.errorsSvc.UpsertErrorRecord(ctx, req.UserID, req.SessionID, item.ContentType, item.ContentID, item.ErrorCount, item.AvgTimeMs)
	}

	// Update daily record
	_ = s.dailySvc.UpdateAfterPractice(ctx, req.UserID, req.DurationMs, req.WPM, req.Accuracy)
}

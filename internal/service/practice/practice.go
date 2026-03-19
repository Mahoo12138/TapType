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
	// CompletePractice records a practice result, triggers SM-2 updates for errors,
	// and updates the daily streak record.
	CompletePractice(ctx context.Context, req CompleteRequest) (*entity.PracticeResult, error)
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

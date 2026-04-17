package practice

import (
	"context"
	"time"

	"github.com/gogf/gf/v2/errors/gerror"
	"github.com/google/uuid"
	"gorm.io/gorm"

	"taptype/internal/model/code"
	"taptype/internal/model/entity"
	achievementService "taptype/internal/service/achievement"
	dailyService "taptype/internal/service/daily"
	errorsService "taptype/internal/service/errors"
	goalService "taptype/internal/service/goal"
)

// Service handles practice session lifecycle and result submission.
type Service interface {
	// CreateSession creates a new practice session and returns it with the content list.
	CreateSession(ctx context.Context, req CreateSessionRequest) (*SessionWithContent, error)
	// ListSessions returns paginated practice sessions for a user.
	ListSessions(ctx context.Context, userID string, page, pageSize int) (*SessionListResult, error)
	// GetSession returns a single session with its result and keystroke stats.
	GetSession(ctx context.Context, userID, sessionID string) (*SessionDetail, error)
	// DiscardSession removes an unfinished practice session and its related temporary data.
	DiscardSession(ctx context.Context, userID, sessionID string) error
	// CompletePractice records a practice result, triggers SM-2 updates for errors,
	// updates the daily streak record, and detects newly unlocked achievements.
	CompletePractice(ctx context.Context, req CompleteRequest) (*CompleteResult, error)
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
	Words          []entity.Word           `json:"words,omitempty"`
	Sentences      []entity.Sentence       `json:"sentences,omitempty"`
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

// CompleteResult wraps the practice result with any newly unlocked achievements.
type CompleteResult struct {
	Result              *entity.PracticeResult `json:"result"`
	NewAchievements     []entity.Achievement   `json:"new_achievements"`
}

type serviceImpl struct {
	db             *gorm.DB
	errorsSvc      errorsService.Service
	dailySvc       dailyService.Service
	achievementSvc achievementService.Service
	goalSvc        goalService.Service
}

func NewService(db *gorm.DB, errorsSvc errorsService.Service, dailySvc dailyService.Service, achievementSvc achievementService.Service, goalSvc goalService.Service) Service {
	return &serviceImpl{db: db, errorsSvc: errorsSvc, dailySvc: dailySvc, achievementSvc: achievementSvc, goalSvc: goalSvc}
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
	var sessionItems []entity.PracticeSessionItem

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
		sessionItems = buildSessionItems(session.ID, "word", words, nil, now)
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
		sessionItems = buildSessionItems(session.ID, "sentence", nil, sentences, now)
	default:
		return nil, gerror.NewCode(code.CodeBadRequest, "invalid source_type")
	}

	if err := s.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		if err := tx.Create(&result.Session).Error; err != nil {
			return err
		}
		if len(sessionItems) == 0 {
			return nil
		}
		if err := tx.Create(&sessionItems).Error; err != nil {
			return err
		}
		return nil
	}); err != nil {
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
	words, sentences, err := s.loadSessionContent(ctx, session.ID, session.SourceType)
	if err != nil {
		return nil, gerror.NewCode(code.CodeInternalError, err.Error())
	}
	detail.Words = words
	detail.Sentences = sentences

	var result entity.PracticeResult
	if err := s.db.WithContext(ctx).Where("session_id = ?", sessionID).First(&result).Error; err == nil {
		detail.Result = &result
	}

	s.db.WithContext(ctx).Where("session_id = ?", sessionID).Find(&detail.KeystrokeStats)
	s.db.WithContext(ctx).Where("session_id = ?", sessionID).Find(&detail.ErrorItems)

	return detail, nil
}

func (s *serviceImpl) DiscardSession(ctx context.Context, userID, sessionID string) error {
	var session entity.PracticeSession
	if err := s.db.WithContext(ctx).Where("id = ? AND user_id = ?", sessionID, userID).
		First(&session).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return gerror.NewCode(code.CodeNotFound, "session not found")
		}
		return gerror.NewCode(code.CodeInternalError, err.Error())
	}

	if session.EndedAt != nil {
		return gerror.NewCode(code.CodeBadRequest, "completed session cannot be discarded")
	}

	var resultCount int64
	if err := s.db.WithContext(ctx).
		Model(&entity.PracticeResult{}).
		Where("session_id = ?", sessionID).
		Count(&resultCount).Error; err != nil {
		return gerror.NewCode(code.CodeInternalError, err.Error())
	}
	if resultCount > 0 {
		return gerror.NewCode(code.CodeBadRequest, "completed session cannot be discarded")
	}

	if err := s.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		if err := tx.Where("session_id = ?", sessionID).Delete(&entity.PracticeSessionItem{}).Error; err != nil {
			return err
		}
		if err := tx.Where("session_id = ?", sessionID).Delete(&entity.KeystrokeStat{}).Error; err != nil {
			return err
		}
		if err := tx.Where("session_id = ?", sessionID).Delete(&entity.ErrorRecord{}).Error; err != nil {
			return err
		}
		if err := tx.Where("session_id = ?", sessionID).Delete(&entity.PracticeResult{}).Error; err != nil {
			return err
		}
		if err := tx.Where("id = ?", sessionID).Delete(&entity.PracticeSession{}).Error; err != nil {
			return err
		}
		return nil
	}); err != nil {
		return gerror.NewCode(code.CodeInternalError, err.Error())
	}

	return nil
}

func (s *serviceImpl) CompletePractice(ctx context.Context, req CompleteRequest) (*CompleteResult, error) {
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

	// Post-completion hooks: SM-2 updates + daily record + achievement detection + goal refresh
	newAchievements := s.postCompletionHooks(ctx, req)

	return &CompleteResult{
		Result:          result,
		NewAchievements: newAchievements,
	}, nil
}

func buildSessionItems(sessionID, contentType string, words []entity.Word, sentences []entity.Sentence, createdAt time.Time) []entity.PracticeSessionItem {
	if len(words) == 0 && len(sentences) == 0 {
		return nil
	}

	if len(words) > 0 {
		items := make([]entity.PracticeSessionItem, len(words))
		for index, word := range words {
			items[index] = entity.PracticeSessionItem{
				ID:          uuid.New().String(),
				SessionID:   sessionID,
				ItemOrder:   index,
				ContentType: contentType,
				ContentID:   word.ID,
				CreatedAt:   createdAt,
			}
		}
		return items
	}

	items := make([]entity.PracticeSessionItem, len(sentences))
	for index, sentence := range sentences {
		items[index] = entity.PracticeSessionItem{
			ID:          uuid.New().String(),
			SessionID:   sessionID,
			ItemOrder:   index,
			ContentType: contentType,
			ContentID:   sentence.ID,
			CreatedAt:   createdAt,
		}
	}
	return items
}

func (s *serviceImpl) loadSessionContent(ctx context.Context, sessionID, sourceType string) ([]entity.Word, []entity.Sentence, error) {
	var sessionItems []entity.PracticeSessionItem
	if err := s.db.WithContext(ctx).
		Where("session_id = ?", sessionID).
		Order("item_order ASC").
		Find(&sessionItems).Error; err != nil {
		return nil, nil, err
	}
	if len(sessionItems) == 0 {
		return nil, nil, nil
	}

	switch sourceType {
	case "word_bank":
		ids := make([]string, 0, len(sessionItems))
		for _, item := range sessionItems {
			ids = append(ids, item.ContentID)
		}

		var words []entity.Word
		if err := s.db.WithContext(ctx).Where("id IN ?", ids).Find(&words).Error; err != nil {
			return nil, nil, err
		}

		wordByID := make(map[string]entity.Word, len(words))
		for _, word := range words {
			wordByID[word.ID] = word
		}

		orderedWords := make([]entity.Word, 0, len(sessionItems))
		for _, item := range sessionItems {
			word, ok := wordByID[item.ContentID]
			if ok {
				orderedWords = append(orderedWords, word)
			}
		}

		return orderedWords, nil, nil
	case "sentence_bank":
		ids := make([]string, 0, len(sessionItems))
		for _, item := range sessionItems {
			ids = append(ids, item.ContentID)
		}

		var sentences []entity.Sentence
		if err := s.db.WithContext(ctx).Where("id IN ?", ids).Find(&sentences).Error; err != nil {
			return nil, nil, err
		}

		sentenceByID := make(map[string]entity.Sentence, len(sentences))
		for _, sentence := range sentences {
			sentenceByID[sentence.ID] = sentence
		}

		orderedSentences := make([]entity.Sentence, 0, len(sessionItems))
		for _, item := range sessionItems {
			sentence, ok := sentenceByID[item.ContentID]
			if ok {
				orderedSentences = append(orderedSentences, sentence)
			}
		}

		return nil, orderedSentences, nil
	default:
		return nil, nil, nil
	}
}

// postCompletionHooks runs SM-2 updates, daily record updates, achievement detection,
// and goal progress refresh after practice completion.
func (s *serviceImpl) postCompletionHooks(ctx context.Context, req CompleteRequest) []entity.Achievement {
	// Update error records with SM-2
	for _, item := range req.ErrorItems {
		_ = s.errorsSvc.UpsertErrorRecord(ctx, req.UserID, req.SessionID, item.ContentType, item.ContentID, item.ErrorCount, item.AvgTimeMs)
	}

	// Update daily record
	_ = s.dailySvc.UpdateAfterPractice(ctx, req.UserID, req.DurationMs, req.WPM, req.Accuracy)

	// Detect and unlock achievements
	var newAchievements []entity.Achievement
	if s.achievementSvc != nil {
		newAchievements, _ = s.achievementSvc.DetectAndUnlock(ctx, req.UserID)
	}

	// Refresh daily goal progress
	if s.goalSvc != nil {
		_ = s.goalSvc.RefreshDailyProgress(ctx, req.UserID)
	}

	return newAchievements
}

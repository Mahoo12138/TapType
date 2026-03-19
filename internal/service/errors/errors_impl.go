package errors

import (
	"context"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"

	"taptype/internal/model/entity"
	"taptype/utility/sm2"
)

type serviceImpl struct {
	db *gorm.DB
}

func NewService(db *gorm.DB) Service {
	return &serviceImpl{db: db}
}

func (s *serviceImpl) ListErrors(ctx context.Context, userID, contentType string, page, pageSize int) ([]entity.ErrorRecord, int64, error) {
	var records []entity.ErrorRecord
	var total int64

	q := s.db.WithContext(ctx).Where("user_id = ?", userID)
	if contentType != "" {
		q = q.Where("content_type = ?", contentType)
	}

	if err := q.Model(&entity.ErrorRecord{}).Count(&total).Error; err != nil {
		return nil, 0, err
	}

	offset := (page - 1) * pageSize
	if err := q.Order("next_review_at ASC").Offset(offset).Limit(pageSize).Find(&records).Error; err != nil {
		return nil, 0, err
	}

	// Populate content text via joins
	s.populateContent(ctx, records)

	return records, total, nil
}

func (s *serviceImpl) GetReviewQueue(ctx context.Context, userID string, limit int) ([]entity.ErrorRecord, error) {
	var records []entity.ErrorRecord
	now := time.Now()

	if err := s.db.WithContext(ctx).
		Where("user_id = ? AND next_review_at <= ?", userID, now).
		Order("next_review_at ASC").
		Limit(limit).
		Find(&records).Error; err != nil {
		return nil, err
	}

	s.populateContent(ctx, records)

	return records, nil
}

func (s *serviceImpl) CreateReviewSession(ctx context.Context, userID string, itemCount int) (*entity.PracticeSession, []ReviewItem, error) {
	if itemCount <= 0 {
		itemCount = 20
	}

	// Fetch due items
	var records []entity.ErrorRecord
	now := time.Now()
	if err := s.db.WithContext(ctx).
		Where("user_id = ? AND next_review_at <= ?", userID, now).
		Order("next_review_at ASC").
		Limit(itemCount).
		Find(&records).Error; err != nil {
		return nil, nil, err
	}

	if len(records) == 0 {
		// No items due — return nil session
		return nil, nil, nil
	}

	// Create a practice session with mode=review
	session := &entity.PracticeSession{
		ID:         uuid.New().String(),
		UserID:     userID,
		Mode:       "review",
		SourceType: "error_list",
		StartedAt:  now,
		CreatedAt:  now,
	}

	if err := s.db.WithContext(ctx).Create(session).Error; err != nil {
		return nil, nil, err
	}

	// Build review items
	items := make([]ReviewItem, 0, len(records))
	for _, r := range records {
		item := ReviewItem{
			ContentType: r.ContentType,
			ContentID:   r.ContentID,
			NextReview:  r.NextReviewAt,
			ErrorCount:  r.ErrorCount,
		}
		items = append(items, item)
	}

	// Populate content
	s.populateReviewItems(ctx, items)

	return session, items, nil
}

func (s *serviceImpl) UpsertErrorRecord(ctx context.Context, userID, sessionID, contentType, contentID string, errorCount int, avgTimeMs int64) error {
	now := time.Now()

	var existing entity.ErrorRecord
	err := s.db.WithContext(ctx).
		Where("user_id = ? AND content_type = ? AND content_id = ?", userID, contentType, contentID).
		First(&existing).Error

	if err == gorm.ErrRecordNotFound {
		// New error record — use SM-2 with initial state
		quality := sm2.ScoreFromTyping(errorCount, avgTimeMs, 0)
		state, nextReview := sm2.Calculate(sm2.DefaultState(), quality)

		record := entity.ErrorRecord{
			ID:             uuid.New().String(),
			UserID:         userID,
			SessionID:      sessionID,
			ContentType:    contentType,
			ContentID:      contentID,
			ErrorCount:     errorCount,
			AvgTimeMs:      int(avgTimeMs),
			LastSeenAt:     now,
			NextReviewAt:   nextReview,
			ReviewInterval: state.Interval,
			EasinessFactor: state.EasinessFactor,
			CreatedAt:      now,
			UpdatedAt:      now,
		}
		return s.db.WithContext(ctx).Create(&record).Error
	}
	if err != nil {
		return err
	}

	// Existing record — update with SM-2
	quality := sm2.ScoreFromTyping(errorCount, avgTimeMs, int64(existing.AvgTimeMs))
	state := sm2.State{
		Interval:       existing.ReviewInterval,
		EasinessFactor: existing.EasinessFactor,
		Repetitions:    0, // We track this implicitly via interval
	}
	// If previous review was successful (interval > 1), set repetitions accordingly
	if existing.ReviewInterval >= 6 {
		state.Repetitions = 2
	} else if existing.ReviewInterval > 1 {
		state.Repetitions = 1
	}

	newState, nextReview := sm2.Calculate(state, quality)

	return s.db.WithContext(ctx).Model(&existing).
		Updates(map[string]interface{}{
			"session_id":      sessionID,
			"error_count":     clause.Expr{SQL: "error_count + ?", Vars: []interface{}{errorCount}},
			"avg_time_ms":     avgTimeMs,
			"last_seen_at":    now,
			"next_review_at":  nextReview,
			"review_interval": newState.Interval,
			"easiness_factor": newState.EasinessFactor,
			"updated_at":      now,
		}).Error
}

// populateContent fills the Content virtual field from words/sentences tables.
func (s *serviceImpl) populateContent(ctx context.Context, records []entity.ErrorRecord) {
	wordIDs := make([]string, 0)
	sentIDs := make([]string, 0)
	for _, r := range records {
		if r.ContentType == "word" {
			wordIDs = append(wordIDs, r.ContentID)
		} else if r.ContentType == "sentence" {
			sentIDs = append(sentIDs, r.ContentID)
		}
	}

	contentMap := make(map[string]string)

	if len(wordIDs) > 0 {
		var words []entity.Word
		s.db.WithContext(ctx).Where("id IN ?", wordIDs).Find(&words)
		for _, w := range words {
			contentMap[w.ID] = w.Content
		}
	}
	if len(sentIDs) > 0 {
		var sents []entity.Sentence
		s.db.WithContext(ctx).Where("id IN ?", sentIDs).Find(&sents)
		for _, st := range sents {
			contentMap[st.ID] = st.Content
		}
	}

	for i := range records {
		records[i].Content = contentMap[records[i].ContentID]
	}
}

func (s *serviceImpl) populateReviewItems(ctx context.Context, items []ReviewItem) {
	wordIDs := make([]string, 0)
	sentIDs := make([]string, 0)
	for _, item := range items {
		if item.ContentType == "word" {
			wordIDs = append(wordIDs, item.ContentID)
		} else if item.ContentType == "sentence" {
			sentIDs = append(sentIDs, item.ContentID)
		}
	}

	contentMap := make(map[string]string)

	if len(wordIDs) > 0 {
		var words []entity.Word
		s.db.WithContext(ctx).Where("id IN ?", wordIDs).Find(&words)
		for _, w := range words {
			contentMap[w.ID] = w.Content
		}
	}
	if len(sentIDs) > 0 {
		var sents []entity.Sentence
		s.db.WithContext(ctx).Where("id IN ?", sentIDs).Find(&sents)
		for _, st := range sents {
			contentMap[st.ID] = st.Content
		}
	}

	for i := range items {
		items[i].Content = contentMap[items[i].ContentID]
	}
}

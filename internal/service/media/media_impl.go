package media

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io/fs"
	"net/http"
	"strings"
	"time"

	"github.com/gogf/gf/v2/errors/gerror"
	"github.com/google/uuid"
	"gorm.io/gorm"

	"taptype/internal/model/code"
	"taptype/internal/model/entity"
)

type serviceImpl struct {
	db *gorm.DB
}

func NewService(db *gorm.DB) Service {
	return &serviceImpl{db: db}
}

func (s *serviceImpl) Upload(ctx context.Context, req UploadReq) (*UploadResult, error) {
	if len(req.Data) == 0 {
		return nil, gerror.NewCode(code.CodeBadRequest, "file is empty")
	}

	def, err := s.getDefinition(ctx, req.TypeKey)
	if err != nil {
		return nil, err
	}

	ownerType := strings.TrimSpace(req.OwnerType)
	ownerID := normalizeOwnerID(ownerType, req.OwnerID)
	slot := strings.TrimSpace(req.Slot)
	if slot == "" {
		slot = "default"
	}
	filename := strings.TrimSpace(req.Filename)
	if filename == "" {
		filename = "file"
	}
	displayName := strings.TrimSpace(req.DisplayName)
	remark := strings.TrimSpace(req.Remark)

	if err := s.validateUploadTarget(ctx, def, ownerType, ownerID, req.OperatorID, req.OperatorRole); err != nil {
		return nil, err
	}
	if len(req.Data) > def.MaxSizeBytes {
		return nil, gerror.NewCode(code.CodeBadRequest, fmt.Sprintf("file size %d exceeds limit %d", len(req.Data), def.MaxSizeBytes))
	}

	contentType := normalizeContentType(http.DetectContentType(req.Data))
	allowed, err := parseAllowedMimeTypes(def.AllowedMimeTypes)
	if err != nil {
		return nil, gerror.NewCode(code.CodeInternalError, err.Error())
	}
	if !isAllowedContentType(contentType, allowed) {
		return nil, gerror.NewCode(code.CodeBadRequest, fmt.Sprintf("content type %s not allowed", contentType))
	}

	hashBytes := sha256.Sum256(req.Data)
	hash := hex.EncodeToString(hashBytes[:])

	var fileID string
	err = s.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		var existing entity.MediaFile
		err := tx.Where("type_key = ? AND owner_type = ? AND owner_id = ? AND slot = ?", req.TypeKey, ownerType, ownerID, slot).First(&existing).Error
		if err != nil && err != gorm.ErrRecordNotFound {
			return gerror.NewCode(code.CodeInternalError, err.Error())
		}

		now := time.Now()
		if err == nil {
			updates := map[string]interface{}{
				"display_name": displayName,
				"remark":       remark,
				"filename":     filename,
				"content_type": contentType,
				"data":         req.Data,
				"size_bytes":   len(req.Data),
				"hash":         hash,
				"updated_at":   now,
			}
			if err = tx.Model(&entity.MediaFile{}).Where("id = ?", existing.ID).Updates(updates).Error; err != nil {
				return gerror.NewCode(code.CodeInternalError, err.Error())
			}
			fileID = existing.ID
			return s.afterUpload(ctx, tx, req.TypeKey, ownerID, fileID)
		}

		if def.MaxCount > 0 {
			var count int64
			if err = tx.Model(&entity.MediaFile{}).
				Where("type_key = ? AND owner_type = ? AND owner_id = ?", req.TypeKey, ownerType, ownerID).
				Count(&count).Error; err != nil {
				return gerror.NewCode(code.CodeInternalError, err.Error())
			}
			if int(count) >= def.MaxCount {
				return gerror.NewCode(code.CodeBadRequest, fmt.Sprintf("max count %d reached for type %s", def.MaxCount, req.TypeKey))
			}
		}

		file := entity.MediaFile{
			ID:          uuid.New().String(),
			TypeKey:     req.TypeKey,
			OwnerType:   ownerType,
			OwnerID:     ownerID,
			Slot:        slot,
			DisplayName: displayName,
			Remark:      remark,
			Filename:    filename,
			ContentType: contentType,
			Data:        req.Data,
			SizeBytes:   len(req.Data),
			Hash:        hash,
			CreatedAt:   now,
			UpdatedAt:   now,
		}
		if err = tx.Create(&file).Error; err != nil {
			return gerror.NewCode(code.CodeInternalError, err.Error())
		}
		fileID = file.ID
		return s.afterUpload(ctx, tx, req.TypeKey, ownerID, fileID)
	})
	if err != nil {
		return nil, err
	}

	return &UploadResult{FileID: fileID, URL: mediaURL(fileID)}, nil
}

func (s *serviceImpl) Delete(ctx context.Context, fileID, operatorID, operatorRole string) error {
	var file entity.MediaFile
	if err := s.db.WithContext(ctx).Where("id = ?", fileID).First(&file).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return gerror.NewCode(code.CodeNotFound, "media file not found")
		}
		return gerror.NewCode(code.CodeInternalError, err.Error())
	}

	if err := s.validateStoredFileAccess(ctx, file.OwnerType, file.OwnerID, operatorID, operatorRole); err != nil {
		return err
	}

	return s.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		if err := tx.Delete(&entity.MediaFile{}, "id = ?", fileID).Error; err != nil {
			return gerror.NewCode(code.CodeInternalError, err.Error())
		}
		if file.TypeKey == "user.avatar" {
			return tx.Model(&entity.User{}).
				Where("id = ? AND avatar_media_id = ?", file.OwnerID, fileID).
				Update("avatar_media_id", nil).Error
		}
		return nil
	})
}

func (s *serviceImpl) ListByOwner(ctx context.Context, typeKey, ownerType, ownerID, operatorID, operatorRole string) ([]MediaFileMeta, error) {
	ownerType = strings.TrimSpace(ownerType)
	ownerID = normalizeOwnerID(ownerType, ownerID)

	if err := s.validateStoredFileAccess(ctx, ownerType, ownerID, operatorID, operatorRole); err != nil {
		return nil, err
	}

	var files []entity.MediaFile
	if err := s.db.WithContext(ctx).
		Where("type_key = ? AND owner_type = ? AND owner_id = ?", typeKey, ownerType, ownerID).
		Order("slot ASC, created_at ASC").
		Find(&files).Error; err != nil {
		return nil, gerror.NewCode(code.CodeInternalError, err.Error())
	}

	items := make([]MediaFileMeta, 0, len(files))
	for _, file := range files {
		items = append(items, MediaFileMeta{
			ID:          file.ID,
			TypeKey:     file.TypeKey,
			OwnerType:   file.OwnerType,
			OwnerID:     file.OwnerID,
			Slot:        file.Slot,
			DisplayName: file.DisplayName,
			Remark:      file.Remark,
			Filename:    file.Filename,
			ContentType: file.ContentType,
			SizeBytes:   file.SizeBytes,
			Hash:        file.Hash,
			CreatedAt:   file.CreatedAt,
			UpdatedAt:   file.UpdatedAt,
		})
	}
	return items, nil
}

func (s *serviceImpl) GetDefinitions(ctx context.Context) ([]*entity.MediaTypeDefinition, error) {
	var defs []*entity.MediaTypeDefinition
	if err := s.db.WithContext(ctx).Order("sort_order ASC, key ASC").Find(&defs).Error; err != nil {
		return nil, gerror.NewCode(code.CodeInternalError, err.Error())
	}
	return defs, nil
}

func (s *serviceImpl) GetServeMeta(ctx context.Context, fileID string) (*ServeMeta, error) {
	var meta ServeMeta
	err := s.db.WithContext(ctx).
		Table("media_files AS mf").
		Select("mf.hash, mf.content_type, mf.filename, mf.type_key, mf.size_bytes, mtd.is_public").
		Joins("JOIN media_type_definitions AS mtd ON mtd.key = mf.type_key").
		Where("mf.id = ?", fileID).
		Take(&meta).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, gerror.NewCode(code.CodeNotFound, "media file not found")
		}
		return nil, gerror.NewCode(code.CodeInternalError, err.Error())
	}
	return &meta, nil
}

func (s *serviceImpl) GetFileData(ctx context.Context, fileID string) ([]byte, error) {
	var file entity.MediaFile
	if err := s.db.WithContext(ctx).Select("data").Where("id = ?", fileID).Take(&file).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, gerror.NewCode(code.CodeNotFound, "media file not found")
		}
		return nil, gerror.NewCode(code.CodeInternalError, err.Error())
	}
	return file.Data, nil
}

func (s *serviceImpl) UploadUserAvatar(ctx context.Context, userID, filename string, data []byte) (*UploadResult, error) {
	return s.Upload(ctx, UploadReq{
		TypeKey:      "user.avatar",
		OwnerType:    "user",
		OwnerID:      userID,
		Slot:         "default",
		Filename:     filename,
		Data:         data,
		OperatorID:   userID,
		OperatorRole: "user",
	})
}

func (s *serviceImpl) DeleteUserAvatar(ctx context.Context, userID string) error {
	var user entity.User
	if err := s.db.WithContext(ctx).Where("id = ?", userID).First(&user).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return gerror.NewCode(code.CodeNotFound, "user not found")
		}
		return gerror.NewCode(code.CodeInternalError, err.Error())
	}
	if user.AvatarMediaID == nil || strings.TrimSpace(*user.AvatarMediaID) == "" {
		return nil
	}
	return s.Delete(ctx, *user.AvatarMediaID, userID, "user")
}

func (s *serviceImpl) UploadSystemSound(ctx context.Context, slot, filename, displayName, remark string, data []byte) (*UploadResult, error) {
	return s.Upload(ctx, UploadReq{
		TypeKey:      "system.sound",
		OwnerType:    "system",
		OwnerID:      "",
		Slot:         slot,
		DisplayName:  displayName,
		Remark:       remark,
		Filename:     filename,
		Data:         data,
		OperatorID:   "system",
		OperatorRole: "admin",
	})
}

func (s *serviceImpl) SeedSystemSounds(ctx context.Context, soundFS fs.FS) error {
	type seedItem struct {
		Path string
		Slot string
	}

	seeds := []seedItem{
		{Path: "sounds/click.wav", Slot: "key"},
		{Path: "sounds/beep.wav", Slot: "error"},
		{Path: "sounds/correct.wav", Slot: "success"},
	}

	for _, item := range seeds {
		data, err := fs.ReadFile(soundFS, item.Path)
		if err != nil {
			return gerror.NewCode(code.CodeInternalError, fmt.Sprintf("read default sound %s: %v", item.Path, err))
		}
		filename := item.Path
		if idx := strings.LastIndex(item.Path, "/"); idx >= 0 {
			filename = item.Path[idx+1:]
		}
		if _, err = s.UploadSystemSound(ctx, item.Slot, filename, defaultSystemSoundName(item.Slot), "系统默认音效", data); err != nil {
			return err
		}
	}

	keySoundEntries, err := fs.ReadDir(soundFS, "sounds/key-sound")
	if err != nil {
		return gerror.NewCode(code.CodeInternalError, fmt.Sprintf("read key-sound dir: %v", err))
	}
	for _, entry := range keySoundEntries {
		if entry.IsDir() {
			continue
		}
		path := "sounds/key-sound/" + entry.Name()
		data, readErr := fs.ReadFile(soundFS, path)
		if readErr != nil {
			return gerror.NewCode(code.CodeInternalError, fmt.Sprintf("read default key sound %s: %v", path, readErr))
		}
		slot := "kbd." + normalizeKeySoundSlot(entry.Name())
		if _, readErr = s.Upload(ctx, UploadReq{
			TypeKey:      "system.keysound",
			OwnerType:    "system",
			OwnerID:      "",
			Slot:         slot,
			DisplayName:  keySoundDisplayName(entry.Name()),
			Remark:       "系统预置键盘音色",
			Filename:     entry.Name(),
			Data:         data,
			OperatorID:   "system",
			OperatorRole: "admin",
		}); readErr != nil {
			return readErr
		}
	}

	return nil
}

func (s *serviceImpl) GetSystemSounds(ctx context.Context) (*SystemSoundCatalog, error) {
	var files []entity.MediaFile
	if err := s.db.WithContext(ctx).
		Where("owner_type = ? AND owner_id = ? AND type_key IN ?", "system", "", []string{"system.sound", "system.keysound"}).
		Order("type_key ASC, slot ASC").
		Find(&files).Error; err != nil {
		return nil, gerror.NewCode(code.CodeInternalError, err.Error())
	}

	result := &SystemSoundCatalog{
		Effects: map[string]*MediaLink{
			"key":     nil,
			"error":   nil,
			"success": nil,
		},
		Keyboards: make([]*MediaLink, 0),
	}

	for _, file := range files {
		item := &MediaLink{
			Identifier:  file.ID,
			FileID:      file.ID,
			URL:         mediaURL(file.ID),
			DisplayName: file.DisplayName,
			Remark:      file.Remark,
		}
		if file.TypeKey == "system.sound" {
			result.Effects[file.Slot] = item
			continue
		}
		result.Keyboards = append(result.Keyboards, item)
	}
	return result, nil
}

func (s *serviceImpl) afterUpload(ctx context.Context, tx *gorm.DB, typeKey, ownerID, fileID string) error {
	if typeKey != "user.avatar" {
		return nil
	}
	if err := tx.Model(&entity.User{}).Where("id = ?", ownerID).Update("avatar_media_id", fileID).Error; err != nil {
		return gerror.NewCode(code.CodeInternalError, err.Error())
	}
	return nil
}

func (s *serviceImpl) getDefinition(ctx context.Context, typeKey string) (*entity.MediaTypeDefinition, error) {
	var def entity.MediaTypeDefinition
	if err := s.db.WithContext(ctx).Where("key = ?", typeKey).First(&def).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, gerror.NewCode(code.CodeNotFound, "media type not found")
		}
		return nil, gerror.NewCode(code.CodeInternalError, err.Error())
	}
	return &def, nil
}

func (s *serviceImpl) validateUploadTarget(ctx context.Context, def *entity.MediaTypeDefinition, ownerType, ownerID, operatorID, operatorRole string) error {
	switch def.OwnerScope {
	case "user":
		if ownerType != "user" || ownerID == "" {
			return gerror.NewCode(code.CodeBadRequest, "user media requires owner_type=user and owner_id")
		}
		return s.assertUserAccess(ctx, ownerID, operatorID, operatorRole)
	case "system":
		if ownerType != "system" {
			return gerror.NewCode(code.CodeBadRequest, "system media requires owner_type=system")
		}
		if operatorRole != "admin" {
			return gerror.NewCode(code.CodeAdminRequired)
		}
		return nil
	case "content":
		if ownerType == "" || ownerID == "" {
			return gerror.NewCode(code.CodeBadRequest, "content media requires owner_type and owner_id")
		}
		return s.assertContentAccess(ctx, ownerType, ownerID, operatorID, operatorRole)
	default:
		return gerror.NewCode(code.CodeBadRequest, "unsupported media owner scope")
	}
}

func (s *serviceImpl) validateStoredFileAccess(ctx context.Context, ownerType, ownerID, operatorID, operatorRole string) error {
	if operatorRole == "admin" {
		return nil
	}

	switch ownerType {
	case "user":
		return s.assertUserAccess(ctx, ownerID, operatorID, operatorRole)
	case "system":
		return gerror.NewCode(code.CodeForbidden, "system media requires admin access")
	case "word", "sentence", "article":
		return s.assertContentAccess(ctx, ownerType, ownerID, operatorID, operatorRole)
	default:
		return gerror.NewCode(code.CodeForbidden, "access denied")
	}
}

func (s *serviceImpl) assertUserAccess(ctx context.Context, targetUserID, operatorID, operatorRole string) error {
	var count int64
	if err := s.db.WithContext(ctx).Model(&entity.User{}).Where("id = ?", targetUserID).Count(&count).Error; err != nil {
		return gerror.NewCode(code.CodeInternalError, err.Error())
	}
	if count == 0 {
		return gerror.NewCode(code.CodeNotFound, "user not found")
	}
	if operatorRole == "admin" || targetUserID == operatorID {
		return nil
	}
	return gerror.NewCode(code.CodeForbidden, "access denied")
}

func (s *serviceImpl) assertContentAccess(ctx context.Context, ownerType, ownerID, operatorID, operatorRole string) error {
	if operatorRole == "admin" {
		return nil
	}
	contentOwnerID, err := s.lookupContentOwnerID(ctx, ownerType, ownerID)
	if err != nil {
		return err
	}
	if contentOwnerID != operatorID {
		return gerror.NewCode(code.CodeForbidden, "access denied")
	}
	return nil
}

func (s *serviceImpl) lookupContentOwnerID(ctx context.Context, ownerType, ownerID string) (string, error) {
	type ownerRow struct {
		OwnerID string `gorm:"column:owner_id"`
	}

	var row ownerRow
	var err error

	switch ownerType {
	case "word":
		err = s.db.WithContext(ctx).
			Table("words AS w").
			Select("wb.owner_id").
			Joins("JOIN word_banks AS wb ON wb.id = w.bank_id").
			Where("w.id = ?", ownerID).
			Take(&row).Error
	case "sentence":
		err = s.db.WithContext(ctx).
			Table("sentences AS s").
			Select("sb.owner_id").
			Joins("JOIN sentence_banks AS sb ON sb.id = s.bank_id").
			Where("s.id = ?", ownerID).
			Take(&row).Error
	case "article":
		err = s.db.WithContext(ctx).
			Table("articles AS a").
			Select("ab.owner_id").
			Joins("JOIN article_banks AS ab ON ab.id = a.bank_id").
			Where("a.id = ?", ownerID).
			Take(&row).Error
	default:
		return "", gerror.NewCode(code.CodeBadRequest, "unsupported content owner type")
	}

	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return "", gerror.NewCode(code.CodeNotFound, fmt.Sprintf("%s not found", ownerType))
		}
		return "", gerror.NewCode(code.CodeInternalError, err.Error())
	}
	return row.OwnerID, nil
}

func normalizeOwnerID(ownerType, ownerID string) string {
	if strings.TrimSpace(ownerType) == "system" {
		return ""
	}
	return strings.TrimSpace(ownerID)
}

func parseAllowedMimeTypes(raw string) ([]string, error) {
	var items []string
	if err := json.Unmarshal([]byte(raw), &items); err != nil {
		return nil, err
	}
	for i := range items {
		items[i] = normalizeContentType(items[i])
	}
	return items, nil
}

func isAllowedContentType(contentType string, allowed []string) bool {
	for _, item := range allowed {
		if item == contentType {
			return true
		}
	}
	return false
}

func normalizeContentType(contentType string) string {
	contentType = strings.ToLower(strings.TrimSpace(strings.Split(contentType, ";")[0]))
	switch contentType {
	case "audio/wave", "audio/x-wav":
		return "audio/wav"
	case "application/ogg":
		return "audio/ogg"
	case "image/jpg":
		return "image/jpeg"
	default:
		return contentType
	}
}

func mediaURL(fileID string) string {
	return "/api/v1/media/" + fileID
}

func defaultSystemSoundName(slot string) string {
	switch slot {
	case "key":
		return "按键音"
	case "error":
		return "错误音"
	case "success":
		return "完成音"
	default:
		return slot
	}
}

func normalizeKeySoundSlot(filename string) string {
	name := strings.TrimSpace(filename)
	if idx := strings.LastIndex(name, "."); idx > 0 {
		name = name[:idx]
	}
	name = strings.ToLower(name)
	name = strings.ReplaceAll(name, " ", "_")
	name = strings.ReplaceAll(name, "-", "_")
	return name
}

func keySoundDisplayName(filename string) string {
	name := strings.TrimSpace(filename)
	if idx := strings.LastIndex(name, "."); idx > 0 {
		name = name[:idx]
	}
	return name
}

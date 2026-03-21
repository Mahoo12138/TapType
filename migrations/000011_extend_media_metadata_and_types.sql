-- +goose Up
-- +goose StatementBegin
ALTER TABLE media_files ADD COLUMN display_name TEXT NOT NULL DEFAULT '';
ALTER TABLE media_files ADD COLUMN remark TEXT NOT NULL DEFAULT '';

UPDATE media_type_definitions SET is_public = 1 WHERE key = 'system.sound';

INSERT OR IGNORE INTO media_type_definitions
    (key, label, description, owner_scope, allowed_mime_types, max_size_bytes, max_count, is_public, sort_order, created_at)
VALUES
    ('system.keysound',
     '系统键盘音效', '系统自带键盘音色，供用户选择',
     'system', '["audio/mpeg","audio/ogg","audio/wav","audio/webm"]',
     524288, 0, 1, 25, datetime('now')),

    ('system.logo',
     '站点 Logo', '站点默认 Logo 图像',
     'system', '["image/jpeg","image/png","image/webp","image/svg+xml"]',
     524288, 1, 1, 26, datetime('now')),

    ('user.keysound',
     '用户自定义键盘音效', '用户自行上传的键盘音色',
     'user', '["audio/mpeg","audio/ogg","audio/wav","audio/webm"]',
     524288, 20, 0, 35, datetime('now'));
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
DELETE FROM media_type_definitions WHERE key IN ('system.keysound', 'system.logo', 'user.keysound');
ALTER TABLE media_files DROP COLUMN remark;
ALTER TABLE media_files DROP COLUMN display_name;
-- +goose StatementEnd

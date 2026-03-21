-- +goose Up
INSERT INTO media_type_definitions
    (key, label, description, owner_scope, allowed_mime_types, max_size_bytes, max_count, is_public, sort_order, created_at)
VALUES
    ('user.avatar',
     '用户头像', NULL,
     'user', '["image/jpeg","image/png","image/webp","image/gif"]',
     262144, 1, 1, 10, datetime('now')),

    ('system.sound',
     '系统音效', '打字练习音效，通过 slot 区分：key / error / success',
     'system', '["audio/mpeg","audio/ogg","audio/wav","audio/webm"]',
        262144, 0, 1, 20, datetime('now')),

    ('word.image',
     '单词配图', '辅助单词记忆的图片，每个单词最多 3 张',
     'content', '["image/jpeg","image/png","image/webp"]',
     262144, 3, 1, 30, datetime('now')),

    ('article.cover',
     '文章封面', NULL,
     'content', '["image/jpeg","image/png","image/webp"]',
     262144, 1, 1, 40, datetime('now'));

-- +goose Down
DELETE FROM media_type_definitions
WHERE key IN ('user.avatar','system.sound','word.image','article.cover');
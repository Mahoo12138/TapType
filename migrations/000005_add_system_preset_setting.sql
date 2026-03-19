-- +goose Up
INSERT INTO setting_definitions
    (key, scope, type, group_key, label, description, default_value, enum_options, validation_rule, is_public, sort_order, created_at, updated_at)
VALUES
    ('system.owner_user_id',
     'system', 'string', 'security',
     '站点管理员用户 ID', '首个站长用户 ID；为空表示需要初始化站长账户',
     '', NULL, NULL,
     1, 5, datetime('now'), datetime('now'));

-- +goose Down
DELETE FROM setting_definitions WHERE key = 'system.owner_user_id';

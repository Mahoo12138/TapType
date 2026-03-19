-- +goose Up
INSERT INTO setting_definitions
    (key, scope, type, group_key, label, description, default_value, enum_options, validation_rule, is_public, sort_order, created_at, updated_at)
VALUES
-- ============================================================
-- System settings (scope = 'system')
-- ============================================================
('system.allow_register',
 'system','bool','security',
 '允许公开注册','关闭后只有管理员可创建新用户',
 'true', NULL, NULL, 0, 10, datetime('now'), datetime('now')),

('system.allow_username_change',
 'system','bool','security',
 '允许修改用户名','关闭后用户不可自行修改用户名',
 'true', NULL, NULL, 0, 20, datetime('now'), datetime('now')),

('system.allow_nickname_change',
 'system','bool','security',
 '允许修改昵称','关闭后用户不可自行修改显示昵称',
 'true', NULL, NULL, 0, 30, datetime('now'), datetime('now')),

('system.site_host',
 'system','string','general',
 '站点地址','用于生成对外链接，末尾不含斜杠',
 'http://localhost:8080', NULL, '{"regex":"^https?://"}', 0, 40, datetime('now'), datetime('now')),

('system.max_word_banks_per_user',
 'system','int','limits',
 '每用户词库上限','每个用户最多可创建的词库数量，0 表示不限制',
 '20', NULL, '{"min":0,"max":1000}', 0, 50, datetime('now'), datetime('now')),

('system.max_sentence_banks_per_user',
 'system','int','limits',
 '每用户句库上限','每个用户最多可创建的句库数量，0 表示不限制',
 '20', NULL, '{"min":0,"max":1000}', 0, 60, datetime('now'), datetime('now')),

('system.max_words_per_bank',
 'system','int','limits',
 '每词库单词上限','单个词库最多容纳的单词数，0 表示不限制',
 '5000', NULL, '{"min":0,"max":100000}', 0, 70, datetime('now'), datetime('now')),

-- ============================================================
-- User settings (scope = 'user') — Display & appearance
-- ============================================================
('user.language',
 'user','enum','display',
 '界面语言',NULL,
 'zh-CN', '["zh-CN","en-US"]', NULL, 1, 10, datetime('now'), datetime('now')),

('user.theme',
 'user','enum','display',
 '主题','light=浅色，dark=深色，system=跟随系统',
 'system', '["light","dark","system"]', NULL, 1, 20, datetime('now'), datetime('now')),

('user.font_size',
 'user','enum','display',
 '字体大小',NULL,
 'medium', '["small","medium","large"]', NULL, 1, 30, datetime('now'), datetime('now')),

-- ============================================================
-- User settings (scope = 'user') — Practice preferences
-- ============================================================
('user.practice.show_wpm',
 'user','bool','practice',
 '练习时显示 WPM','关闭后练习中不显示实时速度',
 'true', NULL, NULL, 1, 100, datetime('now'), datetime('now')),

('user.practice.show_accuracy',
 'user','bool','practice',
 '练习时显示准确率',NULL,
 'true', NULL, NULL, 1, 110, datetime('now'), datetime('now')),

('user.practice.show_timer',
 'user','bool','practice',
 '练习时显示计时器',NULL,
 'true', NULL, NULL, 1, 120, datetime('now'), datetime('now')),

('user.practice.enable_sound',
 'user','bool','practice',
 '按键音效','启用后每次击键播放音效',
 'false', NULL, NULL, 1, 130, datetime('now'), datetime('now')),

('user.practice.enable_pronunciation',
 'user','bool','practice',
 '自动发音','进入下一个单词时自动播放发音',
 'false', NULL, NULL, 1, 140, datetime('now'), datetime('now')),

('user.practice.pronunciation_voice',
 'user','enum','practice',
 '发音音色','朗读单词时使用的语音',
 'en-US', '["en-US","en-GB","en-AU"]', NULL, 1, 150, datetime('now'), datetime('now')),

('user.practice.auto_next',
 'user','bool','practice',
 '自动进入下一题','当前项目完成后自动跳转，无需手动确认',
 'false', NULL, NULL, 1, 160, datetime('now'), datetime('now')),

('user.practice.show_keyboard_hint',
 'user','bool','practice',
 '显示键位提示','在屏幕底部显示虚拟键盘，高亮下一个待输入键',
 'false', NULL, NULL, 1, 170, datetime('now'), datetime('now')),

('user.practice.mistake_behavior',
 'user','enum','practice',
 '出错时行为','stop=停留在错误字符；continue=继续输入覆盖',
 'stop', '["stop","continue"]', NULL, 1, 180, datetime('now'), datetime('now'));

-- +goose Down
DELETE FROM setting_definitions WHERE key LIKE 'system.%' OR key LIKE 'user.%';

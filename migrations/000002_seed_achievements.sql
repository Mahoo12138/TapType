-- +goose Up
INSERT INTO achievements (id, key, name, description, icon, condition, created_at) VALUES
    ('ach-001', 'first_practice', '初次练习', '完成第一次打字练习',   'trophy',  '{"type":"practice_count","value":1}',  datetime('now')),
    ('ach-002', 'streak_3',       '坚持 3 天', '连续练习 3 天',        'fire',    '{"type":"streak","value":3}',          datetime('now')),
    ('ach-003', 'streak_7',       '一周连击',  '连续练习 7 天',        'flame',   '{"type":"streak","value":7}',          datetime('now')),
    ('ach-004', 'streak_30',      '月度达人',  '连续练习 30 天',       'medal',   '{"type":"streak","value":30}',         datetime('now')),
    ('ach-005', 'wpm_60',         '速度突破',  '单次练习 WPM 达到 60', 'bolt',    '{"type":"best_wpm","value":60}',       datetime('now')),
    ('ach-006', 'wpm_100',        '百字飞手',  '单次练习 WPM 达到 100','rocket',  '{"type":"best_wpm","value":100}',      datetime('now')),
    ('ach-007', 'accuracy_99',    '完美主义',  '单次准确率达到 99%',   'target',  '{"type":"accuracy","value":0.99}',     datetime('now')),
    ('ach-008', 'words_1000',     '千词达成',  '累计练习超过 1000 个词','book',   '{"type":"word_count","value":1000}',   datetime('now'));

-- +goose Down
DELETE FROM achievements WHERE key IN (
    'first_practice','streak_3','streak_7','streak_30',
    'wpm_60','wpm_100','accuracy_99','words_1000'
);

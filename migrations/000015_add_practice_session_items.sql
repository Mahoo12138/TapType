-- +goose Up
-- +goose StatementBegin
CREATE TABLE IF NOT EXISTS practice_session_items (
    id           TEXT PRIMARY KEY,
    session_id   TEXT NOT NULL,
    item_order   INTEGER NOT NULL,
    content_type TEXT NOT NULL,
    content_id   TEXT NOT NULL,
    created_at   DATETIME NOT NULL,
    UNIQUE(session_id, item_order)
);

CREATE INDEX IF NOT EXISTS idx_practice_session_items_session_order ON practice_session_items(session_id, item_order);
CREATE INDEX IF NOT EXISTS idx_practice_session_items_content ON practice_session_items(content_type, content_id);
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
DROP TABLE IF EXISTS practice_session_items;
-- +goose StatementEnd
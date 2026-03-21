-- +goose Up
-- +goose StatementBegin
ALTER TABLE practice_sessions ADD COLUMN item_count INTEGER NOT NULL DEFAULT 0;
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
-- SQLite does not support DROP COLUMN in older versions; no-op for rollback
-- +goose StatementEnd

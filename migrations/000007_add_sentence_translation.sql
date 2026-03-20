-- +goose Up
ALTER TABLE sentences ADD COLUMN translation        TEXT;
ALTER TABLE sentences ADD COLUMN translation_source TEXT NOT NULL DEFAULT 'manual';

-- +goose Down
ALTER TABLE sentences DROP COLUMN translation_source;
ALTER TABLE sentences DROP COLUMN translation;

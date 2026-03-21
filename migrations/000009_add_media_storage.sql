-- +goose Up
-- +goose StatementBegin
CREATE TABLE IF NOT EXISTS media_type_definitions (
    key                TEXT PRIMARY KEY,
    label              TEXT NOT NULL,
    description        TEXT,
    owner_scope        TEXT NOT NULL CHECK(owner_scope IN ('user','system','content')),
    allowed_mime_types TEXT NOT NULL,
    max_size_bytes     INTEGER NOT NULL DEFAULT 262144,
    max_count          INTEGER NOT NULL DEFAULT 1,
    is_public          INTEGER NOT NULL DEFAULT 1,
    sort_order         INTEGER NOT NULL DEFAULT 0,
    created_at         DATETIME NOT NULL
);

CREATE TABLE IF NOT EXISTS media_files (
    id           TEXT PRIMARY KEY,
    type_key     TEXT NOT NULL REFERENCES media_type_definitions(key),
    owner_type   TEXT NOT NULL,
    owner_id     TEXT NOT NULL DEFAULT '',
    slot         TEXT NOT NULL DEFAULT 'default',
    filename     TEXT NOT NULL,
    content_type TEXT NOT NULL,
    data         BLOB NOT NULL,
    size_bytes   INTEGER NOT NULL,
    hash         TEXT NOT NULL,
    created_at   DATETIME NOT NULL,
    updated_at   DATETIME NOT NULL,
    UNIQUE(type_key, owner_type, owner_id, slot)
);

CREATE INDEX IF NOT EXISTS idx_media_files_owner ON media_files(owner_type, owner_id);
CREATE INDEX IF NOT EXISTS idx_media_files_type ON media_files(type_key);
CREATE INDEX IF NOT EXISTS idx_media_files_hash ON media_files(hash);

ALTER TABLE users ADD COLUMN avatar_media_id TEXT REFERENCES media_files(id);
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
ALTER TABLE users DROP COLUMN avatar_media_id;
DROP TABLE IF EXISTS media_files;
DROP TABLE IF EXISTS media_type_definitions;
-- +goose StatementEnd
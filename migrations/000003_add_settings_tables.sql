-- +goose Up
-- +goose StatementBegin

-- Setting definitions: schema for all settings, managed by developers via migrations, read-only at runtime
CREATE TABLE IF NOT EXISTS setting_definitions (
    key             TEXT PRIMARY KEY,
    scope           TEXT NOT NULL CHECK(scope IN ('system', 'user')),
    type            TEXT NOT NULL CHECK(type IN ('bool','string','int','float','enum','json')),
    group_key       TEXT NOT NULL DEFAULT 'general',
    label           TEXT NOT NULL,
    description     TEXT,
    default_value   TEXT NOT NULL,
    enum_options    TEXT,
    validation_rule TEXT,
    is_public       INTEGER NOT NULL DEFAULT 1,
    sort_order      INTEGER NOT NULL DEFAULT 0,
    created_at      DATETIME NOT NULL,
    updated_at      DATETIME NOT NULL
);

-- System-level setting values, one row per key, admin-managed
CREATE TABLE IF NOT EXISTS system_settings (
    id              TEXT PRIMARY KEY,
    definition_key  TEXT NOT NULL UNIQUE,
    value           TEXT NOT NULL,
    updated_by      TEXT NOT NULL,
    updated_at      DATETIME NOT NULL
);

-- User-level setting values, one row per user per key
CREATE TABLE IF NOT EXISTS user_settings (
    id              TEXT PRIMARY KEY,
    user_id         TEXT NOT NULL,
    definition_key  TEXT NOT NULL,
    value           TEXT NOT NULL,
    updated_at      DATETIME NOT NULL,
    UNIQUE(user_id, definition_key)
);

CREATE INDEX IF NOT EXISTS idx_user_settings_user ON user_settings(user_id);

-- Admin controls over user-scope settings visibility/editability
CREATE TABLE IF NOT EXISTS setting_controls (
    id              TEXT PRIMARY KEY,
    definition_key  TEXT NOT NULL UNIQUE,
    is_visible      INTEGER NOT NULL DEFAULT 1,
    is_editable     INTEGER NOT NULL DEFAULT 1,
    updated_by      TEXT NOT NULL,
    updated_at      DATETIME NOT NULL
);

-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
DROP TABLE IF EXISTS setting_controls;
DROP TABLE IF EXISTS user_settings;
DROP TABLE IF EXISTS system_settings;
DROP TABLE IF EXISTS setting_definitions;
-- +goose StatementEnd

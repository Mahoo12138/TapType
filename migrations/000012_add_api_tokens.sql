-- +goose Up
CREATE TABLE api_tokens (
    id          TEXT PRIMARY KEY,
    user_id     TEXT NOT NULL,
    name        TEXT NOT NULL DEFAULT '',
    token_hash  TEXT NOT NULL,
    prefix      TEXT NOT NULL DEFAULT '',
    scopes      TEXT NOT NULL DEFAULT '*',
    expires_at  TIMESTAMP NULL,
    last_used_at TIMESTAMP NULL,
    is_active   INTEGER NOT NULL DEFAULT 1,
    created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_api_tokens_user_id ON api_tokens(user_id);
CREATE UNIQUE INDEX idx_api_tokens_token_hash ON api_tokens(token_hash);
CREATE INDEX idx_api_tokens_prefix ON api_tokens(prefix);

-- +goose Down
DROP TABLE IF EXISTS api_tokens;

-- +goose Up
-- +goose StatementBegin
CREATE TABLE IF NOT EXISTS users (
    id            TEXT PRIMARY KEY,
    username      TEXT NOT NULL UNIQUE,
    email         TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role          TEXT NOT NULL DEFAULT 'user',
    is_active     INTEGER NOT NULL DEFAULT 1,
    created_at    DATETIME NOT NULL,
    updated_at    DATETIME NOT NULL,
    deleted_at    DATETIME
);

CREATE TABLE IF NOT EXISTS word_banks (
    id          TEXT PRIMARY KEY,
    owner_id    TEXT NOT NULL,
    name        TEXT NOT NULL,
    description TEXT,
    is_public   INTEGER NOT NULL DEFAULT 0,
    created_at  DATETIME NOT NULL,
    updated_at  DATETIME NOT NULL,
    deleted_at  DATETIME
);

CREATE TABLE IF NOT EXISTS words (
    id               TEXT PRIMARY KEY,
    bank_id          TEXT NOT NULL,
    content          TEXT NOT NULL,
    pronunciation    TEXT,
    definition       TEXT,
    example_sentence TEXT,
    difficulty       INTEGER NOT NULL DEFAULT 1,
    tags             TEXT,
    created_at       DATETIME NOT NULL,
    updated_at       DATETIME NOT NULL
);

CREATE TABLE IF NOT EXISTS sentence_banks (
    id          TEXT PRIMARY KEY,
    owner_id    TEXT NOT NULL,
    name        TEXT NOT NULL,
    category    TEXT,
    is_public   INTEGER NOT NULL DEFAULT 0,
    created_at  DATETIME NOT NULL,
    updated_at  DATETIME NOT NULL,
    deleted_at  DATETIME
);

CREATE TABLE IF NOT EXISTS sentences (
    id          TEXT PRIMARY KEY,
    bank_id     TEXT NOT NULL,
    content     TEXT NOT NULL,
    source      TEXT,
    difficulty  INTEGER NOT NULL DEFAULT 1,
    word_count  INTEGER NOT NULL DEFAULT 0,
    tags        TEXT,
    created_at  DATETIME NOT NULL,
    updated_at  DATETIME NOT NULL
);

CREATE TABLE IF NOT EXISTS practice_sessions (
    id           TEXT PRIMARY KEY,
    user_id      TEXT NOT NULL,
    mode         TEXT NOT NULL,
    source_type  TEXT NOT NULL,
    source_id    TEXT,
    started_at   DATETIME NOT NULL,
    ended_at     DATETIME,
    duration_ms  INTEGER,
    created_at   DATETIME NOT NULL
);

CREATE TABLE IF NOT EXISTS practice_results (
    id           TEXT PRIMARY KEY,
    session_id   TEXT NOT NULL UNIQUE,
    wpm          REAL NOT NULL,
    raw_wpm      REAL NOT NULL,
    accuracy     REAL NOT NULL,
    error_count  INTEGER NOT NULL DEFAULT 0,
    char_count   INTEGER NOT NULL DEFAULT 0,
    consistency  REAL NOT NULL DEFAULT 0.0,
    created_at   DATETIME NOT NULL
);

CREATE TABLE IF NOT EXISTS keystroke_stats (
    id              TEXT PRIMARY KEY,
    session_id      TEXT NOT NULL,
    key_char        TEXT NOT NULL,
    hit_count       INTEGER NOT NULL DEFAULT 0,
    error_count     INTEGER NOT NULL DEFAULT 0,
    avg_interval_ms INTEGER NOT NULL DEFAULT 0,
    created_at      DATETIME NOT NULL
);

CREATE TABLE IF NOT EXISTS error_records (
    id                TEXT PRIMARY KEY,
    user_id           TEXT NOT NULL,
    session_id        TEXT NOT NULL,
    content_type      TEXT NOT NULL,
    content_id        TEXT NOT NULL,
    error_count       INTEGER NOT NULL DEFAULT 1,
    avg_time_ms       INTEGER NOT NULL DEFAULT 0,
    last_seen_at      DATETIME NOT NULL,
    next_review_at    DATETIME NOT NULL,
    review_interval   INTEGER NOT NULL DEFAULT 1,
    easiness_factor   REAL NOT NULL DEFAULT 2.5,
    created_at        DATETIME NOT NULL,
    updated_at        DATETIME NOT NULL,
    UNIQUE(user_id, content_type, content_id)
);

CREATE TABLE IF NOT EXISTS user_goals (
    id             TEXT PRIMARY KEY,
    user_id        TEXT NOT NULL,
    goal_type      TEXT NOT NULL,
    target_value   REAL NOT NULL,
    current_value  REAL NOT NULL DEFAULT 0,
    period         TEXT NOT NULL DEFAULT 'daily',
    start_date     TEXT NOT NULL,
    is_active      INTEGER NOT NULL DEFAULT 1,
    created_at     DATETIME NOT NULL,
    updated_at     DATETIME NOT NULL
);

CREATE TABLE IF NOT EXISTS daily_records (
    id                TEXT PRIMARY KEY,
    user_id           TEXT NOT NULL,
    record_date       TEXT NOT NULL,
    practice_count    INTEGER NOT NULL DEFAULT 0,
    total_duration_ms INTEGER NOT NULL DEFAULT 0,
    avg_wpm           REAL NOT NULL DEFAULT 0,
    avg_accuracy      REAL NOT NULL DEFAULT 0,
    streak_day        INTEGER NOT NULL DEFAULT 1,
    created_at        DATETIME NOT NULL,
    updated_at        DATETIME NOT NULL,
    UNIQUE(user_id, record_date)
);

CREATE TABLE IF NOT EXISTS achievements (
    id          TEXT PRIMARY KEY,
    key         TEXT NOT NULL UNIQUE,
    name        TEXT NOT NULL,
    description TEXT NOT NULL,
    icon        TEXT,
    condition   TEXT NOT NULL,
    created_at  DATETIME NOT NULL
);

CREATE TABLE IF NOT EXISTS user_achievements (
    id             TEXT PRIMARY KEY,
    user_id        TEXT NOT NULL,
    achievement_id TEXT NOT NULL,
    unlocked_at    DATETIME NOT NULL,
    UNIQUE(user_id, achievement_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_words_bank_id ON words(bank_id);
CREATE INDEX IF NOT EXISTS idx_sentences_bank_id ON sentences(bank_id);
CREATE INDEX IF NOT EXISTS idx_practice_sessions_user_id ON practice_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_practice_sessions_user_started ON practice_sessions(user_id, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_error_records_user_review ON error_records(user_id, next_review_at);
CREATE INDEX IF NOT EXISTS idx_daily_records_user_date ON daily_records(user_id, record_date DESC);
CREATE INDEX IF NOT EXISTS idx_keystroke_stats_session ON keystroke_stats(session_id);
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
DROP TABLE IF EXISTS user_achievements;
DROP TABLE IF EXISTS achievements;
DROP TABLE IF EXISTS daily_records;
DROP TABLE IF EXISTS user_goals;
DROP TABLE IF EXISTS error_records;
DROP TABLE IF EXISTS keystroke_stats;
DROP TABLE IF EXISTS practice_results;
DROP TABLE IF EXISTS practice_sessions;
DROP TABLE IF EXISTS sentences;
DROP TABLE IF EXISTS sentence_banks;
DROP TABLE IF EXISTS words;
DROP TABLE IF EXISTS word_banks;
DROP TABLE IF EXISTS users;
-- +goose StatementEnd

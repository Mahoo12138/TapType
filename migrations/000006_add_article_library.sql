-- +goose Up
-- +goose StatementBegin
CREATE TABLE IF NOT EXISTS article_banks (
    id          TEXT PRIMARY KEY,
    owner_id    TEXT NOT NULL REFERENCES users(id),
    name        TEXT NOT NULL,
    description TEXT,
    language    TEXT NOT NULL DEFAULT 'en',
    is_public   INTEGER NOT NULL DEFAULT 0,
    created_at  DATETIME NOT NULL,
    updated_at  DATETIME NOT NULL,
    deleted_at  DATETIME
);

CREATE TABLE IF NOT EXISTS articles (
    id               TEXT PRIMARY KEY,
    bank_id          TEXT NOT NULL REFERENCES article_banks(id),
    title            TEXT NOT NULL,
    author           TEXT,
    source_url       TEXT,
    content          TEXT NOT NULL,
    paragraph_count  INTEGER NOT NULL DEFAULT 0,
    total_char_count INTEGER NOT NULL DEFAULT 0,
    difficulty       INTEGER NOT NULL DEFAULT 1,
    tags             TEXT,
    created_at       DATETIME NOT NULL,
    updated_at       DATETIME NOT NULL
);

CREATE TABLE IF NOT EXISTS article_paragraphs (
    id              TEXT PRIMARY KEY,
    article_id      TEXT NOT NULL REFERENCES articles(id),
    paragraph_index INTEGER NOT NULL,
    content         TEXT NOT NULL,
    char_count      INTEGER NOT NULL,
    sentence_count  INTEGER NOT NULL DEFAULT 0,
    created_at      DATETIME NOT NULL,
    UNIQUE(article_id, paragraph_index)
);

CREATE TABLE IF NOT EXISTS article_sentences (
    id                 TEXT PRIMARY KEY,
    paragraph_id       TEXT NOT NULL REFERENCES article_paragraphs(id),
    sentence_index     INTEGER NOT NULL,
    content            TEXT NOT NULL,
    translation        TEXT,
    translation_source TEXT NOT NULL DEFAULT 'manual',
    created_at         DATETIME NOT NULL,
    updated_at         DATETIME NOT NULL,
    UNIQUE(paragraph_id, sentence_index)
);

CREATE TABLE IF NOT EXISTS user_article_progress (
    id                   TEXT PRIMARY KEY,
    user_id              TEXT NOT NULL REFERENCES users(id),
    article_id           TEXT NOT NULL REFERENCES articles(id),
    completed_paragraphs INTEGER NOT NULL DEFAULT 0,
    total_paragraphs     INTEGER NOT NULL,
    status               TEXT NOT NULL DEFAULT 'not_started',
    last_practiced_at    DATETIME,
    completed_at         DATETIME,
    created_at           DATETIME NOT NULL,
    updated_at           DATETIME NOT NULL,
    UNIQUE(user_id, article_id)
);

CREATE INDEX IF NOT EXISTS idx_articles_bank_id             ON articles(bank_id);
CREATE INDEX IF NOT EXISTS idx_article_paragraphs_article   ON article_paragraphs(article_id);
CREATE INDEX IF NOT EXISTS idx_article_sentences_paragraph  ON article_sentences(paragraph_id);
CREATE INDEX IF NOT EXISTS idx_user_article_progress_user   ON user_article_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_article_progress_status ON user_article_progress(user_id, status);
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
DROP TABLE IF EXISTS user_article_progress;
DROP TABLE IF EXISTS article_sentences;
DROP TABLE IF EXISTS article_paragraphs;
DROP TABLE IF EXISTS articles;
DROP TABLE IF EXISTS article_banks;
-- +goose StatementEnd

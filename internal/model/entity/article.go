package entity

import (
	"time"

	"gorm.io/gorm"
)

// ArticleBank — 文章库
type ArticleBank struct {
	ID          string         `gorm:"primaryKey;type:text" json:"id"`
	OwnerID     string         `gorm:"type:text;not null" json:"owner_id"`
	Name        string         `gorm:"type:text;not null" json:"name"`
	Description string         `gorm:"type:text" json:"description"`
	Language    string         `gorm:"type:text;not null;default:en" json:"language"`
	IsPublic    int            `gorm:"type:integer;not null;default:0" json:"is_public"`
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
	DeletedAt   gorm.DeletedAt `gorm:"index" json:"-"`

	ArticleCount int64 `gorm:"-" json:"article_count,omitempty"`
}

func (ArticleBank) TableName() string { return "article_banks" }

// Article — 文章
type Article struct {
	ID             string    `gorm:"primaryKey;type:text" json:"id"`
	BankID         string    `gorm:"type:text;not null;index" json:"bank_id"`
	Title          string    `gorm:"type:text;not null" json:"title"`
	Author         string    `gorm:"type:text" json:"author"`
	SourceURL      string    `gorm:"type:text" json:"source_url"`
	Content        string    `gorm:"type:text;not null" json:"content,omitempty"`
	ParagraphCount int       `gorm:"type:integer;not null;default:0" json:"paragraph_count"`
	TotalCharCount int       `gorm:"type:integer;not null;default:0" json:"total_char_count"`
	Difficulty     int       `gorm:"type:integer;not null;default:1" json:"difficulty"`
	Tags           string    `gorm:"type:text" json:"tags"`
	CreatedAt      time.Time `json:"created_at"`
	UpdatedAt      time.Time `json:"updated_at"`
}

func (Article) TableName() string { return "articles" }

// ArticleParagraph — 段落（练习单位）
type ArticleParagraph struct {
	ID             string    `gorm:"primaryKey;type:text" json:"id"`
	ArticleID      string    `gorm:"type:text;not null;index" json:"article_id"`
	ParagraphIndex int       `gorm:"type:integer;not null" json:"paragraph_index"`
	Content        string    `gorm:"type:text;not null" json:"content"`
	CharCount      int       `gorm:"type:integer;not null" json:"char_count"`
	SentenceCount  int       `gorm:"type:integer;not null;default:0" json:"sentence_count"`
	CreatedAt      time.Time `json:"created_at"`
}

func (ArticleParagraph) TableName() string { return "article_paragraphs" }

// ArticleSentence — 段内句子（展示单位，带释义）
type ArticleSentence struct {
	ID                string    `gorm:"primaryKey;type:text" json:"id"`
	ParagraphID       string    `gorm:"type:text;not null;index" json:"paragraph_id"`
	SentenceIndex     int       `gorm:"type:integer;not null" json:"sentence_index"`
	Content           string    `gorm:"type:text;not null" json:"content"`
	Translation       string    `gorm:"type:text" json:"translation"`
	TranslationSource string    `gorm:"type:text;not null;default:manual" json:"translation_source"`
	CreatedAt         time.Time `json:"created_at"`
	UpdatedAt         time.Time `json:"updated_at"`
}

func (ArticleSentence) TableName() string { return "article_sentences" }

// UserArticleProgress — 用户阅读进度
type UserArticleProgress struct {
	ID                  string     `gorm:"primaryKey;type:text" json:"id"`
	UserID              string     `gorm:"type:text;not null" json:"user_id"`
	ArticleID           string     `gorm:"type:text;not null" json:"article_id"`
	CompletedParagraphs int        `gorm:"type:integer;not null;default:0" json:"completed_paragraphs"`
	TotalParagraphs     int        `gorm:"type:integer;not null" json:"total_paragraphs"`
	Status              string     `gorm:"type:text;not null;default:not_started" json:"status"`
	LastPracticedAt     *time.Time `json:"last_practiced_at"`
	CompletedAt         *time.Time `json:"completed_at"`
	CreatedAt           time.Time  `json:"created_at"`
	UpdatedAt           time.Time  `json:"updated_at"`
}

func (UserArticleProgress) TableName() string { return "user_article_progress" }

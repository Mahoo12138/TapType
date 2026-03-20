package entity

import "time"

type Word struct {
	ID              string    `gorm:"primaryKey;type:text" json:"id"`
	BankID          string    `gorm:"type:text;not null;index" json:"bank_id"`
	Content         string    `gorm:"type:text;not null" json:"content"`
	Pronunciation   string    `gorm:"type:text" json:"pronunciation"`
	Definition      string    `gorm:"type:text" json:"definition"`
	ExampleSentence string    `gorm:"type:text" json:"example_sentence"`
	Difficulty      int       `gorm:"type:integer;not null;default:1" json:"difficulty"`
	Tags            string    `gorm:"type:text" json:"tags"`
	CreatedAt       time.Time `json:"created_at"`
	UpdatedAt       time.Time `json:"updated_at"`
}

func (Word) TableName() string { return "words" }

type Sentence struct {
	ID                string    `gorm:"primaryKey;type:text" json:"id"`
	BankID            string    `gorm:"type:text;not null;index" json:"bank_id"`
	Content           string    `gorm:"type:text;not null" json:"content"`
	Translation       string    `gorm:"type:text" json:"translation"`
	TranslationSource string    `gorm:"type:text;not null;default:manual" json:"translation_source"`
	Source            string    `gorm:"type:text" json:"source"`
	Difficulty        int       `gorm:"type:integer;not null;default:1" json:"difficulty"`
	WordCount         int       `gorm:"type:integer;not null;default:0" json:"word_count"`
	Tags              string    `gorm:"type:text" json:"tags"`
	CreatedAt         time.Time `json:"created_at"`
	UpdatedAt         time.Time `json:"updated_at"`
}

func (Sentence) TableName() string { return "sentences" }

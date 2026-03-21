package splitter

import (
	"testing"
)

func TestSplitParagraphsNormal(t *testing.T) {
	content := "First paragraph here with enough text.\n\nSecond paragraph also long enough.\n\nThird paragraph is great."
	result := SplitParagraphs(content)
	if len(result) != 3 {
		t.Fatalf("expected 3 paragraphs, got %d: %v", len(result), result)
	}
}

func TestSplitParagraphsSingle(t *testing.T) {
	content := "This is a single paragraph with no line breaks at all, just one continuous block of text."
	result := SplitParagraphs(content)
	if len(result) != 1 {
		t.Fatalf("expected 1 paragraph, got %d: %v", len(result), result)
	}
}

func TestSplitParagraphsMergeShort(t *testing.T) {
	content := "Title\n\nThis is a paragraph that is long enough to stand alone."
	result := SplitParagraphs(content)
	// "Title" is < 20 chars, should be merged
	if len(result) != 1 {
		t.Fatalf("expected 1 merged paragraph, got %d: %v", len(result), result)
	}
}

func TestSplitParagraphsMultipleBlankLines(t *testing.T) {
	content := "First paragraph that is definitely long.\n\n\n\n\nSecond paragraph that is also quite long."
	result := SplitParagraphs(content)
	if len(result) != 2 {
		t.Fatalf("expected 2 paragraphs, got %d: %v", len(result), result)
	}
}

func TestSplitParagraphsInlineNewlines(t *testing.T) {
	content := "First line of para one.\nSecond line of para one.\n\nSecond paragraph is also long enough here."
	result := SplitParagraphs(content)
	if len(result) != 2 {
		t.Fatalf("expected 2 paragraphs, got %d: %v", len(result), result)
	}
	// Single newlines within paragraph should become spaces
	if result[0] != "First line of para one. Second line of para one." {
		t.Fatalf("unexpected content: %s", result[0])
	}
}

func TestSplitParagraphsEmpty(t *testing.T) {
	result := SplitParagraphs("")
	if result != nil {
		t.Fatalf("expected nil, got %v", result)
	}
}

func TestSplitParagraphsWhitespaceOnly(t *testing.T) {
	result := SplitParagraphs("   \n\n  \n  ")
	if result != nil {
		t.Fatalf("expected nil, got %v", result)
	}
}

func TestSplitSentencesNormal(t *testing.T) {
	para := "Hello world. How are you? I am fine! Good to know."
	result := SplitSentences(para)
	if len(result) != 4 {
		t.Fatalf("expected 4 sentences, got %d: %v", len(result), result)
	}
}

func TestSplitSentencesChinese(t *testing.T) {
	para := "你好世界。你好吗？我很好！"
	result := SplitSentences(para)
	if len(result) != 3 {
		t.Fatalf("expected 3 sentences, got %d: %v", len(result), result)
	}
}

func TestSplitSentencesNoPunctuation(t *testing.T) {
	para := "A short phrase without ending punctuation"
	result := SplitSentences(para)
	if len(result) != 1 || result[0] != para {
		t.Fatalf("expected whole paragraph as one sentence, got %v", result)
	}
}

func TestSplitSentencesEmpty(t *testing.T) {
	result := SplitSentences("")
	if result != nil {
		t.Fatalf("expected nil, got %v", result)
	}
}

func TestSplitSentencesWithQuotes(t *testing.T) {
	para := `She said "Hello." He replied "Hi!" Then they left.`
	result := SplitSentences(para)
	if len(result) < 2 {
		t.Fatalf("expected at least 2 sentences, got %d: %v", len(result), result)
	}
}

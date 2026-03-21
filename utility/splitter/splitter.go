package splitter

import (
	"regexp"
	"strings"
	"unicode/utf8"
)

// SplitParagraphs splits by consecutive newlines, filters empty segments,
// and merges short paragraphs (<20 characters) into the previous one.
func SplitParagraphs(content string) []string {
	content = strings.TrimSpace(content)
	if content == "" {
		return nil
	}
	// Split on two or more consecutive newlines
	re := regexp.MustCompile(`\n{2,}`)
	raw := re.Split(content, -1)
	var result []string
	buf := ""
	for _, p := range raw {
		p = strings.TrimSpace(strings.ReplaceAll(p, "\n", " "))
		if p == "" {
			continue
		}
		combined := buf + p
		if utf8.RuneCountInString(combined) < 20 {
			buf = combined + " "
			continue
		}
		result = append(result, strings.TrimSpace(buf+p))
		buf = ""
	}
	if buf != "" {
		trimmed := strings.TrimSpace(buf)
		if trimmed != "" {
			if len(result) > 0 {
				result[len(result)-1] = result[len(result)-1] + " " + trimmed
			} else {
				result = append(result, trimmed)
			}
		}
	}
	return result
}

var sentenceRe = regexp.MustCompile(`[.!?。！？]+["']?\s*`)

// SplitSentences splits a single paragraph by sentence-ending punctuation.
func SplitSentences(paragraph string) []string {
	paragraph = strings.TrimSpace(paragraph)
	if paragraph == "" {
		return nil
	}
	indices := sentenceRe.FindAllStringIndex(paragraph, -1)
	if len(indices) == 0 {
		return []string{paragraph}
	}

	var result []string
	prev := 0
	for _, idx := range indices {
		segment := strings.TrimSpace(paragraph[prev:idx[1]])
		if segment != "" {
			result = append(result, segment)
		}
		prev = idx[1]
	}
	// Remaining text after last sentence-ending punctuation
	if prev < len(paragraph) {
		remaining := strings.TrimSpace(paragraph[prev:])
		if remaining != "" {
			if len(result) > 0 {
				result[len(result)-1] = result[len(result)-1] + " " + remaining
			} else {
				result = append(result, remaining)
			}
		}
	}
	return result
}

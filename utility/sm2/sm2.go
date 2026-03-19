package sm2

import (
	"math"
	"time"
)

// State holds the SM-2 spaced repetition state for a single item.
type State struct {
	Interval       int     // review interval in days
	EasinessFactor float64 // E-Factor, initial 2.5, minimum 1.3
	Repetitions    int     // consecutive correct count
}

// DefaultState returns the initial SM-2 state for a new item.
func DefaultState() State {
	return State{
		Interval:       1,
		EasinessFactor: 2.5,
		Repetitions:    0,
	}
}

// Calculate applies the SM-2 algorithm given the current state and a quality score (0-5).
// Returns the updated state and the next review time.
func Calculate(s State, quality int) (State, time.Time) {
	if quality < 0 {
		quality = 0
	}
	if quality > 5 {
		quality = 5
	}

	if quality < 3 {
		// Failed: reset repetitions, interval back to 1
		s.Repetitions = 0
		s.Interval = 1
	} else {
		// Passed: advance interval
		switch s.Repetitions {
		case 0:
			s.Interval = 1
		case 1:
			s.Interval = 6
		default:
			s.Interval = int(math.Round(float64(s.Interval) * s.EasinessFactor))
		}
		s.Repetitions++
	}

	// Update E-Factor (never below 1.3)
	ef := s.EasinessFactor + 0.1 - float64(5-quality)*(0.08+float64(5-quality)*0.02)
	s.EasinessFactor = math.Max(1.3, ef)

	nextReview := time.Now().AddDate(0, 0, s.Interval)
	return s, nextReview
}

// ScoreFromTyping maps typing practice performance to an SM-2 quality score (0-5).
//
// Mapping rules:
//   - errorCount >= 3      → 1 (severe errors)
//   - errorCount >= 1      → 2 (notable errors)
//   - 0 errors, time > 1.5× avg → 3 (correct but slow)
//   - 0 errors, time 1.0-1.5× avg → 4 (correct, slightly hesitant)
//   - 0 errors, time <= avg → 5 (perfect, fluent)
//   - avgMs == 0 (first attempt) → 4
func ScoreFromTyping(errorCount int, actualMs, avgMs int64) int {
	if errorCount >= 3 {
		return 1
	}
	if errorCount >= 1 {
		return 2
	}
	if avgMs == 0 {
		return 4
	}
	ratio := float64(actualMs) / float64(avgMs)
	switch {
	case ratio > 1.5:
		return 3
	case ratio > 1.0:
		return 4
	default:
		return 5
	}
}

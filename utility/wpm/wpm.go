package wpm

import "math"

// Result holds the computed WPM metrics for a practice session.
type Result struct {
	WPM       float64 `json:"wpm"`        // net WPM (errors deducted)
	RawWPM    float64 `json:"raw_wpm"`    // gross WPM (no deduction)
	Accuracy  float64 `json:"accuracy"`   // 0.0 - 1.0
	ElapsedMs int64   `json:"elapsed_ms"`
}

// Calculate computes WPM metrics from practice data.
//
// Standard formula:
//
//	raw_wpm = (totalChars / 5) / (durationMs / 60000)
//	net_wpm = raw_wpm - (errorCount / minutes)
//	accuracy = correctChars / totalChars
func Calculate(totalChars, correctChars, errorCount int, durationMs int64) Result {
	if durationMs <= 0 || totalChars <= 0 {
		return Result{ElapsedMs: durationMs}
	}

	minutes := float64(durationMs) / 60000.0
	rawWpm := float64(totalChars) / 5.0 / minutes
	netWpm := rawWpm - float64(errorCount)/minutes
	if netWpm < 0 {
		netWpm = 0
	}

	accuracy := float64(correctChars) / float64(totalChars)

	return Result{
		WPM:       math.Round(netWpm*10) / 10,
		RawWPM:    math.Round(rawWpm*10) / 10,
		Accuracy:  math.Round(accuracy*1000) / 1000,
		ElapsedMs: durationMs,
	}
}

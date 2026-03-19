package sm2

import (
	"testing"
	"time"
)

func TestDefaultState(t *testing.T) {
	s := DefaultState()
	if s.Interval != 1 {
		t.Errorf("expected interval 1, got %d", s.Interval)
	}
	if s.EasinessFactor != 2.5 {
		t.Errorf("expected EF 2.5, got %f", s.EasinessFactor)
	}
	if s.Repetitions != 0 {
		t.Errorf("expected repetitions 0, got %d", s.Repetitions)
	}
}

func TestCalculate_FirstCorrect(t *testing.T) {
	s := DefaultState()
	now := time.Now()

	s, next := Calculate(s, 4)

	if s.Interval != 1 {
		t.Errorf("first correct: expected interval 1, got %d", s.Interval)
	}
	if s.Repetitions != 1 {
		t.Errorf("first correct: expected repetitions 1, got %d", s.Repetitions)
	}
	if next.Before(now) {
		t.Error("next review should be in the future")
	}
}

func TestCalculate_SecondCorrect(t *testing.T) {
	s := State{Interval: 1, EasinessFactor: 2.5, Repetitions: 1}

	s, _ = Calculate(s, 4)

	if s.Interval != 6 {
		t.Errorf("second correct: expected interval 6, got %d", s.Interval)
	}
	if s.Repetitions != 2 {
		t.Errorf("second correct: expected repetitions 2, got %d", s.Repetitions)
	}
}

func TestCalculate_ThirdCorrect(t *testing.T) {
	s := State{Interval: 6, EasinessFactor: 2.5, Repetitions: 2}

	s, _ = Calculate(s, 4)

	// 6 * 2.5 = 15
	if s.Interval != 15 {
		t.Errorf("third correct: expected interval 15, got %d", s.Interval)
	}
	if s.Repetitions != 3 {
		t.Errorf("third correct: expected repetitions 3, got %d", s.Repetitions)
	}
}

func TestCalculate_Failed(t *testing.T) {
	s := State{Interval: 15, EasinessFactor: 2.5, Repetitions: 5}

	s, _ = Calculate(s, 2) // failed

	if s.Interval != 1 {
		t.Errorf("failed: expected interval reset to 1, got %d", s.Interval)
	}
	if s.Repetitions != 0 {
		t.Errorf("failed: expected repetitions reset to 0, got %d", s.Repetitions)
	}
}

func TestCalculate_EFNeverBelowMinimum(t *testing.T) {
	s := State{Interval: 1, EasinessFactor: 1.3, Repetitions: 0}

	// Repeated failures should not push EF below 1.3
	for i := 0; i < 10; i++ {
		s, _ = Calculate(s, 0)
	}

	if s.EasinessFactor < 1.3 {
		t.Errorf("EF should never go below 1.3, got %f", s.EasinessFactor)
	}
}

func TestCalculate_PerfectScoreIncreasesEF(t *testing.T) {
	s := State{Interval: 6, EasinessFactor: 2.5, Repetitions: 2}
	origEF := s.EasinessFactor

	s, _ = Calculate(s, 5) // perfect

	if s.EasinessFactor <= origEF {
		t.Errorf("perfect score should increase EF: was %f, now %f", origEF, s.EasinessFactor)
	}
}

func TestCalculate_QualityClamp(t *testing.T) {
	s := DefaultState()

	// quality < 0 should be clamped to 0
	s1, _ := Calculate(s, -5)
	if s1.Repetitions != 0 {
		t.Error("negative quality should fail")
	}

	// quality > 5 should be clamped to 5
	s2, _ := Calculate(s, 10)
	if s2.Repetitions != 1 {
		t.Error("quality > 5 should pass")
	}
}

func TestCalculate_ProgressionSequence(t *testing.T) {
	s := DefaultState()

	// Simulate a sequence of successful reviews
	expectedIntervals := []int{1, 6, 15} // approx for quality=4

	for i, expected := range expectedIntervals {
		s, _ = Calculate(s, 4)
		if s.Interval != expected {
			t.Errorf("step %d: expected interval %d, got %d", i+1, expected, s.Interval)
		}
	}
}

func TestScoreFromTyping_SevereErrors(t *testing.T) {
	if q := ScoreFromTyping(3, 1000, 500); q != 1 {
		t.Errorf("3+ errors should return 1, got %d", q)
	}
	if q := ScoreFromTyping(5, 1000, 500); q != 1 {
		t.Errorf("5 errors should return 1, got %d", q)
	}
}

func TestScoreFromTyping_ModerateErrors(t *testing.T) {
	if q := ScoreFromTyping(1, 1000, 500); q != 2 {
		t.Errorf("1 error should return 2, got %d", q)
	}
	if q := ScoreFromTyping(2, 1000, 500); q != 2 {
		t.Errorf("2 errors should return 2, got %d", q)
	}
}

func TestScoreFromTyping_CorrectButSlow(t *testing.T) {
	if q := ScoreFromTyping(0, 2000, 1000); q != 3 {
		t.Errorf("correct but 2x slow should return 3, got %d", q)
	}
}

func TestScoreFromTyping_CorrectSlightlyHesitant(t *testing.T) {
	if q := ScoreFromTyping(0, 1200, 1000); q != 4 {
		t.Errorf("correct 1.2x avg should return 4, got %d", q)
	}
}

func TestScoreFromTyping_Perfect(t *testing.T) {
	if q := ScoreFromTyping(0, 800, 1000); q != 5 {
		t.Errorf("correct fast should return 5, got %d", q)
	}
	if q := ScoreFromTyping(0, 1000, 1000); q != 5 {
		t.Errorf("correct at avg should return 5, got %d", q)
	}
}

func TestScoreFromTyping_FirstAttemptNoAvg(t *testing.T) {
	if q := ScoreFromTyping(0, 1000, 0); q != 4 {
		t.Errorf("first attempt (avgMs=0) should return 4, got %d", q)
	}
}

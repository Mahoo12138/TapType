package wpm

import "testing"

func TestCalculate_Normal(t *testing.T) {
	// 100 chars, 95 correct, 5 errors, 60 seconds
	r := Calculate(100, 95, 5, 60000)

	// raw = (100/5) / 1.0 = 20.0
	if r.RawWPM != 20.0 {
		t.Errorf("expected raw WPM 20.0, got %f", r.RawWPM)
	}
	// net = 20 - 5/1 = 15.0
	if r.WPM != 15.0 {
		t.Errorf("expected net WPM 15.0, got %f", r.WPM)
	}
	// accuracy = 95/100 = 0.95
	if r.Accuracy != 0.95 {
		t.Errorf("expected accuracy 0.95, got %f", r.Accuracy)
	}
}

func TestCalculate_Perfect(t *testing.T) {
	// 250 chars, all correct, 30 seconds
	r := Calculate(250, 250, 0, 30000)

	// raw = (250/5) / 0.5 = 100.0
	if r.RawWPM != 100.0 {
		t.Errorf("expected raw WPM 100.0, got %f", r.RawWPM)
	}
	if r.WPM != 100.0 {
		t.Errorf("expected net WPM 100.0, got %f", r.WPM)
	}
	if r.Accuracy != 1.0 {
		t.Errorf("expected accuracy 1.0, got %f", r.Accuracy)
	}
}

func TestCalculate_ManyErrors(t *testing.T) {
	// More errors than raw WPM → net WPM capped at 0
	r := Calculate(50, 10, 100, 60000)

	if r.WPM != 0 {
		t.Errorf("expected net WPM capped at 0, got %f", r.WPM)
	}
}

func TestCalculate_ZeroDuration(t *testing.T) {
	r := Calculate(100, 95, 5, 0)
	if r.WPM != 0 || r.RawWPM != 0 {
		t.Error("zero duration should return zero WPM")
	}
}

func TestCalculate_ZeroChars(t *testing.T) {
	r := Calculate(0, 0, 0, 60000)
	if r.WPM != 0 || r.RawWPM != 0 {
		t.Error("zero chars should return zero WPM")
	}
}

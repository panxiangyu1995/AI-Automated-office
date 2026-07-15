package poller

import (
	"testing"
	"time"
)

func TestAdaptivePoller_AdjustInterval_HasMessages(t *testing.T) {
	p := NewAdaptive(5*time.Second, 300*time.Second, 60*time.Second, func() (int, error) { return 0, nil })
	p.AdjustInterval(5)
	if p.CurrentInterval() < p.minInterval {
		t.Error("interval should not be less than min")
	}
	if p.CurrentInterval() > 60*time.Second {
		t.Error("interval should decrease when messages exist")
	}
}

func TestAdaptivePoller_AdjustInterval_NoMessages(t *testing.T) {
	p := NewAdaptive(5*time.Second, 300*time.Second, 60*time.Second, func() (int, error) { return 0, nil })
	p.AdjustInterval(0)
	if p.CurrentInterval() <= 60*time.Second {
		t.Error("interval should increase when no messages")
	}
}

func TestAdaptivePoller_AdjustInterval_MaxCap(t *testing.T) {
	p := NewAdaptive(5*time.Second, 300*time.Second, 200*time.Second, func() (int, error) { return 0, nil })
	p.AdjustInterval(0)
	p.AdjustInterval(0)
	if p.CurrentInterval() > p.maxInterval {
		t.Error("interval should not exceed max")
	}
}

func TestAdaptivePoller_AdjustInterval_MinFloor(t *testing.T) {
	p := NewAdaptive(5*time.Second, 300*time.Second, 10*time.Second, func() (int, error) { return 0, nil })
	p.AdjustInterval(1)
	if p.CurrentInterval() < p.minInterval {
		t.Error("interval should not be less than min")
	}
}

func TestAdaptivePoller_AdjustInterval_ConvergeToMin(t *testing.T) {
	p := NewAdaptive(5*time.Second, 300*time.Second, 60*time.Second, func() (int, error) { return 0, nil })
	for i := 0; i < 10; i++ {
		p.AdjustInterval(1)
	}
	if p.CurrentInterval() != p.minInterval {
		t.Errorf("expected interval to converge to min (%v), got %v", p.minInterval, p.CurrentInterval())
	}
}

func TestAdaptivePoller_AdjustInterval_ConvergeToMax(t *testing.T) {
	p := NewAdaptive(5*time.Second, 300*time.Second, 60*time.Second, func() (int, error) { return 0, nil })
	for i := 0; i < 20; i++ {
		p.AdjustInterval(0)
	}
	if p.CurrentInterval() != p.maxInterval {
		t.Errorf("expected interval to converge to max (%v), got %v", p.maxInterval, p.CurrentInterval())
	}
}

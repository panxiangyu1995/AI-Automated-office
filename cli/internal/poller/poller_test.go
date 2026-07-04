package poller

import (
	"sync/atomic"
	"testing"
	"time"
)

func TestPoller_StartStop(t *testing.T) {
	var counter atomic.Int32
	p := New(50*time.Millisecond, func() error {
		counter.Add(1)
		return nil
	})

	go p.Start()
	time.Sleep(120 * time.Millisecond)
	p.Stop()

	if counter.Load() == 0 {
		t.Error("expected at least 1 callback invocation")
	}
}

func TestPoller_Stop_BeforeStart(t *testing.T) {
	p := New(1*time.Second, func() error { return nil })
	p.Stop()
}

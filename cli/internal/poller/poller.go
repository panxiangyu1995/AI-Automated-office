package poller

import (
	"log"
	"time"
)

type AdaptivePoller struct {
	minInterval     time.Duration
	maxInterval     time.Duration
	currentInterval time.Duration
	callback        func() (int, error)
	stopChan        chan struct{}
}

func NewAdaptive(minInterval, maxInterval, initialInterval time.Duration, callback func() (int, error)) *AdaptivePoller {
	return &AdaptivePoller{
		minInterval:     minInterval,
		maxInterval:     maxInterval,
		currentInterval: initialInterval,
		callback:        callback,
		stopChan:        make(chan struct{}),
	}
}

func (p *AdaptivePoller) AdjustInterval(messageCount int) {
	if messageCount > 0 {
		p.currentInterval = p.minInterval
		if p.currentInterval/2 >= p.minInterval {
			p.currentInterval = p.currentInterval / 2
		}
	} else {
		p.currentInterval = time.Duration(float64(p.currentInterval) * 1.5)
		if p.currentInterval > p.maxInterval {
			p.currentInterval = p.maxInterval
		}
	}
}

func (p *AdaptivePoller) Start() {
	for {
		select {
		case <-time.After(p.currentInterval):
			count, err := p.callback()
			if err != nil {
				log.Printf("poll error: %v", err)
			}
			p.AdjustInterval(count)
		case <-p.stopChan:
			return
		}
	}
}

func (p *AdaptivePoller) Stop() {
	close(p.stopChan)
}

func (p *AdaptivePoller) CurrentInterval() time.Duration {
	return p.currentInterval
}

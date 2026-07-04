package poller

import (
	"log"
	"time"
)

type Poller struct {
	interval time.Duration
	callback func() error
	stopChan chan struct{}
}

func New(interval time.Duration, callback func() error) *Poller {
	return &Poller{
		interval: interval,
		callback: callback,
		stopChan: make(chan struct{}),
	}
}

func (p *Poller) Start() {
	ticker := time.NewTicker(p.interval)
	defer ticker.Stop()

	for {
		select {
		case <-ticker.C:
			if err := p.callback(); err != nil {
				log.Printf("poll error: %v", err)
			}
		case <-p.stopChan:
			return
		}
	}
}

func (p *Poller) Stop() {
	close(p.stopChan)
}

package service

import (
	"sync"
	"time"

	"github.com/google/uuid"
)

type StubEntry struct {
	ID        string            `json:"id"`
	Method    string            `json:"method"`
	Path      string            `json:"path"`
	Status    int               `json:"status"`
	Body      interface{}       `json:"body"`
	Headers   map[string]string `json:"headers,omitempty"`
	CreatedAt time.Time         `json:"created_at"`
}

type DebugStubService struct {
	mu    sync.RWMutex
	stubs map[string]*StubEntry
}

func NewDebugStubService() *DebugStubService {
	return &DebugStubService{
		stubs: make(map[string]*StubEntry),
	}
}

func (s *DebugStubService) Add(entry StubEntry) *StubEntry {
	s.mu.Lock()
	defer s.mu.Unlock()

	entry.ID = uuid.New().String()
	entry.CreatedAt = time.Now()

	key := entry.Method + ":" + entry.Path
	s.stubs[key] = &entry

	return &entry
}

func (s *DebugStubService) List() []StubEntry {
	s.mu.RLock()
	defer s.mu.RUnlock()

	result := make([]StubEntry, 0, len(s.stubs))
	for _, v := range s.stubs {
		result = append(result, *v)
	}
	return result
}

func (s *DebugStubService) Get(id string) (*StubEntry, bool) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	for _, v := range s.stubs {
		if v.ID == id {
			return v, true
		}
	}
	return nil, false
}

func (s *DebugStubService) Remove(id string) bool {
	s.mu.Lock()
	defer s.mu.Unlock()

	for key, v := range s.stubs {
		if v.ID == id {
			delete(s.stubs, key)
			return true
		}
	}
	return false
}

func (s *DebugStubService) Clear() {
	s.mu.Lock()
	defer s.mu.Unlock()

	s.stubs = make(map[string]*StubEntry)
}

func (s *DebugStubService) Match(method, path string) (*StubEntry, bool) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	key := method + ":" + path
	v, ok := s.stubs[key]
	if !ok {
		return nil, false
	}
	return v, true
}

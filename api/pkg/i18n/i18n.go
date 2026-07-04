package i18n

import (
	"encoding/json"
	"os"
	"sync"
)

type Bundle struct {
	mu    sync.RWMutex
	langs map[string]map[string]string
}

var Default *Bundle

func init() {
	Default = NewBundle()
}

func NewBundle() *Bundle {
	return &Bundle{langs: make(map[string]map[string]string)}
}

func (b *Bundle) LoadFile(lang, path string) error {
	data, err := os.ReadFile(path)
	if err != nil {
		return err
	}
	var msgs map[string]string
	if err := json.Unmarshal(data, &msgs); err != nil {
		return err
	}
	b.mu.Lock()
	defer b.mu.Unlock()
	b.langs[lang] = msgs
	return nil
}

func (b *Bundle) T(lang, key string) string {
	b.mu.RLock()
	defer b.mu.RUnlock()
	if msgs, ok := b.langs[lang]; ok {
		if v, ok := msgs[key]; ok {
			return v
		}
	}
	if msgs, ok := b.langs["zh-CN"]; ok {
		if v, ok := msgs[key]; ok {
			return v
		}
	}
	return key
}

var SupportedLocales = []string{"zh-CN", "en-US"}

func IsSupported(lang string) bool {
	for _, l := range SupportedLocales {
		if l == lang {
			return true
		}
	}
	return false
}

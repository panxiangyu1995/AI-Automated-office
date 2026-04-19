package message

import (
	"context"
)

// ContactWhitelist 联系白名单
type ContactWhitelist struct {
	ID        string
	TenantID  string
	UserID    string
	AllowedID string
	AllowedType string // "user" or "agent"
	CreatedAt int64
}

// WhitelistStore 白名单存储接口
type WhitelistStore interface {
	Create(ctx context.Context, w *ContactWhitelist) error
	Delete(ctx context.Context, tenantID, userID, allowedID string) error
	List(ctx context.Context, tenantID, userID string) ([]ContactWhitelist, error)
	IsAllowed(ctx context.Context, tenantID, userID, targetID string) (bool, error)
}

// InMemoryWhitelistStore 内存白名单存储（生产环境应使用数据库）
type InMemoryWhitelistStore struct {
	data map[string]map[string][]ContactWhitelist // tenantID -> userID -> whitelists
}

func NewInMemoryWhitelistStore() *InMemoryWhitelistStore {
	return &InMemoryWhitelistStore{
		data: make(map[string]map[string][]ContactWhitelist),
	}
}

func (s *InMemoryWhitelistStore) key(tenantID, userID string) string {
	return tenantID + ":" + userID
}

func (s *InMemoryWhitelistStore) Create(ctx context.Context, w *ContactWhitelist) error {
	if s.data[w.TenantID] == nil {
		s.data[w.TenantID] = make(map[string][]ContactWhitelist)
	}
	s.data[w.TenantID][w.UserID] = append(s.data[w.TenantID][w.UserID], *w)
	return nil
}

func (s *InMemoryWhitelistStore) Delete(ctx context.Context, tenantID, userID, allowedID string) error {
	if tenantData, ok := s.data[tenantID]; ok {
		if list, ok := tenantData[userID]; ok {
			for i, w := range list {
				if w.AllowedID == allowedID {
					s.data[tenantID][userID] = append(list[:i], list[i+1:]...)
					return nil
				}
			}
		}
	}
	return nil
}

func (s *InMemoryWhitelistStore) List(ctx context.Context, tenantID, userID string) ([]ContactWhitelist, error) {
	if tenantData, ok := s.data[tenantID]; ok {
		if list, ok := tenantData[userID]; ok {
			return list, nil
		}
	}
	return []ContactWhitelist{}, nil
}

func (s *InMemoryWhitelistStore) IsAllowed(ctx context.Context, tenantID, userID, targetID string) (bool, error) {
	// 白名单为空表示允许所有（向后兼容）
	list, err := s.List(ctx, tenantID, userID)
	if err != nil {
		return false, err
	}
	if len(list) == 0 {
		return true, nil
	}
	for _, w := range list {
		if w.AllowedID == targetID {
			return true, nil
		}
	}
	return false, nil
}

// GlobalWhitelistStore 全局白名单存储
var GlobalWhitelistStore = NewInMemoryWhitelistStore()

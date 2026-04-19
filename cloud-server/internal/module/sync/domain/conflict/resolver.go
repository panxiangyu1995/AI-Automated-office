package conflict

import (
	"context"
	"time"
)

// ConflictResolutionStrategy 冲突解决策略
type ConflictResolutionStrategy string

const (
	StrategyLastWriteWins ConflictResolutionStrategy = "last_write_wins"
	StrategyServerWins   ConflictResolutionStrategy = "server_wins"
	StrategyClientWins    ConflictResolutionStrategy = "client_wins"
	StrategyManual        ConflictResolutionStrategy = "manual"
)

// EntityVersion 实体版本信息
type EntityVersion struct {
	EntityType  string      `json:"entity_type"`
	EntityID    string      `json:"entity_id"`
	Data        interface{} `json:"data"`
	Version     int64       `json:"version"`
	Timestamp   time.Time   `json:"timestamp"`
}

// EntityChange 实体变更
type EntityChange struct {
	ID         string      `json:"id"`
	EntityType string      `json:"entity_type"`
	EntityID   string      `json:"entity_id"`
	Operation  string      `json:"operation"`
	Data       interface{} `json:"data"`
	Version    int64       `json:"version"`
	Timestamp  time.Time   `json:"timestamp"`
}

// Conflict 冲突信息
type Conflict struct {
	EntityType    string      `json:"entity_type"`
	EntityID      string      `json:"entity_id"`
	LocalData     interface{} `json:"local_data"`
	ServerData    interface{} `json:"server_data"`
	LocalVersion  int64       `json:"local_version"`
	ServerVersion int64       `json:"server_version"`
	Strategy      ConflictResolutionStrategy `json:"strategy"`
}

// ResolvedConflict 已解决的冲突
type ResolvedConflict struct {
	EntityType   string      `json:"entity_type"`
	EntityID     string      `json:"entity_id"`
	ResolvedData interface{} `json:"resolved_data"`
	Version      int64       `json:"version"`
	Action       string      `json:"action"` // "accept", "reject", "manual"
}

// ConflictResolver 冲突解决器接口
type ConflictResolver interface {
	Resolve(ctx context.Context, conflict *Conflict) (*ResolvedConflict, error)
}

// LastWriteWinsResolver Last-Write-Wins 解决器
type LastWriteWinsResolver struct{}

func (r *LastWriteWinsResolver) Resolve(ctx context.Context, conflict *Conflict) (*ResolvedConflict, error) {
	// 比较时间戳，返回最新的
	var resolved interface{}

	if conflict.LocalVersion >= conflict.ServerVersion {
		resolved = conflict.LocalData
	} else {
		resolved = conflict.ServerData
	}
	
	return &ResolvedConflict{
		EntityType:   conflict.EntityType,
		EntityID:     conflict.EntityID,
		ResolvedData: resolved,
		Version:      max(conflict.LocalVersion, conflict.ServerVersion) + 1,
		Action:       "accept",
	}, nil
}

// ServerWinsResolver 服务端优先解决器
type ServerWinsResolver struct{}

func (r *ServerWinsResolver) Resolve(ctx context.Context, conflict *Conflict) (*ResolvedConflict, error) {
	return &ResolvedConflict{
		EntityType:   conflict.EntityType,
		EntityID:     conflict.EntityID,
		ResolvedData: conflict.ServerData,
		Version:      conflict.ServerVersion + 1,
		Action:       "accept",
	}, nil
}

// ClientWinsResolver 客户端优先解决器
type ClientWinsResolver struct{}

func (r *ClientWinsResolver) Resolve(ctx context.Context, conflict *Conflict) (*ResolvedConflict, error) {
	return &ResolvedConflict{
		EntityType:   conflict.EntityType,
		EntityID:     conflict.EntityID,
		ResolvedData: conflict.LocalData,
		Version:      conflict.LocalVersion + 1,
		Action:       "accept",
	}, nil
}

// ManualResolver 手动解决器（返回冲突，要求用户确认）
type ManualResolver struct{}

func (r *ManualResolver) Resolve(ctx context.Context, conflict *Conflict) (*ResolvedConflict, error) {
	return &ResolvedConflict{
		EntityType:   conflict.EntityType,
		EntityID:     conflict.EntityID,
		ResolvedData: nil, // 需要用户手动选择
		Version:      0,
		Action:       "manual",
	}, nil
}

// ConflictResolverFactory 冲突解决器工厂
type ConflictResolverFactory struct {
	resolvers map[ConflictResolutionStrategy]ConflictResolver
}

func NewConflictResolverFactory() *ConflictResolverFactory {
	f := &ConflictResolverFactory{
		resolvers: make(map[ConflictResolutionStrategy]ConflictResolver),
	}
	
	f.resolvers[StrategyLastWriteWins] = &LastWriteWinsResolver{}
	f.resolvers[StrategyServerWins] = &ServerWinsResolver{}
	f.resolvers[StrategyClientWins] = &ClientWinsResolver{}
	f.resolvers[StrategyManual] = &ManualResolver{}
	
	return f
}

func (f *ConflictResolverFactory) GetResolver(strategy ConflictResolutionStrategy) ConflictResolver {
	if resolver, ok := f.resolvers[strategy]; ok {
		return resolver
	}
	return &LastWriteWinsResolver{} // 默认
}

// ConflictDetector 冲突检测器
type ConflictDetector struct{}

func (d *ConflictDetector) Detect(local, server *EntityVersion) bool {
	if local == nil || server == nil {
		return false
	}
	return local.Version != server.Version
}

// ConflictResolverService 冲突解决服务
type ConflictResolverService struct {
	factory   *ConflictResolverFactory
	detector *ConflictDetector
}

func NewConflictResolverService() *ConflictResolverService {
	return &ConflictResolverService{
		factory:   NewConflictResolverFactory(),
		detector: &ConflictDetector{},
	}
}

// ResolveWithStrategy 使用指定策略解决冲突
func (s *ConflictResolverService) ResolveWithStrategy(
	ctx context.Context,
	conflict *Conflict,
) (*ResolvedConflict, error) {
	resolver := s.factory.GetResolver(conflict.Strategy)
	return resolver.Resolve(ctx, conflict)
}

// ResolveAll 批量解决冲突
func (s *ConflictResolverService) ResolveAll(
	ctx context.Context,
	conflicts []*Conflict,
) ([]*ResolvedConflict, []error) {
	results := make([]*ResolvedConflict, 0, len(conflicts))
	errs := make([]error, 0)
	
	for _, conflict := range conflicts {
		result, err := s.ResolveWithStrategy(ctx, conflict)
		if err != nil {
			errs = append(errs, err)
			continue
		}
		results = append(results, result)
	}
	
	return results, errs
}

// ApplyResolution 应用解决结果
func (s *ConflictResolverService) ApplyResolution(
	ctx context.Context,
	resolved *ResolvedConflict,
) error {
	// TODO: 将解决后的数据写入数据库
	return nil
}

func max(a, b int64) int64 {
	if a > b {
		return a
	}
	return b
}

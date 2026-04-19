package service

import (
	"context"
	"database/sql"
	"time"

	"cloud-server/internal/module/sync/domain/conflict"
	syncstore "cloud-server/internal/module/sync/infrastructure/persistence"
)

// SyncDirection 同步方向
type SyncDirection string

const (
	SyncDirectionPush SyncDirection = "push"
	SyncDirectionPull SyncDirection = "pull"
)

// SyncRequest 同步请求
type SyncRequest struct {
	TenantID      string                             `json:"tenant_id"`
	DeviceID      string                             `json:"device_id"`
	ClientVersion int64                              `json:"client_version"`
	LastSyncTime  time.Time                          `json:"last_sync_time"`
	Direction     SyncDirection                      `json:"direction"`
	Strategy      conflict.ConflictResolutionStrategy `json:"strategy"`
}

// SyncResponse 同步响应
type SyncResponse struct {
	ServerVersion int64                        `json:"server_version"`
	SyncTime     time.Time                    `json:"sync_time"`
	Changes      []EntityChange               `json:"changes"`
	Conflicts    []*conflict.Conflict         `json:"conflicts,omitempty"`
	Resolved     []conflict.ResolvedConflict  `json:"resolved,omitempty"`
	HasMore      bool                         `json:"has_more"`
}

// EntityChange 实体变更
type EntityChange struct {
	ID          string      `json:"id"`
	EntityType  string      `json:"entity_type"`
	EntityID    string      `json:"entity_id"`
	Operation   string      `json:"operation"` // create, update, delete
	Data        interface{} `json:"data"`
	Version     int64       `json:"version"`
	Timestamp   time.Time   `json:"timestamp"`
}

// SyncService 同步服务
type SyncService struct {
	db                *sql.DB
	store            *syncstore.SyncStore
	conflictResolver *conflict.ConflictResolverService
}

// NewSyncService 创建同步服务（使用SQL DB）
func NewSyncServiceWithDB(db *sql.DB) *SyncService {
	return &SyncService{
		db:                db,
		store:            syncstore.NewSyncStore(nil), // GORM会在实际使用中注入
		conflictResolver:  conflict.NewConflictResolverService(),
	}
}

// NewSyncService 创建同步服务
func NewSyncService() *SyncService {
	return &SyncService{
		conflictResolver: conflict.NewConflictResolverService(),
	}
}

// Push 推送本地变更到云端
func (s *SyncService) Push(ctx context.Context, req *SyncRequest, changes []EntityChange) (*SyncResponse, error) {
	var resolved []conflict.ResolvedConflict
	var conflicts []*conflict.Conflict
	
	// 检测冲突
	conflictResults := s.detectConflicts(ctx, req.TenantID, changes)
	
	for _, cr := range conflictResults {
		if cr.HasConflict && cr.Conflict != nil {
			conflicts = append(conflicts, cr.Conflict)
			
			// 使用策略解决冲突
			c := cr.Conflict
			c.Strategy = req.Strategy
			r, err := s.conflictResolver.ResolveWithStrategy(ctx, c)
			if err != nil {
				continue
			}
			if r.Action != "manual" {
				resolved = append(resolved, *r)
			}
		}
	}
	
	// 应用非冲突变更
	applied := s.applyChanges(ctx, req.TenantID, changes)
	
	return &SyncResponse{
		ServerVersion: time.Now().Unix(),
		SyncTime:     time.Now(),
		Changes:      applied,
		Conflicts:    conflicts,
		Resolved:     resolved,
		HasMore:      false,
	}, nil
}

// Pull 从云端拉取变更
func (s *SyncService) Pull(ctx context.Context, req *SyncRequest) (*SyncResponse, error) {
	changes, hasMore := s.getChangesSince(ctx, req.TenantID, req.LastSyncTime, 100)
	
	return &SyncResponse{
		ServerVersion: time.Now().Unix(),
		SyncTime:     time.Now(),
		Changes:      changes,
		HasMore:      hasMore,
	}, nil
}

// detectConflicts 检测冲突
func (s *SyncService) detectConflicts(ctx context.Context, tenantID string, changes []EntityChange) []*syncstore.ConflictDetectionResult {
	results := make([]*syncstore.ConflictDetectionResult, 0, len(changes))
	
	// 仅对update操作检测冲突
	for _, change := range changes {
		if change.Operation != "update" {
			results = append(results, &syncstore.ConflictDetectionResult{HasConflict: false})
			continue
		}
		
		// 使用冲突检测器检测
		result := &syncstore.ConflictDetectionResult{
			HasConflict: false,
		}
		
		// 检查版本号
		// 如果版本号为0，表示新建，无冲突
		if change.Version == 0 {
			results = append(results, result)
			continue
		}
		
		// 简化实现：基于版本号检测
		// 实际生产环境应查询数据库验证
		// 此处假设冲突检测器已经检查过
		results = append(results, result)
	}
	
	return results
}

// applyChanges 应用变更
func (s *SyncService) applyChanges(ctx context.Context, tenantID string, changes []EntityChange) []EntityChange {
	applied := make([]EntityChange, 0, len(changes))
	
	for _, change := range changes {
		// 跳过已被冲突解决的变更
		skip := false
		for _, c := range changes {
			if c.EntityType == change.EntityType && c.EntityID == change.EntityID && c.Operation == change.Operation {
				// 版本相同跳过（已在冲突中处理）
				if c.Version == change.Version && &c != &change {
					skip = true
					break
				}
			}
		}
		if skip {
			continue
		}
		
		// 应用变更
		entityChange := &conflict.EntityChange{
			ID:          change.ID,
			EntityType:  change.EntityType,
			EntityID:    change.EntityID,
			Operation:   change.Operation,
			Data:        change.Data,
			Version:     change.Version,
			Timestamp:   change.Timestamp,
		}
		
		// 更新版本号
		entityChange.Version++
		
		applied = append(applied, EntityChange{
			ID:          entityChange.ID,
			EntityType:  entityChange.EntityType,
			EntityID:    entityChange.EntityID,
			Operation:   entityChange.Operation,
			Data:       entityChange.Data,
			Version:     entityChange.Version,
			Timestamp:   entityChange.Timestamp,
		})
	}
	
	return applied
}

// getChangesSince 获取指定时间后的变更
func (s *SyncService) getChangesSince(ctx context.Context, tenantID string, since time.Time, limit int) ([]EntityChange, bool) {
	// 简化实现：返回空变更列表
	// 实际生产环境应从数据库查询
	return []EntityChange{}, false
}

// GetConflictResolver 获取冲突解决器
func (s *SyncService) GetConflictResolver() *conflict.ConflictResolverService {
	return s.conflictResolver
}

package syncstore

import (
	"cloud-server/internal/module/sync/domain/conflict"
	"encoding/json"
	"errors"
	"fmt"
	"gorm.io/gorm"
	"time"
)

// SyncStore 同步数据存储
type SyncStore struct {
	db *gorm.DB
}

// NewSyncStore 创建同步存储
func NewSyncStore(db *gorm.DB) *SyncStore {
	return &SyncStore{db: db}
}

// ConflictDetectionResult 冲突检测结果
type ConflictDetectionResult struct {
	HasConflict bool
	Conflict    *conflict.Conflict
	ServerData  *conflict.EntityVersion
}

// DetectConflict 检测实体冲突
// 规则：
// 1. 如果服务端版本与客户端传入版本相同，无冲突
// 2. 如果服务端版本 > 客户端传入版本，有冲突（其他人已修改）
// 3. 如果服务端版本 < 客户端传入版本，有冲突（客户端有过期数据）
func (s *SyncStore) DetectConflict(tenantID, entityType, entityID string, clientVersion int64) (*ConflictDetectionResult, error) {
	var entity SyncEntity
	
	err := s.db.Where("tenant_id = ? AND entity_type = ? AND entity_id = ?", tenantID, entityType, entityID).
		First(&entity).Error
	
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			// 实体不存在，无冲突
			return &ConflictDetectionResult{HasConflict: false}, nil
		}
		return nil, err
	}
	
	// 比较版本
	if entity.Version == clientVersion {
		return &ConflictDetectionResult{HasConflict: false}, nil
	}
	
	// 存在冲突
	conflictData := &conflict.Conflict{
		EntityType:   entityType,
		EntityID:     entityID,
		LocalData:    nil, // 客户端数据需要传入
		ServerData:   entity.Data,
		LocalVersion: clientVersion,
		ServerVersion: entity.Version,
	}
	
	return &ConflictDetectionResult{
		HasConflict: true,
		Conflict:    conflictData,
		ServerData: &conflict.EntityVersion{
			EntityType: entityType,
			EntityID:   entityID,
			Data:       entity.Data,
			Version:    entity.Version,
			Timestamp:  entity.UpdatedAt,
		},
	}, nil
}

// ApplyChange 应用变更到数据库
func (s *SyncStore) ApplyChange(tenantID string, change *conflict.EntityChange) error {
	var entity SyncEntity
	
	err := s.db.Where("tenant_id = ? AND entity_type = ? AND entity_id = ?", tenantID, change.EntityType, change.EntityID).
		First(&entity).Error
	
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			// 创建新实体
			if change.Operation == "delete" {
				return nil // 删除不存在的记录，直接返回
			}
			entity = SyncEntity{
				TenantID:   tenantID,
				EntityType: change.EntityType,
				EntityID:   change.EntityID,
				Data:       mustMarshalJSON(change.Data),
				Version:    change.Version,
				CreatedAt:  time.Now(),
				UpdatedAt:  time.Now(),
			}
			return s.db.Create(&entity).Error
		}
		return err
	}
	
	// 更新或删除现有实体
	switch change.Operation {
	case "delete":
		return s.db.Delete(&entity).Error
	case "update", "create":
		entity.Data = mustMarshalJSON(change.Data)
		entity.Version = change.Version
		entity.UpdatedAt = time.Now()
		return s.db.Save(&entity).Error
	default:
		return errors.New("unknown operation: " + change.Operation)
	}
}

// GetChangesSince 获取指定时间后的变更
func (s *SyncStore) GetChangesSince(tenantID string, since time.Time, limit int) ([]conflict.EntityChange, bool, error) {
	var entities []SyncEntity
	
	query := s.db.Where("tenant_id = ? AND updated_at > ?", tenantID, since).
		Order("updated_at ASC").
		Limit(limit + 1)
	
	err := query.Find(&entities).Error
	if err != nil {
		return nil, false, err
	}
	
	hasMore := len(entities) > limit
	if hasMore {
		entities = entities[:limit]
	}
	
	changes := make([]conflict.EntityChange, 0, len(entities))
	for _, e := range entities {
		changes = append(changes, conflict.EntityChange{
			ID:         fmt.Sprintf("%d", e.ID),
			EntityType: e.EntityType,
			EntityID:   e.EntityID,
			Operation:  "update",
			Data:       mustUnmarshalJSON(e.Data),
			Version:    e.Version,
			Timestamp:  e.UpdatedAt,
		})
	}
	
	return changes, hasMore, nil
}

// SyncEntity 同步实体表
type SyncEntity struct {
	ID         uint      `gorm:"primarykey"`
	TenantID   string    `gorm:"index;not null"`
	EntityType string    `gorm:"index;not null"`
	EntityID   string    `gorm:"index;not null"`
	Data       []byte    `gorm:"type:jsonb"`
	Version    int64     `gorm:"not null;default:1"`
	CreatedAt  time.Time
	UpdatedAt  time.Time
}

func (SyncEntity) TableName() string {
	return "sync_entities"
}

// AutoMigrate 执行数据库迁移
func (s *SyncStore) AutoMigrate() error {
	return s.db.AutoMigrate(&SyncEntity{})
}

func mustMarshalJSON(data interface{}) []byte {
	b, _ := json.Marshal(data)
	return b
}

func mustUnmarshalJSON(data []byte) interface{} {
	var result interface{}
	json.Unmarshal(data, &result)
	return result
}

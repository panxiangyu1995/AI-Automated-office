package model

import (
	"time"
)

// Permission 权限模型
type Permission struct {
	ID          string           `gorm:"type:uuid;default:gen_random_uuid();primaryKey" json:"id"`
	TenantID    *string          `gorm:"type:uuid;index" json:"tenant_id,omitempty"` // NULL 表示全局权限
	Code        string           `gorm:"size:100;not null" json:"code"`
	Name        string           `gorm:"size:100;not null" json:"name"`
	Resource    string           `gorm:"size:100;not null;index" json:"resource"`
	Action      PermissionAction `gorm:"size:50;not null" json:"action"`
	Layer       PermissionLayer  `gorm:"size:20;not null;default:'base'" json:"layer"`
	Description string           `gorm:"type:text" json:"description,omitempty"`
	CreatedAt   time.Time        `json:"created_at"`
}

// TableName 指定表名
func (Permission) TableName() string {
	return "permissions"
}

// IsGlobal 判断是否为全局权限
func (p *Permission) IsGlobal() bool {
	return p.TenantID == nil
}

// PermissionSet 权限集合，用于权限计算
type PermissionSet struct {
	Permissions map[string]*Permission `json:"permissions"`
	ByLayer     map[PermissionLayer][]*Permission `json:"by_layer"`
	ByResource  map[string][]*Permission `json:"by_resource"`
}

// NewPermissionSet 创建新的权限集合
func NewPermissionSet() *PermissionSet {
	return &PermissionSet{
		Permissions: make(map[string]*Permission),
		ByLayer:     make(map[PermissionLayer][]*Permission),
		ByResource:  make(map[string][]*Permission),
	}
}

// Add 添加权限到集合
func (ps *PermissionSet) Add(p *Permission) {
	ps.Permissions[p.Code] = p
	ps.ByLayer[p.Layer] = append(ps.ByLayer[p.Layer], p)
	ps.ByResource[p.Resource] = append(ps.ByResource[p.Resource], p)
}

// Merge 合并另一个权限集合
func (ps *PermissionSet) Merge(other *PermissionSet) {
	for code, p := range other.Permissions {
		if _, exists := ps.Permissions[code]; !exists {
			ps.Add(p)
		}
	}
}

// Contains 检查是否包含指定权限
func (ps *PermissionSet) Contains(code string) bool {
	_, exists := ps.Permissions[code]
	return exists
}

// ContainsAny 检查是否包含任意一个指定权限
func (ps *PermissionSet) ContainsAny(codes []string) bool {
	for _, code := range codes {
		if ps.Contains(code) {
			return true
		}
	}
	return false
}

// ContainsAll 检查是否包含所有指定权限
func (ps *PermissionSet) ContainsAll(codes []string) bool {
	for _, code := range codes {
		if !ps.Contains(code) {
			return false
		}
	}
	return true
}

// ToCodeList 获取权限编码列表
func (ps *PermissionSet) ToCodeList() []string {
	codes := make([]string, 0, len(ps.Permissions))
	for code := range ps.Permissions {
		codes = append(codes, code)
	}
	return codes
}

// GetByLayer 获取指定层级的权限列表
func (ps *PermissionSet) GetByLayer(layer PermissionLayer) []*Permission {
	return ps.ByLayer[layer]
}

// GetByResource 获取指定资源的权限列表
func (ps *PermissionSet) GetByResource(resource string) []*Permission {
	return ps.ByResource[resource]
}

// Count 获取权限数量
func (ps *PermissionSet) Count() int {
	return len(ps.Permissions)
}
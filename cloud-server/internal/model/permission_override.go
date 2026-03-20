package model

import (
	"database/sql/driver"
	"encoding/json"
	"time"
)

// OverrideType 权限覆盖类型
type OverrideType string

const (
	OverrideTypeGrant OverrideType = "grant" // 授权
	OverrideTypeDeny  OverrideType = "deny"  // 剥夺
)

// DataScopeType 数据范围类型
type DataScopeType string

const (
	DataScopeAll            DataScopeType = "all"             // 全部数据
	DataScopeDepartment     DataScopeType = "department"      // 本部门
	DataScopeDepartmentTree DataScopeType = "department_tree" // 本部门及下级
	DataScopeSelf           DataScopeType = "self"            // 仅本人
	DataScopeCustom         DataScopeType = "custom"          // 自定义规则
)

// FieldMode 字段权限模式
type FieldMode string

const (
	FieldModeVisible  FieldMode = "visible"  // 可见
	FieldModeHidden   FieldMode = "hidden"   // 隐藏
	FieldModeReadonly FieldMode = "readonly" // 只读
	FieldModeMasked   FieldMode = "masked"   // 脱敏
)

// MaskRule 脱敏规则
type MaskRule string

const (
	MaskRulePhone    MaskRule = "phone"    // 手机号脱敏
	MaskRuleEmail    MaskRule = "email"    // 邮箱脱敏
	MaskRuleIDCard   MaskRule = "idcard"   // 身份证脱敏
	MaskRuleBankCard MaskRule = "bankcard" // 银行卡脱敏
	MaskRuleCustom   MaskRule = "custom"   // 自定义脱敏
)

// PermissionOverride 用户权限覆盖模型
type PermissionOverride struct {
	ID               string                 `gorm:"type:uuid;default:gen_random_uuid();primaryKey" json:"id"`
	TenantID         string                 `gorm:"type:uuid;not null;index" json:"tenant_id"`
	UserID           string                 `gorm:"type:uuid;not null;index" json:"user_id"`
	Resource         string                 `gorm:"size:100;not null;index" json:"resource"`
	PermissionID     *string                `gorm:"type:uuid" json:"permission_id,omitempty"`
	OverrideType     OverrideType           `gorm:"size:20;not null" json:"override_type"`
	DataScopeType    DataScopeType          `gorm:"size:50;not null;default:'all'" json:"data_scope_type"`
	DataScopeRule    *DataScopeRule         `gorm:"type:jsonb" json:"data_scope_rule,omitempty"`
	FieldRestrictions FieldRestrictionsMap  `gorm:"type:jsonb" json:"field_restrictions,omitempty"`
	EffectiveFrom    time.Time              `json:"effective_from"`
	EffectiveUntil   *time.Time             `json:"effective_until,omitempty"`
	CreatedBy        *string                `gorm:"type:uuid" json:"created_by,omitempty"`
	CreatedAt        time.Time              `json:"created_at"`
	UpdatedAt        time.Time              `json:"updated_at"`
}

// TableName 指定表名
func (PermissionOverride) TableName() string {
	return "user_permission_overrides"
}

// IsEffective 检查覆盖是否在有效期内
func (po *PermissionOverride) IsEffective(now time.Time) bool {
	if now.Before(po.EffectiveFrom) {
		return false
	}
	if po.EffectiveUntil != nil && now.After(*po.EffectiveUntil) {
		return false
	}
	return true
}

// IsResourceLevel 是否为资源级覆盖（而非具体权限级）
func (po *PermissionOverride) IsResourceLevel() bool {
	return po.PermissionID == nil
}

// DataScopeRule 数据范围规则
type DataScopeRule struct {
	Conditions []DataScopeCondition `json:"conditions,omitempty"`
	Logic      string               `json:"logic,omitempty"` // and, or
}

// DataScopeCondition 数据范围条件
type DataScopeCondition struct {
	Field    string      `json:"field"`
	Operator string      `json:"operator"` // eq, ne, in, not_in, gt, lt, gte, lte, like
	Value    interface{} `json:"value"`
}

// Value 实现 driver.Valuer 接口
func (r *DataScopeRule) Value() (driver.Value, error) {
	if r == nil {
		return nil, nil
	}
	return json.Marshal(r)
}

// Scan 实现 sql.Scanner 接口
func (r *DataScopeRule) Scan(value interface{}) error {
	if value == nil {
		return nil
	}
	bytes, ok := value.([]byte)
	if !ok {
		return nil
	}
	return json.Unmarshal(bytes, r)
}

// FieldRestriction 字段限制配置
type FieldRestriction struct {
	Mode             FieldMode `json:"mode"`
	MaskRule         MaskRule  `json:"maskRule,omitempty"`
	CustomMaskPattern string   `json:"customMaskPattern,omitempty"`
}

// FieldRestrictionsMap 字段限制映射
type FieldRestrictionsMap map[string]FieldRestriction

// Value 实现 driver.Valuer 接口
func (m FieldRestrictionsMap) Value() (driver.Value, error) {
	if m == nil {
		return nil, nil
	}
	return json.Marshal(m)
}

// Scan 实现 sql.Scanner 接口
func (m *FieldRestrictionsMap) Scan(value interface{}) error {
	if value == nil {
		*m = nil
		return nil
	}
	bytes, ok := value.([]byte)
	if !ok {
		return nil
	}
	return json.Unmarshal(bytes, m)
}

// PermissionResult 完整权限结果
type PermissionResult struct {
	Permissions       map[string]bool         `json:"permissions"`
	DataScope         *DataScope              `json:"data_scope"`
	FieldRestrictions FieldRestrictionsMap    `json:"field_restrictions"`
	Sources           []PermissionSource      `json:"sources,omitempty"`
}

// DataScope 数据范围
type DataScope struct {
	Type DataScopeType  `json:"type"`
	Rule *DataScopeRule `json:"rule,omitempty"`
}

// PermissionSource 权限来源
type PermissionSource struct {
	PermissionID string `json:"permission_id"`
	SourceType   string `json:"source_type"` // role, override
	SourceID     string `json:"source_id"`
	SourceName   string `json:"source_name"`
}

// PermissionOverrideWithDetails 带详情的权限覆盖（用于 API 返回）
type PermissionOverrideWithDetails struct {
	PermissionOverride
	PermissionName string `json:"permission_name,omitempty" gorm:"-"`
	ResourceName   string `json:"resource_name,omitempty" gorm:"-"`
	CreatedByName  string `json:"created_by_name,omitempty" gorm:"-"`
}

// DataScopeFilter 数据范围过滤器接口
type DataScopeFilter interface {
	// Apply 应用数据范围过滤到查询条件
	Apply(query interface{}, userID string) (interface{}, error)
	// Type 返回过滤器类型
	Type() DataScopeType
}

// FieldMasker 字段脱敏器接口
type FieldMasker interface {
	// Mask 对值进行脱敏处理
	Mask(value interface{}) interface{}
	// Rule 返回脱敏规则
	Rule() MaskRule
}

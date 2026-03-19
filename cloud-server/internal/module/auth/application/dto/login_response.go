package dto

// LoginResponse 登录响应
type LoginResponse struct {
	AccessToken  string             `json:"access_token"`
	RefreshToken string             `json:"refresh_token"`
	ExpiresIn    int64              `json:"expires_in"`
	TokenType    string             `json:"token_type"`
	User         *UserProfile       `json:"user"`
	Tenant       *TenantInfo        `json:"tenant"`
	Permissions  *PermissionSummary `json:"permissions"`
}

// UserProfile 用户信息
type UserProfile struct {
	ID           string `json:"id"`
	Username     string `json:"username"`
	Email        string `json:"email"`
	RealName     string `json:"real_name"`
	Phone        string `json:"phone,omitempty"`
	AvatarURL    string `json:"avatar_url,omitempty"`
	EmployeeID   string `json:"employee_id,omitempty"`
	DepartmentID string `json:"department_id,omitempty"`
	PositionID   string `json:"position_id,omitempty"`
	Status       string `json:"status"`
}

// TenantInfo 租户信息
type TenantInfo struct {
	ID   string `json:"id"`
	Name string `json:"name"`
	Slug string `json:"slug"`
}

// PermissionSummary 权限摘要
type PermissionSummary struct {
	Roles       []string          `json:"roles"`
	Permissions []string          `json:"permissions"`
	DataScopes  map[string]string `json:"data_scopes,omitempty"`
}

// PermissionInfo 权限详情
type PermissionInfo struct {
	Code     string `json:"code"`
	Name     string `json:"name"`
	Resource string `json:"resource"`
	Action   string `json:"action"`
}

// RoleInfo 角色信息
type RoleInfo struct {
	Code     string `json:"code"`
	Name     string `json:"name"`
	IsSystem bool   `json:"is_system"`
}

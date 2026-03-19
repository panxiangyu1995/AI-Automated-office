package dto

// LoginRequest 登录请求
type LoginRequest struct {
	Username   string `json:"username" binding:"required,min=3,max=50"`
	Password   string `json:"password" binding:"required,min=8,max=100"`
	TenantID   string `json:"tenant_id"`
	RememberMe bool   `json:"remember_me"`
	DeviceInfo string `json:"device_info"`
}
